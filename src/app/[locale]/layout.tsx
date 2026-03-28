import type { Metadata } from 'next';
import type { ReactNode } from 'react';
import { NextIntlClientProvider } from 'next-intl';
import { getMessages } from 'next-intl/server';
import { notFound } from 'next/navigation';
import { isValidLocale } from '@/i18n/routing';
import { ReactQueryProvider } from '@/components/providers/ReactQueryProvider';
import '@/app/globals.css';

export const metadata: Metadata = {
  title: '精测实验 - 专业检测服务平台',
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
    <div suppressHydrationWarning className="antialiased min-h-screen bg-white text-gray-900">
      <NextIntlClientProvider locale={locale} messages={messages}>
        <ReactQueryProvider>{children}</ReactQueryProvider>
      </NextIntlClientProvider>
    </div>
  );
}