'use client';
import { EnterpriseLayout } from '@/components/layout/enterprise-layout';
import { EmptyState } from '@/components/ui/empty-state';
import { ShoppingCart } from 'lucide-react';

export default function EnterpriseOrdersPage() {
  return (
    <EnterpriseLayout>
      <div className="space-y-6">
        <h1 className="text-2xl font-bold text-gray-900">企业订单</h1>
        <EmptyState icon={ShoppingCart} title="暂无企业订单" description="所有团队成员的订单将在此显示" />
      </div>
    </EnterpriseLayout>
  );
}
