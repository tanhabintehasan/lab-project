'use client';
import { useState, useEffect } from 'react';
import { useTranslations } from 'next-intl';
import { DashboardLayout } from '@/components/layout/dashboard-layout';
import { Card } from '@/components/ui/card';
import { StatsCard } from '@/components/ui/stats-card';
import { Button } from '@/components/ui/button';
import { Table, TableHeader, TableBody, TableRow, TableHead, TableCell } from '@/components/ui/table';
import { Users, Gift, Wallet, Copy, CheckCircle2 } from 'lucide-react';
import { useAuthStore } from '@/store/auth-store';
import { formatDate, formatCurrency } from '@/lib/utils';

export default function ReferralPage() {
  const t = useTranslations('referral');
  // Auth via HttpOnly cookie
  const [data, setData] = useState<Record<string, unknown> | null>(null);
  const [copied, setCopied] = useState(false);

  useEffect(() => {
    fetch('/api/referrals', { })
      .then(r => r.json())
      .then(d => { if (d.success) setData(d.data); });
  }, []);

  const copyCode = () => {
    if (data?.code) {
      navigator.clipboard.writeText(`${window.location.origin}/auth/register?ref=${data.code}`);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  };

  const stats = data?.stats as Record<string, number> | undefined;
  const referrals = (data?.referrals as Array<Record<string, unknown>>) || [];

  return (
    <DashboardLayout>
      <div className="space-y-6">
        <h1 className="text-2xl font-bold text-gray-900">{t('title')}</h1>

        <Card padding="lg" className="bg-gradient-to-r from-blue-600 to-indigo-600 text-white">
          <h2 className="text-lg font-semibold mb-2">{t('myCode')}</h2>
          <div className="flex items-center gap-3">
            <code className="bg-white/20 px-4 py-2 rounded-lg text-lg font-mono">{(data?.code as string) || '...'}</code>
            <Button variant="secondary" size="sm" onClick={copyCode}>
              {copied ? <><CheckCircle2 className="h-4 w-4" />已复制</> : <><Copy className="h-4 w-4" />{t('copyLink')}</>}
            </Button>
          </div>
        </Card>

        <div className="grid sm:grid-cols-3 gap-4">
          <StatsCard title={t('invitedUsers')} value={stats?.invited || 0} icon={Users} iconColor="text-blue-600 bg-blue-100" />
          <StatsCard title={t('totalEarnings')} value={formatCurrency(stats?.totalCommissions || 0)} icon={Gift} iconColor="text-green-600 bg-green-100" />
          <StatsCard title={t('withdrawable')} value={formatCurrency(0)} icon={Wallet} iconColor="text-orange-600 bg-orange-100" />
        </div>

        <Card padding="none">
          <div className="p-4 border-b border-gray-200"><h2 className="font-semibold text-gray-900">{t('invitedUsers')}</h2></div>
          {referrals.length === 0 ? (
            <p className="p-8 text-center text-gray-500">暂无邀请记录</p>
          ) : (
            <Table>
              <TableHeader><TableRow><TableHead>用户</TableHead><TableHead>状态</TableHead><TableHead>注册时间</TableHead></TableRow></TableHeader>
              <TableBody>
                {referrals.map(r => {
                  const u = r.referredUser as Record<string, string>;
                  return (
                    <TableRow key={r.id as string}>
                      <TableCell>{u?.name || u?.email}</TableCell>
                      <TableCell>{r.status as string}</TableCell>
                      <TableCell className="text-sm text-gray-500">{formatDate(r.createdAt as string)}</TableCell>
                    </TableRow>
                  );
                })}
              </TableBody>
            </Table>
          )}
        </Card>
      </div>
    </DashboardLayout>
  );
}
