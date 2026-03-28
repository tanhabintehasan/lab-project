'use client';

import { useState, useEffect } from 'react';
import { useTranslations } from 'next-intl';
import { Link, usePathname, useRouter } from '@/i18n/routing';
import {
  LayoutDashboard,
  ShoppingCart,
  Package,
  FileText,
  Users,
  Building2,
  Wallet,
  Gift,
  Globe,
  BarChart3,
  FileQuestion,
  Wrench,
  Newspaper,
  Shield,
  FlaskConical,
  ChevronLeft,
  ChevronRight,
  Bell,
  Menu,
  LogOut,
  CreditCard,
  Zap,
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { useAuthStore } from '@/store/auth-store';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';

interface AdminLayoutProps {
  children: React.ReactNode;
}

interface MenuItem {
  href: string;
  icon: typeof LayoutDashboard;
  label: string;
}

export function AdminLayout({ children }: AdminLayoutProps) {
  const t = useTranslations('admin');
  const [collapsed, setCollapsed] = useState(false);
  const [mobileOpen, setMobileOpen] = useState(false);
  const [loggingOut, setLoggingOut] = useState(false);
  const [showQuickActions, setShowQuickActions] = useState(false);
  const [authLoading, setAuthLoading] = useState(true);

  const pathname = usePathname();
  const router = useRouter();
  const { user, setUser } = useAuthStore();

  useEffect(() => {
    let mounted = true;

    async function loadCurrentUser() {
      try {
        if (user) {
          if (mounted) setAuthLoading(false);
          return;
        }

        const res = await fetch('/api/auth/me', {
          method: 'GET',
          credentials: 'include',
          cache: 'no-store',
        });

        if (res.status === 401) {
          if (mounted) {
            setUser(null);
            setAuthLoading(false);
            router.replace('/auth/login');
          }
          return;
        }

        const data = await res.json();

        if (mounted && data?.success && data?.data) {
          setUser(data.data);
        } else if (mounted) {
          router.replace('/auth/login');
        }
      } catch (error) {
        console.error('Failed to fetch current user:', error);
      } finally {
        if (mounted) setAuthLoading(false);
      }
    }

    loadCurrentUser();

    return () => {
      mounted = false;
    };
  }, [user, setUser, router]);

  useEffect(() => {
    if (!user) return;

    const financeOnlyPaths = [
      '/admin/finance',
      '/admin/transactions',
      '/admin/referrals',
      '/admin/analytics',
    ];

    const superAdminOnlyPaths = [
      '/admin/dashboard',
      '/admin/users',
      '/admin/translations',
      '/admin/settings/payments',
      '/admin/settings/webhook-logs',
    ];

    if (user.role === 'FINANCE_ADMIN') {
      if (superAdminOnlyPaths.some((p) => pathname.startsWith(p))) {
        router.replace('/admin/finance');
      }
    }

    if (user.role === 'SUPER_ADMIN') {
      if (pathname === '/admin') {
        router.replace('/admin/dashboard');
      }
    }

    if (user.role === 'FINANCE_ADMIN' && pathname === '/admin') {
      router.replace('/admin/finance');
    }
  }, [user, pathname, router]);

  const handleLogout = async () => {
    try {
      setLoggingOut(true);

      await fetch('/api/auth/logout', {
        method: 'POST',
        credentials: 'include',
      });

      setUser(null);
      router.replace('/');
      router.refresh();
    } catch (err) {
      console.error('Logout failed:', err);
    } finally {
      setLoggingOut(false);
    }
  };

  const superAdminMenu: MenuItem[] = [
    { href: '/admin/dashboard', icon: LayoutDashboard, label: t('dashboard') },
    { href: '/admin/services', icon: FlaskConical, label: t('services') },
    { href: '/admin/rfq', icon: FileQuestion, label: t('rfq') },
    { href: '/admin/orders', icon: ShoppingCart, label: t('orders') },
    { href: '/admin/samples', icon: Package, label: t('samples') },
    { href: '/admin/reports', icon: FileText, label: t('reports') },
    { href: '/admin/users', icon: Users, label: t('users') },
    { href: '/admin/labs', icon: Building2, label: t('labs') },
    { href: '/admin/equipment', icon: Wrench, label: t('equipment') },
    { href: '/admin/finance', icon: Wallet, label: t('finance') },
    { href: '/admin/transactions', icon: CreditCard, label: '交易管理' },
    { href: '/admin/referrals', icon: Gift, label: t('referrals') },
    { href: '/admin/cms', icon: Newspaper, label: t('cms') },
    { href: '/admin/translations', icon: Globe, label: t('translations') },
    { href: '/admin/analytics', icon: BarChart3, label: t('analytics') },
    { href: '/admin/settings/payments', icon: CreditCard, label: '支付管理' },
    { href: '/admin/settings/webhook-logs', icon: Zap, label: 'Webhook日志' },
  ];

  const financeAdminMenu: MenuItem[] = [
    { href: '/admin/finance', icon: Wallet, label: '财务首页' },
    { href: '/admin/transactions', icon: CreditCard, label: '交易管理' },
    { href: '/admin/referrals', icon: Gift, label: '返佣管理' },
    { href: '/admin/analytics', icon: BarChart3, label: '财务分析' },
    { href: '/admin/orders', icon: ShoppingCart, label: '订单查看' },
    { href: '/admin/reports', icon: FileText, label: '发票/报告' },
  ];

  const menuItems =
    user?.role === 'FINANCE_ADMIN' ? financeAdminMenu : superAdminMenu;

  const getRoleBadgeVariant = (role: string) => {
    switch (role) {
      case 'SUPER_ADMIN':
        return 'danger' as const;
      case 'FINANCE_ADMIN':
        return 'success' as const;
      default:
        return 'default' as const;
    }
  };

  const getRoleLabel = (role: string) => {
    const labels: Record<string, string> = {
      SUPER_ADMIN: '超级管理员',
      FINANCE_ADMIN: '财务管理员',
      LAB_PARTNER: '实验室',
      TECHNICIAN: '技术员',
    };
    return labels[role] || role;
  };

  const renderSidebar = () => (
    <aside
      className={cn(
        'bg-gray-900 text-gray-300 flex flex-col h-full transition-all duration-200',
        collapsed ? 'w-16' : 'w-60'
      )}
    >
      <div className="h-16 flex items-center px-4 border-b border-gray-800">
        <Link
          href={user?.role === 'FINANCE_ADMIN' ? '/admin/finance' : '/admin/dashboard'}
          className="flex items-center gap-2"
        >
          <Shield className="h-7 w-7 text-blue-400 flex-shrink-0" />
          {!collapsed && (
            <span className="font-bold text-white">
              {user?.role === 'FINANCE_ADMIN' ? 'Finance Panel' : t('title')}
            </span>
          )}
        </Link>
      </div>

      <nav className="flex-1 py-4 px-2 space-y-1 overflow-y-auto">
        {menuItems.map((item) => {
          const isActive =
            pathname === item.href ||
            (item.href !== '/admin/dashboard' &&
              item.href !== '/admin/finance' &&
              pathname.startsWith(item.href));

          return (
            <Link
              key={item.href}
              href={item.href}
              className={cn(
                'flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-colors',
                isActive
                  ? 'bg-blue-600 text-white'
                  : 'text-gray-400 hover:bg-gray-800 hover:text-white'
              )}
              title={collapsed ? item.label : undefined}
            >
              <item.icon className="h-5 w-5 flex-shrink-0" />
              {!collapsed && <span>{item.label}</span>}
            </Link>
          );
        })}
      </nav>

      <div className="p-2 border-t border-gray-800 hidden lg:block">
        <button
          onClick={() => setCollapsed(!collapsed)}
          className="w-full flex items-center justify-center py-2 rounded-lg text-gray-500 hover:bg-gray-800 hover:text-gray-300"
        >
          {collapsed ? <ChevronRight className="h-4 w-4" /> : <ChevronLeft className="h-4 w-4" />}
        </button>
      </div>
    </aside>
  );

  if (authLoading) {
    return (
      <div className="flex h-screen items-center justify-center bg-gray-100">
        <div className="text-sm text-gray-600">Loading admin panel...</div>
      </div>
    );
  }

  return (
    <div className="flex h-screen bg-gray-100">
      <div className="hidden lg:block">{renderSidebar()}</div>

      {mobileOpen && (
        <div className="lg:hidden fixed inset-0 z-50 flex">
          <div className="fixed inset-0 bg-black/50" onClick={() => setMobileOpen(false)} />
          <div className="relative z-50">{renderSidebar()}</div>
        </div>
      )}

      <div className="flex-1 flex flex-col overflow-hidden">
        <header className="h-16 bg-white border-b border-gray-200 flex items-center justify-between px-4 lg:px-6">
          <div className="flex items-center gap-3">
            <button
              className="lg:hidden p-2 rounded-lg text-gray-500 hover:bg-gray-100"
              onClick={() => setMobileOpen(true)}
            >
              <Menu className="h-5 w-5" />
            </button>
            <h1 className="text-lg font-semibold text-gray-900">
              {user?.role === 'FINANCE_ADMIN' ? '财务控制台' : t('title')}
            </h1>
          </div>

          <div className="flex items-center gap-3">
            <Link href="/" className="text-sm text-gray-500 hover:text-gray-700 hidden sm:block">
              返回前台
            </Link>

            <div className="relative">
              <button
                onClick={() => setShowQuickActions(!showQuickActions)}
                className="p-2 rounded-lg text-gray-500 hover:bg-gray-100"
                title="快捷操作"
              >
                <Zap className="h-5 w-5" />
              </button>

              {showQuickActions && (
                <div className="absolute right-0 mt-2 w-56 bg-white rounded-lg shadow-lg border border-gray-200 py-2 z-50">
                  {user?.role === 'SUPER_ADMIN' && (
                    <>
                      <Link
                        href="/admin/settings/payments"
                        className="flex items-center gap-2 px-4 py-2 text-sm text-gray-700 hover:bg-gray-100"
                        onClick={() => setShowQuickActions(false)}
                      >
                        <CreditCard className="h-4 w-4" />
                        支付管理
                      </Link>
                      <Link
                        href="/admin/dashboard"
                        className="flex items-center gap-2 px-4 py-2 text-sm text-gray-700 hover:bg-gray-100"
                        onClick={() => setShowQuickActions(false)}
                      >
                        <LayoutDashboard className="h-4 w-4" />
                        超级管理首页
                      </Link>
                    </>
                  )}

                  {(user?.role === 'SUPER_ADMIN' || user?.role === 'FINANCE_ADMIN') && (
                    <Link
                      href="/admin/finance"
                      className="flex items-center gap-2 px-4 py-2 text-sm text-gray-700 hover:bg-gray-100"
                      onClick={() => setShowQuickActions(false)}
                    >
                      <Wallet className="h-4 w-4" />
                      财务管理
                    </Link>
                  )}
                </div>
              )}
            </div>

            <button className="p-2 rounded-lg text-gray-500 hover:bg-gray-100 relative" title="通知">
              <Bell className="h-5 w-5" />
            </button>

            <div className="flex items-center gap-2">
              <div className="hidden sm:flex flex-col items-end">
                <span className="text-sm font-medium text-gray-900">{user?.name || 'Admin'}</span>
                {user?.role && (
                  <Badge variant={getRoleBadgeVariant(user.role)} className="text-xs">
                    {getRoleLabel(user.role)}
                  </Badge>
                )}
              </div>
              <div className="w-8 h-8 bg-blue-600 rounded-full flex items-center justify-center text-white font-medium text-sm">
                {user?.name?.[0]?.toUpperCase() || 'A'}
              </div>
            </div>

            <Button
              variant="ghost"
              size="sm"
              onClick={handleLogout}
              loading={loggingOut}
              disabled={loggingOut}
              className="text-red-600 hover:text-red-700 hover:bg-red-50"
              title="退出登录"
            >
              <LogOut className="h-4 w-4" />
            </Button>
          </div>
        </header>

        <main className="flex-1 overflow-y-auto p-4 lg:p-6">{children}</main>
      </div>
    </div>
  );
}
