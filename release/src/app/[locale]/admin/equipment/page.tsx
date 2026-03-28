'use client';
import { useState, useEffect, useCallback } from 'react';
import { AdminLayout } from '@/components/layout/admin-layout';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { SearchInput } from '@/components/ui/search-input';
import { Table, TableHeader, TableBody, TableRow, TableHead, TableCell } from '@/components/ui/table';
import { Pagination } from '@/components/ui/pagination';
import { TableSkeleton } from '@/components/ui/skeleton';
import { EmptyState } from '@/components/ui/empty-state';
import { useAuthStore } from '@/store/auth-store';
import { formatDate } from '@/lib/utils';
import { Inbox } from 'lucide-react';

export default function Admin设备Page() {
  // Auth via HttpOnly cookie
  const [items, setItems] = useState<Array<Record<string, unknown>>>([]);
  const [loading, setLoading] = useState(true);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [search, setSearch] = useState('');

  const fetchData = useCallback(() => {
    setLoading(true);
    const p = new URLSearchParams({ page: String(page), pageSize: '15' });
    if (search) p.set('q', search);
    fetch(`/api/equipment?${p}`, { })
      .then(r => r.json())
      .then(d => { setItems(d.data || []); setTotalPages(d.totalPages || 1); })
      .finally(() => setLoading(false));
  }, [page, search]);

  useEffect(() => { fetchData(); }, [fetchData]);

  return (
    <AdminLayout>
      <div className="space-y-6">
        <h1 className="text-2xl font-bold text-gray-900">设备管理</h1>
        <SearchInput placeholder="搜索..." onSearch={v => { setSearch(v); setPage(1); }} className="max-w-xs" />
        {loading ? <TableSkeleton /> : items.length === 0 ? (
          <EmptyState icon={Inbox} title="暂无数据" />
        ) : (
          <Card padding="none">
            <Table>
              <TableHeader><TableRow>
                <TableHead>ID</TableHead><TableHead>名称/编号</TableHead><TableHead>状态</TableHead><TableHead>创建时间</TableHead>
              </TableRow></TableHeader>
              <TableBody>
                {items.map(item => (
                  <TableRow key={item.id as string}>
                    <TableCell className="font-mono text-xs">{(item.id as string).slice(0,8)}</TableCell>
                    <TableCell className="font-medium">{(item.name || item.nameZh || item.title || item.titleZh || item.requestNo || item.sampleNo || item.reportNo || item.orderNo || '-') as string}</TableCell>
                    <TableCell><Badge variant="default">{(item.status || '-') as string}</Badge></TableCell>
                    <TableCell className="text-sm text-gray-500">{item.createdAt ? formatDate(item.createdAt as string) : '-'}</TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </Card>
        )}
        <Pagination currentPage={page} totalPages={totalPages} onPageChange={setPage} />
      </div>
    </AdminLayout>
  );
}
