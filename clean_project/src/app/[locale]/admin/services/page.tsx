'use client';

import { useState, useEffect, useCallback } from 'react';
import { useRouter } from '@/i18n/routing';
import { AdminLayout } from '@/components/layout/admin-layout';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Modal } from '@/components/ui/modal';
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
import { Plus, Edit, Trash2, ToggleLeft, ToggleRight } from 'lucide-react';
import { useAuthStore } from '@/store/auth-store';
import { formatCurrency } from '@/lib/utils';

interface ServiceCategory {
  id: string;
  nameZh: string;
  nameEn?: string;
  slug?: string;
}

interface ServiceItem {
  id: string;
  slug: string;
  nameZh: string;
  nameEn?: string;
  shortDescZh?: string;
  categoryId?: string;
  category?: {
    id?: string;
    nameZh?: string;
    nameEn?: string;
    slug?: string;
  };
  priceMin?: number | null;
  turnaroundDays?: number | null;
  isActive?: boolean;
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

const initialForm = {
  id: '',
  nameZh: '',
  nameEn: '',
  shortDescZh: '',
  categoryId: '',
  priceMin: '',
  turnaroundDays: '',
};

export default function AdminServicesPage() {
  const router = useRouter();
  const { user } = useAuthStore();

  const [services, setServices] = useState<ServiceItem[]>([]);
  const [categories, setCategories] = useState<ServiceCategory[]>([]);
  const [loading, setLoading] = useState(true);
  const [categoriesLoading, setCategoriesLoading] = useState(false);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [search, setSearch] = useState('');
  const [modalOpen, setModalOpen] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [error, setError] = useState('');
  const [saving, setSaving] = useState(false);

  const [form, setForm] = useState(initialForm);

  useEffect(() => {
    if (!user) return;

    if (user.role !== 'SUPER_ADMIN') {
      router.replace('/admin/finance');
    }
  }, [user, router]);

  const fetchCategories = useCallback(async () => {
    try {
      setCategoriesLoading(true);
      setError('');

      const res = await fetch('/api/admin/service-categories?page=1&pageSize=100', {
        credentials: 'include',
        cache: 'no-store',
      });

      const data = await parseApiResponse(res);

      if (!res.ok) {
        setCategories([]);
        return;
      }

      setCategories(extractArray<ServiceCategory>(data));
    } catch (err) {
      console.error('Failed to fetch categories:', err);
      setCategories([]);
      setError(err instanceof Error ? err.message : '加载分类失败');
    } finally {
      setCategoriesLoading(false);
    }
  }, []);

  const fetchData = useCallback(async () => {
    try {
      setLoading(true);
      setError('');

      const params = new URLSearchParams({
        page: String(page),
        pageSize: '15',
      });

      if (search) params.set('q', search);

      const res = await fetch(`/api/admin/services?${params.toString()}`, {
        credentials: 'include',
        cache: 'no-store',
      });

      if (res.status === 401) {
        router.replace('/auth/login');
        return;
      }

      if (res.status === 403) {
        setError('您没有权限访问服务管理');
        setServices([]);
        setTotalPages(1);
        return;
      }

      const data = await parseApiResponse(res);

      if (!res.ok) {
        setError(data?.error || '加载服务失败');
        setServices([]);
        setTotalPages(1);
        return;
      }

      setServices(extractArray<ServiceItem>(data));
      setTotalPages(extractTotalPages(data));
    } catch (err) {
      console.error('Failed to fetch services:', err);
      setError(err instanceof Error ? err.message : '加载服务失败');
      setServices([]);
      setTotalPages(1);
    } finally {
      setLoading(false);
    }
  }, [page, search, router]);

  useEffect(() => {
    if (!user || user.role !== 'SUPER_ADMIN') return;
    fetchData();
  }, [fetchData, user]);

  useEffect(() => {
    if (!modalOpen) return;
    fetchCategories();
  }, [modalOpen, fetchCategories]);

  const resetForm = () => {
    setForm(initialForm);
    setEditingId(null);
  };

  const openCreateModal = () => {
    resetForm();
    setError('');
    setModalOpen(true);
  };

  const openEditModal = (service: ServiceItem) => {
    setEditingId(service.id);
    setError('');
    setForm({
      id: service.id,
      nameZh: service.nameZh || '',
      nameEn: service.nameEn || '',
      shortDescZh: service.shortDescZh || '',
      categoryId: service.categoryId || service.category?.id || '',
      priceMin:
        service.priceMin !== null && service.priceMin !== undefined
          ? String(service.priceMin)
          : '',
      turnaroundDays:
        service.turnaroundDays !== null && service.turnaroundDays !== undefined
          ? String(service.turnaroundDays)
          : '',
    });
    setModalOpen(true);
  };

  const handleSave = async () => {
    if (!form.nameZh.trim()) {
      setError('服务名称（中文）不能为空');
      return;
    }

    if (!form.categoryId.trim()) {
      setError('请选择服务分类');
      return;
    }

    try {
      setSaving(true);
      setError('');

      const payload = {
        nameZh: form.nameZh.trim(),
        nameEn: form.nameEn.trim() || undefined,
        shortDescZh: form.shortDescZh.trim() || undefined,
        categoryId: form.categoryId,
        priceMin: form.priceMin ? parseFloat(form.priceMin) : undefined,
        turnaroundDays: form.turnaroundDays ? parseInt(form.turnaroundDays, 10) : undefined,
      };

      const res = await fetch(
        editingId ? `/api/admin/services/${editingId}` : '/api/admin/services',
        {
          credentials: 'include',
          method: editingId ? 'PUT' : 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(payload),
        }
      );

      if (res.status === 401) {
        router.replace('/auth/login');
        return;
      }

      const data = await parseApiResponse(res);

      if (!res.ok || !data?.success) {
        setError(data?.error || (editingId ? '更新服务失败' : '添加服务失败'));
        return;
      }

      setModalOpen(false);
      resetForm();
      fetchData();
    } catch (err) {
      console.error('Save service error:', err);
      setError(err instanceof Error ? err.message : editingId ? '更新服务失败' : '添加服务失败');
    } finally {
      setSaving(false);
    }
  };

  const toggleActive = async (id: string, isActive: boolean) => {
    try {
      setError('');

      const res = await fetch(`/api/admin/services/${id}`, {
        credentials: 'include',
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ isActive: !isActive }),
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
      console.error('Toggle service error:', err);
      setError(err instanceof Error ? err.message : '更新状态失败');
    } finally {
      setModalOpen(false);
    }
  };

  const handleDelete = async (id: string) => {
    const confirmed = window.confirm('确定要删除这个服务吗？此操作不可撤销。');
    if (!confirmed) return;

    try {
      setError('');

      const res = await fetch(`/api/admin/services/${id}`, {
        credentials: 'include',
        method: 'DELETE',
      });

      if (res.status === 401) {
        router.replace('/auth/login');
        return;
      }

      const data = await parseApiResponse(res);

      if (!res.ok) {
        setError(data?.error || '删除服务失败');
        return;
      }

      fetchData();
    } catch (err) {
      console.error('Delete service error:', err);
      setError(err instanceof Error ? err.message : '删除服务失败');
    } finally {
      setModalOpen(false);
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
          只有超级管理员可以访问服务管理
        </div>
      </AdminLayout>
    );
  }

  return (
    <AdminLayout>
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <h1 className="text-2xl font-bold text-gray-900">服务管理</h1>
          <Button onClick={openCreateModal}>
            <Plus className="h-4 w-4" />
            添加服务
          </Button>
        </div>

        {error && (
          <div className="rounded-lg border border-red-200 bg-red-50 p-4 text-red-600">
            {error}
          </div>
        )}

        <SearchInput
          placeholder="搜索服务..."
          onSearch={(v) => {
            setSearch(v);
            setPage(1);
          }}
          className="max-w-xs"
          size="sm"
        />

        {loading ? (
          <TableSkeleton rows={8} />
        ) : (
          <Card padding="none">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>名称</TableHead>
                  <TableHead>分类</TableHead>
                  <TableHead>价格</TableHead>
                  <TableHead>周期</TableHead>
                  <TableHead>状态</TableHead>
                  <TableHead>操作</TableHead>
                </TableRow>
              </TableHeader>

              <TableBody>
                {services.map((s) => (
                  <TableRow key={s.id}>
                    <TableCell>
                      <div>
                        <div className="font-medium text-gray-900">{s.nameZh}</div>
                        {s.shortDescZh ? (
                          <div className="mt-1 line-clamp-1 text-xs text-gray-500">
                            {s.shortDescZh}
                          </div>
                        ) : null}
                      </div>
                    </TableCell>

                    <TableCell className="text-sm">{s.category?.nameZh || '-'}</TableCell>

                    <TableCell className="text-sm">
                      {s.priceMin ? formatCurrency(Number(s.priceMin)) : '询价'}
                    </TableCell>

                    <TableCell className="text-sm">
                      {s.turnaroundDays ? `${s.turnaroundDays}天` : '-'}
                    </TableCell>

                    <TableCell>
                      <Badge variant={s.isActive ? 'success' : 'default'}>
                        {s.isActive ? '启用' : '停用'}
                      </Badge>
                    </TableCell>

                    <TableCell>
                      <div className="flex gap-1">
                        <button
                          type="button"
                          onClick={() => toggleActive(s.id, !!s.isActive)}
                          className="inline-flex items-center justify-center rounded-md p-1 hover:bg-gray-100"
                        >
                          {s.isActive ? (
                            <ToggleRight className="h-5 w-5 text-green-600" />
                          ) : (
                            <ToggleLeft className="h-5 w-5 text-gray-400" />
                          )}
                        </button>

                        <Button size="sm" variant="ghost" onClick={() => openEditModal(s)}>
                          <Edit className="h-4 w-4" />
                        </Button>

                        <Button size="sm" variant="ghost" onClick={() => handleDelete(s.id)}>
                          <Trash2 className="h-4 w-4 text-red-500" />
                        </Button>
                      </div>
                    </TableCell>
                  </TableRow>
                ))}

                {!services.length && (
                  <TableRow>
                    <TableCell colSpan={6} className="py-8 text-center text-gray-500">
                      暂无服务数据
                    </TableCell>
                  </TableRow>
                )}
              </TableBody>
            </Table>
          </Card>
        )}

        <Pagination currentPage={page} totalPages={totalPages} onPageChange={setPage} />
      </div>

      <Modal
        isOpen={modalOpen}
        onClose={() => {
          setModalOpen(false);
          resetForm();
        }}
        title={editingId ? '编辑服务' : '添加服务'}
        size="lg"
      >
        <div className="space-y-3">
          <Input
            label="服务名称 (中文)"
            required
            value={form.nameZh}
            onChange={(e) => setForm((p) => ({ ...p, nameZh: e.target.value }))}
          />

          <Input
            label="服务名称 (English)"
            value={form.nameEn}
            onChange={(e) => setForm((p) => ({ ...p, nameEn: e.target.value }))}
          />

          <Input
            label="简短描述"
            value={form.shortDescZh}
            onChange={(e) => setForm((p) => ({ ...p, shortDescZh: e.target.value }))}
          />

          <div>
            <label className="mb-1 block text-sm font-medium text-gray-700">
              服务分类 <span className="text-red-500">*</span>
            </label>
            <select
              className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm"
              value={form.categoryId}
              onChange={(e) => setForm((p) => ({ ...p, categoryId: e.target.value }))}
              disabled={categoriesLoading}
            >
              <option value="">请选择分类</option>
              {categories.map((cat) => (
                <option key={cat.id} value={cat.id}>
                  {cat.nameZh}
                </option>
              ))}
            </select>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <Input
              label="最低价格"
              type="number"
              value={form.priceMin}
              onChange={(e) => setForm((p) => ({ ...p, priceMin: e.target.value }))}
            />
            <Input
              label="检测周期 (天)"
              type="number"
              value={form.turnaroundDays}
              onChange={(e) => setForm((p) => ({ ...p, turnaroundDays: e.target.value }))}
            />
          </div>

          <div className="flex gap-3 pt-2">
            <Button onClick={handleSave} loading={saving}>
              {editingId ? '保存修改' : '保存'}
            </Button>

            <Button
              variant="outline"
              onClick={() => {
                setModalOpen(false);
                resetForm();
              }}
            >
              取消
            </Button>
          </div>
        </div>
      </Modal>
    </AdminLayout>
  );
}