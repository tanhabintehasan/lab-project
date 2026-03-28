'use client';
import { EnterpriseLayout } from '@/components/layout/enterprise-layout';
import { EmptyState } from '@/components/ui/empty-state';
import { FileText } from 'lucide-react';

export default function EnterpriseReportsPage() {
  return (
    <EnterpriseLayout>
      <div className="space-y-6">
        <h1 className="text-2xl font-bold text-gray-900">企业报告</h1>
        <EmptyState icon={FileText} title="暂无企业报告" description="所有团队成员的检测报告将在此显示" />
      </div>
    </EnterpriseLayout>
  );
}
