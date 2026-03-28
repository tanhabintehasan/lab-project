'use client';
import { EnterpriseLayout } from '@/components/layout/enterprise-layout';
import { StatsCard } from '@/components/ui/stats-card';
import { Card } from '@/components/ui/card';
import { ShoppingCart, Users, Wallet, CheckCircle2 } from 'lucide-react';

export default function EnterpriseWorkspacePage() {
  return (
    <EnterpriseLayout>
      <div className="space-y-6">
        <h1 className="text-2xl font-bold text-gray-900">企业空间</h1>
        <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-4">
          <StatsCard title="企业订单" value="0" icon={ShoppingCart} iconColor="text-teal-600 bg-teal-100" />
          <StatsCard title="团队成员" value="1" icon={Users} iconColor="text-blue-600 bg-blue-100" />
          <StatsCard title="企业余额" value="¥0.00" icon={Wallet} iconColor="text-green-600 bg-green-100" />
          <StatsCard title="待审批" value="0" icon={CheckCircle2} iconColor="text-orange-600 bg-orange-100" />
        </div>
        <Card padding="lg">
          <h2 className="font-semibold text-gray-900 mb-4">最近动态</h2>
          <p className="text-gray-500 text-sm">暂无动态记录</p>
        </Card>
      </div>
    </EnterpriseLayout>
  );
}
