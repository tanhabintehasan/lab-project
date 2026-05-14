/**
 * Analytics Cache Layer
 *
 * Provides stale-while-revalidate cached views for dashboard charts.
 * Heavy DB aggregations run in the background; API responses serve
 * cached data immediately without waiting for computation.
 */

import { Prisma } from '@prisma/client';
import { prisma } from './db';

const CACHE_TTL_MS = 5 * 60 * 1000; // 5 minutes
const LOCK_TIMEOUT_MS = 30 * 1000;  // 30 seconds max computation time

interface CacheEntry {
  data: DashboardAnalytics;
  fetchedAt: number;
  refreshing: boolean;
}

interface MonthlyDataPoint {
  month: string; // "YYYY-MM"
  label: string; // "2024年1月"
  revenue: number;
  orderCount: number;
}

interface LabPerformancePoint {
  labId: string;
  labName: string;
  orderCount: number;
  revenue: number;
  completedOrders: number;
  rating: number | null;
  avgTurnaroundDays: number | null;
}

interface ServicePopularityPoint {
  serviceId: string;
  serviceName: string;
  categoryName: string;
  orderCount: number;
  viewCount: number;
  rating: number | null;
}

interface DashboardAnalytics {
  monthlyRevenue: MonthlyDataPoint[];
  orderVolume: MonthlyDataPoint[];
  labPerformance: LabPerformancePoint[];
  servicePopularity: ServicePopularityPoint[];
  summary: {
    totalRevenueThisMonth: number;
    totalOrdersThisMonth: number;
    totalRevenueLastMonth: number;
    totalOrdersLastMonth: number;
    revenueChangePercent: number;
    ordersChangePercent: number;
  };
}

// ─── In-memory caches ──────────────────────────────────────────

const caches: {
  dashboard?: CacheEntry;
} = {};

// ─── Helpers ───────────────────────────────────────────────────

function getMonthRange(monthsBack: number) {
  const now = new Date();
  const end = new Date(now.getFullYear(), now.getMonth() + 1, 0, 23, 59, 59);
  const start = new Date(now.getFullYear(), now.getMonth() - monthsBack + 1, 1);
  return { start, end };
}

function formatMonthLabel(year: number, month: number): string {
  return `${year}年${month + 1}月`;
}

function toMonthKey(d: Date): string {
  const y = d.getFullYear();
  const m = d.getMonth() + 1;
  return `${y}-${String(m).padStart(2, '0')}`;
}

// ─── Background refresh lock ───────────────────────────────────

async function withRefreshLock(
  cacheKey: keyof typeof caches,
  compute: () => Promise<DashboardAnalytics>
): Promise<DashboardAnalytics> {
  const entry = caches[cacheKey];

  // If cache is fresh, return immediately
  if (entry && Date.now() - entry.fetchedAt < CACHE_TTL_MS) {
    return entry.data;
  }

  // If cache is stale but a refresh is already in progress, return stale data
  if (entry && entry.refreshing) {
    return entry.data;
  }

  // Mark as refreshing and return stale data immediately (if any)
  if (entry) {
    entry.refreshing = true;
    // Trigger background refresh without awaiting
    Promise.resolve().then(async () => {
      try {
        const data = await compute();
        caches[cacheKey] = { data, fetchedAt: Date.now(), refreshing: false };
      } catch (err) {
        console.error(`[AnalyticsCache] Background refresh failed for ${cacheKey}:`, err);
        if (caches[cacheKey]) caches[cacheKey].refreshing = false;
      }
    });
    return entry.data;
  }

  // No cache at all — we have to compute, but use a timeout to avoid hanging
  const timeoutPromise = new Promise<DashboardAnalytics>((_, reject) =>
    setTimeout(() => reject(new Error('Analytics computation timed out')), LOCK_TIMEOUT_MS)
  );

  try {
    const data = await Promise.race([compute(), timeoutPromise]);
    caches[cacheKey] = { data, fetchedAt: Date.now(), refreshing: false };
    return data;
  } catch (err) {
    console.error(`[AnalyticsCache] Initial computation failed for ${cacheKey}:`, err);
    throw err;
  }
}

// ─── Computation functions (heavy DB work) ─────────────────────

