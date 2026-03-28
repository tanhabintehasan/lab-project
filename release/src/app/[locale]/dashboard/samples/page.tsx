'use client';

import { useState, useEffect, useCallback } from 'react';
import { useTranslations } from 'next-intl';
import { DashboardLayout } from '@/components/layout/dashboard-layout';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Table, TableHeader, TableBody, TableRow, TableHead, TableCell } from '@/components/ui/table';
import { Pagination } from '@/components/ui/pagination';
import { EmptyState } from '@/components/ui/empty-state';
import { TableSkeleton } from '@/components/ui/skeleton';
import { Package, BookOpen } from 'lucide-react';
import { useAuthStore } from '@/store/auth-store';
import { formatDate } from '@/lib/utils';

const statusVariant: Record<string, 'default'|'info'|'success'|'warning'|'danger'> = {
  PENDING_SUBMISSION:'warning', SHIPPED:'info', RECEIVED:'info', INSPECTING:'info',
  INSPECTION_PASSED:'success', INSPECTION_FAILED:'danger', TESTING:'info',
  TESTING_COMPLETE:'success', STORED:'default', RETURNED:'default', DISPOSED:'default',
};

export default function SamplesPage() {
  const t = useTranslations('samples');
  // Auth via HttpOnly cookie
  const [samples, setSamples] = useState<Array<Record<string, unknown>>>([]);
  const [loading, setLoading] = useState(true);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);

  const fetchData = useCallback(() => {
    setLoading(true);
    fetch(`/api/samples?page=${page}&pageSize=10`, { })
      .then(r => r.json())
      .then(d => { setSamples(d.data || []); setTotalPages(d.totalPages || 1); })
      .finally(() => setLoading(false));
  }, [page]);

  useEffect(() => { fetchData(); }, [fetchData]);

  return (
    <DashboardLayout>
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <h1 className="text-2xl font-bold text-gray-900">{t('title')}</h1>
          <Button variant="outline" size="sm" onClick={() => window.open('/help#sample-guide')}>
            <BookOpen className="h-4 w-4" />查看指南
          </Button>
        </div>
        {loading ? <TableSkeleton /> : samples.length === 0 ? (
          <EmptyState icon={Package} title="暂无样品" description="下单后可在此追踪样品状态" />
        ) : (
          <Card padding="none">
            <Table>
              <TableHeader><TableRow>
                <TableHead>{t('sampleNo')}</TableHead><TableHead>{t('sampleName')}</TableHead>
                <TableHead>{t('materialType')}</TableHead><TableHead>状态</TableHead>
                <TableHead>{t('trackingNo')}</TableHead><TableHead>更新时间</TableHead>
              </TableRow></TableHeader>
              <TableBody>
                {samples.map(s => (
                  <TableRow key={s.id as string}>
                    <TableCell className="font-mono text-sm">{s.sampleNo as string}</TableCell>
                    <TableCell className="font-medium">{s.name as string}</TableCell>
                    <TableCell className="text-sm">{(s.materialType || '-') as string}</TableCell>
                    <TableCell><Badge variant={statusVariant[(s.status as string)] || 'default'}>{t(`status.${(s.status as string).toLowerCase()}`)}</Badge></TableCell>
                    <TableCell className="text-sm">{(s.trackingNo || '-') as string}</TableCell>
                    <TableCell className="text-sm text-gray-500">{formatDate(s.updatedAt as string)}</TableCell>
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
