'use client';

import { useState, useEffect, useCallback } from 'react';
import { useTranslations } from 'next-intl';
import { DashboardLayout } from '@/components/layout/dashboard-layout';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import {
  Table,
  TableHeader,
  TableBody,
  TableRow,
  TableHead,
  TableCell,
} from '@/components/ui/table';
import { Pagination } from '@/components/ui/pagination';
import { EmptyState } from '@/components/ui/empty-state';
import { TableSkeleton } from '@/components/ui/skeleton';
import { FileText, Eye, Download, Copy, Key } from 'lucide-react';
import { formatDate } from '@/lib/utils';

export default function ReportsPage() {
  const t = useTranslations('reports');
  const [reports, setReports] = useState<Array<Record<string, unknown>>>([]);
  const [loading, setLoading] = useState(true);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);

  const fetchData = useCallback(() => {
    setLoading(true);
    fetch(`/api/reports?page=${page}&pageSize=10`, {
      credentials: 'include',
    })
      .then(r => r.json())
      .then(d => {
        setReports(d.data || []);
        setTotalPages(d.totalPages || 1);
      })
      .finally(() => setLoading(false));
  }, [page]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  const handleDownload = async (reportId: string) => {
    try {
      const res = await fetch(`/api/reports/${reportId}/download`, {
        credentials: 'include',
      });
      const data = await res.json();
      if (data?.success && data.downloadUrl) {
        // Show password alert
        if (data.pdfPassword) {
          const copy = confirm(
            `PDF Password: ${data.pdfPassword}\n\nClick OK to copy password and open download.\nYou will need this password to open the PDF.`
          );
          if (copy) {
            navigator.clipboard.writeText(data.pdfPassword);
          }
        }
        window.open(data.downloadUrl, '_blank');
      } else {
        alert(data?.error || 'Download failed');
      }
    } catch {
      alert('Download failed');
    }
  };

  return (
    <DashboardLayout>
      <div className="space-y-6">
        <h1 className="text-2xl font-bold text-gray-900">{t('title')}</h1>

        {loading ? (
          <TableSkeleton />
        ) : reports.length === 0 ? (
          <EmptyState icon={FileText} title="No reports" description="Reports will appear here after admin approval." />
        ) : (
          <Card padding="none">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>{t('reportNo')}</TableHead>
                  <TableHead>Title</TableHead>
                  <TableHead>Order</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>{t('issuedDate')}</TableHead>
                  <TableHead>Actions</TableHead>
                </TableRow>
              </TableHeader>

              <TableBody>
                {reports.map(r => {
                  const order = r.order as Record<string, string> | undefined;
                  const status = r.status as string;
                  const fileUrl = r.fileUrl as string | undefined;
                  const issuedAt = r.issuedAt as string | undefined;

                  return (
                    <TableRow key={r.id as string}>
                      <TableCell className="font-mono text-sm">{r.reportNo as string}</TableCell>
                      <TableCell className="font-medium">{r.title as string}</TableCell>
                      <TableCell className="text-sm">{order?.orderNo || '-'}</TableCell>
                      <TableCell>
                        <Badge variant={status === 'PUBLISHED' ? 'success' : 'info'}>
                          {t(`status.${status.toLowerCase()}`)}
                        </Badge>
                      </TableCell>
                      <TableCell className="text-sm text-gray-500">
                        {issuedAt ? formatDate(issuedAt) : '-'}
                      </TableCell>
                      <TableCell>
                        <div className="flex gap-1">
                          {fileUrl ? (
                            <>
                              <Button
                                size="sm"
                                variant="ghost"
                                onClick={() => window.open(fileUrl, '_blank')}
                              >
                                <Eye className="h-4 w-4" />
                              </Button>
                              <Button
                                size="sm"
                                variant="ghost"
                                onClick={() => handleDownload(r.id as string)}
                              >
                                <Download className="h-4 w-4" />
                              </Button>
                            </>
                          ) : null}
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
    </DashboardLayout>
  );
}
