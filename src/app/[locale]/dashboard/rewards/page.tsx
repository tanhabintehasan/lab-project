'use client';

import { useCallback, useEffect, useState } from 'react';
import { DashboardLayout } from '@/components/layout/dashboard-layout';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Link, useRouter } from '@/i18n/routing';
import { Gift, Users, Wallet, Coins, Copy, CheckCircle2 } from 'lucide-react';
import { formatDateTime } from '@/lib/utils';

interface RewardConfig {
  registrationReward?: number;
  commissionRate?: number;
  minWithdrawalAmount?: number;
  frozenDays?: number;
  maxTiers?: number;
  isActive?: boolean;
}

interface RewardReferral {
  id: string;
  status: string;
  createdAt: string;
  referredUser?: {
    id: string;
    name?: string;
    email?: string;
  } | null;
}

interface RewardCommission {
  id: string;
  amount: number;
  rate: number;
  status: string;
  releasedAt?: string | null;
  createdAt: string;
  orderId?: string | null;
  referral?: {
    id: string;
    status: string;
    referredUser?: {
      id: string;
      name?: string;
      email?: string;
    } | null;
  } | null;
}

interface RewardsResponse {
  success: boolean;
  data: {
    referralCode?: {
      id: string;
      code: string;
    } | null;
    config?: RewardConfig | null;
    summary: {
      referralCount: number;
      registeredReferralCount: number;
      qualifiedReferralCount: number;
      rewardedReferralCount: number;
      totalCommissionAmount: number;
      releasedCommissionAmount: number;
      pendingCommissionAmount: number;
      walletBalance: number;
    };
    referrals: RewardReferral[];
    commissions: RewardCommission[];
  };
}

const statusMap: Record<
  string,
  { label: string; variant: 'default' | 'warning' | 'success' | 'info' | 'danger' }
> = {
  registered: { label: '已注册', variant: 'default' },
  qualified: { label: '已达标', variant: 'info' },
  rewarded: { label: '已奖励', variant: 'success' },
  pending: { label: '待结算', variant: 'warning' },
  frozen: { label: '冻结中', variant: 'warning' },
  released: { label: '已释放', variant: 'success' },
  paid: { label: '已发放', variant: 'success' },
  cancelled: { label: '已取消', variant: 'danger' },
};

function formatMoney(value?: number) {
  const n = Number(value || 0);
  return `¥${n.toFixed(2)}`;
}

