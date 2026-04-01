'use client';

import { useState } from 'react';
import { useTranslations } from 'next-intl';
import { Link, usePathname } from '@/i18n/routing';
import {
  LayoutDashboard, ShoppingCart, Package, FileText, Wrench,
  FileQuestion, Microscope, ChevronLeft, ChevronRight,
  Bell, Menu,
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { useAuthStore } from '@/store/auth-store';

interface LabPortalLayoutProps {
  children: React.ReactNode;
}

export function LabPortalLayout({ children }: LabPortalLayoutProps) {
  const t = useTranslations('labPortal');
  const [collapsed, setCollapsed] = useState(false);
  const [mobileOpen, setMobileOpen] = useState(false);
  const pathname = usePathname();
  const { user } = useAuthStore();

  const menuItems = [
    { href: '/lab-portal/dashboard', icon: LayoutDashboard, label: t('dashboard') },
    { href: '/lab-portal/orders', icon: ShoppingCart, label: t('assignedOrders') },
    { href: '/lab-portal/rfq', icon: FileQuestion, label: t('assignedRFQs') },
    { href: '/lab-portal/samples', icon: Package, label: t('sampleManagement') },
    { href: '/lab-portal/reports', icon: FileText, label: t('reportUpload') },
    { href: '/lab-portal/equipment', icon: Wrench, label: t('equipmentManage') },
  ];

  const renderSidebar = () => (
    <aside
      className={cn(
        'bg-emerald-900 text-emerald-200 flex flex-col h-full transition-all duration-200',
        collapsed ? 'w-16' : 'w-60'
      )}
    >
      <div className="h-16 flex items-center px-4 border-b border-emerald-800">
        <Link href="/lab-portal/dashboard" className="flex items-center gap-2">
          <Microscope className="h-7 w-7 text-emerald-400 flex-shrink-0" />
          {!collapsed && <span className="font-bold text-white">度量衡科研平台</span>}
        </Link>
      </div>

      <nav className="flex-1 py-4 px-2 space-y-1 overflow-y-auto">
        {menuItems.map((item) => {
          const isActive = pathname === item.href;
          return (
            <Link
              key={item.href}
              href={item.href}
              className={cn(
                'flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-colors',
                isActive
                  ? 'bg-emerald-600 text-white'
                  : 'text-emerald-300 hover:bg-emerald-800 hover:text-white'
              )}
              title={collapsed ? item.label : undefined}
            >
              <item.icon className="h-5 w-5 flex-shrink-0" />
              {!collapsed && <span>{item.label}</span>}
            </Link>
          );
        })}
      </nav>

      <div className="p-2 border-t border-emerald-800 hidden lg:block">
        <button
          onClick={() => setCollapsed(!collapsed)}
          className="w-full flex items-center justify-center py-2 rounded-lg text-emerald-500 hover:bg-emerald-800 hover:text-emerald-300"
        >
          {collapsed ? <ChevronRight className="h-4 w-4" /> : <ChevronLeft className="h-4 w-4" />}
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
            <button className="lg:hidden p-2 rounded-lg text-gray-500 hover:bg-gray-100" onClick={() => setMobileOpen(true)}>
              <Menu className="h-5 w-5" />
            </button>
            <h1 className="text-lg font-semibold text-gray-900">度量衡科研平台</h1>
          </div>
          <div className="flex items-center gap-2">
            <button className="p-2 rounded-lg text-gray-500 hover:bg-gray-100"><Bell className="h-5 w-5" /></button>
            <div className="w-8 h-8 bg-emerald-600 rounded-full flex items-center justify-center text-white font-medium text-sm">
              {user?.name?.[0] || 'L'}
            </div>
          </div>
        </header>
        <main className="flex-1 overflow-y-auto p-4 lg:p-6">{children}</main>
      </div>
    </div>
  );
}