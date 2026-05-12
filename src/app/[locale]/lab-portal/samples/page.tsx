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
import { Package } from 'lucide-react';
import { useAuthStore } from '@/store/auth-store';
import { formatDate } from '@/lib/utils';

export default function LabPortalSamplesPage() {
  const t = useTranslations('labPortal');
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

  const updateStatus = async (id: string, status: string) => {
    await fetch(`/api/lab/samples/${id}`, {
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
        <h1 className="text-2xl font-bold text-gray-900">{t('sampleManagement')}</h1>
        {loading ? <TableSkeleton rows={6} /> : samples.length === 0 ? (
          <EmptyState icon={Package} title="暂无样品" />
        ) : (
          <Card padding="none">
            <Table>
              <TableHeader><TableRow>
                <TableHead>样品编号</TableHead><TableHead>名称</TableHead><TableHead>材料类型</TableHead>
                <TableHead>状态</TableHead><TableHead>快递单号</TableHead><TableHead>操作</TableHead>
              </TableRow></TableHeader>
              <TableBody>
                {samples.map(s => {
                  const status = s.status as string;
                  return (
                    <TableRow key={s.id as string}>
                      <TableCell className="font-mono text-sm">{s.sampleNo as string}</TableCell>
                      <TableCell className="font-medium">{s.name as string}</TableCell>
                      <TableCell className="text-sm">{(s.materialType || '-') as string}</TableCell>
                      <TableCell><Badge variant="info">{status}</Badge></TableCell>
                      <TableCell className="text-sm">{(s.trackingNo || '-') as string}</TableCell>
                      <TableCell>
                        <div className="flex gap-1">
                          {status === 'SHIPPED' && <Button size="sm" onClick={() => updateStatus(s.id as string, 'RECEIVED')}>确认收样</Button>}
                          {status === 'RECEIVED' && <Button size="sm" onClick={() => updateStatus(s.id as string, 'INSPECTING')}>开始验收</Button>}
                          {status === 'INSPECTING' && <>
                            <Button size="sm" variant="success" onClick={() => updateStatus(s.id as string, 'INSPECTION_PASSED')}>通过</Button>
                            <Button size="sm" variant="danger" onClick={() => updateStatus(s.id as string, 'INSPECTION_FAILED')}>不通过</Button>
                          </>}
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
