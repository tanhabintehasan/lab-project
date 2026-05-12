'use client';
import { useState, useEffect, useCallback } from 'react';
import { DashboardLayout } from '@/components/layout/dashboard-layout';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Table, TableHeader, TableBody, TableRow, TableHead, TableCell } from '@/components/ui/table';
import { Pagination } from '@/components/ui/pagination';
import { EmptyState } from '@/components/ui/empty-state';
import { TableSkeleton } from '@/components/ui/skeleton';
import { FileQuestion } from 'lucide-react';
import { useAuthStore } from '@/store/auth-store';
import { formatDate, formatCurrency } from '@/lib/utils';

const statusVariant: Record<string, 'default'|'info'|'warning'|'success'|'danger'> = {
  DRAFT:'default', SENT:'info', VIEWED:'warning', ACCEPTED:'success', REJECTED:'danger', EXPIRED:'default',
};

export default function QuotationsPage() {
  // Auth via HttpOnly cookie
  const [data, setData] = useState<Array<Record<string, unknown>>>([]);
  const [loading, setLoading] = useState(true);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);

  const fetchData = useCallback(() => {
    setLoading(true);
    fetch(`/api/quotations?page=${page}`, { })
      .then(r => r.json())
      .then(d => { setData(d.data || []); setTotalPages(d.totalPages || 1); })
      .finally(() => setLoading(false));
  }, [page]);

  useEffect(() => { fetchData(); }, [fetchData]);

  const handleAction = async (id: string, action: string) => {
    await fetch(`/api/quotations/${id}`, {
      credentials: 'include',
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ action }),
    });
    fetchData();
  };

  return (
    <DashboardLayout>
      <div className="space-y-6">
        <h1 className="text-2xl font-bold text-gray-900">我的报价</h1>
        {loading ? <TableSkeleton /> : data.length === 0 ? (
          <EmptyState icon={FileQuestion} title="暂无报价" description="您的报价单将在此显示" />
        ) : (
          <Card padding="none">
            <Table>
              <TableHeader><TableRow>
                <TableHead>报价编号</TableHead><TableHead>标题</TableHead><TableHead>金额</TableHead><TableHead>有效期</TableHead><TableHead>状态</TableHead><TableHead>操作</TableHead>
              </TableRow></TableHeader>
              <TableBody>
                {data.map(q => (
                  <TableRow key={q.id as string}>
                    <TableCell className="font-mono text-sm">{q.quotationNo as string}</TableCell>
                    <TableCell className="font-medium">{q.title as string}</TableCell>
                    <TableCell className="text-blue-600 font-medium">{formatCurrency(Number(q.totalAmount))}</TableCell>
                    <TableCell className="text-sm text-gray-500">{q.validUntil ? formatDate(q.validUntil as string) : '-'}</TableCell>
                    <TableCell><Badge variant={statusVariant[(q.status as string)] || 'default'}>{q.status as string}</Badge></TableCell>
                    <TableCell>
                      {q.status === 'SENT' && (
                        <div className="flex gap-2">
                          <Button size="sm" onClick={() => handleAction(q.id as string, 'accept')}>接受</Button>
                          <Button size="sm" variant="outline" onClick={() => handleAction(q.id as string, 'reject')}>拒绝</Button>
                        </div>
                      )}
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