export default function DashboardRewardsPage() {
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [copied, setCopied] = useState(false);
  const [data, setData] = useState<RewardsResponse['data'] | null>(null);

  const fetchData = useCallback(async () => {
    try {
      setLoading(true);
      setError('');

      const res = await fetch('/api/rewards', {
        credentials: 'include',
        cache: 'no-store',
      });

      if (res.status === 401) {
        router.replace('/auth/login');
        return;
      }

      const json = (await res.json()) as RewardsResponse;

      if (!res.ok || !json?.success) {
        setError('加载奖励数据失败');
        setData(null);
        return;
      }

      setData(json.data);
    } catch (err) {
      console.error('Fetch rewards failed:', err);
      setError('加载奖励数据失败');
      setData(null);
    } finally {
      setLoading(false);
    }
  }, [router]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  const copyCode = async () => {
    if (!data?.referralCode?.code) return;

    try {
      await navigator.clipboard.writeText(data.referralCode.code);
      setCopied(true);
      setTimeout(() => setCopied(false), 1200);
    } catch (error) {
      console.error('Copy referral code failed:', error);
    }
  };

  return (
    <DashboardLayout>
      <div className="space-y-6">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">奖励中心</h1>
          <p className="mt-1 text-sm text-gray-500">查看邀请奖励、返佣进度和累计收益</p>
        </div>

        {error ? (
          <Card padding="lg">
            <p className="text-sm text-red-600">{error}</p>
          </Card>
        ) : null}

        {loading ? (
          <div className="grid grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-4">
            {Array.from({ length: 4 }).map((_, idx) => (
              <Card key={idx} padding="lg">
                <div className="h-20 animate-pulse rounded-xl bg-gray-100" />
              </Card>
            ))}
          </div>
        ) : data ? (
          <>
            <div className="grid grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-4">
              <Card padding="lg">
                <div className="flex items-start justify-between">
                  <div>
                    <p className="text-sm text-gray-500">累计邀请</p>
                    <p className="mt-2 text-3xl font-bold text-gray-900">
                      {data.summary.referralCount}
                    </p>
                  </div>
                  <Users className="h-6 w-6 text-blue-600" />
                </div>
              </Card>

              <Card padding="lg">
                <div className="flex items-start justify-between">
                  <div>
                    <p className="text-sm text-gray-500">累计返佣</p>
                    <p className="mt-2 text-3xl font-bold text-gray-900">
                      {formatMoney(data.summary.totalCommissionAmount)}
                    </p>
                  </div>
                  <Gift className="h-6 w-6 text-green-600" />
                </div>
              </Card>

              <Card padding="lg">
                <div className="flex items-start justify-between">
                  <div>
                    <p className="text-sm text-gray-500">待释放奖励</p>
                    <p className="mt-2 text-3xl font-bold text-gray-900">
                      {formatMoney(data.summary.pendingCommissionAmount)}
                    </p>
                  </div>
                  <Coins className="h-6 w-6 text-amber-600" />
                </div>
              </Card>

              <Card padding="lg">
                <div className="flex items-start justify-between">
                  <div>
                    <p className="text-sm text-gray-500">钱包余额</p>
                    <p className="mt-2 text-3xl font-bold text-gray-900">
                      {formatMoney(data.summary.walletBalance)}
                    </p>
                  </div>
                  <Wallet className="h-6 w-6 text-purple-600" />
                </div>
              </Card>
            </div>

            <Card padding="lg">
              <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
                <div>
                  <h2 className="text-lg font-semibold text-gray-900">我的邀请码</h2>
                  <p className="mt-1 text-sm text-gray-500">
                    邀请好友注册并下单，可获得平台返佣奖励
                  </p>
                </div>

                <div className="flex flex-wrap items-center gap-3">
                  <div className="rounded-xl border border-gray-200 bg-gray-50 px-4 py-3 font-mono text-sm text-gray-900">
                    {data.referralCode?.code || '暂未生成邀请码'}
                  </div>

                  <Button
                    variant="outline"
                    onClick={copyCode}
                    disabled={!data.referralCode?.code}
                  >
                    {copied ? (
                      <>
                        <CheckCircle2 className="h-4 w-4" />
                        已复制
                      </>
                    ) : (
                      <>
                        <Copy className="h-4 w-4" />
                        复制邀请码
                      </>
                    )}
                  </Button>

                  <Link href="/dashboard/referral">
                    <Button variant="outline">查看邀请页</Button>
                  </Link>
                </div>
              </div>

              {data.config ? (
                <div className="mt-5 grid gap-3 text-sm text-gray-600 md:grid-cols-3">
                  <div className="rounded-xl bg-gray-50 px-4 py-3">
                    注册红包：{formatMoney(data.config.registrationReward)}
                  </div>
                  <div className="rounded-xl bg-gray-50 px-4 py-3">
                    佣金比例：{((Number(data.config.commissionRate || 0) * 100).toFixed(2))}%
                  </div>
                  <div className="rounded-xl bg-gray-50 px-4 py-3">
                    冻结天数：{data.config.frozenDays || 0} 天
                  </div>
                </div>
              ) : null}
            </Card>

            <div className="grid gap-6 xl:grid-cols-2">
              <Card padding="lg">
                <h2 className="text-lg font-semibold text-gray-900">邀请记录</h2>
                <div className="mt-4 space-y-3">
                  {data.referrals.length === 0 ? (
                    <p className="text-sm text-gray-500">暂无邀请记录</p>
                  ) : (
                    data.referrals.map((item) => {
                      const statusInfo = statusMap[item.status] || {
                        label: item.status,
                        variant: 'default' as const,
                      };

                      return (
                        <div
                          key={item.id}
                          className="flex items-center justify-between rounded-xl border border-gray-100 px-4 py-3"
                        >
                          <div>
                            <div className="font-medium text-gray-900">
                              {item.referredUser?.name ||
                                item.referredUser?.email ||
                                '未命名用户'}
                            </div>
                            <div className="mt-1 text-xs text-gray-500">
                              {formatDateTime(item.createdAt)}
                            </div>
                          </div>
                          <Badge variant={statusInfo.variant}>{statusInfo.label}</Badge>
                        </div>
                      );
                    })
                  )}
                </div>
              </Card>

              <Card padding="lg">
                <h2 className="text-lg font-semibold text-gray-900">返佣记录</h2>
                <div className="mt-4 space-y-3">
                  {data.commissions.length === 0 ? (
                    <p className="text-sm text-gray-500">暂无返佣记录</p>
                  ) : (
                    data.commissions.map((item) => {
                      const statusInfo = statusMap[item.status] || {
                        label: item.status,
                        variant: 'default' as const,
                      };

                      return (
                        <div
                          key={item.id}
                          className="flex items-center justify-between rounded-xl border border-gray-100 px-4 py-3"
                        >
                          <div>
                            <div className="font-medium text-gray-900">
                              {formatMoney(item.amount)}
                            </div>
                            <div className="mt-1 text-xs text-gray-500">
                              来源用户：
                              {item.referral?.referredUser?.name ||
                                item.referral?.referredUser?.email ||
                                '-'}
                            </div>
                            <div className="mt-1 text-xs text-gray-500">
                              创建时间：{formatDateTime(item.createdAt)}
                            </div>
                          </div>
                          <Badge variant={statusInfo.variant}>{statusInfo.label}</Badge>
                        </div>
                      );
                    })
                  )}
                </div>
              </Card>
            </div>
          </>
        ) : null}
      </div>
    </DashboardLayout>
  );
}