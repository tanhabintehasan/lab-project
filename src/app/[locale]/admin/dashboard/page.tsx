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
} from 'lucide-react';
import { formatCurrency, formatDate } from '@/lib/utils';
import { useAuthStore } from '@/store/auth-store';

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

  const [recentOrders, setRecentOrders] = useState<Array<Record<string, unknown>>>([]);
  const [loading, setLoading] = useState(true);

  const isFinanceAdmin = user?.role === 'FINANCE_ADMIN';
  const isSuperAdmin = user?.role === 'SUPER_ADMIN';

  useEffect(() => {
    const fetchData = async () => {
      try {
        const [statsRes, ordersRes] = await Promise.all([
          fetch('/api/admin/stats').then(r => r.json()),
          fetch('/api/orders?pageSize=6').then(r => r.json()),
        ]);

        if (statsRes.success) {
          setStats(statsRes.data);
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

            <div className="grid lg:grid-cols-2 gap-6">
              <Card padding="lg">
                <CardHeader>
                  <CardTitle>收入趋势</CardTitle>
                </CardHeader>
                <div className="h-48 bg-gray-50 rounded-lg flex items-center justify-center text-gray-400 text-sm">
                  集成图表库后显示
                </div>
              </Card>

              <Card padding="lg">
                <CardHeader>
                  <CardTitle>订单分布</CardTitle>
                </CardHeader>
                <div className="h-48 bg-gray-50 rounded-lg flex items-center justify-center text-gray-400 text-sm">
                  集成图表库后显示
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