/**
 * AI Recommendation Engine
 *
 * Generates personalized service recommendations based on:
 * 1. User's category browsing history (UserBrowseLog)
 * 2. User's order history (Order + OrderItem)
 * 3. User's favorites (Favorite)
 *
 * Heavy computation is cached per-user with stale-while-revalidate.
 * The public API always returns cached data immediately and triggers
 * background refresh asynchronously.
 */

import { prisma } from './db';

const REC_CACHE_TTL_MS = 10 * 60 * 1000; // 10 minutes
const REC_LOCK_TIMEOUT_MS = 15 * 1000;
const MAX_RECOMMENDATIONS = 8;
const MIN_BROWSE_AGE_DAYS = 90;

interface Recommendation {
  serviceId: string;
  serviceName: string;
  categoryName: string;
  score: number;
  reason: string;
}

interface RecCacheEntry {
  data: Recommendation[];
  fetchedAt: number;
  refreshing: boolean;
}

// Per-user in-memory cache
const recCaches = new Map<string, RecCacheEntry>();

// ─── Time decay weight ─────────────────────────────────────────

function daysAgoWeight(date: Date, halfLifeDays = 14): number {
  const days = (Date.now() - date.getTime()) / (1000 * 60 * 60 * 24);
  return Math.exp(-days / halfLifeDays);
}

// ─── Background refresh lock ───────────────────────────────────

async function withRecRefreshLock(
  userId: string,
  compute: () => Promise<Recommendation[]>
): Promise<Recommendation[]> {
  const entry = recCaches.get(userId);

  if (entry && Date.now() - entry.fetchedAt < REC_CACHE_TTL_MS) {
    return entry.data;
  }

  if (entry && entry.refreshing) {
    return entry.data;
  }

  if (entry) {
    entry.refreshing = true;
    Promise.resolve().then(async () => {
      try {
        const data = await compute();
        recCaches.set(userId, { data, fetchedAt: Date.now(), refreshing: false });
      } catch (err) {
        console.error(`[RecEngine] Background refresh failed for ${userId}:`, err);
        const current = recCaches.get(userId);
        if (current) current.refreshing = false;
      }
    });
    return entry.data;
  }

  const timeoutPromise = new Promise<Recommendation[]>((_, reject) =>
    setTimeout(() => reject(new Error('Recommendation computation timed out')), REC_LOCK_TIMEOUT_MS)
  );

  try {
    const data = await Promise.race([compute(), timeoutPromise]);
    recCaches.set(userId, { data, fetchedAt: Date.now(), refreshing: false });
    return data;
  } catch (err) {
    console.error(`[RecEngine] Initial computation failed for ${userId}:`, err);
    throw err;
  }
}

// ─── Core algorithm ────────────────────────────────────────────

