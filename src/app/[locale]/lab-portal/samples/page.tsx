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
import { QRCode } from '@/components/ui/qr-code';
import { Package, ScanLine, QrCode } from 'lucide-react';
import { useAuthStore } from '@/store/auth-store';
import { formatDate } from '@/lib/utils';
import { Link } from '@/i18n/routing';

export default function LabPortalSamplesPage() {
  const t = useTranslations('labPortal');
  const { user } = useAuthStore();
  const [samples, setSamples] = useState<Array<Record<string, unknown>>>([]);
  const [loading, setLoading] = useState(true);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [showQrFor, setShowQrFor] = useState<string | null>(null);

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

  return (
    <LabPortalLayout>
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <h1 className="text-2xl font-bold text-gray-900">{t('sampleManagement')}</h1>
          <Link href="/lab-portal/samples/scan">
            <Button size="sm"><ScanLine className="h-4 w-4 mr-1" />Scan &amp; Receive</Button>
          </Link>
        </div>
        {loading ? <TableSkeleton rows={6} /> : samples.length === 0 ? (
          <EmptyState icon={Package} title="No samples" />
        ) : (
          <Card padding="none">
            <Table>
              <TableHeader><TableRow>
                <TableHead>Barcode</TableHead><TableHead>Name</TableHead><TableHead>Material</TableHead>
                <TableHead>Status</TableHead><TableHead>Tracking</TableHead><TableHead>Actions</TableHead>
              </TableRow></TableHeader>
              <TableBody>
                {samples.map(s => {
                  const status = s.status as string;
                  const sampleNo = s.sampleNo as string;
                  return (
                    <TableRow key={s.id as string}>
                      <TableCell>
                        <div className="flex items-center gap-2">
                          <span className="font-mono text-sm font-medium">{sampleNo}</span>
                          <button
                            onClick={() => setShowQrFor(showQrFor === sampleNo ? null : sampleNo)}
                            className="p-1 rounded hover:bg-gray-100 text-gray-400 hover:text-gray-600"
                            title="Show QR code"
                          >
                            <QrCode className="h-4 w-4" />
                          </button>
                        </div>
                        {showQrFor === sampleNo && (
                          <div className="mt-2 p-2 bg-gray-50 rounded-lg inline-block">
                            <QRCode value={sampleNo} size={96} />
                          </div>
                        )}
                      </TableCell>
                      <TableCell className="font-medium">{s.name as string}</TableCell>
                      <TableCell className="text-sm">{(s.materialType || '-') as string}</TableCell>
                      <TableCell><Badge variant={statusVariant(status)}>{statusLabel(status)}</Badge></TableCell>
                      <TableCell className="text-sm">{(s.trackingNo || '-') as string}</TableCell>
                      <TableCell>
                        <div className="flex gap-1 flex-wrap">
                          {status === 'SHIPPED' && <Button size="sm" onClick={() => updateStatus(s.id as string, 'RECEIVED')}>Receive</Button>}
                          {status === 'RECEIVED' && <Button size="sm" onClick={() => updateStatus(s.id as string, 'INSPECTING')}>Inspect</Button>}
                          {status === 'INSPECTING' && <>
                            <Button size="sm" variant="success" onClick={() => updateStatus(s.id as string, 'INSPECTION_PASSED')}>Pass</Button>
                            <Button size="sm" variant="danger" onClick={() => updateStatus(s.id as string, 'INSPECTION_FAILED')}>Fail</Button>
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
