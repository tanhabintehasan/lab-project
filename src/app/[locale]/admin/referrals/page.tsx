'use client';
import { useState, useEffect } from 'react';
import { AdminLayout } from '@/components/layout/admin-layout';
import { StatsCard } from '@/components/ui/stats-card';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Table, TableHeader, TableBody, TableRow, TableHead, TableCell } from '@/components/ui/table';
import { Pagination } from '@/components/ui/pagination';
import { EmptyState } from '@/components/ui/empty-state';
import { TableSkeleton } from '@/components/ui/skeleton';
import { Modal } from '@/components/ui/modal';
import { Users, Gift, DollarSign, Settings, RefreshCw } from 'lucide-react';
import { formatCurrency, formatDate } from '@/lib/utils';

interface ReferralData {
  id: string;
  referrerName: string;
  referredName: string;
  status: string;
  orderCount: number;
  totalCommission: number;
  createdAt: string;
}

export default function AdminReferralsPage() {
  const [stats, setStats] = useState({ totalReferrals: 0, totalCommission: 0, activeReferralCodes: 0 });
  const [referrals, setReferrals] = useState<ReferralData[]>([]);
  const [loading, setLoading] = useState(true);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [configModal, setConfigModal] = useState(false);
  const [config, setConfig] = useState({ registrationReward: 0, commissionRate: 0.05, minWithdrawalAmount: 100, frozenDays: 30 });
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    fetchData();
  }, [page]);

  const fetchData = async () => {
    setLoading(true);
    try {
      // Fetch stats
      const statsRes = await fetch('/api/admin/referrals/stats', { credentials: 'include' });
      const statsData = await statsRes.json();
      if (statsData.success) setStats(statsData.data);

      // Fetch referrals list
      const listRes = await fetch(`/api/admin/referrals?page=${page}`, { credentials: 'include' });
      const listData = await listRes.json();
      if (listData.success && listData.data) {
        setReferrals(listData.data.data || []);
        setTotalPages(listData.data.totalPages || 1);
      }

      // Fetch config
      const configRes = await fetch('/api/admin/referrals/config', { credentials: 'include' });
      const configData = await configRes.json();
      if (configData.success && configData.data) {
        setConfig(configData.data);
      }
    } catch (error) {
      console.error('Fetch error:', error);
    }
    setLoading(false);
  };

  const handleSaveConfig = async () => {
    setSaving(true);
    try {
      const res = await fetch('/api/admin/referrals/config', {
        method: 'POST',
        credentials: 'include',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(config),
      });
      const data = await res.json();
      if (data.success) {
        setConfigModal(false);
        fetchData();
      }
    } catch (error) {
      console.error('Save error:', error);
    }
    setSaving(false);
  };

  return (
    <AdminLayout>
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <h1 className="text-2xl font-bold text-gray-900">推荐管理</h1>
          <div className="flex gap-2">
            <Button variant="outline" size="sm" onClick={fetchData}>
              <RefreshCw className="h-4 w-4" /> 刷新
            </Button>
            <Button size="sm" onClick={() => setConfigModal(true)}>
              <Settings className="h-4 w-4" /> 佣金设置
            </Button>
          </div>
        </div>

        <div className="grid sm:grid-cols-3 gap-4">
          <StatsCard title="总推荐数" value={stats.totalReferrals} icon={Users} iconColor="text-blue-600 bg-blue-100" />
          <StatsCard title="已发佣金" value={formatCurrency(stats.totalCommission)} icon={Gift} iconColor="text-green-600 bg-green-100" />
          <StatsCard title="活跃推荐码" value={stats.activeReferralCodes} icon={DollarSign} iconColor="text-orange-600 bg-orange-100" />
        </div>

        <Card padding="none">
          <div className="p-6 pb-0">
            <h2 className="font-semibold text-gray-900">推荐记录</h2>
          </div>
          {loading ? (
            <TableSkeleton />
          ) : referrals.length === 0 ? (
            <EmptyState icon={Users} title="暂无推荐记录" />
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>推荐人</TableHead>
                  <TableHead>被推荐人</TableHead>
                  <TableHead>状态</TableHead>
                  <TableHead>订单数</TableHead>
                  <TableHead>佣金总额</TableHead>
                  <TableHead>注册时间</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {referrals.map(ref => (
                  <TableRow key={ref.id}>
                    <TableCell className="font-medium">{ref.referrerName}</TableCell>
                    <TableCell>{ref.referredName}</TableCell>
                    <TableCell>
                      <Badge variant={ref.status === 'rewarded' ? 'success' : ref.status === 'qualified' ? 'info' : 'default'}>
                        {ref.status}
                      </Badge>
                    </TableCell>
                    <TableCell>{ref.orderCount}</TableCell>
                    <TableCell className="text-green-600 font-medium">{formatCurrency(ref.totalCommission)}</TableCell>
                    <TableCell className="text-gray-500">{formatDate(ref.createdAt)}</TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </Card>

        <Pagination currentPage={page} totalPages={totalPages} onPageChange={setPage} />
      </div>

      <Modal isOpen={configModal} onClose={() => setConfigModal(false)} title="推荐佣金设置">
        <div className="space-y-4">
          <Input
            label="注册奖励 (元)"
            type="number"
            value={config.registrationReward}
            onChange={e => setConfig(p => ({ ...p, registrationReward: parseFloat(e.target.value) || 0 }))}
          />
          <Input
            label="佣金比例 (0-1)"
            type="number"
            step="0.01"
            value={config.commissionRate}
            onChange={e => setConfig(p => ({ ...p, commissionRate: parseFloat(e.target.value) || 0 }))}
          />
          <Input
            label="最低提现金额 (元)"
            type="number"
            value={config.minWithdrawalAmount}
            onChange={e => setConfig(p => ({ ...p, minWithdrawalAmount: parseFloat(e.target.value) || 0 }))}
          />
          <Input
            label="佣金冻结天数"
            type="number"
            value={config.frozenDays}
            onChange={e => setConfig(p => ({ ...p, frozenDays: parseInt(e.target.value) || 0 }))}
          />
          <div className="flex gap-3 justify-end pt-4">
            <Button variant="outline" onClick={() => setConfigModal(false)}>取消</Button>
            <Button onClick={handleSaveConfig} loading={saving}>保存</Button>
          </div>
        </div>
      </Modal>
    </AdminLayout>
  );
}
