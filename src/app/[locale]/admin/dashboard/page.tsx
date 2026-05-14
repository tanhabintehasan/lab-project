'use client';

import { useState, useEffect } from 'react';
import { useTranslations } from 'next-intl';
import { Link, useRouter } from '@/i18n/routing';
import { AdminLayout } from '@/components/layout/admin-layout';
import { StatsCard } from '@/components/ui/stats-card';
import { Card, CardHeader, CardTitle } from '@/components/ui/card';
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
import {
  ShoppingCart,
  Users,
  Building2,
  TrendingUp,
  Eye,
  Download,
  DollarSign,
  Clock,
  BarChart3,
} from 'lucide-react';
import { formatCurrency, formatDate } from '@/lib/utils';
import { useAuthStore } from '@/store/auth-store';
import {
  AreaChart,
  Area,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Legend,
} from 'recharts';

interface MonthlyPoint {
  month: string;
  label: string;
  revenue: number;
  orderCount: number;
}

interface AnalyticsData {
  monthlyRevenue: MonthlyPoint[];
  orderVolume: MonthlyPoint[];
  summary: {
    totalRevenueThisMonth: number;
    totalOrdersThisMonth: number;
    totalRevenueLastMonth: number;
    totalOrdersLastMonth: number;
    revenueChangePercent: number;
    ordersChangePercent: number;
  };
}

