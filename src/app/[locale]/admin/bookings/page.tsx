'use client';

import { useState, useEffect, useCallback } from 'react';
import { useRouter } from '@/i18n/routing';
import { AdminLayout } from '@/components/layout/admin-layout';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { SearchInput } from '@/components/ui/search-input';
import {
  Table,
  TableHeader,
  TableBody,
  TableRow,
  TableHead,
  TableCell,
} from '@/components/ui/table';
import { Pagination } from '@/components/ui/pagination';
import { TableSkeleton } from '@/components/ui/skeleton';
import { CalendarDays, CheckCircle2, XCircle, Clock3, Ban, Play, Loader2 } from 'lucide-react';
import { useAuthStore } from '@/store/auth-store';
import { formatDate, formatDateTime } from '@/lib/utils';

interface BookingItem {
  id: string;
  bookingDate: string;
  startTime: string;
  endTime: string;
  status: string;
  purpose?: string;
  serviceName?: string;
  contactName?: string;
  contactPhone?: string;
  totalPrice?: string | number | null;
  createdAt: string;
  user?: {
    id: string;
    name?: string;
    email?: string;
    phone?: string;
  } | null;
  equipment?: {
    id: string;
    slug: string;
    nameZh: string;
    model?: string;
    lab?: {
      id: string;
      nameZh: string;
      slug: string;
    } | null;
  } | null;
}

function extractArray<T = unknown>(payload: any): T[] {
  if (Array.isArray(payload)) return payload;
  if (Array.isArray(payload?.data)) return payload.data;
  if (Array.isArray(payload?.items)) return payload.items;
  if (Array.isArray(payload?.data?.data)) return payload.data.data;
  return [];
}

function extractTotalPages(payload: any): number {
  if (typeof payload?.totalPages === 'number') return payload.totalPages;
  if (typeof payload?.pagination?.totalPages === 'number') return payload.pagination.totalPages;
  if (typeof payload?.data?.totalPages === 'number') return payload.data.totalPages;
  return 1;
}

async function parseApiResponse(res: Response) {
  const contentType = res.headers.get('content-type') || '';
  if (!contentType.includes('application/json')) {
    const text = await res.text();
    throw new Error(`接口未返回 JSON，响应内容: ${text.slice(0, 200)}`);
  }
  return res.json();
}

const statusMap: Record<
  string,
  { label: string; variant: 'default' | 'info' | 'warning' | 'success' | 'danger' }
> = {
  PENDING: { label: '待审核', variant: 'warning' },
  APPROVED: { label: '已批准', variant: 'success' },
  CONFIRMED: { label: '已确认', variant: 'info' },
  IN_PROGRESS: { label: '进行中', variant: 'info' },
  COMPLETED: { label: '已完成', variant: 'success' },
  REJECTED: { label: '已拒绝', variant: 'danger' },
  CANCELLED: { label: '已取消', variant: 'default' },
};

const tabs = [
  { key: '', label: '全部' },
  { key: 'PENDING', label: '待审核' },
  { key: 'APPROVED', label: '已批准' },
  { key: 'IN_PROGRESS', label: '进行中' },
  { key: 'COMPLETED', label: '已完成' },
  { key: 'REJECTED', label: '已拒绝' },
  { key: 'CANCELLED', label: '已取消' },
];

