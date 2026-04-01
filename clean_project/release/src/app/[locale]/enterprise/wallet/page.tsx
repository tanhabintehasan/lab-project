'use client';
import { useState, useEffect } from 'react';
import { EnterpriseLayout } from '@/components/layout/enterprise-layout';
import { StatsCard } from '@/components/ui/stats-card';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Table, TableHeader, TableBody, TableRow, TableHead, TableCell } from '@/components/ui/table';
import { Pagination } from '@/components/ui/pagination';
import { EmptyState } from '@/components/ui/empty-state';
import { TableSkeleton } from '@/components/ui/skeleton';
import { Wallet, TrendingUp, Lock, CreditCard, ArrowUpCircle, RefreshCw } from 'lucide-react';
import { formatCurrency, formatDate } from '@/lib/utils';

interface WalletInfo {
  balance: number;
  frozenAmount: number;
  creditLimit: number;
  currency: string;
  companyName: string;
}

interface Transaction {
  id: string;
  type: string;
  amount: number;
  balanceAfter: number | null;
  description: string | null;
  createdAt: string;
}

export default function CompanyWalletPage() {
  const [walletInfo, setWalletInfo] = useState<WalletInfo | null>(null);
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [loading, setLoading] = useState(true);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);

  useEffect(() => {
    fetchData();
  }, [page]);

  const fetchData = async () => {
    setLoading(true);
    try {
      // Fetch wallet info
      const walletRes = await fetch('/api/enterprise/wallet', { credentials: 'include' });
      const walletData = await walletRes.json();
      if (walletData.success) setWalletInfo(walletData.data);

      // Fetch transactions
      const txRes = await fetch(`/api/enterprise/wallet/transactions?page=${page}`, { credentials: 'include' });
      const txData = await txRes.json();
      if (txData.data) {
        setTransactions(txData.data);
        setTotalPages(txData.totalPages || 1);
      }
    } catch (error) {
      console.error('Fetch error:', error);
    }
    setLoading(false);
  };

  const availableBalance = walletInfo ? walletInfo.balance - walletInfo.frozenAmount : 0;

  return (
    <EnterpriseLayout>
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold text-gray-900">公司钱包</h1>
            <p className="text-gray-600 mt-1">{walletInfo?.companyName}</p>
          </div>
          <div className="flex gap-2">
            <Button variant="outline" size="sm" onClick={fetchData}>
              <RefreshCw className="h-4 w-4" /> 刷新
            </Button>
            <Button size="sm">
              <ArrowUpCircle className="h-4 w-4" /> 充值
            </Button>
          </div>
        </div>

        {loading && !walletInfo ? (
          <div className="grid sm:grid-cols-3 gap-4">
            <div className="h-32 bg-gray-100 animate-pulse rounded-lg" />
            <div className="h-32 bg-gray-100 animate-pulse rounded-lg" />
            <div className="h-32 bg-gray-100 animate-pulse rounded-lg" />
          </div>
        ) : walletInfo ? (
          <div className="grid sm:grid-cols-3 gap-4">
            <StatsCard
              title="可用余额"
              value={formatCurrency(availableBalance)}
              icon={Wallet}
              iconColor="text-green-600 bg-green-100"
            />
            <StatsCard
              title="冻结金额"
              value={formatCurrency(walletInfo.frozenAmount)}
              icon={Lock}
              iconColor="text-orange-600 bg-orange-100"
            />
            <StatsCard
              title="信用额度"
              value={formatCurrency(walletInfo.creditLimit)}
              icon={CreditCard}
              iconColor="text-blue-600 bg-blue-100"
            />
          </div>
        ) : null}

        <Card padding="none">
          <div className="p-6 pb-0">
            <h2 className="font-semibold text-gray-900">交易记录</h2>
          </div>
          {loading ? (
            <TableSkeleton />
          ) : transactions.length === 0 ? (
            <EmptyState icon={TrendingUp} title="暂无交易记录" />
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>类型</TableHead>
                  <TableHead>金额</TableHead>
                  <TableHead>余额</TableHead>
                  <TableHead>说明</TableHead>
                  <TableHead>时间</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {transactions.map(tx => (
                  <TableRow key={tx.id}>
                    <TableCell>
                      <Badge variant={tx.type === 'RECHARGE' ? 'success' : tx.type === 'PAYMENT' ? 'danger' : 'default'}>
                        {tx.type}
                      </Badge>
                    </TableCell>
                    <TableCell className={`font-medium ${
                      tx.type === 'RECHARGE' || tx.type === 'REFUND' ? 'text-green-600' : 'text-red-600'
                    }`}>
                      {tx.type === 'RECHARGE' || tx.type === 'REFUND' ? '+' : '-'}
                      {formatCurrency(tx.amount)}
                    </TableCell>
                    <TableCell className="text-gray-600">
                      {tx.balanceAfter !== null ? formatCurrency(tx.balanceAfter) : '-'}
                    </TableCell>
                    <TableCell className="text-gray-600">{tx.description || '-'}</TableCell>
                    <TableCell className="text-gray-500">{formatDate(tx.createdAt)}</TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </Card>

        <Pagination currentPage={page} totalPages={totalPages} onPageChange={setPage} />
      </div>
    </EnterpriseLayout>
  );
}
