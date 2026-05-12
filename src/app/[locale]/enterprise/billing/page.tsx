'use client';
import { EnterpriseLayout } from '@/components/layout/enterprise-layout';
import { StatsCard } from '@/components/ui/stats-card';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Wallet } from 'lucide-react';

export default function EnterpriseBillingPage() {
  return (
    <EnterpriseLayout>
      <div className="space-y-6">
        <h1 className="text-2xl font-bold text-gray-900">企业账单</h1>
        <StatsCard title="企业余额" value="¥0.00" icon={Wallet} iconColor="text-green-600 bg-green-100" className="max-w-sm" />
        <Card padding="lg">
          <div className="flex items-center justify-between mb-4">
            <h2 className="font-semibold text-gray-900">交易记录</h2>
            <Button size="sm">充值</Button>
          </div>
          <p className="text-gray-500 text-sm">暂无交易记录</p>
        </Card>
      </div>
    </EnterpriseLayout>
  );
}
