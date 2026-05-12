'use client';
import { useState, useEffect } from 'react';
import { EnterpriseLayout } from '@/components/layout/enterprise-layout';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Table, TableHeader, TableBody, TableRow, TableHead, TableCell } from '@/components/ui/table';
import { Pagination } from '@/components/ui/pagination';
import { EmptyState } from '@/components/ui/empty-state';
import { TableSkeleton } from '@/components/ui/skeleton';
import { Modal } from '@/components/ui/modal';
import { CheckCircle, XCircle, Clock, RefreshCw } from 'lucide-react';
import { formatCurrency, formatDate } from '@/lib/utils';

interface Approval {
  id: string;
  type: string;
  requestedBy: string;
  description: string;
  amount?: number;
  status: string;
  createdAt: string;
}

export default function ApprovalsPage() {
  const [approvals, setApprovals] = useState<Approval[]>([]);
  const [loading, setLoading] = useState(true);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [actionModal, setActionModal] = useState<{ open: boolean; id: string | null; action: 'approve' | 'reject' | null }>({ open: false, id: null, action: null });
  const [processing, setProcessing] = useState(false);

  useEffect(() => {
    fetchData();
  }, [page]);

  const fetchData = async () => {
    setLoading(true);
    try {
      const res = await fetch(`/api/enterprise/approvals?page=${page}`, { credentials: 'include' });
      const data = await res.json();
      if (data.data) {
        setApprovals(data.data);
        setTotalPages(data.totalPages || 1);
      }
    } catch (error) {
      console.error('Fetch error:', error);
    }
    setLoading(false);
  };

  const handleAction = async () => {
    if (!actionModal.id || !actionModal.action) return;
    setProcessing(true);
    try {
      const res = await fetch(`/api/enterprise/approvals/${actionModal.id}`, {
        method: 'PATCH',
        credentials: 'include',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: actionModal.action }),
      });
      if (res.ok) {
        setActionModal({ open: false, id: null, action: null });
        fetchData();
      }
    } catch (error) {
      console.error('Action error:', error);
    }
    setProcessing(false);
  };

  return (
    <EnterpriseLayout>
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <h1 className="text-2xl font-bold text-gray-900">审批管理</h1>
          <Button variant="outline" size="sm" onClick={fetchData}>
            <RefreshCw className="h-4 w-4" /> 刷新
          </Button>
        </div>

        <Card padding="none">
          {loading ? (
            <TableSkeleton />
          ) : approvals.length === 0 ? (
            <EmptyState icon={Clock} title="暂无待审批事项" description="所有审批已处理完毕" />
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>类型</TableHead>
                  <TableHead>申请人</TableHead>
                  <TableHead>描述</TableHead>
                  <TableHead>金额</TableHead>
                  <TableHead>状态</TableHead>
                  <TableHead>申请时间</TableHead>
                  <TableHead>操作</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {approvals.map(approval => (
                  <TableRow key={approval.id}>
                    <TableCell>
                      <Badge variant="info">{approval.type}</Badge>
                    </TableCell>
                    <TableCell className="font-medium">{approval.requestedBy}</TableCell>
                    <TableCell className="text-gray-600">{approval.description}</TableCell>
                    <TableCell className="font-medium">
                      {approval.amount !== undefined ? formatCurrency(approval.amount) : '-'}
                    </TableCell>
                    <TableCell>
                      <Badge
                        variant={
                          approval.status === 'approved'
                            ? 'success'
                            : approval.status === 'rejected'
                            ? 'danger'
                            : 'warning'
                        }
                      >
                        {approval.status === 'pending' && <Clock className="h-3 w-3 mr-1" />}
                        {approval.status}
                      </Badge>
                    </TableCell>
                    <TableCell className="text-gray-500">{formatDate(approval.createdAt)}</TableCell>
                    <TableCell>
                      {approval.status === 'pending' && (
                        <div className="flex gap-2">
                          <Button
                            size="sm"
                            onClick={() => setActionModal({ open: true, id: approval.id, action: 'approve' })}
                          >
                            <CheckCircle className="h-4 w-4" /> 批准
                          </Button>
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => setActionModal({ open: true, id: approval.id, action: 'reject' })}
                          >
                            <XCircle className="h-4 w-4" /> 拒绝
                          </Button>
                        </div>
                      )}
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </Card>

        <Pagination currentPage={page} totalPages={totalPages} onPageChange={setPage} />
      </div>

      <Modal
        isOpen={actionModal.open}
        onClose={() => setActionModal({ open: false, id: null, action: null })}
        title={actionModal.action === 'approve' ? '确认批准' : '确认拒绝'}
      >
        <div className="space-y-4">
          <p className="text-gray-600">
            {actionModal.action === 'approve'
              ? '确定要批准此申请吗？'
              : '确定要拒绝此申请吗？'}
          </p>
          <div className="flex gap-3 justify-end">
            <Button variant="outline" onClick={() => setActionModal({ open: false, id: null, action: null })}>
              取消
            </Button>
            <Button
              variant={actionModal.action === 'approve' ? 'primary' : 'primary'}
              onClick={handleAction}
              loading={processing}
            >
              确认
            </Button>
          </div>
        </div>
      </Modal>
    </EnterpriseLayout>
  );
}
