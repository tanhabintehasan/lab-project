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

const statusVariant = (status: string): 'default' | 'success' | 'warning' | 'danger' | 'info' | 'outline' => {
  const map: Record<string, 'default' | 'success' | 'warning' | 'danger' | 'info' | 'outline'> = {
    PENDING_SUBMISSION: 'warning',
    SHIPPED: 'info',
    RECEIVED: 'success',
    INSPECTING: 'info',
    INSPECTION_PASSED: 'success',
    INSPECTION_FAILED: 'danger',
    TESTING: 'info',
    TESTING_COMPLETE: 'success',
    STORED: 'default',
    RETURNED: 'outline',
  };
  return map[status] || 'default';
};

const statusLabel = (status: string): string => {
  const map: Record<string, string> = {
    PENDING_SUBMISSION: 'Pending',
    SHIPPED: 'Shipped',
    RECEIVED: 'Received',
    INSPECTING: 'Inspecting',
    INSPECTION_PASSED: 'Passed',
    INSPECTION_FAILED: 'Failed',
    TESTING: 'Testing',
    TESTING_COMPLETE: 'Complete',
    STORED: 'Stored',
    RETURNED: 'Returned',
  };
  return map[status] || status;
};

export default function AdminSamplesPage() {
  const [items, setItems] = useState<Array<Record<string, unknown>>>([]);
  const [loading, setLoading] = useState(true);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [search, setSearch] = useState('');

  const fetchData = useCallback(() => {
    setLoading(true);
    const p = new URLSearchParams({ page: String(page), pageSize: '15' });
    if (search) p.set('q', search);
    fetch(`/api/samples?${p}`, { })
      .then(r => r.json())
      .then(d => { setItems(d.data || []); setTotalPages(d.totalPages || 1); })
      .finally(() => setLoading(false));
  }, [page, search]);

  useEffect(() => { fetchData(); }, [fetchData]);

  return (
    <AdminLayout>
      <div className="space-y-6">
        <h1 className="text-2xl font-bold text-gray-900">Sample Management</h1>
        <SearchInput placeholder="Search barcode or name..." onSearch={v => { setSearch(v); setPage(1); }} className="max-w-xs" />
        {loading ? <TableSkeleton /> : items.length === 0 ? (
          <EmptyState icon={Inbox} title="No data" />
        ) : (
          <Card padding="none">
            <Table>
              <TableHeader><TableRow>
                <TableHead>Barcode</TableHead><TableHead>Name</TableHead><TableHead>Order</TableHead>
                <TableHead>Status</TableHead><TableHead>Tracking</TableHead><TableHead>Created</TableHead>
              </TableRow></TableHeader>
              <TableBody>
                {items.map(item => (
                  <TableRow key={item.id as string}>
                    <TableCell className="font-mono text-sm font-medium">{(item.sampleNo as string) || '-'}</TableCell>
                    <TableCell className="font-medium">{(item.name || '-') as string}</TableCell>
                    <TableCell className="text-sm">{((item.order as Record<string, string>)?.orderNo) || '-'}</TableCell>
                    <TableCell><Badge variant={statusVariant((item.status as string) || '')}>{statusLabel((item.status as string) || '-')}</Badge></TableCell>
                    <TableCell className="text-sm">{(item.trackingNo || '-') as string}</TableCell>
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
