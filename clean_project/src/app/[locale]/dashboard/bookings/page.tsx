'use client';

import { useCallback, useEffect, useState } from 'react';
import { useRouter, Link } from '@/i18n/routing';
import { DashboardLayout } from '@/components/layout/dashboard-layout';
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
import { EmptyState } from '@/components/ui/empty-state';
import { TableSkeleton } from '@/components/ui/skeleton';
import { CalendarDays, Plus, Clock3 } from 'lucide-react';
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
  createdAt: string;
  equipment?: {
    id: string;
    slug: string;
    nameZh: string;
    model?: string;
    lab?: {
      nameZh: string;
      slug: string;
    } | null;
  } | null;
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

export default function DashboardBookingsPage() {
  const router = useRouter();
  const [bookings, setBookings] = useState<BookingItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('');
  const [error, setError] = useState('');

  const fetchData = useCallback(async () => {
    try {
      setLoading(true);
      setError('');

      const params = new URLSearchParams({
        page: String(page),
        pageSize: '10',
      });

      if (search) params.set('q', search);
      if (statusFilter) params.set('status', statusFilter);

      const res = await fetch(`/api/bookings?${params.toString()}`, {
        credentials: 'include',
        cache: 'no-store',
      });

      if (res.status === 401) {
        router.replace('/auth/login');
        return;
      }

      const data = await res.json().catch(() => null);

      if (!res.ok || !data?.success) {
        setError(data?.error || '加载预约记录失败');
        setBookings([]);
        setTotalPages(1);
        return;
      }

      setBookings((data.data || []) as BookingItem[]);
      setTotalPages(data.totalPages || 1);
    } catch (err) {
      console.error('Failed to fetch bookings:', err);
      setError('加载预约记录失败');
      setBookings([]);
      setTotalPages(1);
    } finally {
      setLoading(false);
    }
  }, [page, search, statusFilter, router]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  const tabs = [
    { key: '', label: '全部' },
    { key: 'PENDING', label: '待审核' },
    { key: 'APPROVED', label: '已批准' },
    { key: 'COMPLETED', label: '已完成' },
    { key: 'CANCELLED', label: '已取消' },
  ];

  return (
    <DashboardLayout>
      <div className="space-y-6">
        <div className="flex flex-wrap items-center justify-between gap-4">
          <div>
            <h1 className="text-2xl font-bold text-gray-900">我的预约</h1>
            <p className="text-sm text-gray-500 mt-1">查看设备预约进度与历史记录</p>
          </div>

          <Link href="/equipment">
            <Button>
              <Plus className="h-4 w-4" />
              新建预约
            </Button>
          </Link>
        </div>

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
            placeholder="搜索设备名称、用途..."
            onSearch={value => {
              setSearch(value);
              setPage(1);
            }}
            className="w-full sm:w-72"
            size="sm"
          />
        </div>

        {error ? (
          <Card padding="lg">
            <p className="text-sm text-red-600">{error}</p>
          </Card>
        ) : null}

        {loading ? (
          <TableSkeleton rows={6} />
        ) : bookings.length === 0 ? (
          <Card>
            <EmptyState
              icon={CalendarDays}
              title="暂无预约记录"
              description="您还没有提交过设备预约，先去浏览可预约设备吧。"
              actionLabel="去预约设备"
              onAction={() => router.push('/equipment')}
            />
          </Card>
        ) : (
          <Card padding="none">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>设备</TableHead>
                  <TableHead>预约时间</TableHead>
                  <TableHead>用途</TableHead>
                  <TableHead>状态</TableHead>
                  <TableHead>提交时间</TableHead>
                </TableRow>
              </TableHeader>

              <TableBody>
                {bookings.map(booking => {
                  const statusInfo = statusMap[booking.status] || {
                    label: booking.status,
                    variant: 'default' as const,
                  };

                  return (
                    <TableRow key={booking.id}>
                      <TableCell>
                        <div className="min-w-[180px]">
                          {booking.equipment?.slug ? (
                            <Link
                              href={`/equipment/${booking.equipment.slug}`}
                              className="font-medium text-blue-600 hover:underline"
                            >
                              {booking.equipment?.nameZh || '未知设备'}
                            </Link>
                          ) : (
                            <div className="font-medium text-gray-900">
                              {booking.equipment?.nameZh || '未知设备'}
                            </div>
                          )}

                          {booking.equipment?.model ? (
                            <p className="text-xs text-gray-500 mt-1">型号：{booking.equipment.model}</p>
                          ) : null}

                          {booking.equipment?.lab?.nameZh ? (
                            <p className="text-xs text-gray-400 mt-1">{booking.equipment.lab.nameZh}</p>
                          ) : null}
                        </div>
                      </TableCell>

                      <TableCell>
                        <div className="text-sm text-gray-900">
                          {formatDate(booking.bookingDate)}
                        </div>
                        <div className="text-xs text-gray-500 flex items-center gap-1 mt-1">
                          <Clock3 className="h-3.5 w-3.5" />
                          {booking.startTime} - {booking.endTime}
                        </div>
                      </TableCell>

                      <TableCell>
                        <div className="max-w-[260px]">
                          {booking.serviceName ? (
                            <p className="text-sm font-medium text-gray-700 mb-1">{booking.serviceName}</p>
                          ) : null}
                          <p className="text-sm text-gray-500 line-clamp-2">
                            {booking.purpose || '-'}
                          </p>
                        </div>
                      </TableCell>

                      <TableCell>
                        <Badge variant={statusInfo.variant}>{statusInfo.label}</Badge>
                      </TableCell>

                      <TableCell className="text-sm text-gray-500">
                        {formatDateTime(booking.createdAt)}
                      </TableCell>
                    </TableRow>
                  );
                })}
              </TableBody>
            </Table>
          </Card>
        )}

        <Pagination currentPage={page} totalPages={totalPages} onPageChange={setPage} />
      </div>
    </DashboardLayout>
  );
}