export default function AdminBookingsPage() {
  const router = useRouter();
  const { user } = useAuthStore();

  const [items, setItems] = useState<BookingItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [updatingId, setUpdatingId] = useState<string | null>(null);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('');
  const [error, setError] = useState('');

  useEffect(() => {
    if (!user) return;
    if (user.role !== 'SUPER_ADMIN') {
      router.replace('/admin/finance');
    }
  }, [user, router]);

  const fetchData = useCallback(async () => {
    try {
      setLoading(true);
      setError('');
      const params = new URLSearchParams({ page: String(page), pageSize: '15' });
      if (search) params.set('q', search);
      if (statusFilter) params.set('status', statusFilter);

      const res = await fetch(`/api/admin/bookings?${params.toString()}`, {
        credentials: 'include',
        cache: 'no-store',
      });

      if (res.status === 401) {
        router.replace('/auth/login');
        return;
      }
      if (res.status === 403) {
        setError('您没有权限访问预约管理');
        setItems([]);
        setTotalPages(1);
        return;
      }

      const data = await parseApiResponse(res);
      if (!res.ok) {
        setError(data?.error || '加载预约列表失败');
        setItems([]);
        setTotalPages(1);
        return;
      }

      setItems(extractArray<BookingItem>(data));
      setTotalPages(extractTotalPages(data));
    } catch (err) {
      setError(err instanceof Error ? err.message : '加载预约列表失败');
      setItems([]);
      setTotalPages(1);
    } finally {
      setLoading(false);
    }
  }, [page, search, statusFilter, router]);

  useEffect(() => {
    if (!user || user.role !== 'SUPER_ADMIN') return;
    fetchData();
  }, [fetchData, user]);

  const updateStatus = async (id: string, status: string) => {
    try {
      setUpdatingId(id);
      setError('');
      const res = await fetch('/api/admin/bookings', {
        credentials: 'include',
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id, status }),
      });

      if (res.status === 401) {
        router.replace('/auth/login');
        return;
      }

      const data = await parseApiResponse(res);
      if (!res.ok) {
        setError(data?.error || '更新状态失败');
        return;
      }

      fetchData();
    } catch (err) {
      setError(err instanceof Error ? err.message : '更新状态失败');
    } finally {
      setUpdatingId(null);
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
          只有超级管理员可以访问预约管理
        </div>
      </AdminLayout>
    );
  }

  return (
    <AdminLayout>
      <div className="space-y-6">
        <div className="flex flex-wrap items-center justify-between gap-4">
          <div>
            <h1 className="text-2xl font-bold text-gray-900">设备预约管理</h1>
            <p className="text-sm text-gray-500 mt-1">审核与管理所有设备预约申请</p>
          </div>
        </div>

        {error && (
          <div className="rounded-lg border border-red-200 bg-red-50 p-4 text-red-600">
            {error}
          </div>
        )}

        <div className="flex flex-wrap items-center gap-3">
          <div className="flex gap-1 flex-wrap">
            {tabs.map(tab => (
              <button
                key={tab.key}
                onClick={() => {
                  setStatusFilter(tab.key);
                  setPage(1);
                }}
                className={`px-4 py-2 rounded-lg text-sm font-medium ${
                  statusFilter === tab.key
                    ? 'bg-blue-600 text-white'
                    : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                }`}
              >
                {tab.label}
              </button>
            ))}
          </div>

          <SearchInput
            placeholder="搜索设备、用户、用途..."
            onSearch={value => {
              setSearch(value);
              setPage(1);
            }}
            className="w-full sm:w-72"
            size="sm"
          />
        </div>

        {loading ? (
          <TableSkeleton rows={8} />
        ) : (
          <Card padding="none">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>设备</TableHead>
                  <TableHead>预约用户</TableHead>
                  <TableHead>预约时间</TableHead>
                  <TableHead>用途</TableHead>
                  <TableHead>费用</TableHead>
                  <TableHead>状态</TableHead>
                  <TableHead>提交时间</TableHead>
                  <TableHead>操作</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {items.map(booking => {
                  const statusInfo = statusMap[booking.status] || {
                    label: booking.status,
                    variant: 'default' as const,
                  };
                  const canApprove = booking.status === 'PENDING';
                  const canReject = ['PENDING', 'APPROVED', 'CONFIRMED'].includes(booking.status);
                  const canComplete = ['APPROVED', 'CONFIRMED', 'IN_PROGRESS'].includes(booking.status);

                  return (
                    <TableRow key={booking.id}>
                      <TableCell>
                        <div className="min-w-[160px]">
                          <div className="font-medium text-gray-900">
                            {booking.equipment?.nameZh || '未知设备'}
                          </div>
                          {booking.equipment?.model ? (
                            <p className="text-xs text-gray-500 mt-1">型号：{booking.equipment.model}</p>
                          ) : null}
                          {booking.equipment?.lab?.nameZh ? (
                            <p className="text-xs text-gray-400 mt-1">{booking.equipment.lab.nameZh}</p>
                          ) : null}
                        </div>
                      </TableCell>

                      <TableCell>
                        <div className="min-w-[140px]">
                          <div className="text-sm text-gray-900">{booking.user?.name || '-'}</div>
                          <div className="text-xs text-gray-500">{booking.user?.email || '-'}</div>
                          {booking.user?.phone ? (
                            <div className="text-xs text-gray-400">{booking.user.phone}</div>
                          ) : null}
                        </div>
                      </TableCell>

                      <TableCell>
                        <div className="text-sm text-gray-900">{formatDate(booking.bookingDate)}</div>
                        <div className="text-xs text-gray-500 flex items-center gap-1 mt-1">
                          <Clock3 className="h-3.5 w-3.5" />
                          {booking.startTime} - {booking.endTime}
                        </div>
                      </TableCell>

                      <TableCell>
                        <div className="max-w-[200px]">
                          {booking.serviceName ? (
                            <p className="text-sm font-medium text-gray-700 mb-1">{booking.serviceName}</p>
                          ) : null}
                          <p className="text-sm text-gray-500 line-clamp-2">{booking.purpose || '-'}</p>
                        </div>
                      </TableCell>

                      <TableCell className="text-sm">
                        {booking.totalPrice !== undefined && booking.totalPrice !== null
                          ? `¥${Number(booking.totalPrice).toFixed(2)}`
                          : '-'}
                      </TableCell>

                      <TableCell>
                        <Badge variant={statusInfo.variant}>{statusInfo.label}</Badge>
                      </TableCell>

                      <TableCell className="text-sm text-gray-500">
                        {formatDateTime(booking.createdAt)}
                      </TableCell>

                      <TableCell>
                        <div className="flex flex-wrap gap-1 min-w-[120px]">
                          {canApprove && (
                            <Button
                              size="sm"
                              variant="outline"
                              className="text-green-600 border-green-200 hover:bg-green-50"
                              onClick={() => updateStatus(booking.id, 'APPROVED')}
                              disabled={updatingId === booking.id}
                            >
                              {updatingId === booking.id ? (
                                <Loader2 className="h-3.5 w-3.5 animate-spin" />
                              ) : (
                                <CheckCircle2 className="h-3.5 w-3.5" />
                              )}
                              批准
                            </Button>
                          )}
                          {canReject && (
                            <Button
                              size="sm"
                              variant="outline"
                              className="text-red-600 border-red-200 hover:bg-red-50"
                              onClick={() => updateStatus(booking.id, 'REJECTED')}
                              disabled={updatingId === booking.id}
                            >
                              {updatingId === booking.id ? (
                                <Loader2 className="h-3.5 w-3.5 animate-spin" />
                              ) : (
                                <XCircle className="h-3.5 w-3.5" />
                              )}
                              拒绝
                            </Button>
                          )}
                          {canComplete && (
                            <Button
                              size="sm"
                              variant="outline"
                              onClick={() => updateStatus(booking.id, 'COMPLETED')}
                              disabled={updatingId === booking.id}
                            >
                              {updatingId === booking.id ? (
                                <Loader2 className="h-3.5 w-3.5 animate-spin" />
                              ) : (
                                <Play className="h-3.5 w-3.5" />
                              )}
                              完成
                            </Button>
                          )}
                          {booking.status !== 'CANCELLED' && booking.status !== 'COMPLETED' && (
                            <Button
                              size="sm"
                              variant="ghost"
                              onClick={() => updateStatus(booking.id, 'CANCELLED')}
                              disabled={updatingId === booking.id}
                            >
                              {updatingId === booking.id ? (
                                <Loader2 className="h-3.5 w-3.5 animate-spin" />
                              ) : (
                                <Ban className="h-3.5 w-3.5" />
                              )}
                              取消
                            </Button>
                          )}
                        </div>
                      </TableCell>
                    </TableRow>
                  );
                })}
                {!items.length && (
                  <TableRow>
                    <TableCell colSpan={8} className="py-8 text-center text-gray-500">
                      暂无预约数据
                    </TableCell>
                  </TableRow>
                )}
              </TableBody>
            </Table>
          </Card>
        )}

        <Pagination currentPage={page} totalPages={totalPages} onPageChange={setPage} />
      </div>
    </AdminLayout>
  );
}
