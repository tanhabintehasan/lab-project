'use client';

import { useState, useEffect, useCallback } from 'react';
import { useRouter } from '@/i18n/routing';
import { AdminLayout } from '@/components/layout/admin-layout';
import { StatsCard } from '@/components/ui/stats-card';
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
import { Modal } from '@/components/ui/modal';
import { useAuthStore } from '@/store/auth-store';
import {
  DollarSign,
  CreditCard,
  ArrowDownCircle,
  FileText,
  Download,
  RefreshCw,
} from 'lucide-react';
import { formatCurrency, formatDate } from '@/lib/utils';

interface Payment {
  id: string;
  orderNo: string;
  amount: number;
  method: string;
  status: string;
  paidAt: string | null;
  createdAt: string;
}

interface Transaction {
  id: string;
  type: string;
  amount: number;
  description: string;
  createdAt: string;
  userName?: string;
}

interface FinanceStats {
  totalRevenue: number;
  pendingPayments: number;
  pendingWithdrawals: number;
  issuedInvoices: number;
}

function extractArray<T = unknown>(payload: any): T[] {
  if (Array.isArray(payload)) return payload;
  if (Array.isArray(payload?.data)) return payload.data;
  if (Array.isArray(payload?.items)) return payload.items;
  if (Array.isArray(payload?.results)) return payload.results;
  return [];
}

function extractTotalPages(payload: any): number {
  if (typeof payload?.totalPages === 'number') return payload.totalPages;
  if (typeof payload?.pagination?.totalPages === 'number') return payload.pagination.totalPages;
  if (typeof payload?.meta?.totalPages === 'number') return payload.meta.totalPages;
  return 1;
}

