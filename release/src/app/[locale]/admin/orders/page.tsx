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
import { Download, Eye } from 'lucide-react';
import { useAuthStore } from '@/store/auth-store';
import { Link } from '@/i18n/routing';
import { formatDate, formatCurrency } from '@/lib/utils';

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
          {['', 'PENDING_PAYMENT', 'TESTING_IN_PROGRESS', 'COMPLETED', 'CANCELLED'].map(s => (
            <button key={s} onClick={() => { setStatusFilter(s); setPage(1); }}
              className={`px-3 py-1.5 rounded-lg text-sm ${statusFilter === s ? 'bg-blue-600 text-white' : 'bg-gray-100 text-gray-600'}`}>
              {s || '全部'}
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
                      <TableCell><Badge variant="info">{o.status as string}</Badge></TableCell>
                      <TableCell className="text-sm">{lab?.nameZh || '未分配'}</TableCell>
                      <TableCell className="text-sm text-gray-500">{formatDate(o.createdAt as string)}</TableCell>
                      <TableCell>
                        <Link href={`/dashboard/orders/${o.id as string}`}>
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
