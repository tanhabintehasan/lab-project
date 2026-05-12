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
import { validateEnv } from '@/lib/env-validation';
import '@/app/globals.css';

// Validate required environment variables at startup (build + runtime)
validateEnv();

export const metadata: Metadata = {
  title: '度量衡科研平台 - 立足科学前沿，服务中国创新',
  description:
    '一站式检测服务平台，连接企业与优质实验室，提供高效、透明、可靠的检测解决方案',
};

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
                {children}
                <SonnerToaster />
              </BrandColorProvider>
            </SiteSettingsProvider>
          </AuthProvider>
        </ReactQueryProvider>
      </NextIntlClientProvider>
    </div>
  );
}
