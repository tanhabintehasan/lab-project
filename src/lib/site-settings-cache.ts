/**
 * Site Settings Cache
 *
 * Server-side in-memory cache with TTL to avoid repeated DB calls
 * on every page load. Cache is invalidated when settings are updated.
 *
 * Public settings (safe for frontend):
 *   - site info, branding, SEO, contact, footer, social
 *
 * Sensitive config (admin-only, NEVER sent to frontend):
 *   - API keys, SMTP creds, SMS secrets, storage keys
 */

import { Prisma } from '@prisma/client';
import { prisma } from '@/lib/db';

const CACHE_TTL_MS = 5 * 60 * 1000; // 5 minutes

interface CacheEntry<T> {
  data: T;
  expiresAt: number;
}

let publicSettingsCache: CacheEntry<PublicSiteSettings> | null = null;
let adminSettingsCache: CacheEntry<AdminSiteSettings> | null = null;
let appConfigCache: CacheEntry<Record<string, string>> | null = null;

/* ─── Types ─── */

export interface PublicSiteSettings {
  id?: string | null;
  siteName?: string | null;
  siteNameEn?: string | null;
  logoUrl?: string | null;
  logoUploadUrl?: string | null;
  faviconUrl?: string | null;
  brandColor?: string | null;
  supportEmail?: string | null;
  supportPhone?: string | null;
  whatsapp?: string | null;
  wechat?: string | null;
  addressZh?: string | null;
  addressEn?: string | null;
  facebookUrl?: string | null;
  linkedinUrl?: string | null;
  youtubeUrl?: string | null;
  footerTextZh?: string | null;
  footerTextEn?: string | null;
  footerCopyrightZh?: string | null;
  footerCopyrightEn?: string | null;
  footerContactPhone?: string | null;
  footerContactEmail?: string | null;
  footerContactAddress?: string | null;
  footerIcp?: string | null;
  footerSocialLinks?: any;
  seoTitleZh?: string | null;
  seoTitleEn?: string | null;
  seoDescriptionZh?: string | null;
  seoDescriptionEn?: string | null;
  seoKeywordsZh?: string | null;
  seoKeywordsEn?: string | null;
  platformFeeRate?: number | null;
}

export interface AdminSiteSettings extends PublicSiteSettings {
  // Same as public for now; sensitive keys live in AppConfig
}

/* ─── Cache helpers ─── */

function isExpired<T>(entry: CacheEntry<T> | null): boolean {
  if (!entry) return true;
  return Date.now() > entry.expiresAt;
}

function setCache<T>(entryRef: { current: CacheEntry<T> | null }, data: T): void {
  entryRef.current = {
    data,
    expiresAt: Date.now() + CACHE_TTL_MS,
  };
}

/* ─── Safe data transform ─── */

function sanitizePublicSettings(row: any): PublicSiteSettings {
  if (!row) return {};
  const data: PublicSiteSettings = { ...row };
  // Prisma.Decimal is not JSON-serializable; convert to number
  const fee = data.platformFeeRate as any;
  if (fee instanceof Prisma.Decimal) {
    data.platformFeeRate = fee.toNumber();
  }
  return data;
}

/* ─── Public Settings (safe for frontend) ─── */

const PUBLIC_FIELDS_SELECT: Record<string, boolean> = {
  id: true,
  siteName: true,
  siteNameEn: true,
  logoUrl: true,
  logoUploadUrl: true,
  faviconUrl: true,
  brandColor: true,
  supportEmail: true,
  supportPhone: true,
  whatsapp: true,
  wechat: true,
  addressZh: true,
  addressEn: true,
  facebookUrl: true,
  linkedinUrl: true,
  youtubeUrl: true,
  footerTextZh: true,
  footerTextEn: true,
  footerCopyrightZh: true,
  footerCopyrightEn: true,
  footerContactPhone: true,
  footerContactEmail: true,
  footerContactAddress: true,
  footerIcp: true,
  footerSocialLinks: true,
  seoTitleZh: true,
  seoTitleEn: true,
  seoDescriptionZh: true,
  seoDescriptionEn: true,
  seoKeywordsZh: true,
  seoKeywordsEn: true,
  platformFeeRate: true,
};

