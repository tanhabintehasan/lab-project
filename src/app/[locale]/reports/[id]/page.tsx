'use client';

import { useState, useEffect } from 'react';
import { useParams } from 'next/navigation';
import { Header } from '@/components/layout/header';
import { Footer } from '@/components/layout/footer';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import { formatDate } from '@/lib/utils';

export default function ReportPublicPage() {
  const params = useParams();
  const [report, setReport] = useState<Record<string, unknown> | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch(`/api/reports/verify?reportNo=${params.id}`, {
      credentials: 'include',
    })
      .then(r => r.json())
      .then(data => {
        if (data.success) setReport(data.data);
      })
      .finally(() => setLoading(false));
  }, [params.id]);

  if (loading) {
    return (
      <div className="min-h-screen">
        <Header />
        <div className="max-w-2xl mx-auto px-4 py-16">
          <Skeleton className="h-48 w-full" />
        </div>
        <Footer />
      </div>
    );
  }

  if (!report) {
    return (
      <div className="min-h-screen">
        <Header />
        <div className="max-w-2xl mx-auto px-4 py-16">
          <p className="text-center text-gray-500">报告未找到</p>
        </div>
        <Footer />
      </div>
    );
  }

  const title = report.title as string;
  const reportNo = report.reportNo as string;
  const status = report.status as string;
  const issuedAt = report.issuedAt as string | undefined;

  return (
    <div className="min-h-screen">
      <Header />
      <div className="max-w-2xl mx-auto px-4 py-16">
        <Card padding="lg">
          <h1 className="text-xl font-bold text-gray-900 mb-4">{title}</h1>

          <div className="space-y-3 text-sm">
            <div className="flex justify-between">
              <span className="text-gray-500">报告编号</span>
              <span className="font-mono">{reportNo}</span>
            </div>

            <div className="flex justify-between">
              <span className="text-gray-500">状态</span>
              <Badge variant="success">{status}</Badge>
            </div>

            {issuedAt ? (
              <div className="flex justify-between">
                <span className="text-gray-500">出具日期</span>
                <span>{formatDate(issuedAt)}</span>
              </div>
            ) : null}
          </div>

          <p className="mt-6 text-sm text-gray-400 text-center">
            此为报告摘要信息，完整报告请登录后查看
          </p>
        </Card>
      </div>
      <Footer />
    </div>
  );
}