async function computeMonthlyRevenueAndOrders(): Promise<MonthlyDataPoint[]> {
  const { start, end } = getMonthRange(12);

  const orders = await (prisma as any).order.findMany({
    where: {
      createdAt: { gte: start, lte: end },
      paymentStatus: 'PAID',
    },
    select: {
      totalAmount: true,
      createdAt: true,
    },
    orderBy: { createdAt: 'asc' },
  });

  const allMonths: MonthlyDataPoint[] = [];
  const now = new Date();
  for (let i = 11; i >= 0; i--) {
    const d = new Date(now.getFullYear(), now.getMonth() - i, 1);
    allMonths.push({
      month: toMonthKey(d),
      label: formatMonthLabel(d.getFullYear(), d.getMonth()),
      revenue: 0,
      orderCount: 0,
    });
  }

  const monthMap = new Map<string, MonthlyDataPoint>();
  for (const m of allMonths) monthMap.set(m.month, m);

  for (const order of orders) {
    const key = toMonthKey(new Date(order.createdAt));
    const entry = monthMap.get(key);
    if (entry) {
      entry.revenue += Number(order.totalAmount || 0);
      entry.orderCount += 1;
    }
  }

  return allMonths;
}

async function computeLabPerformance(): Promise<LabPerformancePoint[]> {
  const labs = await (prisma as any).laboratory.findMany({
    where: { status: 'ACTIVE' },
    select: {
      id: true,
      nameZh: true,
      rating: true,
      completedOrders: true,
      avgTurnaroundDays: true,
    },
    orderBy: { completedOrders: 'desc' },
    take: 20,
  });

  const labIds = labs.map((l: any) => l.id);

  const orderAgg = await (prisma as any).order.groupBy({
    by: ['assignedLabId'],
    where: {
      assignedLabId: { in: labIds },
      paymentStatus: 'PAID',
    },
    _count: { id: true },
    _sum: { totalAmount: true },
  });

  const orderMap = new Map<string, { count: number; revenue: number }>();
  for (const row of orderAgg) {
    if (row.assignedLabId) {
      orderMap.set(row.assignedLabId, {
        count: row._count.id,
        revenue: Number(row._sum.totalAmount || 0),
      });
    }
  }

  return labs.map((lab: any) => {
    const agg = orderMap.get(lab.id);
    return {
      labId: lab.id,
      labName: lab.nameZh || '未命名实验室',
      orderCount: agg?.count || 0,
      revenue: agg?.revenue || 0,
      completedOrders: lab.completedOrders || 0,
      rating: lab.rating ? Number(lab.rating) : null,
      avgTurnaroundDays: lab.avgTurnaroundDays ? Number(lab.avgTurnaroundDays) : null,
    };
  });
}

async function computeServicePopularity(): Promise<ServicePopularityPoint[]> {
  const services = await (prisma as any).testingService.findMany({
    where: { isActive: true },
    select: {
      id: true,
      nameZh: true,
      orderCount: true,
      viewCount: true,
      category: { select: { nameZh: true } },
    },
    orderBy: [{ orderCount: 'desc' }, { viewCount: 'desc' }],
    take: 20,
  });

  return services.map((s: any) => ({
    serviceId: s.id,
    serviceName: s.nameZh || '未命名服务',
    categoryName: s.category?.nameZh || '未分类',
    orderCount: s.orderCount || 0,
    viewCount: s.viewCount || 0,
    rating: null, // Could add avg rating from reviews if model exists
  }));
}

async function computeDashboardAnalytics(): Promise<DashboardAnalytics> {
  const monthly = await computeMonthlyRevenueAndOrders();
  const labPerformance = await computeLabPerformance();
  const servicePopularity = await computeServicePopularity();

  const thisMonth = monthly[monthly.length - 1];
  const lastMonth = monthly[monthly.length - 2];

  const revenueChangePercent = lastMonth && lastMonth.revenue > 0
    ? ((thisMonth.revenue - lastMonth.revenue) / lastMonth.revenue) * 100
    : 0;

  const ordersChangePercent = lastMonth && lastMonth.orderCount > 0
    ? ((thisMonth.orderCount - lastMonth.orderCount) / lastMonth.orderCount) * 100
    : 0;

  return {
    monthlyRevenue: monthly,
    orderVolume: monthly,
    labPerformance,
    servicePopularity,
    summary: {
      totalRevenueThisMonth: thisMonth?.revenue || 0,
      totalOrdersThisMonth: thisMonth?.orderCount || 0,
      totalRevenueLastMonth: lastMonth?.revenue || 0,
      totalOrdersLastMonth: lastMonth?.orderCount || 0,
      revenueChangePercent: Math.round(revenueChangePercent * 100) / 100,
      ordersChangePercent: Math.round(ordersChangePercent * 100) / 100,
    },
  };
}

// ─── Public API ────────────────────────────────────────────────

export async function getDashboardAnalyticsCached(): Promise<DashboardAnalytics> {
  return withRefreshLock('dashboard', computeDashboardAnalytics);
}

export function invalidateDashboardAnalyticsCache() {
  delete caches.dashboard;
}

export type {
  DashboardAnalytics,
  MonthlyDataPoint,
  LabPerformancePoint,
  ServicePopularityPoint,
};
