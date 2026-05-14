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

// Validate required environment variables at startup (build + runtime)
validateEnv();

export async function generateMetadata(): Promise<Metadata> {
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

  const messages = await getMessages();

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
