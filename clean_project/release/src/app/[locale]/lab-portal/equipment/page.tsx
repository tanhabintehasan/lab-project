'use client';
import { useState, useEffect } from 'react';
import { LabPortalLayout } from '@/components/layout/lab-portal-layout';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Table, TableHeader, TableBody, TableRow, TableHead, TableCell } from '@/components/ui/table';
import { EmptyState } from '@/components/ui/empty-state';
import { TableSkeleton } from '@/components/ui/skeleton';
import { useAuthStore } from '@/store/auth-store';
import { Wrench } from 'lucide-react';

export default function LabPortalEquipmentPage() {
  // Auth via HttpOnly cookie
  const [equipment, setEquipment] = useState<Array<Record<string, unknown>>>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch('/api/equipment?pageSize=50', { })
      .then(r => r.json())
      .then(d => setEquipment(d.data || []))
      .finally(() => setLoading(false));
  }, []);

  return (
    <LabPortalLayout>
      <div className="space-y-6">
        <h1 className="text-2xl font-bold text-gray-900">设备管理</h1>
        {loading ? <TableSkeleton /> : equipment.length === 0 ? (
          <EmptyState icon={Wrench} title="暂无设备" />
        ) : (
          <Card padding="none">
            <Table>
              <TableHeader><TableRow>
                <TableHead>名称</TableHead><TableHead>型号</TableHead><TableHead>状态</TableHead><TableHead>可预约</TableHead>
              </TableRow></TableHeader>
              <TableBody>
                {equipment.map(eq => (
                  <TableRow key={eq.id as string}>
                    <TableCell className="font-medium">{eq.nameZh as string}</TableCell>
                    <TableCell className="text-sm text-gray-500">{(eq.model || '-') as string}</TableCell>
                    <TableCell><Badge variant={eq.status === 'AVAILABLE' ? 'success' : 'warning'}>{eq.status as string}</Badge></TableCell>
                    <TableCell>{eq.bookable ? '是' : '否'}</TableCell>
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
