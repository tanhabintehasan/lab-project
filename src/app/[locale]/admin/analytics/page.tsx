'use client';
import { useState, useEffect } from 'react';
import { AdminLayout } from '@/components/layout/admin-layout';
import { StatsCard } from '@/components/ui/stats-card';
import { Card, CardHeader, CardTitle } from '@/components/ui/card';
import { useAuthStore } from '@/store/auth-store';
import { BarChart3, ShoppingCart, Users, Building2, TrendingUp, Eye } from 'lucide-react';
import { formatCurrency } from '@/lib/utils';
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Legend,
  PieChart,
  Pie,
  Cell,
  LineChart,
  Line,
} from 'recharts';
import { cn } from '@/lib/utils';

interface MonthlyPoint {
  month: string;
  label: string;
  revenue: number;
  orderCount: number;
}

interface LabPoint {
  labId: string;
  labName: string;
  orderCount: number;
  revenue: number;
  completedOrders: number;
  rating: number | null;
  avgTurnaroundDays: number | null;
}

interface ServicePoint {
  serviceId: string;
  serviceName: string;
  categoryName: string;
  orderCount: number;
  viewCount: number;
}

interface AnalyticsData {
  monthlyRevenue: MonthlyPoint[];
  orderVolume: MonthlyPoint[];
  labPerformance: LabPoint[];
  servicePopularity: ServicePoint[];
  summary: {
    totalRevenueThisMonth: number;
    totalOrdersThisMonth: number;
    totalRevenueLastMonth: number;
    totalOrdersLastMonth: number;
    revenueChangePercent: number;
    ordersChangePercent: number;
  };
}

const PIE_COLORS = ['#3b82f6', '#10b981', '#f59e0b', '#ef4444', '#8b5cf6', '#ec4899', '#06b6d4', '#84cc16'];

