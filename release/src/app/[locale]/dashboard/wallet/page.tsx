'use client';

import { useState, useEffect, useCallback } from 'react';
import { useTranslations } from 'next-intl';
import { DashboardLayout } from '@/components/layout/dashboard-layout';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Modal } from '@/components/ui/modal';
import { StatsCard } from '@/components/ui/stats-card';
import { Table, TableHeader, TableBody, TableRow, TableHead, TableCell } from '@/components/ui/table';
import { Pagination } from '@/components/ui/pagination';
import { TableSkeleton } from '@/components/ui/skeleton';
import { Wallet, ArrowUpCircle, ArrowDownCircle, CreditCard } from 'lucide-react';
import { useAuthStore } from '@/store/auth-store';
import { formatCurrency, formatDateTime } from '@/lib/utils';

const typeLabels: Record<string, string> = {
  RECHARGE: '充值', PAYMENT: '支付', REFUND: '退款', WITHDRAWAL: '提现', COMMISSION: '佣金', ADJUSTMENT: '调整',
};
const typeVariant: Record<string, 'success'|'danger'|'info'|'warning'|'default'> = {
  RECHARGE: 'success', PAYMENT: 'danger', REFUND: 'info', WITHDRAWAL: 'warning', COMMISSION: 'success',
};

export default function WalletPage() {
  const t = useTranslations('wallet');
  // Auth via HttpOnly cookie
  const [wallet, setWallet] = useState<Record<string, unknown> | null>(null);
  const [transactions, setTransactions] = useState<Array<Record<string, unknown>>>([]);
  const [loading, setLoading] = useState(true);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [rechargeModal, setRechargeModal] = useState(false);
  const [rechargeAmount, setRechargeAmount] = useState('');
  const [recharging, setRecharging] = useState(false);

  const fetchWallet = useCallback(() => {
    fetch('/api/wallet', { })
      .then(r => r.json()).then(d => { if (d.success) setWallet(d.data); });
  }, []);

  const fetchTransactions = useCallback(() => {
    setLoading(true);
    fetch(`/api/wallet/transactions?page=${page}&pageSize=10`, { })
      .then(r => r.json())
      .then(d => { setTransactions(d.data || []); setTotalPages(d.totalPages || 1); })
      .finally(() => setLoading(false));
  }, [page]);

  useEffect(() => { fetchWallet(); fetchTransactions(); }, [fetchWallet, fetchTransactions]);

  const handleRecharge = async () => {
    const amt = parseFloat(rechargeAmount);
    if (!amt || amt <= 0) return;
    setRecharging(true);
    await fetch('/api/wallet/recharge', {
      credentials: 'include',
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ amount: amt }),
    });
    setRechargeModal(false);
    setRechargeAmount('');
    setRecharging(false);
    fetchWallet();
    fetchTransactions();
  };

  return (
    <DashboardLayout>
      <div className="space-y-6">
        <h1 className="text-2xl font-bold text-gray-900">{t('title')}</h1>

        <div className="grid sm:grid-cols-3 gap-4">
          <StatsCard title={t('balance')} value={formatCurrency(Number(wallet?.balance || 0))} icon={Wallet} iconColor="text-blue-600 bg-blue-100" />
          <StatsCard title={t('frozen')} value={formatCurrency(Number(wallet?.frozenAmount || 0))} icon={ArrowDownCircle} iconColor="text-orange-600 bg-orange-100" />
          <Card padding="md" className="flex items-center justify-center">
            <Button size="lg" onClick={() => setRechargeModal(true)}>
              <ArrowUpCircle className="h-4 w-4" />{t('recharge')}
            </Button>
          </Card>
        </div>

        <Card padding="none">
          <div className="p-4 border-b border-gray-200">
            <h2 className="font-semibold text-gray-900">{t('transactions')}</h2>
          </div>
          {loading ? <div className="p-4"><TableSkeleton /></div> : transactions.length === 0 ? (
            <p className="p-8 text-center text-gray-500">暂无交易记录</p>
          ) : (
            <Table>
              <TableHeader><TableRow>
                <TableHead>类型</TableHead><TableHead>金额</TableHead><TableHead>余额</TableHead>
                <TableHead>描述</TableHead><TableHead>时间</TableHead>
              </TableRow></TableHeader>
              <TableBody>
                {transactions.map(tx => (
                  <TableRow key={tx.id as string}>
                    <TableCell><Badge variant={typeVariant[(tx.type as string)] || 'default'}>{typeLabels[(tx.type as string)] || tx.type as string}</Badge></TableCell>
                    <TableCell className={`font-medium ${['RECHARGE','REFUND','COMMISSION'].includes(tx.type as string) ? 'text-green-600' : 'text-red-600'}`}>
                      {['RECHARGE','REFUND','COMMISSION'].includes(tx.type as string) ? '+' : '-'}{formatCurrency(Number(tx.amount))}
                    </TableCell>
                    <TableCell className="text-sm">{tx.balanceAfter ? formatCurrency(Number(tx.balanceAfter)) : '-'}</TableCell>
                    <TableCell className="text-sm text-gray-500">{(tx.description || '-') as string}</TableCell>
                    <TableCell className="text-sm text-gray-500">{formatDateTime(tx.createdAt as string)}</TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </Card>
        <Pagination currentPage={page} totalPages={totalPages} onPageChange={setPage} />
      </div>

      <Modal isOpen={rechargeModal} onClose={() => setRechargeModal(false)} title="钱包充值">
        <div className="space-y-4">
          <div className="grid grid-cols-3 gap-2">
            {[100, 500, 1000, 2000, 5000, 10000].map(amt => (
              <button key={amt} onClick={() => setRechargeAmount(String(amt))}
                className={`py-2 rounded-lg border text-sm font-medium ${rechargeAmount === String(amt) ? 'border-blue-600 bg-blue-50 text-blue-600' : 'border-gray-300 text-gray-700 hover:bg-gray-50'}`}>
                ¥{amt.toLocaleString()}
              </button>
            ))}
          </div>
          <Input label="自定义金额" type="number" placeholder="输入金额" value={rechargeAmount} onChange={e => setRechargeAmount(e.target.value)} />
          <Button fullWidth loading={recharging} onClick={handleRecharge} disabled={!rechargeAmount || parseFloat(rechargeAmount) <= 0}>
            确认充值 {rechargeAmount ? `¥${parseFloat(rechargeAmount).toLocaleString()}` : ''}
          </Button>
        </div>
      </Modal>
    </DashboardLayout>
  );
}
