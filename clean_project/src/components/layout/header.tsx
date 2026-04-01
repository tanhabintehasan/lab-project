'use client';

import { useState } from 'react';
import { useTranslations, useLocale } from 'next-intl';
import {
  Link,
  usePathname,
  useRouter as useIntlRouter,
  usePathname as useIntlPathname,
} from '@/i18n/routing';
import {
  Search,
  Menu,
  X,
  ChevronDown,
  Bell,
  User,
  Globe,
  FlaskConical,
  Building2,
  Microscope,
  FileText,
  MessageSquare,
} from 'lucide-react';
import { useAuthStore } from '@/store/auth-store';
import { useAppStore } from '@/store/app-store';
import { cn } from '@/lib/utils';

export function Header() {
  const t = useTranslations('nav');
  const tCommon = useTranslations('common');
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  const { isAuthenticated, user } = useAuthStore();
  const loggedIn = isAuthenticated && !!user;

  const { notificationCount } = useAppStore();
  const pathname = usePathname();
  const currentLocale = useLocale();
  const intlRouter = useIntlRouter();
  const intlPathname = useIntlPathname();

  const switchLocale = () => {
    const newLocale = currentLocale === 'zh-CN' ? 'en' : 'zh-CN';
    intlRouter.replace(intlPathname, { locale: newLocale });
  };

  const getDashboardHref = () => {
    const role = user?.role;

    if (role === 'SUPER_ADMIN') return '/admin/dashboard';
    if (role === 'FINANCE_ADMIN') return '/admin/finance';
    if (role === 'CUSTOMER') return '/dashboard';
    if (role === 'LAB_PARTNER') return '/lab-portal/dashboard';
    if (role === 'ENTERPRISE_MEMBER') return '/enterprise/workspace';

    return '/dashboard';
  };

  const dashboardHref = getDashboardHref();

  const mainNav = [
    { href: '/', label: t('home') },
    {
      href: '/services',
      label: t('services'),
      hasDropdown: true,
      children: [
        { href: '/services', label: t('services'), icon: FlaskConical },
        { href: '/services/categories', label: t('categories'), icon: FlaskConical },
        { href: '/services/materials', label: t('materials'), icon: Microscope },
        { href: '/services/industries', label: t('industries'), icon: Building2 },
        { href: '/services/standards', label: t('standards'), icon: FileText },
      ],
    },
    { href: '/labs', label: t('labs') },
    { href: '/equipment', label: t('equipment') },
    { href: '/rfq', label: t('rfq') },
    { href: '/about', label: t('about') },
    { href: '/help', label: t('help') },
  ];

  return (
    <header className="sticky top-0 z-50 bg-white border-b border-gray-200">
      <div className="bg-gray-900 text-gray-300 text-xs">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 flex items-center justify-between h-8">
          <span>
            {tCommon('siteName')} - {tCommon('siteDesc')}
          </span>

          <div className="flex items-center gap-4">
            <Link href="/help" className="hover:text-white transition-colors">
              {t('help')}
            </Link>

            <Link href="/contact" className="hover:text-white transition-colors">
              {t('contact')}
            </Link>

            <button
              onClick={switchLocale}
              className="flex items-center gap-1 hover:text-white transition-colors"
            >
              <Globe className="h-3 w-3" />
              <span>{currentLocale === 'zh-CN' ? 'English' : '中文'}</span>
            </button>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16">
          <Link href="/" className="flex items-center gap-2 flex-shrink-0">
            <FlaskConical className="h-8 w-8 text-blue-600" />
            <span className="text-xl font-bold text-gray-900">{tCommon('siteName')}</span>
          </Link>

          <nav className="hidden lg:flex items-center gap-1">
            {mainNav.map((item) => (
              <div key={item.href} className="relative group">
                <Link
                  href={item.href}
                  className={cn(
                    'px-3 py-2 text-sm font-medium rounded-lg transition-colors inline-flex items-center gap-1',
                    pathname === item.href
                      ? 'text-blue-600 bg-blue-50'
                      : 'text-gray-700 hover:text-blue-600 hover:bg-gray-50'
                  )}
                >
                  {item.label}
                  {item.hasDropdown ? <ChevronDown className="h-3.5 w-3.5" /> : null}
                </Link>

                {item.hasDropdown && item.children ? (
                  <div className="absolute top-full left-0 pt-1 opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all duration-200">
                    <div className="bg-white rounded-lg shadow-lg border border-gray-200 py-2 min-w-[200px]">
                      {item.children.map((child) => (
                        <Link
                          key={child.href}
                          href={child.href}
                          className="flex items-center gap-3 px-4 py-2.5 text-sm text-gray-700 hover:bg-gray-50 hover:text-blue-600"
                        >
                          <child.icon className="h-4 w-4 text-gray-400" />
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
            <button className="p-2 rounded-lg text-gray-500 hover:bg-gray-100 hover:text-gray-700">
              <Search className="h-5 w-5" />
            </button>

            {loggedIn ? (
              <>
                <Link
                  href="/dashboard/messages"
                  className="p-2 rounded-lg text-gray-500 hover:bg-gray-100 relative"
                >
                  <MessageSquare className="h-5 w-5" />
                </Link>

                <Link
                  href={dashboardHref}
                  className="relative p-2 rounded-lg text-gray-500 hover:bg-gray-100"
                >
                  <Bell className="h-5 w-5" />
                  {notificationCount > 0 ? (
                    <span className="absolute top-1 right-1 w-4 h-4 bg-red-500 text-white text-[10px] font-bold rounded-full flex items-center justify-center">
                      {notificationCount > 9 ? '9+' : notificationCount}
                    </span>
                  ) : null}
                </Link>

                <Link
                  href={dashboardHref}
                  className="flex items-center gap-2 px-3 py-1.5 rounded-lg text-sm font-medium text-gray-700 hover:bg-gray-100"
                >
                  <User className="h-4 w-4" />
                  <span className="hidden md:inline">{user?.name || 'Account'}</span>
                </Link>
              </>
            ) : (
              <div className="flex items-center gap-2">
                <Link
                  href="/auth/login"
                  className="px-4 py-2 text-sm font-medium text-gray-700 hover:text-blue-600"
                >
                  {t('login')}
                </Link>

                <Link
                  href="/auth/register"
                  className="px-4 py-2 text-sm font-medium text-white bg-blue-600 rounded-lg hover:bg-blue-700 transition-colors"
                >
                  {t('register')}
                </Link>
              </div>
            )}

            <button
              className="lg:hidden p-2 rounded-lg text-gray-500 hover:bg-gray-100"
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
            >
              {mobileMenuOpen ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
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
                      ? 'text-blue-600 bg-blue-50'
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
                    className="block pl-8 pr-3 py-2 text-sm text-gray-600 hover:text-blue-600"
                    onClick={() => setMobileMenuOpen(false)}
                  >
                    {child.label}
                  </Link>
                ))}
              </div>
            ))}

            <div className="pt-3 mt-3 border-t border-gray-200">
              {loggedIn ? (
                <Link
                  href={dashboardHref}
                  className="block px-3 py-2.5 text-sm font-medium rounded-lg text-gray-700 hover:bg-gray-50"
                  onClick={() => setMobileMenuOpen(false)}
                >
                  {user?.name || 'Account'}
                </Link>
              ) : (
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
                    className="block px-3 py-2.5 text-sm font-medium rounded-lg text-white bg-blue-600 hover:bg-blue-700"
                    onClick={() => setMobileMenuOpen(false)}
                  >
                    {t('register')}
                  </Link>
                </div>
              )}
            </div>
          </div>
        </div>
      ) : null}
    </header>
  );
}