export default function AdminAnalyticsPage() {
  const [stats, setStats] = useState<Record<string, unknown>>({});
  const [analytics, setAnalytics] = useState<AnalyticsData | null>(null);
  const [loading, setLoading] = useState(true);
  const { user } = useAuthStore();

  useEffect(() => {
    Promise.all([
      fetch('/api/admin/stats', {}).then(r => r.json()),
      fetch('/api/admin/analytics').then(r => r.json()),
    ]).then(([statsRes, analyticsRes]) => {
      if (statsRes.success) setStats(statsRes.data);
      if (analyticsRes.success) setAnalytics(analyticsRes.data);
      setLoading(false);
    }).catch(() => setLoading(false));
  }, []);

  const monthlyData = analytics?.monthlyRevenue || [];
  const labs = analytics?.labPerformance?.slice(0, 10) || [];
  const services = analytics?.servicePopularity?.slice(0, 10) || [];

  // Build category distribution from services
  const categoryDist = services.reduce((acc, s) => {
    acc[s.categoryName] = (acc[s.categoryName] || 0) + s.orderCount;
    return acc;
  }, {} as Record<string, number>);
  const pieData = Object.entries(categoryDist).map(([name, value]) => ({ name, value }));

  return (
    <AdminLayout>
      <div className="space-y-6">
        <h1 className="text-2xl font-bold text-gray-900">数据分析</h1>

        {loading ? (
          <div className="text-center py-12 text-gray-500">加载分析数据中...</div>
        ) : (
          <>
            {/* Top Stats */}
            <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-4">
              <StatsCard title="总订单" value={String(stats.totalOrders || 0)} icon={ShoppingCart} iconColor="text-blue-600 bg-blue-100" />
              <StatsCard title="总用户" value={String(stats.totalUsers || 0)} icon={Users} iconColor="text-green-600 bg-green-100" />
              <StatsCard title="合作实验室" value={String(stats.totalLabs || 0)} icon={Building2} iconColor="text-purple-600 bg-purple-100" />
              <StatsCard title="活跃服务" value={String(stats.activeServices || 0)} icon={BarChart3} iconColor="text-orange-600 bg-orange-100" />
            </div>

            {/* Revenue & Orders Trend */}
            <div className="grid lg:grid-cols-2 gap-6">
              <Card padding="lg">
                <CardHeader>
                  <CardTitle>收入趋势 (近12个月)</CardTitle>
                </CardHeader>
                <div className="h-72">
                  {monthlyData.length > 0 ? (
                    <ResponsiveContainer width="100%" height="100%">
                      <LineChart data={monthlyData} margin={{ top: 5, right: 20, bottom: 5, left: 0 }}>
                        <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
                        <XAxis dataKey="label" tick={{ fontSize: 11 }} interval="preserveStartEnd" />
                        <YAxis tick={{ fontSize: 11 }} tickFormatter={(v: number) => `¥${(v / 1000).toFixed(0)}k`} />
                        <Tooltip formatter={((value: number) => [formatCurrency(value), '收入']) as any} contentStyle={{ borderRadius: 8 }} />
                        <Legend />
                        <Line type="monotone" dataKey="revenue" stroke="#3b82f6" strokeWidth={2} dot={{ r: 3 }} name="收入" />
                      </LineChart>
                    </ResponsiveContainer>
                  ) : (
                    <div className="h-full bg-gray-50 rounded-lg flex items-center justify-center text-gray-400 text-sm">暂无数据</div>
                  )}
                </div>
              </Card>

              <Card padding="lg">
                <CardHeader>
                  <CardTitle>订单量趋势 (近12个月)</CardTitle>
                </CardHeader>
                <div className="h-72">
                  {monthlyData.length > 0 ? (
                    <ResponsiveContainer width="100%" height="100%">
                      <BarChart data={monthlyData} margin={{ top: 5, right: 20, bottom: 5, left: 0 }}>
                        <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
                        <XAxis dataKey="label" tick={{ fontSize: 11 }} interval="preserveStartEnd" />
                        <YAxis tick={{ fontSize: 11 }} />
                        <Tooltip contentStyle={{ borderRadius: 8 }} />
                        <Legend />
                        <Bar dataKey="orderCount" fill="#10b981" radius={[4, 4, 0, 0]} name="订单数" />
                      </BarChart>
                    </ResponsiveContainer>
                  ) : (
                    <div className="h-full bg-gray-50 rounded-lg flex items-center justify-center text-gray-400 text-sm">暂无数据</div>
                  )}
                </div>
              </Card>
            </div>

            {/* Lab Performance & Service Popularity */}
            <div className="grid lg:grid-cols-2 gap-6">
              <Card padding="lg">
                <CardHeader>
                  <CardTitle>实验室绩效 (Top 10)</CardTitle>
                </CardHeader>
                <div className="h-72">
                  {labs.length > 0 ? (
                    <ResponsiveContainer width="100%" height="100%">
                      <BarChart
                        data={labs.map(l => ({ ...l, revenue: l.revenue / 1000 }))}
                        layout="vertical"
                        margin={{ top: 5, right: 20, bottom: 5, left: 60 }}
                      >
                        <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
                        <XAxis type="number" tick={{ fontSize: 11 }} tickFormatter={(v: number) => `¥${v}k`} />
                        <YAxis type="category" dataKey="labName" tick={{ fontSize: 11 }} width={100} />
                        <Tooltip formatter={((value: number) => [formatCurrency(value * 1000), '收入']) as any} contentStyle={{ borderRadius: 8 }} />
                        <Legend />
                        <Bar dataKey="revenue" fill="#8b5cf6" radius={[0, 4, 4, 0]} name="收入 (千元)" />
                        <Bar dataKey="orderCount" fill="#ec4899" radius={[0, 4, 4, 0]} name="订单数" />
                      </BarChart>
                    </ResponsiveContainer>
                  ) : (
                    <div className="h-full bg-gray-50 rounded-lg flex items-center justify-center text-gray-400 text-sm">暂无数据</div>
                  )}
                </div>
              </Card>

              <Card padding="lg">
                <CardHeader>
                  <CardTitle>热门服务分类分布</CardTitle>
                </CardHeader>
                <div className="h-72">
                  {pieData.length > 0 ? (
                    <ResponsiveContainer width="100%" height="100%">
                      <PieChart>
                        <Pie
                          data={pieData}
                          cx="50%"
                          cy="50%"
                          innerRadius={60}
                          outerRadius={100}
                          paddingAngle={3}
                          dataKey="value"
                          nameKey="name"
                        >
                          {pieData.map((_, index) => (
                            <Cell key={`cell-${index}`} fill={PIE_COLORS[index % PIE_COLORS.length]} />
                          ))}
                        </Pie>
                        <Tooltip contentStyle={{ borderRadius: 8 }} />
                        <Legend />
                      </PieChart>
                    </ResponsiveContainer>
                  ) : (
                    <div className="h-full bg-gray-50 rounded-lg flex items-center justify-center text-gray-400 text-sm">暂无数据</div>
                  )}
                </div>
              </Card>
            </div>

            {/* Lab Performance Table */}
            <Card padding="none">
              <div className="p-4 border-b border-gray-200">
                <h2 className="font-semibold text-gray-900">实验室详细数据</h2>
              </div>
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead className="bg-gray-50">
                    <tr>
                      <th className="text-left px-4 py-3 font-semibold text-gray-700">实验室</th>
                      <th className="text-right px-4 py-3 font-semibold text-gray-700">收入</th>
                      <th className="text-right px-4 py-3 font-semibold text-gray-700">订单数</th>
                      <th className="text-right px-4 py-3 font-semibold text-gray-700">完成订单</th>
                      <th className="text-right px-4 py-3 font-semibold text-gray-700">评分</th>
                      <th className="text-right px-4 py-3 font-semibold text-gray-700">平均周转(天)</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-100">
                    {labs.map((lab) => (
                      <tr key={lab.labId} className="hover:bg-gray-50">
                        <td className="px-4 py-3 font-medium text-gray-900">{lab.labName}</td>
                        <td className="px-4 py-3 text-right">{formatCurrency(lab.revenue)}</td>
                        <td className="px-4 py-3 text-right">{lab.orderCount}</td>
                        <td className="px-4 py-3 text-right">{lab.completedOrders}</td>
                        <td className="px-4 py-3 text-right">
                          <span className={cn(
                            'font-medium',
                            lab.rating && lab.rating >= 4 ? 'text-green-600' : lab.rating && lab.rating >= 3 ? 'text-yellow-600' : 'text-gray-500'
                          )}>
                            {lab.rating?.toFixed(1) || '-'}
                          </span>
                        </td>
                        <td className="px-4 py-3 text-right text-gray-600">
                          {lab.avgTurnaroundDays?.toFixed(1) || '-'}
                        </td>
                      </tr>
                    ))}
                    {labs.length === 0 && (
                      <tr>
                        <td colSpan={6} className="px-4 py-8 text-center text-gray-500">暂无实验室数据</td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>
            </Card>

            {/* Service Popularity Table */}
            <Card padding="none">
              <div className="p-4 border-b border-gray-200">
                <h2 className="font-semibold text-gray-900">热门服务排行</h2>
              </div>
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead className="bg-gray-50">
                    <tr>
                      <th className="text-left px-4 py-3 font-semibold text-gray-700">服务名称</th>
                      <th className="text-left px-4 py-3 font-semibold text-gray-700">分类</th>
                      <th className="text-right px-4 py-3 font-semibold text-gray-700">订单量</th>
                      <th className="text-right px-4 py-3 font-semibold text-gray-700">浏览量</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-100">
                    {services.map((s) => (
                      <tr key={s.serviceId} className="hover:bg-gray-50">
                        <td className="px-4 py-3 font-medium text-gray-900">{s.serviceName}</td>
                        <td className="px-4 py-3 text-gray-600">{s.categoryName}</td>
                        <td className="px-4 py-3 text-right">{s.orderCount}</td>
                        <td className="px-4 py-3 text-right text-gray-600">{s.viewCount}</td>
                      </tr>
                    ))}
                    {services.length === 0 && (
                      <tr>
                        <td colSpan={4} className="px-4 py-8 text-center text-gray-500">暂无服务数据</td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>
            </Card>
          </>
        )}
      </div>
    </AdminLayout>
  );
}
