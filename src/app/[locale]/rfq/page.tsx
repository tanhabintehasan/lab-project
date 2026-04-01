'use client';

import { useState, useEffect, useCallback } from 'react';
import { useTranslations } from 'next-intl';
import { Link, useRouter } from '@/i18n/routing';
import { Card } from '@/components/ui/card';
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
import { Pagination } from '@/components/ui/pagination';
import { EmptyState } from '@/components/ui/empty-state';
import { TableSkeleton } from '@/components/ui/skeleton';
import { Plus, FileQuestion, ArrowLeft } from 'lucide-react';
import { formatDate } from '@/lib/utils';

const statusVariant: Record<
  string,
  'default' | 'info' | 'warning' | 'success' | 'danger'
> = {
  SUBMITTED: 'info',
  UNDER_REVIEW: 'warning',
  QUOTING: 'warning',
  QUOTED: 'success',
  ACCEPTED: 'success',
  REJECTED: 'danger',
  CANCELLED: 'default',
  CONVERTED: 'success',
};

export default function RFQPage() {
  const t = useTranslations('rfq');
  const router = useRouter();
  const [rfqs, setRfqs] = useState<Array<Record<string, unknown>>>([]);
  const [loading, setLoading] = useState(true);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);

  const handleBack = () => {
    if (typeof window !== 'undefined' && window.history.length > 1) {
      router.back();
    } else {
      router.push('/');
    }
  };

  const fetchData = useCallback(() => {
    setLoading(true);
    fetch(`/api/rfq?page=${page}&pageSize=10`, { credentials: 'include' })
      .then((r) => r.json())
      .then((data) => {
        setRfqs(data.data || []);
        setTotalPages(data.totalPages || 1);
      })
      .finally(() => setLoading(false));
  }, [page]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  return (
    <div className="mx-auto max-w-6xl px-4 py-10">
      <div className="space-y-6">
        <div className="mb-2">
          <button
            type="button"
            onClick={handleBack}
            className="flex items-center gap-2 text-sm text-gray-600 transition-colors hover:text-blue-600"
          >
            <ArrowLeft className="h-4 w-4" />
            返回
          </button>
        </div>

        <div className="flex items-center justify-between">
          <h1 className="text-2xl font-bold text-gray-900">{t('title')}</h1>
          <div className="flex gap-3">
            <Link href="/custom-testing">
              <Button variant="outline">定制测试</Button>
            </Link>
            <Link href="/rfq/new">
              <Button>
                <Plus className="h-4 w-4" />
                {t('createNew')}
              </Button>
            </Link>
          </div>
        </div>

        {loading ? (
          <TableSkeleton rows={5} />
        ) : rfqs.length === 0 ? (
          <EmptyState
            icon={FileQuestion}
            title="暂无需求"
            description="提交您的检测需求，获取专业报价"
            actionLabel={t('createNew')}
            onAction={() => router.push('/rfq/new')}
          />
        ) : (
          <Card padding="none">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>需求编号</TableHead>
                  <TableHead>标题</TableHead>
                  <TableHead>状态</TableHead>
                  <TableHead>提交时间</TableHead>
                  <TableHead>操作</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {rfqs.map((r) => (
                  <TableRow key={r.id as string}>
                    <TableCell className="font-mono text-sm">
                      {r.requestNo as string}
                    </TableCell>
                    <TableCell className="font-medium">{r.title as string}</TableCell>
                    <TableCell>
                      <Badge variant={statusVariant[(r.status as string)] || 'default'}>
                        {t(`status.${(r.status as string).toLowerCase()}`)}
                      </Badge>
                    </TableCell>
                    <TableCell className="text-sm text-gray-500">
                      {formatDate(r.createdAt as string)}
                    </TableCell>
                    <TableCell>
                      <Link
                        href={`/rfq/${r.id as string}`}
                        className="text-sm text-blue-600 hover:underline"
                      >
                        查看
                      </Link>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </Card>
        )}

        <Pagination currentPage={page} totalPages={totalPages} onPageChange={setPage} />
      </div>
    </div>
  );
}