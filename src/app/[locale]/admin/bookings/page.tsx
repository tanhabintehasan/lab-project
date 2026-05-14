'use client';

import { useState, useEffect, useCallback } from 'react';
import { useRouter } from '@/i18n/routing';
import { AdminLayout } from '@/components/layout/admin-layout';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { SearchInput } from '@/components/ui/search-input';
import { CalendarView } from '@/components/ui/calendar-view';
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
import { CalendarDays, CheckCircle2, XCircle, Clock3, Ban, Play, Loader2, LayoutList } from 'lucide-react';
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
  PENDING: { label: 'Pending', variant: 'warning' },
  APPROVED: { label: 'Approved', variant: 'success' },
  CONFIRMED: { label: 'Confirmed', variant: 'info' },
  IN_PROGRESS: { label: 'In Progress', variant: 'info' },
  COMPLETED: { label: 'Completed', variant: 'success' },
  REJECTED: { label: 'Rejected', variant: 'danger' },
  CANCELLED: { label: 'Cancelled', variant: 'default' },
};

const tabs = [
  { key: '', label: 'All' },
  { key: 'PENDING', label: 'Pending' },
  { key: 'APPROVED', label: 'Approved' },
  { key: 'IN_PROGRESS', label: 'In Progress' },
  { key: 'COMPLETED', label: 'Completed' },
  { key: 'REJECTED', label: 'Rejected' },
  { key: 'CANCELLED', label: 'Cancelled' },
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
  const [viewMode, setViewMode] = useState<'list' | 'calendar'>('list');

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
        setError('You do not have permission to access booking management');
        setItems([]);
        setTotalPages(1);
        return;
      }

      const data = await parseApiResponse(res);
      if (!res.ok) {
        setError(data?.error || 'Failed to load bookings');
        setItems([]);
        setTotalPages(1);
        return;
      }

      setItems(extractArray<BookingItem>(data));
      setTotalPages(extractTotalPages(data));
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load bookings');
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
        setError(data?.error || 'Status update failed');
        return;
      }

      fetchData();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Status update failed');
    } finally {
      setUpdatingId(null);
    }
  };

  const calendarEvents = items.map((b) => ({
    id: b.id,
    title: `${b.equipment?.nameZh || 'Equipment'} — ${b.user?.name || 'User'}`,
    date: b.bookingDate,
    startTime: b.startTime.slice(0, 5),
    endTime: b.endTime.slice(0, 5),
    status: b.status,
  }));

  if (!user) {
    return (
      <AdminLayout>
        <div className="p-6 text-gray-600">Loading user info...</div>
      </AdminLayout>
    );
  }

  if (user.role !== 'SUPER_ADMIN') {
    return (
      <AdminLayout>
        <div className="rounded-lg border border-red-200 bg-red-50 p-4 text-red-600">
          Only Super Admin can access booking management
        </div>
      </AdminLayout>
    );
  }

  return (
    <AdminLayout>
      <div className="space-y-6">
        <div className="flex flex-wrap items-center justify-between gap-4">
          <div>
            <h1 className="text-2xl font-bold text-gray-900">Equipment Booking Management</h1>
            <p className="text-sm text-gray-500 mt-1">Review and manage all equipment booking requests</p>
          </div>
          <div className="flex gap-2">
            <button
              onClick={() => setViewMode('list')}
              className={`px-3 py-1.5 rounded-lg text-sm font-medium flex items-center gap-1 ${
                viewMode === 'list' ? 'bg-blue-600 text-white' : 'bg-gray-100 text-gray-600'
              }`}
            >
              <LayoutList className="h-4 w-4" /> List
            </button>
            <button
              onClick={() => setViewMode('calendar')}
              className={`px-3 py-1.5 rounded-lg text-sm font-medium flex items-center gap-1 ${
                viewMode === 'calendar' ? 'bg-blue-600 text-white' : 'bg-gray-100 text-gray-600'
              }`}
            >
              <CalendarDays className="h-4 w-4" /> Calendar
            </button>
          </div>
        </div>

        {error && (
          <div className="rounded-lg border border-red-200 bg-red-50 p-4 text-red-600">
            {error}
          </div>
        )}

        {viewMode === 'calendar' ? (
          <Card padding="lg">
            <CalendarView
              events={calendarEvents}
              onEventClick={(evt) => {
                const booking = items.find((b) => b.id === evt.id);
                if (booking) {
                  alert(
                    `Booking: ${booking.equipment?.nameZh}\nUser: ${booking.user?.name}\nDate: ${booking.bookingDate}\nTime: ${booking.startTime} - ${booking.endTime}\nStatus: ${booking.status}\nPurpose: ${booking.purpose || '-'}`
                  );
                }
              }}
            />
          </Card>
        ) : (
          <>
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
                placeholder="Search equipment, user, purpose..."
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
                      <TableHead>Equipment</TableHead>
                      <TableHead>User</TableHead>
                      <TableHead>Time</TableHead>
                      <TableHead>Purpose</TableHead>
                      <TableHead>Fee</TableHead>
                      <TableHead>Status</TableHead>
                      <TableHead>Submitted</TableHead>
                      <TableHead>Actions</TableHead>
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
                                {booking.equipment?.nameZh || 'Unknown'}
                              </div>
                              {booking.equipment?.model ? (
                                <p className="text-xs text-gray-500 mt-1">Model: {booking.equipment.model}</p>
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
                                  Approve
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
                                  Reject
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
                                  Complete
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
                                  Cancel
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
                          No booking data
                        </TableCell>
                      </TableRow>
                    )}
                  </TableBody>
                </Table>
              </Card>
            )}

            <Pagination currentPage={page} totalPages={totalPages} onPageChange={setPage} />
          </>
        )}
      </div>
    </AdminLayout>
  );
}
