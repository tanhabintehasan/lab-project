'use client';

import { Fragment, useCallback, useEffect, useState } from 'react';
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
import { EmptyState } from '@/components/ui/empty-state';
import { formatDate } from '@/lib/utils';
import { Inbox } from 'lucide-react';

const statusVariant: Record<string, 'default' | 'info' | 'warning' | 'success' | 'danger'> = {
  SUBMITTED: 'info',
  UNDER_REVIEW: 'warning',
  QUOTING: 'warning',
  QUOTED: 'success',
  ACCEPTED: 'success',
  REJECTED: 'danger',
  CANCELLED: 'default',
  CONVERTED: 'success',
  INFO_REQUESTED: 'warning',
};

type RFQItem = Record<string, unknown>;

function parseApiResponse(text: string) {
  try {
    return text ? JSON.parse(text) : null;
  } catch {
    return null;
  }
}

export default function Admin需求Page() {
  const [items, setItems] = useState<RFQItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [search, setSearch] = useState('');

  const [expandedId, setExpandedId] = useState<string | null>(null);
  const [detailLoadingId, setDetailLoadingId] = useState<string | null>(null);
  const [detailsMap, setDetailsMap] = useState<Record<string, RFQItem>>({});
  const [deletingId, setDeletingId] = useState<string | null>(null);

  const fetchData = useCallback(async () => {
    setLoading(true);

    try {
      const p = new URLSearchParams({
        page: String(page),
        pageSize: '15',
        requestType: 'CUSTOM_TESTING',
      });

      if (search) p.set('q', search);

      const res = await fetch(`/api/rfq?${p.toString()}`, {
        credentials: 'include',
      });

      const text = await res.text();
      const data = parseApiResponse(text);

      if (!res.ok) {
        throw new Error(data?.error || `加载失败 (${res.status})`);
      }

      setItems(data?.data || []);
      setTotalPages(data?.totalPages || 1);
    } catch (error) {
      console.error('RFQ list load error:', error);
      setItems([]);
      setTotalPages(1);
    } finally {
      setLoading(false);
    }
  }, [page, search]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  const handleView = async (id: string) => {
    if (expandedId === id) {
      setExpandedId(null);
      return;
    }

    setExpandedId(id);

    if (detailsMap[id]) return;

    try {
      setDetailLoadingId(id);

      const res = await fetch(`/api/rfq/${id}`, {
        credentials: 'include',
      });

      const text = await res.text();
      const data = parseApiResponse(text);

      if (!res.ok) {
        throw new Error(data?.error || `详情加载失败 (${res.status})`);
      }

      if (data?.success) {
        setDetailsMap((prev) => ({
          ...prev,
          [id]: data.data,
        }));
      }
    } catch (error) {
      console.error('RFQ detail load error:', error);
    } finally {
      setDetailLoadingId(null);
    }
  };

  const handleDelete = async (id: string) => {
    const ok = window.confirm('确定要删除这条需求吗？删除后不可恢复。');
    if (!ok) return;

    try {
      setDeletingId(id);

      const res = await fetch(`/api/rfq/${id}`, {
        method: 'DELETE',
        credentials: 'include',
      });

      const text = await res.text();
      const data = parseApiResponse(text);

      if (!res.ok) {
        throw new Error(data?.error || `删除失败 (${res.status})`);
      }

      if (!data?.success) {
        throw new Error(data?.error || '删除失败');
      }

      if (expandedId === id) {
        setExpandedId(null);
      }

      setDetailsMap((prev) => {
        const next = { ...prev };
        delete next[id];
        return next;
      });

      fetchData();
    } catch (error) {
      alert(error instanceof Error ? error.message : '删除失败');
    } finally {
      setDeletingId(null);
    }
  };

  return (
    <AdminLayout>
      <div className="space-y-6">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">定制测试线索管理</h1>
          <p className="mt-1 text-sm text-gray-500">
            查看客户提交的完整需求信息，并进行跟进或删除
          </p>
        </div>

        <SearchInput
          placeholder="搜索编号、标题、联系人、电话、邮箱..."
          onSearch={(v) => {
            setSearch(v);
            setPage(1);
          }}
          className="max-w-md"
        />

        {loading ? (
          <TableSkeleton />
        ) : items.length === 0 ? (
          <EmptyState icon={Inbox} title="暂无数据" />
        ) : (
          <Card padding="none">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>需求编号</TableHead>
                  <TableHead>项目名称</TableHead>
                  <TableHead>联系人</TableHead>
                  <TableHead>联系方式</TableHead>
                  <TableHead>状态</TableHead>
                  <TableHead>提交时间</TableHead>
                  <TableHead>操作</TableHead>
                </TableRow>
              </TableHeader>

              <TableBody>
                {items.map((item) => {
                  const id = item.id as string;
                  const detail = detailsMap[id];
                  const isExpanded = expandedId === id;
                  const isLoadingDetail = detailLoadingId === id;
                  const isDeleting = deletingId === id;

                  return (
                    <Fragment key={id}>
                      <TableRow>
                        <TableCell className="font-mono text-xs">
                          {(item.requestNo as string) || '-'}
                        </TableCell>

                        <TableCell>
                          <div className="font-medium text-gray-900">
                            {(item.title as string) || '-'}
                          </div>
                          <div className="text-xs text-gray-500">
                            {(item.productType as string) || '-'}
                          </div>
                        </TableCell>

                        <TableCell>
                          <div className="font-medium">{(item.contactName as string) || '-'}</div>
                        </TableCell>

                        <TableCell>
                          <div className="text-sm">{(item.contactPhone as string) || '-'}</div>
                          <div className="text-xs text-gray-500">
                            {(item.contactEmail as string) || '-'}
                          </div>
                        </TableCell>

                        <TableCell>
                          <Badge variant={statusVariant[(item.status as string)] || 'default'}>
                            {(item.status as string) || '-'}
                          </Badge>
                        </TableCell>

                        <TableCell className="text-sm text-gray-500">
                          {item.createdAt ? formatDate(item.createdAt as string) : '-'}
                        </TableCell>

                        <TableCell>
                          <div className="flex gap-2">
                            <Button size="sm" variant="outline" onClick={() => handleView(id)}>
                              {isExpanded ? '收起' : '查看'}
                            </Button>

                            <Button
                              size="sm"
                              variant="outline"
                              onClick={() => handleDelete(id)}
                              disabled={isDeleting}
                              className="border-red-200 text-red-600 hover:bg-red-50"
                            >
                              {isDeleting ? '删除中...' : '删除'}
                            </Button>
                          </div>
                        </TableCell>
                      </TableRow>

                      {isExpanded ? (
                        <TableRow>
                          <TableCell colSpan={7} className="bg-gray-50">
                            {isLoadingDetail ? (
                              <div className="py-6 text-sm text-gray-500">正在加载详情...</div>
                            ) : detail ? (
                              <div className="space-y-6 p-2">
                                <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
                                  <div className="rounded-xl border bg-white p-4">
                                    <h3 className="mb-3 text-sm font-semibold text-gray-900">
                                      基本信息
                                    </h3>
                                    <div className="space-y-2 text-sm">
                                      <div><span className="text-gray-500">需求编号：</span>{(detail.requestNo as string) || '-'}</div>
                                      <div><span className="text-gray-500">标题：</span>{(detail.title as string) || '-'}</div>
                                      <div><span className="text-gray-500">类型：</span>{(detail.requestType as string) || '-'}</div>
                                      <div><span className="text-gray-500">状态：</span>{(detail.status as string) || '-'}</div>
                                      <div><span className="text-gray-500">提交时间：</span>{detail.createdAt ? formatDate(detail.createdAt as string) : '-'}</div>
                                      <div><span className="text-gray-500">截止时间：</span>{detail.deadline ? formatDate(detail.deadline as string) : '-'}</div>
                                    </div>
                                  </div>

                                  <div className="rounded-xl border bg-white p-4">
                                    <h3 className="mb-3 text-sm font-semibold text-gray-900">
                                      联系方式
                                    </h3>
                                    <div className="space-y-2 text-sm">
                                      <div><span className="text-gray-500">联系人：</span>{(detail.contactName as string) || '-'}</div>
                                      <div><span className="text-gray-500">电话：</span>{(detail.contactPhone as string) || '-'}</div>
                                      <div><span className="text-gray-500">邮箱：</span>{(detail.contactEmail as string) || '-'}</div>
                                      <div><span className="text-gray-500">用户姓名：</span>{(detail.user as any)?.name || '-'}</div>
                                      <div><span className="text-gray-500">用户账号：</span>{(detail.user as any)?.email || '-'}</div>
                                    </div>
                                  </div>

                                  <div className="rounded-xl border bg-white p-4">
                                    <h3 className="mb-3 text-sm font-semibold text-gray-900">
                                      测试信息
                                    </h3>
                                    <div className="space-y-2 text-sm">
                                      <div><span className="text-gray-500">材料：</span>{(detail.materialDesc as string) || '-'}</div>
                                      <div><span className="text-gray-500">分类：</span>{(detail.productType as string) || '-'}</div>
                                      <div><span className="text-gray-500">检测目标：</span>{(detail.testingTarget as string) || '-'}</div>
                                      <div><span className="text-gray-500">数量：</span>{(detail.quantity as string) || '-'}</div>
                                      <div><span className="text-gray-500">样品名称：</span>{(detail.sampleName as string) || '-'}</div>
                                      <div><span className="text-gray-500">样品状态：</span>{(detail.sampleCondition as string) || '-'}</div>
                                      <div><span className="text-gray-500">测试目的：</span>{(detail.testPurpose as string) || '-'}</div>
                                      <div><span className="text-gray-500">测试标准：</span>{(detail.testingStandard as string) || '-'}</div>
                                      <div><span className="text-gray-500">期望输出：</span>{(detail.expectedOutput as string) || '-'}</div>
                                      <div><span className="text-gray-500">紧急程度：</span>{(detail.urgency as string) || '-'}</div>
                                    </div>
                                  </div>
                                </div>

                                <div className="grid gap-4 lg:grid-cols-2">
                                  <div className="rounded-xl border bg-white p-4">
                                    <h3 className="mb-3 text-sm font-semibold text-gray-900">
                                      客户需求说明
                                    </h3>
                                    <div className="whitespace-pre-wrap text-sm text-gray-700">
                                      {(detail.requirements as string) || '暂无说明'}
                                    </div>
                                  </div>

                                  <div className="rounded-xl border bg-white p-4">
                                    <h3 className="mb-3 text-sm font-semibold text-gray-900">
                                      管理员备注
                                    </h3>
                                    <div className="whitespace-pre-wrap text-sm text-gray-700">
                                      {(detail.adminNote as string) || '暂无备注'}
                                    </div>
                                  </div>
                                </div>

                                <div className="rounded-xl border bg-white p-4">
                                  <h3 className="mb-3 text-sm font-semibold text-gray-900">
                                    附件信息
                                  </h3>

                                  {Array.isArray(detail.files) && (detail.files as any[]).length > 0 ? (
                                    <div className="space-y-2">
                                      {(detail.files as any[]).map((file, index) => (
                                        <div
                                          key={file.id || index}
                                          className="flex items-center justify-between rounded-lg border px-3 py-2 text-sm"
                                        >
                                          <div>
                                            <div className="font-medium text-gray-900">
                                              {file.fileName || '-'}
                                            </div>
                                            <div className="text-xs text-gray-500">
                                              类型：{file.fileType || '-'}
                                            </div>
                                          </div>

                                          {file.fileUrl ? (
                                            <a
                                              href={file.fileUrl}
                                              target="_blank"
                                              rel="noreferrer"
                                              className="text-blue-600 hover:underline"
                                            >
                                              查看附件
                                            </a>
                                          ) : null}
                                        </div>
                                      ))}
                                    </div>
                                  ) : (
                                    <div className="text-sm text-gray-500">暂无附件</div>
                                  )}
                                </div>
                              </div>
                            ) : (
                              <div className="py-6 text-sm text-red-500">详情加载失败</div>
                            )}
                          </TableCell>
                        </TableRow>
                      ) : null}
                    </Fragment>
                  );
                })}
              </TableBody>
            </Table>
          </Card>
        )}

        <Pagination currentPage={page} totalPages={totalPages} onPageChange={setPage} />
      </div>
    </AdminLayout>
  );
}