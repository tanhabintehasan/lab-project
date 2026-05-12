'use client';
import { useState, useEffect, useCallback } from 'react';
import { useRouter } from '@/i18n/routing';
import { AdminLayout } from '@/components/layout/admin-layout';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { SearchInput } from '@/components/ui/search-input';
import { Table, TableHeader, TableBody, TableRow, TableHead, TableCell } from '@/components/ui/table';
import { Pagination } from '@/components/ui/pagination';
import { TableSkeleton } from '@/components/ui/skeleton';
import { EmptyState } from '@/components/ui/empty-state';
import { formatDate } from '@/lib/utils';
import { Inbox, Plus, Pencil, Trash2, Eye, EyeOff } from 'lucide-react';

interface CMSPageItem {
  id: string;
  slug: string;
  type: string;
  titleZh: string;
  isPublished: boolean;
  sortOrder: number;
  createdAt: string;
}

export default function AdminCMSPage() {
  const router = useRouter();
  const [items, setItems] = useState<CMSPageItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [search, setSearch] = useState('');

  const fetchData = useCallback(() => {
    setLoading(true);
    const p = new URLSearchParams({ page: String(page), pageSize: '15' });
    if (search) p.set('q', search);
    fetch(`/api/admin/cms?${p}`, {})
      .then((r) => r.json())
      .then((d) => {
        setItems(d.data || []);
        setTotalPages(d.totalPages || 1);
      })
      .finally(() => setLoading(false));
  }, [page, search]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  const togglePublish = async (item: CMSPageItem) => {
    try {
      const res = await fetch(`/api/admin/cms/${item.id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ isPublished: !item.isPublished }),
      });
      if (res.ok) fetchData();
    } catch (e) {
      console.error(e);
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm('确定删除此内容？')) return;
    try {
      const res = await fetch(`/api/admin/cms/${id}`, { method: 'DELETE' });
      if (res.ok) fetchData();
    } catch (e) {
      console.error(e);
    }
  };

  return (
    <AdminLayout>
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <h1 className="text-2xl font-bold text-gray-900">内容管理</h1>
          <Button onClick={() => router.push('/admin/cms/new')}>
            <Plus className="mr-2 h-4 w-4" />
            新建页面
          </Button>
        </div>

        <SearchInput placeholder="搜索标题或别名..." onSearch={(v) => { setSearch(v); setPage(1); }} className="max-w-xs" />

        {loading ? (
          <TableSkeleton />
        ) : items.length === 0 ? (
          <EmptyState icon={Inbox} title="暂无数据" />
        ) : (
          <Card padding="none">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>标题</TableHead>
                  <TableHead>别名 (Slug)</TableHead>
                  <TableHead>类型</TableHead>
                  <TableHead>排序</TableHead>
                  <TableHead>状态</TableHead>
                  <TableHead>创建时间</TableHead>
                  <TableHead className="text-right">操作</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {items.map((item) => (
                  <TableRow key={item.id}>
                    <TableCell className="font-medium">{item.titleZh}</TableCell>
                    <TableCell className="text-sm text-gray-500">{item.slug}</TableCell>
                    <TableCell><Badge variant="outline">{item.type}</Badge></TableCell>
                    <TableCell>{item.sortOrder}</TableCell>
                    <TableCell>
                      <Badge variant={item.isPublished ? 'success' : 'default'}>{item.isPublished ? '已发布' : '草稿'}</Badge>
                    </TableCell>
                    <TableCell className="text-sm text-gray-500">{item.createdAt ? formatDate(item.createdAt) : '-'}</TableCell>
                    <TableCell className="text-right">
                      <div className="flex items-center justify-end gap-2">
                        <Button size="sm" variant="ghost" onClick={() => togglePublish(item)} title={item.isPublished ? '下线' : '发布'}>
                          {item.isPublished ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                        </Button>
                        <Button size="sm" variant="ghost" onClick={() => router.push(`/admin/cms/${item.id}`)} title="编辑">
                          <Pencil className="h-4 w-4" />
                        </Button>
                        <Button size="sm" variant="ghost" className="text-red-600 hover:text-red-700" onClick={() => handleDelete(item.id)} title="删除">
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </Card>
        )}
        <Pagination currentPage={page} totalPages={totalPages} onPageChange={setPage} />
      </div>
    </AdminLayout>
  );
}
