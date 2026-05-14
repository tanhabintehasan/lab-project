'use client';

import { useState, useEffect, useCallback } from 'react';
import { LabPortalLayout } from '@/components/layout/lab-portal-layout';
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
import {
  Wallet,
  TrendingUp,
  TrendingDown,
  DollarSign,
  RefreshCw,
  ArrowUpRight,
  ArrowDownRight,
} from 'lucide-react';
import { formatCurrency, formatDate } from '@/lib/utils';

interface WalletSummary {
  balance: number;
  frozenAmount: number;
  availableBalance: number;
  totalEarned: number;
  totalWithdrawn: number;
  currency: string;
}

interface LedgerTransaction {
  id: string;
  type: string;
  amount: string;
  balanceAfter: string | null;
  description: string;
  grossAmount: string | null;
  platformFee: string | null;
  netAmount: string | null;
  feeRate: string | null;
  createdAt: string;
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

export default function LabEarningsPage() {
  const [summary, setSummary] = useState<WalletSummary | null>(null);
  const [transactions, setTransactions] = useState<LedgerTransaction[]>([]);
  const [loadingSummary, setLoadingSummary] = useState(true);
  const [loadingTx, setLoadingTx] = useState(true);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [error, setError] = useState('');

  const fetchSummary = useCallback(async () => {
    try {
      setLoadingSummary(true);
      const res = await fetch('/api/lab/earnings', {
        credentials: 'include',
        cache: 'no-store',
      });
      const d = await res.json();
      if (d?.success) {
        setSummary(d.data as WalletSummary);
      } else {
        setError(d?.error || '加载收益信息失败');
      }
    } catch (err) {
      console.error('fetchSummary error:', err);
      setError('加载收益信息失败');
    } finally {
      setLoadingSummary(false);
    }
  }, []);

  const fetchTransactions = useCallback(async () => {
    try {
      setLoadingTx(true);
      const res = await fetch(`/api/lab/earnings/transactions?page=${page}`, {
        credentials: 'include',
        cache: 'no-store',
      });
      const d = await res.json();
      if (d?.success) {
        const list = extractArray<LedgerTransaction>(d.data);
        setTransactions(list);
        setTotalPages(extractTotalPages(d.data));
      } else {
        setError(d?.error || '加载交易记录失败');
      }
    } catch (err) {
      console.error('fetchTransactions error:', err);
      setError('加载交易记录失败');
    } finally {
      setLoadingTx(false);
    }
  }, [page]);

  useEffect(() => {
    fetchSummary();
  }, [fetchSummary]);

  useEffect(() => {
    fetchTransactions();
  }, [fetchTransactions]);

  const txTypeBadge = (type: string) => {
    const variants: Record<string, 'success' | 'warning' | 'danger' | 'default' | 'info'> = {
      PAYOUT: 'success',
      WITHDRAWAL: 'warning',
      RECHARGE: 'info',
      PAYMENT: 'danger',
      REFUND: 'default',
      COMMISSION: 'success',
      ADJUSTMENT: 'default',
      REWARD: 'info',
    };
    const labels: Record<string, string> = {
      PAYOUT: '收益入账',
      WITHDRAWAL: '提现',
      RECHARGE: '充值',
      PAYMENT: '支付',
      REFUND: '退款',
      COMMISSION: '佣金',
      ADJUSTMENT: '调整',
      REWARD: '奖励',
    };
    return (
      <Badge variant={variants[type] || 'default'}>
        {labels[type] || type}
      </Badge>
    );
  };

  const txAmountClass = (type: string) => {
    const positive = ['PAYOUT', 'RECHARGE', 'REWARD', 'COMMISSION'];
    return positive.includes(type) ? 'text-green-600' : 'text-red-600';
  };

  const txSign = (type: string) => {
    const positive = ['PAYOUT', 'RECHARGE', 'REWARD', 'COMMISSION'];
    return positive.includes(type) ? '+' : '-';
  };

  return (
    <LabPortalLayout>
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold text-gray-900">我的收益</h1>
            <p className="text-sm text-gray-500 mt-1">查看实验室收益与交易明细</p>
          </div>
          <Button variant="outline" size="sm" onClick={() => { fetchSummary(); fetchTransactions(); }}>
            <RefreshCw className="h-4 w-4 mr-1" /> 刷新
          </Button>
        </div>

        {error && (
          <div className="rounded-lg border border-red-200 bg-red-50 p-4 text-red-600">
            {error}
          </div>
        )}

        {/* Stats Cards */}
        <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-4">
          <Card className="p-5">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-500">可用余额</p>
                <p className="text-2xl font-bold text-gray-900 mt-1">
                  {loadingSummary ? '...' : formatCurrency(summary?.availableBalance || 0)}
                </p>
              </div>
              <div className="h-10 w-10 rounded-full bg-emerald-100 flex items-center justify-center">
                <Wallet className="h-5 w-5 text-emerald-600" />
              </div>
            </div>
          </Card>

          <Card className="p-5">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-500">总收益</p>
                <p className="text-2xl font-bold text-gray-900 mt-1">
                  {loadingSummary ? '...' : formatCurrency(summary?.totalEarned || 0)}
                </p>
              </div>
              <div className="h-10 w-10 rounded-full bg-blue-100 flex items-center justify-center">
                <TrendingUp className="h-5 w-5 text-blue-600" />
              </div>
            </div>
          </Card>

          <Card className="p-5">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-500">已提现</p>
                <p className="text-2xl font-bold text-gray-900 mt-1">
                  {loadingSummary ? '...' : formatCurrency(summary?.totalWithdrawn || 0)}
                </p>
              </div>
              <div className="h-10 w-10 rounded-full bg-orange-100 flex items-center justify-center">
                <TrendingDown className="h-5 w-5 text-orange-600" />
              </div>
            </div>
          </Card>

          <Card className="p-5">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-500">冻结金额</p>
                <p className="text-2xl font-bold text-gray-900 mt-1">
                  {loadingSummary ? '...' : formatCurrency(summary?.frozenAmount || 0)}
                </p>
              </div>
              <div className="h-10 w-10 rounded-full bg-gray-100 flex items-center justify-center">
                <DollarSign className="h-5 w-5 text-gray-600" />
              </div>
            </div>
          </Card>
        </div>

        {/* Transactions Table */}
        <Card padding="none">
          <div className="px-6 py-4 border-b border-gray-200">
            <h2 className="text-lg font-semibold text-gray-900">交易明细</h2>
          </div>

          {loadingTx ? (
            <TableSkeleton />
          ) : transactions.length === 0 ? (
            <EmptyState icon={Wallet} title="暂无交易记录" />
          ) : (
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>类型</TableHead>
                    <TableHead>金额</TableHead>
                    <TableHead>余额</TableHead>
                    <TableHead>明细</TableHead>
                    <TableHead>时间</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {transactions.map((tx) => (
                    <TableRow key={tx.id}>
                      <TableCell>{txTypeBadge(tx.type)}</TableCell>
                      <TableCell className={`font-medium ${txAmountClass(tx.type)}`}>
                        <span className="flex items-center gap-1">
                          {txSign(tx.type) === '+' ? (
                            <ArrowUpRight className="h-4 w-4" />
                          ) : (
                            <ArrowDownRight className="h-4 w-4" />
                          )}
                          {txSign(tx.type)}
                          {formatCurrency(Number(tx.amount))}
                        </span>
                      </TableCell>
                      <TableCell className="text-gray-600">
                        {tx.balanceAfter ? formatCurrency(Number(tx.balanceAfter)) : '-'}
                      </TableCell>
                      <TableCell>
                        <div className="text-sm text-gray-700">{tx.description || '-'}</div>
                        {tx.grossAmount && (
                          <div className="text-xs text-gray-500 mt-0.5">
                            总额 {formatCurrency(Number(tx.grossAmount))}
                            {tx.platformFee
                              ? ` · 平台费 ${formatCurrency(Number(tx.platformFee))}`
                              : ''}
                            {tx.feeRate
                              ? ` · 费率 ${(Number(tx.feeRate) * 100).toFixed(1)}%`
                              : ''}
                          </div>
                        )}
                      </TableCell>
                      <TableCell className="text-gray-500 whitespace-nowrap">
                        {formatDate(tx.createdAt)}
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          )}
        </Card>

        {totalPages > 1 && (
          <Pagination currentPage={page} totalPages={totalPages} onPageChange={setPage} />
        )}
      </div>
    </LabPortalLayout>
  );
}
