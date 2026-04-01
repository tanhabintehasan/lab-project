'use client';

import { useState, useEffect } from 'react';
import { useParams } from 'next/navigation';
import { useTranslations } from 'next-intl';
import { Link } from '@/i18n/routing';
import { DashboardLayout } from '@/components/layout/dashboard-layout';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Timeline } from '@/components/ui/timeline';
import { Skeleton } from '@/components/ui/skeleton';
import { ArrowLeft, Printer, Download, FileText } from 'lucide-react';
import { formatDateTime, formatCurrency } from '@/lib/utils';

export default function OrderDetailPage() {
  const t = useTranslations('orders');
  const params = useParams();
  const [order, setOrder] = useState<Record<string, unknown> | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch(`/api/orders/${params.id}`, {})
      .then(r => r.json())
      .then(d => {
        if (d.success) setOrder(d.data);
      })
      .finally(() => setLoading(false));
  }, [params.id]);

  if (loading) {
    return (
      <DashboardLayout>
        <div className="space-y-4">
          <Skeleton className="h-8 w-1/3" />
          <Skeleton className="h-64 w-full" />
        </div>
      </DashboardLayout>
    );
  }

  if (!order) {
    return (
      <DashboardLayout>
        <div className="text-center py-16">
          <p className="text-gray-500">订单未找到</p>
          <Link href="/dashboard/orders" className="text-blue-600">
            返回订单列表
          </Link>
        </div>
      </DashboardLayout>
    );
  }

  const items = (order.items as Array<Record<string, unknown>>) || [];
  const timeline = (order.timeline as Array<Record<string, unknown>>) || [];
  const reports = (order.reports as Array<Record<string, unknown>>) || [];
  const samples = (order.samples as Array<Record<string, unknown>>) || [];
  const lab = order.lab as Record<string, string> | null;

  return (
    <DashboardLayout>
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <Link
              href="/dashboard/orders"
              className="inline-flex items-center gap-1 text-gray-500 hover:text-gray-700 text-sm mb-2"
            >
              <ArrowLeft className="h-4 w-4" />
              返回订单列表
            </Link>
            <h1 className="text-2xl font-bold text-gray-900">订单 {order.orderNo as string}</h1>
          </div>
          <div className="flex gap-2">
            <Button variant="outline" size="sm" onClick={() => window.print()}>
              <Printer className="h-4 w-4" />
              打印订单
            </Button>
          </div>
        </div>

        <div className="grid md:grid-cols-2 gap-6">
          <Card padding="lg">
            <h2 className="font-semibold text-gray-900 mb-4">订单信息</h2>
            <div className="space-y-3 text-sm">
              <div className="flex justify-between">
                <span className="text-gray-500">订单编号</span>
                <span className="font-mono">{order.orderNo as string}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-500">状态</span>
                <Badge variant="info">{t(`status.${(order.status as string).toLowerCase()}`)}</Badge>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-500">订单金额</span>
                <span className="font-medium text-blue-600">
                  {formatCurrency(Number(order.totalAmount))}
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-500">已支付</span>
                <span>{formatCurrency(Number(order.paidAmount))}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-500">创建时间</span>
                <span>{formatDateTime(order.createdAt as string)}</span>
              </div>
              {lab && (
                <div className="flex justify-between">
                  <span className="text-gray-500">分配实验室</span>
                  <Link href={`/labs/${lab.slug}`} className="text-blue-600 hover:underline">
                    {lab.nameZh}
                  </Link>
                </div>
              )}
            </div>
          </Card>

          <Card padding="lg">
            <h2 className="font-semibold text-gray-900 mb-4">订单进度</h2>
            {timeline.length > 0 ? (
              <Timeline
                items={timeline.map(t => ({
                  title: t.title as string,
                  description: t.description as string | undefined,
                  time: formatDateTime(t.createdAt as string),
                  operator: t.operator as string | undefined,
                  status: 'completed' as const,
                }))}
              />
            ) : (
              <p className="text-gray-500 text-sm">暂无进度记录</p>
            )}
          </Card>
        </div>

        {items.length > 0 && (
          <Card padding="lg">
            <h2 className="font-semibold text-gray-900 mb-4">检测项目</h2>
            <div className="space-y-3">
              {items.map(item => {
                const svc = item.service as Record<string, string> | undefined;
                return (
                  <div
                    key={item.id as string}
                    className="flex items-center justify-between p-3 border border-gray-200 rounded-lg"
                  >
                    <div>
                      <p className="font-medium text-gray-900">{svc?.nameZh || '-'}</p>
                      <p className="text-sm text-gray-500">
                        数量: {String(item.quantity)} · 单价: {formatCurrency(Number(item.unitPrice))}
                      </p>
                    </div>
                    <p className="font-medium text-gray-900">
                      {formatCurrency(Number(item.subtotal))}
                    </p>
                  </div>
                );
              })}
            </div>
          </Card>
        )}

        {samples.length > 0 && (
          <Card padding="lg">
            <h2 className="font-semibold text-gray-900 mb-4">样品信息</h2>
            <div className="space-y-3">
              {samples.map(s => {
                const trackingNo = s.trackingNo as string | undefined;

                return (
                  <div key={s.id as string} className="p-3 border border-gray-200 rounded-lg">
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="font-medium text-gray-900">{s.name as string}</p>
                        <p className="text-sm text-gray-500 font-mono">{s.sampleNo as string}</p>
                      </div>
                      <Badge variant="info">{s.status as string}</Badge>
                    </div>
                    {trackingNo ? (
                      <p className="text-sm text-gray-500 mt-2">快递单号: {trackingNo}</p>
                    ) : null}
                  </div>
                );
              })}
            </div>
          </Card>
        )}

        {reports.length > 0 && (
          <Card padding="lg">
            <h2 className="font-semibold text-gray-900 mb-4">检测报告</h2>
            <div className="space-y-3">
              {reports.map(r => (
                <div
                  key={r.id as string}
                  className="flex items-center justify-between p-3 border border-gray-200 rounded-lg"
                >
                  <div className="flex items-center gap-3">
                    <FileText className="h-8 w-8 text-blue-600" />
                    <div>
                      <p className="font-medium text-gray-900">{r.title as string}</p>
                      <p className="text-sm text-gray-500 font-mono">{r.reportNo as string}</p>
                    </div>
                  </div>
                  <div className="flex gap-2">
                    {r.fileUrl ? (
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => window.open(r.fileUrl as string)}
                      >
                        <Download className="h-4 w-4" />
                        下载
                      </Button>
                    ) : null}
                  </div>
                </div>
              ))}
            </div>
          </Card>
        )}
      </div>
    </DashboardLayout>
  );
}