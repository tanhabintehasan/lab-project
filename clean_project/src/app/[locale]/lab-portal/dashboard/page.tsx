'use client';

import { useState, useEffect } from 'react';
import { LabPortalLayout } from '@/components/layout/lab-portal-layout';
import { StatsCard } from '@/components/ui/stats-card';
import { Card, CardHeader, CardTitle } from '@/components/ui/card';
import { ShoppingCart, Package, FileText, Clock } from 'lucide-react';
import { useAuthStore } from '@/store/auth-store';

export default function LabPortalDashboardPage() {
  // Auth via HttpOnly cookie
  const [orderCount, setOrderCount] = useState(0);
  const [sampleCount, setSampleCount] = useState(0);

  useEffect(() => {
    const fetchOpts = { };
    fetch('/api/orders?pageSize=1', fetchOpts).then(r => r.json()).then(d => setOrderCount(d.total || 0));
    fetch('/api/samples?pageSize=1', fetchOpts).then(r => r.json()).then(d => setSampleCount(d.total || 0));
  }, []);

  return (
    <LabPortalLayout>
      <div className="space-y-6">
        <h1 className="text-2xl font-bold text-gray-900">工作台</h1>
        <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-4">
          <StatsCard title="分配订单" value={orderCount} icon={ShoppingCart} iconColor="text-emerald-600 bg-emerald-100" />
          <StatsCard title="待处理样品" value={sampleCount} icon={Package} iconColor="text-blue-600 bg-blue-100" />
          <StatsCard title="待上传报告" value={0} icon={FileText} iconColor="text-orange-600 bg-orange-100" />
          <StatsCard title="平均周期" value="5天" icon={Clock} iconColor="text-purple-600 bg-purple-100" />
        </div>
        <div className="grid md:grid-cols-2 gap-6">
          <Card padding="lg"><CardHeader><CardTitle>今日任务</CardTitle></CardHeader><p className="text-gray-500 text-sm">暂无待处理任务</p></Card>
          <Card padding="lg"><CardHeader><CardTitle>绩效统计</CardTitle></CardHeader><div className="h-48 bg-gray-50 rounded-lg flex items-center justify-center text-gray-400 text-sm">集成图表库后显示</div></Card>
        </div>
      </div>
    </LabPortalLayout>
  );
}