export default function AdminFinancePage() {
  const router = useRouter();
  const { user } = useAuthStore();

  const [stats, setStats] = useState<FinanceStats>({
    totalRevenue: 0,
    pendingPayments: 0,
    pendingWithdrawals: 0,
    issuedInvoices: 0,
  });

  const [payments, setPayments] = useState<Payment[]>([]);
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [loading, setLoading] = useState(true);
  const [statsLoading, setStatsLoading] = useState(true);
  const [pageError, setPageError] = useState('');
  const [activeTab, setActiveTab] = useState<'payments' | 'transactions'>('payments');
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [refundModal, setRefundModal] = useState<{ open: boolean; paymentId: string | null }>({
    open: false,
    paymentId: null,
  });
  const [refunding, setRefunding] = useState(false);

  useEffect(() => {
    if (!user) return;

    if (user.role !== 'SUPER_ADMIN' && user.role !== 'FINANCE_ADMIN') {
      router.replace('/dashboard');
    }
  }, [user, router]);

  const fetchStats = useCallback(async () => {
    try {
      setStatsLoading(true);

      const res = await fetch('/api/admin/finance', {
        credentials: 'include',
        cache: 'no-store',
      });

      if (res.status === 401) {
        router.replace('/auth/login');
        return;
      }

      if (res.status === 403) {
        setPageError('您没有权限访问财务统计数据');
        return;
      }

      const d = await res.json();

      if (!res.ok || !d?.success) {
        setPageError(d?.error || '加载财务统计失败');
        return;
      }

      setStats({
        totalRevenue: Number(d?.data?.totalRevenue || 0),
        pendingPayments: Number(d?.data?.pendingPayments || 0),
        pendingWithdrawals: Number(d?.data?.pendingWithdrawals || 0),
        issuedInvoices: Number(d?.data?.issuedInvoices || 0),
      });
    } catch (error) {
      console.error('fetchStats error:', error);
      setPageError('加载财务统计失败');
    } finally {
      setStatsLoading(false);
    }
  }, [router]);

  const fetchData = useCallback(async () => {
    try {
      setLoading(true);
      setPageError('');

      if (activeTab === 'payments') {
        const res = await fetch(`/api/payments?page=${page}`, {
          credentials: 'include',
          cache: 'no-store',
        });

        if (res.status === 401) {
          router.replace('/auth/login');
          return;
        }

        const d = await res.json();

        if (!res.ok) {
          setPayments([]);
          setTotalPages(1);
          setPageError(d?.error || '加载支付记录失败');
          return;
        }

        const paymentList = extractArray<Payment>(d);
        setPayments(paymentList);
        setTotalPages(extractTotalPages(d));
      } else {
        const res = await fetch(`/api/wallet/transactions?page=${page}&all=true`, {
          credentials: 'include',
          cache: 'no-store',
        });

        if (res.status === 401) {
          router.replace('/auth/login');
          return;
        }

        const d = await res.json();

        if (!res.ok) {
          setTransactions([]);
          setTotalPages(1);
          setPageError(d?.error || '加载交易记录失败');
          return;
        }

        const transactionList = extractArray<Transaction>(d);
        setTransactions(transactionList);
        setTotalPages(extractTotalPages(d));
      }
    } catch (error) {
      console.error('fetchData error:', error);
      if (activeTab === 'payments') {
        setPayments([]);
      } else {
        setTransactions([]);
      }
      setTotalPages(1);
      setPageError(activeTab === 'payments' ? '加载支付记录失败' : '加载交易记录失败');
    } finally {
      setLoading(false);
    }
  }, [activeTab, page, router]);

  useEffect(() => {
    if (!user) return;
    if (user.role !== 'SUPER_ADMIN' && user.role !== 'FINANCE_ADMIN') return;

    fetchStats();
  }, [user, fetchStats]);

  useEffect(() => {
    if (!user) return;
    if (user.role !== 'SUPER_ADMIN' && user.role !== 'FINANCE_ADMIN') return;

    fetchData();
  }, [user, fetchData]);

  const handleRefund = async () => {
    if (!refundModal.paymentId) return;

    setRefunding(true);
    try {
      const res = await fetch(`/api/payments/${refundModal.paymentId}/refund`, {
        method: 'POST',
        credentials: 'include',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ reason: '管理员操作' }),
      });

      const d = await res.json();

      if (res.status === 401) {
        router.replace('/auth/login');
        return;
      }

      if (d?.success) {
        setRefundModal({ open: false, paymentId: null });
        await fetchStats();
        await fetchData();
      } else {
        setPageError(d?.error || '退款失败');
      }
    } catch (error) {
      console.error('Refund error:', error);
      setPageError('退款失败');
    } finally {
      setRefunding(false);
    }
  };

  const paymentStatusVariant = (status: string) => {
    const map: Record<string, 'success' | 'warning' | 'danger' | 'default'> = {
      success: 'success',
      pending: 'warning',
      failed: 'danger',
      refunded: 'default',
    };
    return map[status] || 'default';
  };

  if (!user) {
    return (
      <AdminLayout>
        <div className="p-6 text-gray-600">正在加载用户信息...</div>
      </AdminLayout>
    );
  }

  if (user.role !== 'SUPER_ADMIN' && user.role !== 'FINANCE_ADMIN') {
    return (
      <AdminLayout>
        <div className="p-6">
          <div className="rounded-lg border border-red-200 bg-red-50 p-4 text-red-600">
            您没有权限访问此页面
          </div>
        </div>
      </AdminLayout>
    );
  }

  return (
    <AdminLayout>
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold text-gray-900">财务管理</h1>
            <p className="text-sm text-gray-500 mt-1">
              {user.role === 'FINANCE_ADMIN' ? '财务管理员专用控制台' : '管理员财务总览'}
            </p>
          </div>

          <div className="flex gap-2">
            <Button variant="outline" size="sm" onClick={fetchStats}>
              <RefreshCw className="h-4 w-4" /> 刷新统计
            </Button>
            <Button variant="outline" size="sm" onClick={fetchData}>
              <RefreshCw className="h-4 w-4" /> 刷新列表
            </Button>
            <Button variant="outline" size="sm">
              <Download className="h-4 w-4" /> 导出报表
            </Button>
          </div>
        </div>

        {pageError && (
          <div className="rounded-lg border border-red-200 bg-red-50 p-4 text-red-600">
            {pageError}
          </div>
        )}

        <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-4">
          <StatsCard
            title="总收入"
            value={statsLoading ? '...' : formatCurrency(Number(stats.totalRevenue || 0))}
            icon={DollarSign}
            iconColor="text-green-600 bg-green-100"
          />
          <StatsCard
            title="待处理支付"
            value={statsLoading ? '...' : String(stats.pendingPayments || 0)}
            icon={CreditCard}
            iconColor="text-orange-600 bg-orange-100"
          />
          <StatsCard
            title="待处理提现"
            value={statsLoading ? '...' : String(stats.pendingWithdrawals || 0)}
            icon={ArrowDownCircle}
            iconColor="text-red-600 bg-red-100"
          />
          <StatsCard
            title="已开发票"
            value={statsLoading ? '...' : String(stats.issuedInvoices || 0)}
            icon={FileText}
            iconColor="text-blue-600 bg-blue-100"
          />
        </div>

        <Card padding="none">
          <div className="border-b border-gray-200">
            <nav className="flex -mb-px">
              <button
                onClick={() => {
                  setActiveTab('payments');
                  setPage(1);
                }}
                className={`px-6 py-3 text-sm font-medium border-b-2 ${
                  activeTab === 'payments'
                    ? 'border-blue-600 text-blue-600'
                    : 'border-transparent text-gray-500 hover:text-gray-700'
                }`}
              >
                支付记录
              </button>
              <button
                onClick={() => {
                  setActiveTab('transactions');
                  setPage(1);
                }}
                className={`px-6 py-3 text-sm font-medium border-b-2 ${
                  activeTab === 'transactions'
                    ? 'border-blue-600 text-blue-600'
                    : 'border-transparent text-gray-500 hover:text-gray-700'
                }`}
              >
                钱包交易
              </button>
            </nav>
          </div>

          {loading ? (
            <TableSkeleton />
          ) : activeTab === 'payments' ? (
            payments.length === 0 ? (
              <EmptyState icon={CreditCard} title="暂无支付记录" />
            ) : (
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>订单号</TableHead>
                    <TableHead>金额</TableHead>
                    <TableHead>支付方式</TableHead>
                    <TableHead>状态</TableHead>
                    <TableHead>支付时间</TableHead>
                    <TableHead>操作</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {payments.map((payment) => (
                    <TableRow key={payment.id}>
                      <TableCell className="font-mono text-sm">{payment.orderNo}</TableCell>
                      <TableCell className="font-medium text-blue-600">
                        {formatCurrency(payment.amount)}
                      </TableCell>
                      <TableCell>{payment.method}</TableCell>
                      <TableCell>
                        <Badge variant={paymentStatusVariant(payment.status)}>
                          {payment.status}
                        </Badge>
                      </TableCell>
                      <TableCell className="text-gray-500">
                        {payment.paidAt ? formatDate(payment.paidAt) : '-'}
                      </TableCell>
                      <TableCell>
                        {payment.status === 'success' && (
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() =>
                              setRefundModal({ open: true, paymentId: payment.id })
                            }
                          >
                            退款
                          </Button>
                        )}
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            )
          ) : transactions.length === 0 ? (
            <EmptyState icon={DollarSign} title="暂无交易记录" />
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>类型</TableHead>
                  <TableHead>用户</TableHead>
                  <TableHead>金额</TableHead>
                  <TableHead>说明</TableHead>
                  <TableHead>时间</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {transactions.map((tx) => (
                  <TableRow key={tx.id}>
                    <TableCell>
                      <Badge variant={tx.type.includes('PAYMENT') ? 'danger' : 'success'}>
                        {tx.type}
                      </Badge>
                    </TableCell>
                    <TableCell>{tx.userName || '-'}</TableCell>
                    <TableCell
                      className={`font-medium ${
                        tx.type === 'PAYMENT' ? 'text-red-600' : 'text-green-600'
                      }`}
                    >
                      {tx.type === 'PAYMENT' ? '-' : '+'}
                      {formatCurrency(tx.amount)}
                    </TableCell>
                    <TableCell className="text-gray-600">{tx.description}</TableCell>
                    <TableCell className="text-gray-500">{formatDate(tx.createdAt)}</TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </Card>

        <Pagination currentPage={page} totalPages={totalPages} onPageChange={setPage} />
      </div>

      <Modal
        isOpen={refundModal.open}
        onClose={() => setRefundModal({ open: false, paymentId: null })}
        title="确认退款"
      >
        <div className="space-y-4">
          <p className="text-gray-600">确定要对此支付进行退款吗？此操作不可撤销。</p>
          <div className="flex gap-3 justify-end">
            <Button
              variant="outline"
              onClick={() => setRefundModal({ open: false, paymentId: null })}
            >
              取消
            </Button>
            <Button variant="primary" onClick={handleRefund} loading={refunding}>
              确认退款
            </Button>
          </div>
        </div>
      </Modal>
    </AdminLayout>
  );
}
