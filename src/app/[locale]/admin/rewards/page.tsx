'use client';

import { useCallback, useEffect, useState } from 'react';
import { AdminLayout } from '@/components/layout/admin-layout';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { useRouter } from '@/i18n/routing';
import { useAuthStore } from '@/store/auth-store';
import { formatDateTime } from '@/lib/utils';

interface RewardConfig {
  id?: string;
  registrationReward?: number;
  commissionRate?: number;
  minWithdrawalAmount?: number;
  frozenDays?: number;
  maxTiers?: number;
  isActive?: boolean;
}

interface AdminRewardsData {
  config?: RewardConfig | null;
  overview: {
    referralCount: number;
    commissionCount: number;
    totalCommissionAmount: number;
  };
  recentCommissions: Array<{
    id: string;
    amount: number;
    rate: number;
    status: string;
    releasedAt?: string | null;
    createdAt: string;
    orderId?: string | null;
    referral?: {
      id?: string;
      status?: string;
      referrerUser?: {
        id: string;
        name?: string;
        email?: string;
      } | null;
      referredUser?: {
        id: string;
        name?: string;
        email?: string;
      } | null;
    } | null;
  }>;
}

function formatMoney(value?: number) {
  const n = Number(value || 0);
  return `¥${n.toFixed(2)}`;
}

