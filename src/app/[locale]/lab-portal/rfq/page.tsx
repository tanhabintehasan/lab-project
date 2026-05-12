'use client';
import { useState, useEffect, useCallback } from 'react';
import { LabPortalLayout } from '@/components/layout/lab-portal-layout';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Table, TableHeader, TableBody, TableRow, TableHead, TableCell } from '@/components/ui/table';
import { EmptyState } from '@/components/ui/empty-state';
import { TableSkeleton } from '@/components/ui/skeleton';
import { useAuthStore } from '@/store/auth-store';
import { formatDate } from '@/lib/utils';
import { FileQuestion } from 'lucide-react';

export default function LabPortalRFQPage() {
  // Auth via HttpOnly cookie
  const [rfqs, setRfqs] = useState<Array<Record<string, unknown>>>([]);
  const [loading, setLoading] = useState(true);

  const fetchData = useCallback(() => {
    setLoading(true);
    fetch('/api/rfq?pageSize=20', { })
      .then(r => r.json())
      .then(d => setRfqs(d.data || []))
      .finally(() => setLoading(false));
  }, []);

  useEffect(() => { fetchData(); }, [fetchData]);

  return (
    <LabPortalLayout>
      <div className="space-y-6">
        <h1 className="text-2xl font-bold text-gray-900">分配的需求</h1>
        {loading ? <TableSkeleton /> : rfqs.length === 0 ? (
          <EmptyState icon={FileQuestion} title="暂无分配的需求" />
        ) : (
          <Card padding="none">
            <Table>
              <TableHeader><TableRow>
                <TableHead>编号</TableHead><TableHead>标题</TableHead><TableHead>状态</TableHead><TableHead>提交时间</TableHead><TableHead>操作</TableHead>
              </TableRow></TableHeader>
              <TableBody>
                {rfqs.map(r => (
                  <TableRow key={r.id as string}>
                    <TableCell className="font-mono text-sm">{r.requestNo as string}</TableCell>
                    <TableCell>{r.title as string}</TableCell>
                    <TableCell><Badge variant="info">{r.status as string}</Badge></TableCell>
                    <TableCell className="text-sm text-gray-500">{formatDate(r.createdAt as string)}</TableCell>
                    <TableCell><Button size="sm" variant="outline">提交报价</Button></TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </Card>
        )}
      </div>
    </LabPortalLayout>
  );
}
