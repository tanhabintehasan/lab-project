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
import { EmptyState } from '@/components/ui/empty-state';
import { Modal } from '@/components/ui/modal';
import { useAuthStore } from '@/store/auth-store';
import { formatDate } from '@/lib/utils';
import { Inbox, CheckCircle2, Eye } from 'lucide-react';

const statusVariant = (status: string): 'default' | 'success' | 'warning' | 'danger' | 'info' | 'outline' => {
  const map: Record<string, 'default' | 'success' | 'warning' | 'danger' | 'info' | 'outline'> = {
    DRAFT: 'default',
    UNDER_REVIEW: 'warning',
    APPROVED: 'info',
    PUBLISHED: 'success',
    ARCHIVED: 'outline',
  };
  return map[status] || 'default';
};

const statusLabel = (status: string): string => {
  const map: Record<string, string> = {
    DRAFT: 'Draft',
    UNDER_REVIEW: 'Under Review',
    APPROVED: 'Approved',
    PUBLISHED: 'Published',
    ARCHIVED: 'Archived',
  };
  return map[status] || status;
};

export default function AdminReportsPage() {
  const { user } = useAuthStore();
  const [items, setItems] = useState<Array<Record<string, unknown>>>([]);
  const [loading, setLoading] = useState(true);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('');
  const [approvingId, setApprovingId] = useState<string | null>(null);
  const [approveModalOpen, setApproveModalOpen] = useState(false);
  const [approveNote, setApproveNote] = useState('');
  const [approveLoading, setApproveLoading] = useState(false);

  const fetchData = useCallback(() => {
    setLoading(true);
    const p = new URLSearchParams({ page: String(page), pageSize: '15' });
    if (search) p.set('q', search);
    if (statusFilter) p.set('status', statusFilter);
    fetch(`/api/admin/reports?${p}`, { credentials: 'include' })
      .then(r => r.json())
      .then(d => { setItems(d.data || []); setTotalPages(d.totalPages || 1); })
      .finally(() => setLoading(false));
  }, [page, search, statusFilter]);

  useEffect(() => { fetchData(); }, [fetchData]);

  const handleApprove = async () => {
    if (!approvingId) return;
    setApproveLoading(true);
    try {
      const res = await fetch(`/api/admin/reports/${approvingId}/approve`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ note: approveNote }),
      });
      const data = await res.json();
      if (data?.success) {
        setApproveModalOpen(false);
        setApproveNote('');
        setApprovingId(null);
        fetchData();
      } else {
        alert(data?.error || 'Approval failed');
      }
    } catch {
      alert('Approval failed');
    } finally {
      setApproveLoading(false);
    }
  };

  const openApprove = (id: string) => {
    setApprovingId(id);
    setApproveModalOpen(true);
  };

  return (
    <AdminLayout>
      <div className="space-y-6">
        <h1 className="text-2xl font-bold text-gray-900">Report Management</h1>
        <div className="flex flex-wrap gap-3">
          <SearchInput placeholder="Search report or order..." onSearch={v => { setSearch(v); setPage(1); }} className="max-w-xs" />
          {[
            { key: '', label: 'All' },
            { key: 'UNDER_REVIEW', label: 'Under Review' },
            { key: 'PUBLISHED', label: 'Published' },
            { key: 'DRAFT', label: 'Draft' },
            { key: 'ARCHIVED', label: 'Archived' },
          ].map(s => (
            <button key={s.key} onClick={() => { setStatusFilter(s.key); setPage(1); }}
              className={`px-3 py-1.5 rounded-lg text-sm ${statusFilter === s.key ? 'bg-blue-600 text-white' : 'bg-gray-100 text-gray-600'}`}>
              {s.label}
            </button>
          ))}
        </div>
        {loading ? <TableSkeleton /> : items.length === 0 ? (
          <EmptyState icon={Inbox} title="No reports" />
        ) : (
          <Card padding="none">
            <Table>
              <TableHeader><TableRow>
                <TableHead>Report No</TableHead><TableHead>Title</TableHead><TableHead>Order</TableHead>
                <TableHead>Status</TableHead><TableHead>Created</TableHead><TableHead>Actions</TableHead>
              </TableRow></TableHeader>
              <TableBody>
                {items.map(item => {
                  const order = item.order as Record<string, string> | undefined;
                  const status = item.status as string;
                  return (
                    <TableRow key={item.id as string}>
                      <TableCell className="font-mono text-sm">{(item.reportNo as string) || '-'}</TableCell>
                      <TableCell className="font-medium">{(item.title as string) || '-'}</TableCell>
                      <TableCell className="text-sm">{order?.orderNo || '-'}</TableCell>
                      <TableCell><Badge variant={statusVariant(status)}>{statusLabel(status)}</Badge></TableCell>
                      <TableCell className="text-sm text-gray-500">{item.createdAt ? formatDate(item.createdAt as string) : '-'}</TableCell>
                      <TableCell>
                        <div className="flex gap-1">
                          {status === 'UNDER_REVIEW' && (
                            <Button size="sm" onClick={() => openApprove(item.id as string)}>
                              <CheckCircle2 className="h-4 w-4 mr-1" />Approve
                            </Button>
                          )}
                          {!!item.fileUrl && (
                            <Button size="sm" variant="ghost" onClick={() => window.open(item.fileUrl as string, '_blank')}>
                              <Eye className="h-4 w-4" />
                            </Button>
                          )}
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

      <Modal
        isOpen={approveModalOpen}
        onClose={() => setApproveModalOpen(false)}
        title="Approve Report"
        loading={approveLoading}
      >
        <div className="space-y-4">
          <p className="text-sm text-gray-600">
            Approving this report will:
          </p>
          <ul className="text-sm text-gray-600 list-disc list-inside space-y-1">
            <li>Add a digital signature to the final page</li>
            <li>Encrypt the PDF with a password</li>
            <li>Make it visible to the customer</li>
            <li>Notify the customer via email</li>
          </ul>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Approval Note (optional)</label>
            <textarea
              className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
              rows={3}
              value={approveNote}
              onChange={(e) => setApproveNote(e.target.value)}
              placeholder="Add any notes about this approval..."
            />
          </div>
          <div className="flex justify-end gap-3">
            <Button variant="outline" onClick={() => setApproveModalOpen(false)} disabled={approveLoading}>Cancel</Button>
            <Button onClick={handleApprove} loading={approveLoading}>
              Confirm Approval
            </Button>
          </div>
        </div>
      </Modal>
    </AdminLayout>
  );
}