export default function AdminRewardsPage() {
  const router = useRouter();
  const { user } = useAuthStore();

  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [data, setData] = useState<AdminRewardsData | null>(null);

  const [form, setForm] = useState({
    registrationReward: '0',
    commissionRate: '0.05',
    minWithdrawalAmount: '100',
    frozenDays: '30',
    maxTiers: '1',
    isActive: true,
  });

  const fetchData = useCallback(async () => {
    try {
      setLoading(true);
      setError('');

      const res = await fetch('/api/rewards?scope=admin', {
        credentials: 'include',
        cache: 'no-store',
      });

      if (res.status === 401) {
        router.replace('/auth/login');
        return;
      }

      if (res.status === 403) {
        setError('您没有权限访问奖励管理');
        setData(null);
        return;
      }

      const json = await res.json();

      if (!res.ok || !json?.success) {
        setError(json?.error || '加载奖励配置失败');
        setData(null);
        return;
      }

      const payload = json.data as AdminRewardsData;
      setData(payload);

      setForm({
        registrationReward: String(payload.config?.registrationReward ?? 0),
        commissionRate: String(payload.config?.commissionRate ?? 0.05),
        minWithdrawalAmount: String(payload.config?.minWithdrawalAmount ?? 100),
        frozenDays: String(payload.config?.frozenDays ?? 30),
        maxTiers: String(payload.config?.maxTiers ?? 1),
        isActive: Boolean(payload.config?.isActive ?? true),
      });
    } catch (err) {
      console.error('Fetch admin rewards failed:', err);
      setError('加载奖励配置失败');
      setData(null);
    } finally {
      setLoading(false);
    }
  }, [router]);

  useEffect(() => {
    if (!user) return;

    if (user.role !== 'SUPER_ADMIN') {
      router.replace('/admin/finance');
      return;
    }

    fetchData();
  }, [user, router, fetchData]);

  const handleSave = async () => {
    try {
      setSaving(true);
      setError('');
      setSuccess('');

      const payload = {
        registrationReward: Number(form.registrationReward),
        commissionRate: Number(form.commissionRate),
        minWithdrawalAmount: Number(form.minWithdrawalAmount),
        frozenDays: Number(form.frozenDays),
        maxTiers: Number(form.maxTiers),
        isActive: form.isActive,
      };

      const res = await fetch('/api/rewards', {
        method: 'POST',
        credentials: 'include',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(payload),
      });

      const json = await res.json();

      if (!res.ok || !json?.success) {
        setError(json?.error || '保存奖励配置失败');
        return;
      }

      setSuccess('奖励配置已保存');
      fetchData();
    } catch (err) {
      console.error('Save reward config failed:', err);
      setError('保存奖励配置失败');
    } finally {
      setSaving(false);
    }
  };

  if (!user) {
    return (
      <AdminLayout>
        <div className="p-6 text-gray-600">正在加载用户信息...</div>
      </AdminLayout>
    );
  }

  if (user.role !== 'SUPER_ADMIN') {
    return (
      <AdminLayout>
        <div className="rounded-lg border border-red-200 bg-red-50 p-4 text-red-600">
          只有超级管理员可以访问奖励管理
        </div>
      </AdminLayout>
    );
  }

  return (
    <AdminLayout>
      <div className="space-y-6">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">奖励系统管理</h1>
          <p className="mt-1 text-sm text-gray-500">管理邀请红包与返佣配置</p>
        </div>

        {error ? (
          <div className="rounded-lg border border-red-200 bg-red-50 p-4 text-red-600">
            {error}
          </div>
        ) : null}

        {success ? (
          <div className="rounded-lg border border-green-200 bg-green-50 p-4 text-green-700">
            {success}
          </div>
        ) : null}

        {loading ? (
          <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
            {Array.from({ length: 3 }).map((_, idx) => (
              <Card key={idx} padding="lg">
                <div className="h-24 animate-pulse rounded-xl bg-gray-100" />
              </Card>
            ))}
          </div>
        ) : (
          <>
            <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
              <Card padding="lg">
                <p className="text-sm text-gray-500">邀请总数</p>
                <p className="mt-2 text-3xl font-bold text-gray-900">
                  {data?.overview.referralCount || 0}
                </p>
              </Card>

              <Card padding="lg">
                <p className="text-sm text-gray-500">返佣记录数</p>
                <p className="mt-2 text-3xl font-bold text-gray-900">
                  {data?.overview.commissionCount || 0}
                </p>
              </Card>

              <Card padding="lg">
                <p className="text-sm text-gray-500">累计返佣金额</p>
                <p className="mt-2 text-3xl font-bold text-gray-900">
                  {formatMoney(data?.overview.totalCommissionAmount)}
                </p>
              </Card>
            </div>

            <Card padding="lg">
              <div className="flex items-center justify-between">
                <div>
                  <h2 className="text-lg font-semibold text-gray-900">奖励配置</h2>
                  <p className="mt-1 text-sm text-gray-500">配置邀请注册奖励与佣金规则</p>
                </div>
                <Badge variant={form.isActive ? 'success' : 'default'}>
                  {form.isActive ? '已启用' : '已停用'}
                </Badge>
              </div>

              <div className="mt-6 grid gap-4 md:grid-cols-2 xl:grid-cols-3">
                <Input
                  label="注册红包金额"
                  type="number"
                  value={form.registrationReward}
                  onChange={(e) =>
                    setForm((prev) => ({ ...prev, registrationReward: e.target.value }))
                  }
                />

                <Input
                  label="佣金比例"
                  type="number"
                  step="0.0001"
                  value={form.commissionRate}
                  onChange={(e) =>
                    setForm((prev) => ({ ...prev, commissionRate: e.target.value }))
                  }
                />

                <Input
                  label="最低提现金额"
                  type="number"
                  value={form.minWithdrawalAmount}
                  onChange={(e) =>
                    setForm((prev) => ({ ...prev, minWithdrawalAmount: e.target.value }))
                  }
                />

                <Input
                  label="冻结天数"
                  type="number"
                  value={form.frozenDays}
                  onChange={(e) =>
                    setForm((prev) => ({ ...prev, frozenDays: e.target.value }))
                  }
                />

                <Input
                  label="最大层级"
                  type="number"
                  value={form.maxTiers}
                  onChange={(e) =>
                    setForm((prev) => ({ ...prev, maxTiers: e.target.value }))
                  }
                />

                <div className="flex items-center rounded-xl border border-gray-200 px-4 py-3">
                  <label className="flex items-center gap-2 text-sm text-gray-700">
                    <input
                      type="checkbox"
                      checked={form.isActive}
                      onChange={(e) =>
                        setForm((prev) => ({ ...prev, isActive: e.target.checked }))
                      }
                    />
                    启用奖励系统
                  </label>
                </div>
              </div>

              <div className="mt-6">
                <Button onClick={handleSave} loading={saving}>
                  保存配置
                </Button>
              </div>
            </Card>

            <Card padding="lg">
              <h2 className="text-lg font-semibold text-gray-900">最近返佣记录</h2>

              <div className="mt-4 space-y-3">
                {!data?.recentCommissions?.length ? (
                  <p className="text-sm text-gray-500">暂无返佣记录</p>
                ) : (
                  data.recentCommissions.map((item) => (
                    <div
                      key={item.id}
                      className="flex flex-col gap-3 rounded-xl border border-gray-100 px-4 py-3 lg:flex-row lg:items-center lg:justify-between"
                    >
                      <div>
                        <div className="font-medium text-gray-900">
                          {item.referral?.referrerUser?.name ||
                            item.referral?.referrerUser?.email ||
                            '未知邀请人'}
                          {' → '}
                          {item.referral?.referredUser?.name ||
                            item.referral?.referredUser?.email ||
                            '未知被邀请人'}
                        </div>
                        <div className="mt-1 text-xs text-gray-500">
                          创建时间：{formatDateTime(item.createdAt)}
                        </div>
                      </div>

                      <div className="flex items-center gap-4">
                        <div className="text-right">
                          <div className="font-semibold text-gray-900">
                            {formatMoney(item.amount)}
                          </div>
                          <div className="text-xs text-gray-500">
                            比例 {(item.rate * 100).toFixed(2)}%
                          </div>
                        </div>

                        <Badge variant="default">{item.status}</Badge>
                      </div>
                    </div>
                  ))
                )}
              </div>
            </Card>
          </>
        )}
      </div>
    </AdminLayout>
  );
}