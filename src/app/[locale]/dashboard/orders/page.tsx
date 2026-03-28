'use client';

import { useState, useEffect, useCallback } from 'react';
import { useTranslations } from 'next-intl';
import { Link, useRouter } from '@/i18n/routing';
import { DashboardLayout } from '@/components/layout/dashboard-layout';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { SearchInput } from '@/components/ui/search-input';
import { Table, TableHeader, TableBody, TableRow, TableHead, TableCell } from '@/components/ui/table';
import { Pagination } from '@/components/ui/pagination';
import { EmptyState } from '@/components/ui/empty-state';
import { TableSkeleton } from '@/components/ui/skeleton';
import { ShoppingCart, Plus, Eye } from 'lucide-react';
import { useAuthStore } from '@/store/auth-store';
import { formatDate, formatCurrency } from '@/lib/utils';

const statusVariant: Record<string, 'default'|'info'|'warning'|'success'|'danger'> = {
  PENDING_PAYMENT:'warning', PAID:'info', SAMPLE_PENDING:'default', SAMPLE_SHIPPED:'info',
  SAMPLE_RECEIVED:'info', TESTING_IN_PROGRESS:'info', TESTING_COMPLETE:'success',
  REPORT_GENERATING:'info', REPORT_APPROVED:'success', REPORT_DELIVERED:'success',
  COMPLETED:'success', CANCELLED:'danger', REFUNDED:'default',
};

export default function OrdersPage() {
  const t = useTranslations('orders');
  const router = useRouter();
  // Auth via HttpOnly cookie
  const [orders, setOrders] = useState<Array<Record<string, unknown>>>([]);
  const [loading, setLoading] = useState(true);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('');

  const fetchData = useCallback(() => {
    setLoading(true);
    const params = new URLSearchParams({ page: String(page), pageSize: '10' });
    if (search) params.set('q', search);
    if (statusFilter) params.set('status', statusFilter);
    fetch(`/api/orders?${params}`, { })
      .then(r => r.json())
      .then(d => { setOrders(d.data || []); setTotalPages(d.totalPages || 1); })
      .finally(() => setLoading(false));
  }, [page, search, statusFilter]);

  useEffect(() => { fetchData(); }, [fetchData]);

  const tabs = [
    { key: '', label: '全部' },
    { key: 'PENDING_PAYMENT', label: '待付款' },
    { key: 'TESTING_IN_PROGRESS', label: '检测中' },
    { key: 'COMPLETED', label: '已完成' },
  ];

  return (
    <DashboardLayout>
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <h1 className="text-2xl font-bold text-gray-900">{t('title')}</h1>
          <Link href="/services"><Button><Plus className="h-4 w-4" />{t('createOrder')}</Button></Link>
        </div>

        <div className="flex flex-wrap items-center gap-3">
          <div className="flex gap-1">
            {tabs.map(tab => (
              <button key={tab.key} onClick={() => { setStatusFilter(tab.key); setPage(1); }}
                className={`px-4 py-2 rounded-lg text-sm font-medium ${statusFilter === tab.key ? 'bg-blue-600 text-white' : 'bg-gray-100 text-gray-600 hover:bg-gray-200'}`}>
                {tab.label}
              </button>
            ))}
          </div>
          <SearchInput placeholder="搜索订单号..." onSearch={v => { setSearch(v); setPage(1); }} className="w-56" size="sm" />
        </div>

        {loading ? <TableSkeleton rows={6} /> : orders.length === 0 ? (
          <EmptyState icon={ShoppingCart} title="暂无订单" description="浏览服务并下单开始检测" actionLabel="浏览服务" onAction={() => router.push('/services')} />
        ) : (
          <Card padding="none">
            <Table>
              <TableHeader><TableRow>
                <TableHead>{t('orderNo')}</TableHead>
                <TableHead>服务</TableHead>
                <TableHead>状态</TableHead>
                <TableHead>{t('totalAmount')}</TableHead>
                <TableHead>{t('orderDate')}</TableHead>
                <TableHead>操作</TableHead>
              </TableRow></TableHeader>
              <TableBody>
                {orders.map(o => (
                  <TableRow key={o.id as string}>
                    <TableCell className="font-mono text-sm">{o.orderNo as string}</TableCell>
                    <TableCell className="font-medium max-w-[200px] truncate">
                      {((o.items as Array<{service:{nameZh:string}}>)?.[0]?.service?.nameZh) || '-'}
                    </TableCell>
                    <TableCell>
                      <Badge variant={statusVariant[(o.status as string)] || 'default'}>
                        {t(`status.${(o.status as string).toLowerCase()}`)}
                      </Badge>
                    </TableCell>
                    <TableCell className="text-blue-600 font-medium">{formatCurrency(Number(o.totalAmount))}</TableCell>
                    <TableCell className="text-sm text-gray-500">{formatDate(o.createdAt as string)}</TableCell>
                    <TableCell>
                      <Link href={`/dashboard/orders/${o.id as string}`}>
                        <Button size="sm" variant="ghost"><Eye className="h-4 w-4" /></Button>
                      </Link>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </Card>
        )}
        <Pagination currentPage={page} totalPages={totalPages} onPageChange={setPage} />
      </div>
    </DashboardLayout>
  );
}
