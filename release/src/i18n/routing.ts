import { defineRouting } from 'next-intl/routing';
import { createNavigation } from 'next-intl/navigation';

export const routing = defineRouting({
  locales: ['zh-CN', 'en'],
  defaultLocale: 'zh-CN',
  localePrefix: 'as-needed',
});

export type AppLocale = (typeof routing.locales)[number];

export function isValidLocale(locale: string): locale is AppLocale {
  return routing.locales.includes(locale as AppLocale);
}

export const { Link, redirect, usePathname, useRouter, getPathname } =
  createNavigation(routing);
