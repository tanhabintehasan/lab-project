'use client';

import { useState, useEffect, useCallback } from 'react';
import { useTranslations } from 'next-intl';
import { LabPortalLayout } from '@/components/layout/lab-portal-layout';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Table, TableHeader, TableBody, TableRow, TableHead, TableCell } from '@/components/ui/table';
import { Pagination } from '@/components/ui/pagination';
import { EmptyState } from '@/components/ui/empty-state';
import { TableSkeleton } from '@/components/ui/skeleton';
import { ShoppingCart } from 'lucide-react';
import { useAuthStore } from '@/store/auth-store';
import { formatDate, formatCurrency } from '@/lib/utils';

export default function LabPortalOrdersPage() {
  const t = useTranslations('labPortal');
  // Auth via HttpOnly cookie
  const [orders, setOrders] = useState<Array<Record<string, unknown>>>([]);
  const [loading, setLoading] = useState(true);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);

  const fetchData = useCallback(() => {
    setLoading(true);
    fetch(`/api/orders?page=${page}&pageSize=10`, { })
      .then(r => r.json())
      .then(d => { setOrders(d.data || []); setTotalPages(d.totalPages || 1); })
      .finally(() => setLoading(false));
  }, [page]);

  useEffect(() => { fetchData(); }, [fetchData]);

  const updateStatus = async (id: string, status: string) => {
    await fetch(`/api/lab/orders/${id}`, {
      credentials: 'include',
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ status }),
    });
    fetchData();
  };

  return (
    <LabPortalLayout>
      <div className="space-y-6">
        <h1 className="text-2xl font-bold text-gray-900">{t('assignedOrders')}</h1>
        {loading ? <TableSkeleton rows={6} /> : orders.length === 0 ? (
          <EmptyState icon={ShoppingCart} title="暂无分配的订单" />
        ) : (
          <Card padding="none">
            <Table>
              <TableHeader><TableRow>
                <TableHead>订单号</TableHead><TableHead>客户</TableHead><TableHead>金额</TableHead>
                <TableHead>状态</TableHead><TableHead>日期</TableHead><TableHead>操作</TableHead>
              </TableRow></TableHeader>
              <TableBody>
                {orders.map(o => {
                  const usr = o.user as Record<string, string> | undefined;
                  const status = o.status as string;
                  return (
                    <TableRow key={o.id as string}>
                      <TableCell className="font-mono text-sm">{o.orderNo as string}</TableCell>
                      <TableCell className="text-sm">{usr?.name || '-'}</TableCell>
                      <TableCell className="font-medium">{formatCurrency(Number(o.totalAmount))}</TableCell>
                      <TableCell><Badge variant="info">{status}</Badge></TableCell>
                      <TableCell className="text-sm text-gray-500">{formatDate(o.createdAt as string)}</TableCell>
                      <TableCell>
                        <div className="flex gap-1">
                          {status === 'PAID' && <Button size="sm" variant="success" onClick={() => updateStatus(o.id as string, 'SAMPLE_PENDING')}>接受</Button>}
                          {status === 'SAMPLE_RECEIVED' && <Button size="sm" onClick={() => updateStatus(o.id as string, 'TESTING_IN_PROGRESS')}>开始检测</Button>}
                          {status === 'TESTING_IN_PROGRESS' && <Button size="sm" variant="success" onClick={() => updateStatus(o.id as string, 'TESTING_COMPLETE')}>完成</Button>}
                        </div>
                      </TableCell>
                    </TableRow>
                  );
                })}
              </TableBody>
            </Table>
          </Card>
        )}
        <Pagination currentPage={page} totalPages={totalPages} onPageChange={setPage} />
      </div>
    </LabPortalLayout>
  );
}