async function computeRecommendations(userId: string): Promise<Recommendation[]> {
  const since = new Date(Date.now() - MIN_BROWSE_AGE_DAYS * 24 * 60 * 60 * 1000);

  // 1. Gather user signals
  const [browseLogs, orderItems, favorites] = await Promise.all([
    // Category browse history
    (prisma as any).userBrowseLog.findMany({
      where: { userId, createdAt: { gte: since } },
      select: { categoryId: true, createdAt: true },
      orderBy: { createdAt: 'desc' },
      take: 200,
    }).catch(() => []),

    // Ordered services with their categories
    (prisma as any).order.findMany({
      where: { userId },
      select: {
        items: {
          select: {
            service: { select: { categoryId: true } },
          },
        },
        createdAt: true,
      },
      take: 100,
    }).catch(() => []),

    // Favorited services with their categories
    (prisma as any).favorite.findMany({
      where: { userId },
      select: {
        service: { select: { categoryId: true } },
        createdAt: true,
      },
      take: 100,
    }).catch(() => []),
  ]);

  // 2. Build category affinity scores
  const categoryScores = new Map<string, number>();

  for (const log of browseLogs) {
    const weight = daysAgoWeight(new Date(log.createdAt), 7);
    categoryScores.set(log.categoryId, (categoryScores.get(log.categoryId) || 0) + weight * 1.0);
  }

  for (const order of orderItems) {
    const weight = daysAgoWeight(new Date(order.createdAt), 30);
    for (const item of order.items || []) {
      const catId = item.service?.categoryId;
      if (catId) {
        categoryScores.set(catId, (categoryScores.get(catId) || 0) + weight * 5.0);
      }
    }
  }

  for (const fav of favorites) {
    const weight = daysAgoWeight(new Date(fav.createdAt), 14);
    const catId = fav.service?.categoryId;
    if (catId) {
      categoryScores.set(catId, (categoryScores.get(catId) || 0) + weight * 3.0);
    }
  }

  if (categoryScores.size === 0) {
    // Cold start: return globally popular services
    return getPopularFallback();
  }

  // 3. Get candidate services from high-affinity categories
  const topCategories = Array.from(categoryScores.entries())
    .sort((a, b) => b[1] - a[1])
    .slice(0, 5)
    .map(([id]) => id);

  const totalAffinity = Array.from(categoryScores.values()).reduce((s, v) => s + v, 0);

  // Services user already ordered (to exclude)
  const orderedServiceIds = new Set<string>();
  for (const order of orderItems) {
    for (const item of order.items || []) {
      if (item.service) orderedServiceIds.add(item.service.id);
    }
  }
  // If OrderItem doesn't expose service.id in the query above, we need a separate query
  // Let's fetch ordered service IDs directly
  const orderedIdsRaw = await (prisma as any).orderItem.findMany({
    where: { order: { userId } },
    select: { serviceId: true },
    distinct: ['serviceId'],
  }).catch(() => []);
  for (const r of orderedIdsRaw) orderedServiceIds.add(r.serviceId);

  const candidates = await (prisma as any).testingService.findMany({
    where: {
      isActive: true,
      categoryId: { in: topCategories },
      id: { notIn: Array.from(orderedServiceIds) },
    },
    select: {
      id: true,
      nameZh: true,
      orderCount: true,
      viewCount: true,
      rating: true,
      category: { select: { id: true, nameZh: true } },
    },
    take: 100,
  }).catch(() => []);

  if (candidates.length === 0) {
    return getPopularFallback();
  }

  // 4. Score candidates
  const maxOrderCount = Math.max(...candidates.map((c: any) => c.orderCount || 0), 1);
  const maxViewCount = Math.max(...candidates.map((c: any) => c.viewCount || 0), 1);

  const scored = candidates.map((svc: any) => {
    const catAffinity = categoryScores.get(svc.category?.id) || 0;
    const normalizedAffinity = totalAffinity > 0 ? catAffinity / totalAffinity : 0;

    const normalizedOrderCount = (svc.orderCount || 0) / maxOrderCount;
    const normalizedViewCount = (svc.viewCount || 0) / maxViewCount;
    const normalizedRating = svc.rating ? Number(svc.rating) / 5 : 0.5;

    const score =
      normalizedAffinity * 0.40 +
      normalizedOrderCount * 0.25 +
      normalizedViewCount * 0.15 +
      normalizedRating * 0.20;

    let reason = '根据您的浏览偏好推荐';
    if (catAffinity >= 5) reason = '您经常浏览该分类';
    else if (catAffinity >= 3) reason = '您可能对该分类感兴趣';
    else if ((svc.orderCount || 0) > 10) reason = '热门服务';

    return {
      serviceId: svc.id,
      serviceName: svc.nameZh || '未命名服务',
      categoryName: svc.category?.nameZh || '未分类',
      score,
      reason,
    };
  });

  scored.sort((a: Recommendation, b: Recommendation) => b.score - a.score);
  return scored.slice(0, MAX_RECOMMENDATIONS);
}

async function getPopularFallback(): Promise<Recommendation[]> {
  const popular = await (prisma as any).testingService.findMany({
    where: { isActive: true },
    select: {
      id: true,
      nameZh: true,
      orderCount: true,
      viewCount: true,
      rating: true,
      category: { select: { nameZh: true } },
    },
    orderBy: [{ orderCount: 'desc' }, { viewCount: 'desc' }],
    take: MAX_RECOMMENDATIONS,
  }).catch(() => []);

  return popular.map((svc: any) => ({
    serviceId: svc.id,
    serviceName: svc.nameZh || '未命名服务',
    categoryName: svc.category?.nameZh || '未分类',
    score: 0,
    reason: '热门推荐',
  }));
}

// ─── Public API ────────────────────────────────────────────────

export async function getRecommendationsForUser(userId: string): Promise<Recommendation[]> {
  return withRecRefreshLock(userId, () => computeRecommendations(userId));
}

export function invalidateUserRecommendations(userId: string) {
  recCaches.delete(userId);
}

export type { Recommendation };