/**
 * Get public-safe site settings (cached).
 * Use this in public-facing API routes and server components.
 */
export async function getPublicSettings(): Promise<PublicSiteSettings> {
  if (!isExpired(publicSettingsCache)) {
    return publicSettingsCache!.data;
  }

  try {
    const row = await (prisma as any).siteSetting.findFirst({
      orderBy: { createdAt: 'asc' },
      select: PUBLIC_FIELDS_SELECT,
    });

    const data = sanitizePublicSettings(row);
    publicSettingsCache = { data, expiresAt: Date.now() + CACHE_TTL_MS };
    return data;
  } catch (err) {
    console.error('[getPublicSettings] DB error:', err);
    // Return empty defaults so the page doesn't crash
    return {};
  }
}

/**
 * Get admin site settings (cached).
 * Same as public for now since sensitive keys are in AppConfig.
 */
export async function getAdminSettings(): Promise<AdminSiteSettings> {
  if (!isExpired(adminSettingsCache)) {
    return adminSettingsCache!.data;
  }

  try {
    const row = await (prisma as any).siteSetting.findFirst({
      orderBy: { createdAt: 'asc' },
    });

    const data = sanitizePublicSettings(row);
    adminSettingsCache = { data, expiresAt: Date.now() + CACHE_TTL_MS };
    return data;
  } catch (err) {
    console.error('[getAdminSettings] DB error:', err);
    return {};
  }
}

/* ─── AppConfig (sensitive keys, admin-only) ─── */

/**
 * Get sensitive app config by key (cached).
 */
export async function getAppConfig(key: string): Promise<string | null> {
  const all = await getAllAppConfig();
  return all[key] ?? null;
}

/**
 * Get all sensitive app config as a flat key-value map (cached).
 */
export async function getAllAppConfig(): Promise<Record<string, string>> {
  if (!isExpired(appConfigCache)) {
    return appConfigCache!.data;
  }

  try {
    const rows = await (prisma as any).appConfig.findMany({
      select: { key: true, value: true },
    });

    const data: Record<string, string> = {};
    for (const row of rows) {
      data[row.key] = row.value;
    }

    appConfigCache = { data, expiresAt: Date.now() + CACHE_TTL_MS };
    return data;
  } catch (err) {
    console.error('[getAllAppConfig] DB error:', err);
    return {};
  }
}

/**
 * Set (create or update) a sensitive app config value.
 * Invalidates the app config cache.
 */
export async function setAppConfig(
  key: string,
  value: string,
  options?: { category?: string; description?: string; updatedBy?: string }
): Promise<void> {
  try {
    await (prisma as any).appConfig.upsert({
      where: { key },
      update: {
        value,
        ...(options?.category && { category: options.category }),
        ...(options?.description && { description: options.description }),
        ...(options?.updatedBy && { updatedBy: options.updatedBy }),
        updatedAt: new Date(),
      },
      create: {
        key,
        value,
        category: options?.category || 'general',
        description: options?.description,
        updatedBy: options?.updatedBy,
      },
    });

    invalidateAppConfigCache();
  } catch (err) {
    console.error('[setAppConfig] DB error:', err);
    throw new Error('Failed to save app config');
  }
}

/* ─── Cache invalidation ─── */

/**
 * Invalidate all site settings caches.
 * Call this after ANY site setting or app config update.
 */
export function invalidateSiteSettingsCache(): void {
  publicSettingsCache = null;
  adminSettingsCache = null;
}

/**
 * Invalidate only the app config cache.
 */
export function invalidateAppConfigCache(): void {
  appConfigCache = null;
}

/**
 * Invalidate all caches (public + admin + app config).
 */
export function invalidateAllCaches(): void {
  publicSettingsCache = null;
  adminSettingsCache = null;
  appConfigCache = null;
}
