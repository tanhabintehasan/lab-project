'use client';

import { useState, useEffect, useCallback } from 'react';
import { useTranslations } from 'next-intl';
import { DashboardLayout } from '@/components/layout/dashboard-layout';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Pagination } from '@/components/ui/pagination';
import { EmptyState } from '@/components/ui/empty-state';
import { TableSkeleton } from '@/components/ui/skeleton';
import { Bell, ShoppingCart, FileText, Wallet, MessageSquare } from 'lucide-react';
import { formatDateTime } from '@/lib/utils';

const typeIcons: Record<string, typeof Bell> = {
  SYSTEM: Bell,
  ORDER: ShoppingCart,
  REPORT: FileText,
  WALLET: Wallet,
};

export default function MessagesPage() {
  const t = useTranslations('notifications');
  const [notifications, setNotifications] = useState<Array<Record<string, unknown>>>([]);
  const [loading, setLoading] = useState(true);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [filter, setFilter] = useState('');

  const fetchData = useCallback(() => {
    setLoading(true);
    const params = new URLSearchParams({ page: String(page), pageSize: '10' });

    if (filter) {
      params.set(filter === 'unread' ? 'isRead' : 'type', filter === 'unread' ? 'false' : filter);
    }

    fetch(`/api/notifications?${params}`, {
      credentials: 'include',
    })
      .then(r => r.json())
      .then(d => {
        setNotifications(d.data || []);
        setTotalPages(d.totalPages || 1);
      })
      .finally(() => setLoading(false));
  }, [page, filter]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  const markRead = async (id: string) => {
    await fetch(`/api/notifications/${id}`, {
      method: 'PATCH',
      credentials: 'include',
    });
    fetchData();
  };

  const tabs = [
    { key: '', label: '全部' },
    { key: 'ORDER', label: '订单' },
    { key: 'REPORT', label: '报告' },
    { key: 'SYSTEM', label: '系统' },
    { key: 'unread', label: '未读' },
  ];

  return (
    <DashboardLayout>
      <div className="space-y-6">
        <h1 className="text-2xl font-bold text-gray-900">{t('title')}</h1>

        <div className="flex gap-2 flex-wrap">
          {tabs.map(tab => (
            <button
              key={tab.key}
              onClick={() => {
                setFilter(tab.key);
                setPage(1);
              }}
              className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
                filter === tab.key
                  ? 'bg-blue-600 text-white'
                  : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
              }`}
            >
              {tab.label}
            </button>
          ))}
        </div>

        {loading ? (
          <TableSkeleton />
        ) : notifications.length === 0 ? (
          <EmptyState icon={MessageSquare} title={t('noNotifications')} />
        ) : (
          <div className="space-y-3">
            {notifications.map(n => {
              const Icon = typeIcons[(n.type as string)] || Bell;

              return (
                <Card
                  key={n.id as string}
                  padding="md"
                  className={`cursor-pointer ${
                    !(n.isRead as boolean) ? 'border-l-4 border-l-blue-600 bg-blue-50/30' : ''
                  }`}
                  onClick={() => {
                    if (!n.isRead) markRead(n.id as string);
                  }}
                >
                  <div className="flex items-start gap-3">
                    <div className="p-2 bg-gray-100 rounded-lg">
                      <Icon className="h-4 w-4 text-gray-500" />
                    </div>

                    <div className="flex-1 min-w-0">
                      <div className="flex items-center justify-between">
                        <h3 className="text-sm font-medium text-gray-900">{n.titleZh as string}</h3>
                        {!(n.isRead as boolean) && (
                          <Badge variant="info" size="sm">
                            未读
                          </Badge>
                        )}
                      </div>

                      <p className="text-sm text-gray-600 mt-1 line-clamp-2">
                        {n.contentZh as string}
                      </p>

                      <p className="text-xs text-gray-400 mt-2">
                        {formatDateTime(n.createdAt as string)}
                      </p>
                    </div>
                  </div>
                </Card>
              );
            })}
          </div>
        )}

        <Pagination currentPage={page} totalPages={totalPages} onPageChange={setPage} />
      </div>
    </DashboardLayout>
  );
}