'use client';
import { useState, useEffect } from 'react';
import { AdminLayout } from '@/components/layout/admin-layout';
import { StatsCard } from '@/components/ui/stats-card';
import { Card } from '@/components/ui/card';
import { useAuthStore } from '@/store/auth-store';
import { BarChart3, ShoppingCart, Users, Building2 } from 'lucide-react';

export default function AdminAnalyticsPage() {
  // Auth via HttpOnly cookie
  const [stats, setStats] = useState<Record<string, unknown>>({});

  useEffect(() => {
    fetch('/api/admin/stats', { })
      .then(r => r.json())
      .then(d => { if (d.success) setStats(d.data); });
  }, []);

  return (
    <AdminLayout>
      <div className="space-y-6">
        <h1 className="text-2xl font-bold text-gray-900">数据分析</h1>
        <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-4">
          <StatsCard title="总订单" value={String(stats.totalOrders || 0)} icon={ShoppingCart} iconColor="text-blue-600 bg-blue-100" />
          <StatsCard title="总用户" value={String(stats.totalUsers || 0)} icon={Users} iconColor="text-green-600 bg-green-100" />
          <StatsCard title="合作实验室" value={String(stats.totalLabs || 0)} icon={Building2} iconColor="text-purple-600 bg-purple-100" />
          <StatsCard title="活跃服务" value={String(stats.activeServices || 0)} icon={BarChart3} iconColor="text-orange-600 bg-orange-100" />
        </div>
        <div className="grid md:grid-cols-2 gap-6">
          {['订单趋势', '收入趋势', '热门服务', '实验室绩效'].map(title => (
            <Card key={title} padding="lg">
              <h2 className="font-semibold text-gray-900 mb-4">{title}</h2>
              <div className="h-48 bg-gray-50 rounded-lg flex items-center justify-center text-gray-400 text-sm">集成图表库后显示</div>
            </Card>
          ))}
        </div>
      </div>
    </AdminLayout>
  );
}
