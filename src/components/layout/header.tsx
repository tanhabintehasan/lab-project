'use client';

import { useEffect, useState } from 'react';
import { useTranslations } from 'next-intl';
import {
  Link,
  usePathname,
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
  BookOpen,
} from 'lucide-react';
import { useAuthStore } from '@/store/auth-store';
import { useAppStore } from '@/store/app-store';
import { useSiteSettings } from '@/components/providers/SiteSettingsProvider';
import { cn } from '@/lib/utils';

export function Header() {
  const t = useTranslations('nav');
  const tCommon = useTranslations('common');
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const { settings } = useSiteSettings();

  const logoUrl = settings?.logoUploadUrl || settings?.logoUrl || null;
  const siteName = settings?.siteName || tCommon('siteName');
  const siteNameEn = settings?.siteNameEn || '';

  const { isAuthenticated, user } = useAuthStore();
  const loggedIn = isAuthenticated && !!user;

  const { notificationCount } = useAppStore();
  const pathname = usePathname();

  // Locale switcher removed - Chinese only

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
        { href: '/patent-services', label: t('patentServices'), icon: FileText },
        { href: '/paper-services', label: t('paperServices'), icon: BookOpen },
      ],
    },
    { href: '/patent-services', label: t('patentServices') },
    { href: '/equipment', label: t('equipment') },
    { href: '/rfq', label: t('rfq') },
    { href: '/research-fund', label: t('researchFund') },
    { href: '/about', label: t('about') },
    { href: '/help', label: t('help') },
  ];

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
              <Globe className="h-3 w-3" />
              <span>中文</span>
            </span>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16">
          <Link href="/" className="flex items-center gap-2 flex-shrink-0">
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
                  {item.hasDropdown ? <ChevronDown className="h-3.5 w-3.5" /> : null}
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
                          <child.icon className="h-4 w-4 text-primary/60" />
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
            <button className="p-2 rounded-lg text-primary/70 hover:bg-primary/10 hover:text-primary">
              <Search className="h-5 w-5" />
            </button>

            {loggedIn ? (
              <>
                <Link
                  href="/dashboard/messages"
                  className="p-2 rounded-lg text-primary/70 hover:bg-primary/10 relative"
                >
                  <MessageSquare className="h-5 w-5" />
                </Link>

                <Link
                  href={dashboardHref}
                  className="relative p-2 rounded-lg text-primary/70 hover:bg-primary/10"
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
                  className="flex items-center gap-2 px-3 py-1.5 rounded-lg text-sm font-medium text-primary/80 hover:bg-primary/10"
                >
                  <User className="h-4 w-4" />
                  <span className="hidden md:inline">{user?.name || 'Account'}</span>
                </Link>
              </>
            ) : (
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
            )}

            <button
              className="lg:hidden p-2 rounded-lg text-primary/70 hover:bg-primary/10"
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
                    className="block px-3 py-2.5 text-sm font-medium rounded-lg text-white bg-primary hover:opacity-90"
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
