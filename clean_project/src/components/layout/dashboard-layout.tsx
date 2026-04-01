'use client';

import { useState } from 'react';
import { useTranslations } from 'next-intl';
import { Link, usePathname } from '@/i18n/routing';
import {
  LayoutDashboard,
  ShoppingCart,
  Package,
  FileText,
  Wallet,
  Users,
  MessageSquare,
  Settings,
  User,
  FileQuestion,
  ChevronLeft,
  ChevronRight,
  Bell,
  FlaskConical,
  Menu,
  CalendarDays,
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { useAuthStore } from '@/store/auth-store';

interface DashboardLayoutProps {
  children: React.ReactNode;
}

export function DashboardLayout({ children }: DashboardLayoutProps) {
  const t = useTranslations('dashboard');
  const [collapsed, setCollapsed] = useState(false);
  const [mobileOpen, setMobileOpen] = useState(false);
  const pathname = usePathname();
  const { user } = useAuthStore();

  const menuItems = [
    { href: '/dashboard', icon: LayoutDashboard, label: t('title') },
    { href: '/dashboard/orders', icon: ShoppingCart, label: '我的订单' },
    { href: '/dashboard/quotations', icon: FileQuestion, label: '我的报价' },
    { href: '/dashboard/samples', icon: Package, label: '样品追踪' },
    { href: '/dashboard/reports', icon: FileText, label: '检测报告' },
    { href: '/dashboard/bookings', icon: CalendarDays, label: '设备预约' },
    { href: '/dashboard/wallet', icon: Wallet, label: '钱包中心' },
    { href: '/dashboard/referral', icon: Users, label: '邀请返佣' },
    { href: '/dashboard/messages', icon: MessageSquare, label: '消息通知' },
    { href: '/dashboard/profile', icon: User, label: '个人资料' },
    { href: '/dashboard/settings', icon: Settings, label: '账户设置' },
  ];

  const renderSidebar = () => (
    <aside
      className={cn(
        'bg-white border-r border-gray-200 flex flex-col h-full transition-all duration-200',
        collapsed ? 'w-16' : 'w-60'
      )}
    >
      <div className="h-16 flex items-center px-4 border-b border-gray-200">
        <Link href="/" className="flex items-center gap-2">
          <FlaskConical className="h-7 w-7 text-blue-600 flex-shrink-0" />
          {!collapsed && <span className="font-bold text-gray-900">度量衡科研平台</span>}
        </Link>
      </div>

      <nav className="flex-1 py-4 px-2 space-y-1 overflow-y-auto">
        {menuItems.map((item) => {
          const isActive =
            pathname === item.href ||
            (item.href !== '/dashboard' && pathname.startsWith(item.href));

          return (
            <Link
              key={item.href}
              href={item.href}
              className={cn(
                'flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-colors',
                isActive
                  ? 'bg-blue-50 text-blue-600'
                  : 'text-gray-600 hover:bg-gray-50 hover:text-gray-900'
              )}
              title={collapsed ? item.label : undefined}
            >
              <item.icon className="h-5 w-5 flex-shrink-0" />
              {!collapsed && <span>{item.label}</span>}
            </Link>
          );
        })}
      </nav>

      <div className="p-2 border-t border-gray-200 hidden lg:block">
        <button
          onClick={() => setCollapsed(!collapsed)}
          className="w-full flex items-center justify-center py-2 rounded-lg text-gray-400 hover:bg-gray-100 hover:text-gray-600"
        >
          {collapsed ? (
            <ChevronRight className="h-4 w-4" />
          ) : (
            <ChevronLeft className="h-4 w-4" />
          )}
        </button>
      </div>
    </aside>
  );

  return (
    <div className="flex h-screen bg-gray-50">
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
            <h1 className="text-lg font-semibold text-gray-900">{t('title')}</h1>
          </div>

          <div className="flex items-center gap-2">
            <button className="p-2 rounded-lg text-gray-500 hover:bg-gray-100 relative">
              <Bell className="h-5 w-5" />
            </button>

            <div className="flex items-center gap-2 px-3 py-1.5 rounded-lg text-sm">
              <div className="w-8 h-8 bg-blue-100 rounded-full flex items-center justify-center text-blue-600 font-medium text-sm">
                {user?.name?.[0] || 'U'}
              </div>
              <span className="hidden md:inline text-gray-700 font-medium">
                {user?.name || '用户'}
              </span>
            </div>
          </div>
        </header>

        <main className="flex-1 overflow-y-auto p-4 lg:p-6">{children}</main>
      </div>
    </div>
  );
}