export default function AdminDashboardPage() {
  const t = useTranslations('admin');
  const router = useRouter();
  const { user } = useAuthStore();

  const [stats, setStats] = useState({
    totalOrders: 0,
    totalRevenue: 0,
    todayRevenue: 0,
    totalUsers: 0,
    totalLabs: 0,
    pendingOrders: 0,
    activeServices: 0,
    pendingPayments: 0,
    failedPayments24h: 0,
  });

  const [analytics, setAnalytics] = useState<AnalyticsData | null>(null);
  const [recentOrders, setRecentOrders] = useState<Array<Record<string, unknown>>>([]);
  const [loading, setLoading] = useState(true);

  const isFinanceAdmin = user?.role === 'FINANCE_ADMIN';
  const isSuperAdmin = user?.role === 'SUPER_ADMIN';

  useEffect(() => {
    const fetchData = async () => {
      try {
        const [statsRes, analyticsRes, ordersRes] = await Promise.all([
          fetch('/api/admin/stats').then(r => r.json()),
          fetch('/api/admin/analytics').then(r => r.json()),
          fetch('/api/orders?pageSize=6').then(r => r.json()),
        ]);

        if (statsRes.success) {
          setStats(statsRes.data);
        }
        if (analyticsRes.success) {
          setAnalytics(analyticsRes.data);
        }
        if (ordersRes.data && Array.isArray(ordersRes.data)) {
          setRecentOrders(ordersRes.data);
        }
      } catch (error) {
        console.error('Failed to fetch dashboard data:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, []);

  const monthlyData = analytics?.monthlyRevenue || [];

  return (
    <AdminLayout>
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <h1 className="text-2xl font-bold text-gray-900">{t('dashboard')}</h1>

          <div className="flex gap-2">
            <Button variant="outline" size="sm">
              <Download className="h-4 w-4 mr-1" />
              导出报表
            </Button>
          </div>
        </div>

        {loading ? (
          <div className="text-center py-12">
            <div className="text-gray-500">加载中...</div>
          </div>
        ) : (
          <>
            {/* Finance-Focused Stats for Finance Admin */}
            {isFinanceAdmin && (
              <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
                <StatsCard
                  title="总收入"
                  value={formatCurrency(Number(stats.totalRevenue))}
                  icon={TrendingUp}
                  iconColor="text-green-600 bg-green-100"
                />
                <StatsCard
                  title="今日收入"
                  value={formatCurrency(Number(stats.todayRevenue || 0))}
                  icon={DollarSign}
                  iconColor="text-blue-600 bg-blue-100"
                />
                <StatsCard
                  title="待处理支付"
                  value={stats.pendingPayments || 0}
                  icon={Clock}
                  iconColor="text-yellow-600 bg-yellow-100"
                />
                <StatsCard
                  title="失败支付"
                  value={stats.failedPayments24h || 0}
                  icon={ShoppingCart}
                  iconColor="text-red-600 bg-red-100"
                />
              </div>
            )}

            {/* Full Stats for Super Admin */}
            {isSuperAdmin && (
              <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
                <StatsCard
                  title="总订单"
                  value={stats.totalOrders}
                  icon={ShoppingCart}
                  iconColor="text-blue-600 bg-blue-100"
                />
                <StatsCard
                  title="总收入"
                  value={formatCurrency(Number(stats.totalRevenue))}
                  icon={TrendingUp}
                  iconColor="text-green-600 bg-green-100"
                />
                <StatsCard
                  title="总用户"
                  value={stats.totalUsers}
                  icon={Users}
                  iconColor="text-purple-600 bg-purple-100"
                />
                <StatsCard
                  title="合作实验室"
                  value={stats.totalLabs}
                  icon={Building2}
                  iconColor="text-orange-600 bg-orange-100"
                />
              </div>
            )}

            {/* Analytics Summary Row */}
            {analytics && (
              <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
                <StatsCard
                  title="本月收入"
                  value={formatCurrency(analytics.summary.totalRevenueThisMonth)}
                  change={`${analytics.summary.revenueChangePercent >= 0 ? '+' : ''}${analytics.summary.revenueChangePercent}%`}
                  changeType={analytics.summary.revenueChangePercent >= 0 ? 'positive' : 'negative'}
                  icon={DollarSign}
                  iconColor="text-emerald-600 bg-emerald-100"
                />
                <StatsCard
                  title="本月订单"
                  value={analytics.summary.totalOrdersThisMonth}
                  change={`${analytics.summary.ordersChangePercent >= 0 ? '+' : ''}${analytics.summary.ordersChangePercent}%`}
                  changeType={analytics.summary.ordersChangePercent >= 0 ? 'positive' : 'negative'}
                  icon={BarChart3}
                  iconColor="text-blue-600 bg-blue-100"
                />
                <StatsCard
                  title="上月收入"
                  value={formatCurrency(analytics.summary.totalRevenueLastMonth)}
                  icon={TrendingUp}
                  iconColor="text-gray-600 bg-gray-100"
                />
                <StatsCard
                  title="上月订单"
                  value={analytics.summary.totalOrdersLastMonth}
                  icon={ShoppingCart}
                  iconColor="text-gray-600 bg-gray-100"
                />
              </div>
            )}

            {/* Charts */}
            <div className="grid lg:grid-cols-2 gap-6">
              <Card padding="lg">
                <CardHeader>
                  <CardTitle>月度收入趋势</CardTitle>
                </CardHeader>
                <div className="h-64">
                  {monthlyData.length > 0 ? (
                    <ResponsiveContainer width="100%" height="100%">
                      <AreaChart data={monthlyData} margin={{ top: 5, right: 20, bottom: 5, left: 0 }}>
                        <defs>
                          <linearGradient id="colorRevenue" x1="0" y1="0" x2="0" y2="1">
                            <stop offset="5%" stopColor="#3b82f6" stopOpacity={0.3} />
                            <stop offset="95%" stopColor="#3b82f6" stopOpacity={0} />
                          </linearGradient>
                        </defs>
                        <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
                        <XAxis
                          dataKey="label"
                          tick={{ fontSize: 12 }}
                          interval="preserveStartEnd"
                        />
                        <YAxis
                          tick={{ fontSize: 12 }}
                          tickFormatter={(v: number) => `¥${(v / 1000).toFixed(0)}k`}
                        />
                        <Tooltip
                          formatter={((value: number) => formatCurrency(value)) as any}
                          contentStyle={{ borderRadius: 8, border: '1px solid #e5e7eb' }}
                        />
                        <Area
                          type="monotone"
                          dataKey="revenue"
                          stroke="#3b82f6"
                          strokeWidth={2}
                          fillOpacity={1}
                          fill="url(#colorRevenue)"
                          name="收入"
                        />
                      </AreaChart>
                    </ResponsiveContainer>
                  ) : (
                    <div className="h-full bg-gray-50 rounded-lg flex items-center justify-center text-gray-400 text-sm">
                      暂无数据
                    </div>
                  )}
                </div>
              </Card>

              <Card padding="lg">
                <CardHeader>
                  <CardTitle>月度订单量</CardTitle>
                </CardHeader>
                <div className="h-64">
                  {monthlyData.length > 0 ? (
                    <ResponsiveContainer width="100%" height="100%">
                      <BarChart data={monthlyData} margin={{ top: 5, right: 20, bottom: 5, left: 0 }}>
                        <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
                        <XAxis
                          dataKey="label"
                          tick={{ fontSize: 12 }}
                          interval="preserveStartEnd"
                        />
                        <YAxis tick={{ fontSize: 12 }} />
                        <Tooltip
                          contentStyle={{ borderRadius: 8, border: '1px solid #e5e7eb' }}
                        />
                        <Bar
                          dataKey="orderCount"
                          fill="#10b981"
                          radius={[4, 4, 0, 0]}
                          name="订单数"
                        />
                      </BarChart>
                    </ResponsiveContainer>
                  ) : (
                    <div className="h-full bg-gray-50 rounded-lg flex items-center justify-center text-gray-400 text-sm">
                      暂无数据
                    </div>
                  )}
                </div>
              </Card>
            </div>

            <Card padding="none">
              <div className="p-4 border-b border-gray-200 flex items-center justify-between">
                <h2 className="font-semibold text-gray-900">最近订单</h2>
                <Link href="/admin/orders" className="text-sm text-blue-600 hover:underline">
                  查看全部
                </Link>
              </div>

              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>订单号</TableHead>
                    <TableHead>用户</TableHead>
                    <TableHead>金额</TableHead>
                    <TableHead>状态</TableHead>
                    <TableHead>日期</TableHead>
                    <TableHead>操作</TableHead>
                  </TableRow>
                </TableHeader>

                <TableBody>
                  {Array.isArray(recentOrders) && recentOrders.length > 0 ? (
                    recentOrders.map((o) => {
                      const usr = o.user as Record<string, string> | undefined;

                      return (
                        <TableRow key={o.id as string}>
                          <TableCell className="font-mono text-sm">
                            {o.orderNo as string}
                          </TableCell>

                          <TableCell>{usr?.name || usr?.email || '-'}</TableCell>

                          <TableCell className="font-medium">
                            {formatCurrency(Number(o.totalAmount))}
                          </TableCell>

                          <TableCell>
                            <Badge variant="info">{o.status as string}</Badge>
                          </TableCell>

                          <TableCell className="text-sm text-gray-500">
                            {formatDate(o.createdAt as string)}
                          </TableCell>

                          <TableCell>
                            <Button
                              size="sm"
                              variant="ghost"
                              onClick={() => router.push(`/dashboard/orders/${o.id as string}`)}
                            >
                              <Eye className="h-4 w-4" />
                            </Button>
                          </TableCell>
                        </TableRow>
                      );
                    })
                  ) : (
                    <TableRow>
                      <TableCell colSpan={6} className="text-center text-gray-500 py-4">
                        暂无订单
                      </TableCell>
                    </TableRow>
                  )}
                </TableBody>
              </Table>
            </Card>
          </>
        )}
      </div>
    </AdminLayout>
  );
}
