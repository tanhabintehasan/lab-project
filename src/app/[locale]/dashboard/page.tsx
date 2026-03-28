'use client';

import { useState, useEffect } from 'react';
import { useTranslations } from 'next-intl';
import { Link } from '@/i18n/routing';
import {
  ShoppingCart,
  FileText,
  Wallet,
  FileQuestion,
  Plus,
  Send,
  Bell,
  Clock,
  TrendingUp,
  Eye,
  ArrowRight,
} from 'lucide-react';
import { DashboardLayout } from '@/components/layout/dashboard-layout';
import { StatsCard } from '@/components/ui/stats-card';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
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
import { formatCurrency } from '@/lib/utils';

export default function DashboardPage() {
  const t = useTranslations('dashboard');
  const [stats, setStats] = useState({
    activeOrders: 0,
    pendingQuotations: 0,
    reportsReady: 0,
    walletBalance: 0,
  });
  const [recentOrders, setRecentOrders] = useState<Array<Record<string, unknown>>>([]);
  const [notifications, setNotifications] = useState<Array<Record<string, unknown>>>([]);

  useEffect(() => {
    const fetchOpts: RequestInit = {
      credentials: 'include',
    };

    fetch('/api/dashboard/stats', fetchOpts)
      .then(r => r.json())
      .then(d => {
        if (d.success) setStats(d.data);
      });

    fetch('/api/orders?pageSize=5', fetchOpts)
      .then(r => r.json())
      .then(d => {
        if (d.data) setRecentOrders(d.data);
      });

    fetch('/api/notifications?pageSize=4', fetchOpts)
      .then(r => r.json())
      .then(d => {
        if (d.data) setNotifications(d.data);
      });
  }, []);

  return (
    <DashboardLayout>
      <div className="space-y-6">
        <div>
          <h2 className="text-2xl font-bold text-gray-900">欢迎回来！</h2>
          <p className="text-gray-500 mt-1">以下是您的账户概览和最近动态</p>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          <StatsCard
            title="进行中的订单"
            value={stats.activeOrders}
            icon={ShoppingCart}
            iconColor="text-blue-600 bg-blue-100"
          />
          <StatsCard
            title="待处理报价"
            value={stats.pendingQuotations}
            icon={FileQuestion}
            iconColor="text-orange-600 bg-orange-100"
          />
          <StatsCard
            title="报告待查看"
            value={stats.reportsReady}
            icon={FileText}
            iconColor="text-green-600 bg-green-100"
          />
          <StatsCard
            title="钱包余额"
            value={formatCurrency(Number(stats.walletBalance))}
            icon={Wallet}
            iconColor="text-purple-600 bg-purple-100"
          />
        </div>

        <Card>
          <CardHeader>
            <CardTitle>快捷操作</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex flex-wrap gap-3">
              <Link href="/dashboard/orders">
                <Button variant="primary" size="sm">
                  <Plus className="h-4 w-4" /> 新建订单
                </Button>
              </Link>
              <Link href="/dashboard/quotations">
                <Button variant="outline" size="sm">
                  <Send className="h-4 w-4" /> 申请报价
                </Button>
              </Link>
              <Link href="/dashboard/samples">
                <Button variant="outline" size="sm">
                  <TrendingUp className="h-4 w-4" /> 样品追踪
                </Button>
              </Link>
              <Link href="/dashboard/reports">
                <Button variant="outline" size="sm">
                  <Eye className="h-4 w-4" /> 查看报告
                </Button>
              </Link>
              <Link href="/dashboard/wallet">
                <Button variant="outline" size="sm">
                  <Wallet className="h-4 w-4" /> 钱包充值
                </Button>
              </Link>
            </div>
          </CardContent>
        </Card>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <div className="lg:col-span-2">
            <Card padding="none">
              <div className="p-6 pb-0 flex items-center justify-between">
                <CardTitle>最近订单</CardTitle>
                <Link
                  href="/dashboard/orders"
                  className="text-sm text-blue-600 hover:text-blue-700 flex items-center gap-1"
                >
                  查看全部 <ArrowRight className="h-3.5 w-3.5" />
                </Link>
              </div>

              <div className="p-6 pt-4">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>订单号</TableHead>
                      <TableHead>检测服务</TableHead>
                      <TableHead>状态</TableHead>
                      <TableHead>金额</TableHead>
                      <TableHead>日期</TableHead>
                    </TableRow>
                  </TableHeader>

                  <TableBody>
                    {recentOrders.map(order => {
                      const id = order.id as string;
                      const service = order.service as string;
                      const status = order.status as string;
                      const statusVariant = order.statusVariant as
                        | 'default'
                        | 'success'
                        | 'warning'
                        | 'danger'
                        | 'info';
                      const amount = Number(order.amount);
                      const date = order.date as string;

                      return (
                        <TableRow key={id}>
                          <TableCell>
                            <Link
                              href={`/dashboard/orders/${id}`}
                              className="text-blue-600 hover:underline font-medium"
                            >
                              {id}
                            </Link>
                          </TableCell>
                          <TableCell>{service}</TableCell>
                          <TableCell>
                            <Badge variant={statusVariant}>{status}</Badge>
                          </TableCell>
                          <TableCell className="font-medium">
                            {formatCurrency(amount)}
                          </TableCell>
                          <TableCell className="text-gray-500">{date}</TableCell>
                        </TableRow>
                      );
                    })}
                  </TableBody>
                </Table>
              </div>
            </Card>
          </div>

          <div>
            <Card padding="none">
              <div className="p-6 pb-0 flex items-center justify-between">
                <CardTitle>最近通知</CardTitle>
                <Link
                  href="/dashboard/messages"
                  className="text-sm text-blue-600 hover:text-blue-700 flex items-center gap-1"
                >
                  全部 <ArrowRight className="h-3.5 w-3.5" />
                </Link>
              </div>

              <div className="p-6 pt-4 space-y-3">
                {notifications.map(notif => {
                  const id = notif.id as string;
                  const read = Boolean(notif.read);
                  const type = notif.type as string;
                  const title = notif.title as string;
                  const time = notif.time as string;

                  return (
                    <div
                      key={id}
                      className={`flex gap-3 p-3 rounded-lg ${read ? 'bg-white' : 'bg-blue-50'}`}
                    >
                      <div
                        className={`flex-shrink-0 w-8 h-8 rounded-full flex items-center justify-center ${
                          type === 'order'
                            ? 'bg-blue-100 text-blue-600'
                            : type === 'report'
                              ? 'bg-green-100 text-green-600'
                              : 'bg-gray-100 text-gray-600'
                        }`}
                      >
                        {type === 'order' ? (
                          <ShoppingCart className="h-4 w-4" />
                        ) : type === 'report' ? (
                          <FileText className="h-4 w-4" />
                        ) : (
                          <Bell className="h-4 w-4" />
                        )}
                      </div>

                      <div className="min-w-0 flex-1">
                        <p className={`text-sm ${read ? 'text-gray-700' : 'text-gray-900 font-medium'}`}>
                          {title}
                        </p>
                        <p className="text-xs text-gray-400 mt-1 flex items-center gap-1">
                          <Clock className="h-3 w-3" /> {time}
                        </p>
                      </div>

                      {!read ? (
                        <div className="flex-shrink-0 w-2 h-2 rounded-full bg-blue-600 mt-2" />
                      ) : null}
                    </div>
                  );
                })}
              </div>
            </Card>
          </div>
        </div>
      </div>
    </DashboardLayout>
  );
}