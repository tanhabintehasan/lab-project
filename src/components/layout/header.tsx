'use client';

import { useState, useMemo } from 'react';
import { useTranslations } from 'next-intl';
import {
  Link,
  usePathname,
} from '@/i18n/routing';
import { useAuthStore } from '@/store/auth-store';
import { useAppStore } from '@/store/app-store';
import { useSiteSettings } from '@/components/providers/SiteSettingsProvider';
import { cn } from '@/lib/utils';
import Image from 'next/image';

export function Header() {
  const t = useTranslations('nav');
  const tCommon = useTranslations('common');
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const { settings } = useSiteSettings();

  const siteName = settings?.siteName || tCommon('siteName');

  // Use Zustand selectors to subscribe only to the fields we need.
  // This prevents unnecessary re-renders when unrelated store fields change.
  const isAuthenticated = useAuthStore((state) => state.isAuthenticated);
  const user = useAuthStore((state) => state.user);
  const loggedIn = isAuthenticated && !!user;

  const notificationCount = useAppStore((state) => state.notificationCount);
  const pathname = usePathname();

  const dashboardHref = useMemo(() => {
    const role = user?.role;
    if (role === 'SUPER_ADMIN') return '/admin/dashboard';
    if (role === 'FINANCE_ADMIN') return '/admin/finance';
    if (role === 'CUSTOMER') return '/dashboard';
    if (role === 'LAB_PARTNER') return '/lab-portal/dashboard';
    if (role === 'ENTERPRISE_MEMBER') return '/enterprise/workspace';
    return '/dashboard';
  }, [user?.role]);

  // Memoize mainNav so it is a stable reference across re-renders.
  // React can then rely on stable keys instead of re-creating DOM nodes.
  const mainNav = useMemo(
    () => [
      { href: '/', label: t('home') },
      {
        href: '/services',
        label: t('services'),
        hasDropdown: true,
        children: [
          { href: '/services', label: t('services'), icon: '⚗' },
          { href: '/services/categories', label: t('categories'), icon: '📂' },
          { href: '/services/materials', label: t('materials'), icon: '🔬' },
          { href: '/services/industries', label: t('industries'), icon: '🏭' },
          { href: '/services/standards', label: t('standards'), icon: '📄' },
          { href: '/patent-services', label: t('patentServices'), icon: '📄' },
          { href: '/paper-services', label: t('paperServices'), icon: '📖' },
        ],
      },
      { href: '/patent-services', label: t('patentServices') },
      { href: '/equipment', label: t('equipment') },
      { href: '/rfq', label: t('rfq') },
      { href: '/research-fund', label: t('researchFund') },
      { href: '/about', label: t('about') },
      { href: '/help', label: t('help') },
    ],
    [t]
  );

  return (
    <header className="sticky top-0 z-50 bg-white border-b border-gray-200">
      <div className="bg-gray-900 text-gray-300 text-xs">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 flex items-center justify-between h-8">
          <span>
            {siteName} - {tCommon('siteDesc')}
          </span>

          <div className="flex items-center gap-4">
            <Link href="/help" className="hover:text-white transition-colors">
              {t('help')}
            </Link>

            <Link href="/contact" className="hover:text-white transition-colors">
              {t('contact')}
            </Link>

            <span className="flex items-center gap-1 text-gray-400">
              <span>🌐</span>
              <span>中文</span>
            </span>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16">
          <Link href="/" className="flex items-center gap-2.5 flex-shrink-0">
            <Image
              src="/images/bg-remove-logo.png"
              alt={siteName}
              width={36}
              height={36}
              className="rounded-lg object-contain"
            />
            <span className="text-xl font-bold text-gray-900">{siteName}</span>
          </Link>

          <nav className="hidden lg:flex items-center gap-1">
            {mainNav.map((item) => (
              <div key={item.href} className="relative group">
                <Link
                  href={item.href}
                  className={cn(
                    'px-3 py-2 text-sm font-medium rounded-lg transition-colors inline-flex items-center gap-1',
                    pathname === item.href
                      ? 'text-primary bg-primary/10'
                      : 'text-gray-700 hover:text-primary hover:bg-gray-50'
                  )}
                >
                  {item.label}
                  {item.hasDropdown ? <span className="text-xs">▼</span> : null}
                </Link>

                {item.hasDropdown && item.children ? (
                  <div className="absolute top-full left-0 pt-1 opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all duration-200">
                    <div className="bg-white rounded-lg shadow-lg border border-gray-200 py-2 min-w-[200px]">
                      {item.children.map((child) => (
                        <Link
                          key={child.href}
                          href={child.href}
                          className="flex items-center gap-3 px-4 py-2.5 text-sm text-gray-700 hover:bg-gray-50 hover:text-primary"
                        >
                          <span className="text-sm text-primary/60">{child.icon}</span>
                          {child.label}
                        </Link>
                      ))}
                    </div>
                  </div>
                ) : null}
              </div>
            ))}
          </nav>

          <div className="flex items-center gap-2">
            <button className="p-2 rounded-lg text-primary/70 hover:bg-primary/10 hover:text-primary text-sm">
              搜索
            </button>

            {/* Auth section — stable wrapper with CSS visibility toggle.
                We render BOTH trees in the DOM and hide the inactive one.
                This prevents React from destroying/recreating DOM nodes
                during auth-state transitions, which was causing insertBefore
                crashes when concurrent updates overlapped with the remount. */}
            <div className="flex items-center gap-2">
              <div className={cn(!loggedIn && 'hidden')} aria-hidden={!loggedIn}>
                <div className="flex items-center gap-2">
                  <Link
                    href="/dashboard/messages"
                    className="p-2 rounded-lg text-primary/70 hover:bg-primary/10 relative"
                  >
                    <span className="text-sm">消息</span>
                  </Link>

                  <Link
                    href={dashboardHref}
                    className="relative p-2 rounded-lg text-primary/70 hover:bg-primary/10"
                  >
                    <span className="text-sm">通知</span>
                    {notificationCount > 0 ? (
                      <span className="absolute top-1 right-1 w-4 h-4 bg-red-500 text-white text-[10px] font-bold rounded-full flex items-center justify-center">
                        {notificationCount > 9 ? '9+' : notificationCount}
                      </span>
                    ) : null}
                  </Link>

                  <Link
                    href={dashboardHref}
                    className="flex items-center gap-2 px-3 py-1.5 rounded-lg text-sm font-medium text-primary/80 hover:bg-primary/10"
                  >
                    <span className="text-sm">账户</span>
                    <span className="hidden md:inline">{user?.name || 'Account'}</span>
                  </Link>
                </div>
              </div>

              <div className={cn(loggedIn && 'hidden')} aria-hidden={loggedIn}>
                <div className="flex items-center gap-2">
                  <Link
                    href="/auth/login"
                    className="px-4 py-2 text-sm font-medium text-gray-700 hover:text-primary"
                  >
                    {t('login')}
                  </Link>

                  <Link
                    href="/auth/register"
                    className="px-4 py-2 text-sm font-medium text-white bg-primary rounded-lg hover:opacity-90 transition-colors"
                  >
                    {t('register')}
                  </Link>
                </div>
              </div>
            </div>

            <button
              className="lg:hidden p-2 rounded-lg text-primary/70 hover:bg-primary/10"
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
              aria-label={mobileMenuOpen ? '关闭菜单' : '打开菜单'}
            >
              <span className="block text-sm font-medium">{mobileMenuOpen ? '✕' : '☰'}</span>
            </button>
          </div>
        </div>
      </div>

      {mobileMenuOpen ? (
        <div className="lg:hidden bg-white border-t border-gray-200">
          <div className="max-w-7xl mx-auto px-4 py-4 space-y-1">
            {mainNav.map((item) => (
              <div key={item.href}>
                <Link
                  href={item.href}
                  className={cn(
                    'block px-3 py-2.5 text-sm font-medium rounded-lg',
                    pathname === item.href
                      ? 'text-primary bg-primary/10'
                      : 'text-gray-700 hover:bg-gray-50'
                  )}
                  onClick={() => setMobileMenuOpen(false)}
                >
                  {item.label}
                </Link>

                {item.children?.map((child) => (
                  <Link
                    key={child.href}
                    href={child.href}
                    className="block pl-8 pr-3 py-2 text-sm text-gray-600 hover:text-primary"
                    onClick={() => setMobileMenuOpen(false)}
                  >
                    {child.label}
                  </Link>
                ))}
              </div>
            ))}

            <div className="pt-3 mt-3 border-t border-gray-200">
              <div className={cn(!loggedIn && 'hidden')} aria-hidden={!loggedIn}>
                <Link
                  href={dashboardHref}
                  className="block px-3 py-2.5 text-sm font-medium rounded-lg text-gray-700 hover:bg-gray-50"
                  onClick={() => setMobileMenuOpen(false)}
                >
                  {user?.name || 'Account'}
                </Link>
              </div>
              <div className={cn(loggedIn && 'hidden')} aria-hidden={loggedIn}>
                <div className="space-y-1">
                  <Link
                    href="/auth/login"
                    className="block px-3 py-2.5 text-sm font-medium rounded-lg text-gray-700 hover:bg-gray-50"
                    onClick={() => setMobileMenuOpen(false)}
                  >
                    {t('login')}
                  </Link>

                  <Link
                    href="/auth/register"
                    className="block px-3 py-2.5 text-sm font-medium rounded-lg text-white bg-primary hover:opacity-90"
                    onClick={() => setMobileMenuOpen(false)}
                  >
                    {t('register')}
                  </Link>
                </div>
              </div>
            </div>
          </div>
        </div>
      ) : null}
    </header>
  );
}
