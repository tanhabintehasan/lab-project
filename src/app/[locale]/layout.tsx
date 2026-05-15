import type { Metadata } from 'next';
import type { ReactNode } from 'react';
import { NextIntlClientProvider } from 'next-intl';
import { getMessages } from 'next-intl/server';
import { notFound } from 'next/navigation';
import { isValidLocale } from '@/i18n/routing';
import { ReactQueryProvider } from '@/components/providers/ReactQueryProvider';
import { AuthProvider } from '@/components/providers/AuthProvider';
import { SiteSettingsProvider } from '@/components/providers/SiteSettingsProvider';
import { BrandColorProvider } from '@/components/providers/BrandColorProvider';
import { SonnerToaster } from '@/components/ui/sonner-toaster';
import { ExtensionGuard } from '@/components/providers/ExtensionGuard';
import { validateEnv } from '@/lib/env-validation';
import { getPublicSettings } from '@/lib/site-settings-cache';
import '@/app/globals.css';

// Force Node.js runtime for the entire app — Prisma is not Edge-compatible
export const runtime = 'nodejs';

// Validate required environment variables at startup.
// Wrapped in try/catch so a missing env var logs clearly instead of crashing
// the build with an opaque Next.js error.
try {
  validateEnv();
} catch (err: any) {
  console.error('[Layout] Environment validation failed:', err?.message || err);
  // Do NOT re-throw — allow the app to start so error pages can render.
}

// Safe fallback metadata so a DB failure never breaks <head> rendering.
const FALLBACK_METADATA: Metadata = {
  title: '度量衡科研平台',
  description:
    '一站式检测服务平台，连接企业与优质实验室，提供高效、透明、可靠的检测解决方案',
  keywords: '检测, 科研, 实验室, 材料测试',
  openGraph: {
    title: '度量衡科研平台',
    description:
      '一站式检测服务平台，连接企业与优质实验室，提供高效、透明、可靠的检测解决方案',
    type: 'website',
    locale: 'zh_CN',
  },
};

export async function generateMetadata(): Promise<Metadata> {
  try {
    const settings = await getPublicSettings();

    const title = settings.seoTitleZh || settings.siteName || '度量衡科研平台';
    const description =
      settings.seoDescriptionZh ||
      '一站式检测服务平台，连接企业与优质实验室，提供高效、透明、可靠的检测解决方案';
    const keywords = settings.seoKeywordsZh || '检测, 科研, 实验室, 材料测试';

    return {
      title,
      description,
      keywords,
      icons: settings.faviconUrl ? { icon: settings.faviconUrl } : undefined,
      openGraph: {
        title,
        description,
        type: 'website',
        locale: 'zh_CN',
      },
    };
  } catch (err) {
    console.error('[generateMetadata] Failed to load settings:', err);
    return FALLBACK_METADATA;
  }
}

export default async function LocaleLayout({
  children,
  params,
}: {
  children: ReactNode;
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;

  if (!isValidLocale(locale)) {
    notFound();
  }

  // Wrapped in try/catch so i18n failures don't crash the whole page tree.
  let messages: Record<string, string> = {};
  try {
    messages = await getMessages();
  } catch (err) {
    console.error('[LocaleLayout] Failed to load messages:', err);
  }

  return (
    <div className="antialiased min-h-screen bg-white text-gray-900">
      <NextIntlClientProvider locale={locale} messages={messages}>
        <ReactQueryProvider>
          <AuthProvider>
            <SiteSettingsProvider>
              <BrandColorProvider>
                <ExtensionGuard>
                  {children}
                  <SonnerToaster />
                </ExtensionGuard>
              </BrandColorProvider>
            </SiteSettingsProvider>
          </AuthProvider>
        </ReactQueryProvider>
      </NextIntlClientProvider>
    </div>
  );
}
