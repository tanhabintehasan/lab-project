'use client';

import { useState, useEffect, useCallback } from 'react';
import { AdminLayout } from '@/components/layout/admin-layout';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { SearchInput } from '@/components/ui/search-input';
import { Table, TableHeader, TableBody, TableRow, TableHead, TableCell } from '@/components/ui/table';
import { Pagination } from '@/components/ui/pagination';
import { TableSkeleton } from '@/components/ui/skeleton';
import { Download, Eye, ArrowRight } from 'lucide-react';
import { useAuthStore } from '@/store/auth-store';
import { Link } from '@/i18n/routing';
import { formatDate, formatCurrency } from '@/lib/utils';

function OrderStatusBadge({ status }: { status: string }) {
  const variantMap: Record<string, 'default' | 'success' | 'warning' | 'danger' | 'info' | 'outline'> = {
    PENDING_PAYMENT: 'warning',
    PAID: 'info',
    SAMPLE_PENDING: 'default',
    SAMPLE_SHIPPED: 'default',
    SAMPLE_RECEIVED: 'info',
    SAMPLE_INSPECTED: 'info',
    TESTING_IN_PROGRESS: 'info',
    TESTING_COMPLETE: 'success',
    REPORT_GENERATING: 'info',
    REPORT_APPROVED: 'success',
    REPORT_DELIVERED: 'success',
    COMPLETED: 'success',
    CANCELLED: 'danger',
    REFUNDING: 'warning',
    REFUNDED: 'outline',
  };
  const labelMap: Record<string, string> = {
    PENDING_PAYMENT: '待支付',
    PAID: '已支付',
    SAMPLE_PENDING: '待寄样',
    SAMPLE_SHIPPED: '已寄样',
    SAMPLE_RECEIVED: '已收样',
    SAMPLE_INSPECTED: '已检验',
    TESTING_IN_PROGRESS: '检测中',
    TESTING_COMPLETE: '检测完成',
    REPORT_GENERATING: '报告生成中',
    REPORT_APPROVED: '报告就绪',
    REPORT_DELIVERED: '报告已送达',
    COMPLETED: '已完成',
    CANCELLED: '已取消',
    REFUNDING: '退款中',
    REFUNDED: '已退款',
  };
  return <Badge variant={variantMap[status] || 'default'}>{labelMap[status] || status}</Badge>;
}

export default function AdminOrdersPage() {
  // Auth via HttpOnly cookie
  const [orders, setOrders] = useState<Array<Record<string, unknown>>>([]);
  const [loading, setLoading] = useState(true);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('');

  const fetchData = useCallback(() => {
    setLoading(true);
    const params = new URLSearchParams({ page: String(page), pageSize: '15' });
    if (search) params.set('q', search);
    if (statusFilter) params.set('status', statusFilter);
    fetch(`/api/orders?${params}`, { })
      .then(r => r.json())
      .then(d => { setOrders(d.data || []); setTotalPages(d.totalPages || 1); })
      .finally(() => setLoading(false));
  }, [page, search, statusFilter]);

  useEffect(() => { fetchData(); }, [fetchData]);

  const exportCSV = () => {
    const csv = ['订单号,用户,金额,状态,日期'].concat(
      orders.map(o => `${o.orderNo},${(o.user as Record<string,string>)?.email || ''},${o.totalAmount},${o.status},${o.createdAt}`)
    ).join('\n');
    const blob = new Blob([csv], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a'); a.href = url; a.download = 'orders.csv'; a.click();
  };

  return (
    <AdminLayout>
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <h1 className="text-2xl font-bold text-gray-900">订单管理</h1>
          <Button variant="outline" size="sm" onClick={exportCSV}><Download className="h-4 w-4" />导出订单</Button>
        </div>
        <div className="flex flex-wrap gap-3">
          <SearchInput placeholder="搜索订单号..." onSearch={v => { setSearch(v); setPage(1); }} className="w-56" size="sm" />
          {[
            { key: '', label: '全部' },
            { key: 'PENDING_PAYMENT', label: '待支付' },
            { key: 'PAID', label: '已支付' },
            { key: 'SAMPLE_RECEIVED', label: '已收样' },
            { key: 'TESTING_IN_PROGRESS', label: '检测中' },
            { key: 'REPORT_APPROVED', label: '报告就绪' },
            { key: 'COMPLETED', label: '已完成' },
            { key: 'CANCELLED', label: '已取消' },
            { key: 'REFUNDING', label: '退款中' },
          ].map(s => (
            <button key={s.key} onClick={() => { setStatusFilter(s.key); setPage(1); }}
              className={`px-3 py-1.5 rounded-lg text-sm ${statusFilter === s.key ? 'bg-blue-600 text-white' : 'bg-gray-100 text-gray-600'}`}>
              {s.label}
            </button>
          ))}
        </div>
        {loading ? <TableSkeleton rows={8} /> : (
          <Card padding="none">
            <Table>
              <TableHeader><TableRow>
                <TableHead>订单号</TableHead><TableHead>用户</TableHead><TableHead>金额</TableHead>
                <TableHead>状态</TableHead><TableHead>实验室</TableHead><TableHead>日期</TableHead><TableHead>操作</TableHead>
              </TableRow></TableHeader>
              <TableBody>
                {orders.map(o => {
                  const usr = o.user as Record<string, string> | undefined;
                  const lab = o.lab as Record<string, string> | undefined;
                  return (
                    <TableRow key={o.id as string}>
                      <TableCell className="font-mono text-sm">{o.orderNo as string}</TableCell>
                      <TableCell className="text-sm">{usr?.name || usr?.email || '-'}</TableCell>
                      <TableCell className="font-medium">{formatCurrency(Number(o.totalAmount))}</TableCell>
                      <TableCell><OrderStatusBadge status={o.status as string} /></TableCell>
                      <TableCell className="text-sm">{lab?.nameZh || '未分配'}</TableCell>
                      <TableCell className="text-sm text-gray-500">{formatDate(o.createdAt as string)}</TableCell>
                      <TableCell>
                        <Link href={`/admin/orders/${o.id as string}`}>
                          <Button size="sm" variant="ghost"><Eye className="h-4 w-4" /></Button>
                        </Link>
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
    </AdminLayout>
  );
}
