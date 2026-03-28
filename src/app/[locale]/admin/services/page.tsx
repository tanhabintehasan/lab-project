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
  const [addModal, setAddModal] = useState(false);
  const [error, setError] = useState('');
  const [saving, setSaving] = useState(false);

  const [form, setForm] = useState({
    nameZh: '',
    nameEn: '',
    shortDescZh: '',
    categoryId: '',
    priceMin: '',
    turnaroundDays: '',
  });

  useEffect(() => {
    if (!user) return;

    if (user.role !== 'SUPER_ADMIN') {
      router.replace('/admin/finance');
    }
  }, [user, router]);

  const fetchCategories = useCallback(async () => {
    try {
      setCategoriesLoading(true);

      const res = await fetch('/api/service-categories?pageSize=100', {
        credentials: 'include',
        cache: 'no-store',
      });

      let d: any = null;
      try {
        d = await res.json();
      } catch {
        d = null;
      }

      setCategories(extractArray<ServiceCategory>(d));
    } catch (err) {
      console.error('Failed to fetch categories:', err);
      setCategories([]);
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

      let d: any = null;
      try {
        d = await res.json();
      } catch {
        d = null;
      }

      if (!res.ok) {
        setError(d?.error || '加载服务失败');
        setServices([]);
        setTotalPages(1);
        return;
      }

      setServices(extractArray<ServiceItem>(d));
      setTotalPages(extractTotalPages(d));
    } catch (err) {
      console.error('Failed to fetch services:', err);
      setError('加载服务失败');
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
    if (!addModal) return;
    fetchCategories();
  }, [addModal, fetchCategories]);

  const resetForm = () => {
    setForm({
      nameZh: '',
      nameEn: '',
      shortDescZh: '',
      categoryId: '',
      priceMin: '',
      turnaroundDays: '',
    });
  };

  const handleAdd = async () => {
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

      const res = await fetch('/api/admin/services', {
        credentials: 'include',
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });

      let d: any = null;
      try {
        d = await res.json();
      } catch {
        d = null;
      }

      if (res.status === 401) {
        router.replace('/auth/login');
        return;
      }

      if (!res.ok || !d?.success) {
        setError(d?.error || '添加服务失败');
        return;
      }

      setAddModal(false);
      resetForm();
      fetchData();
    } catch (err) {
      console.error('Add service error:', err);
      setError('添加服务失败');
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

      let d: any = null;
      try {
        d = await res.json();
      } catch {
        d = null;
      }

      if (res.status === 401) {
        router.replace('/auth/login');
        return;
      }

      if (!res.ok) {
        setError(d?.error || '更新状态失败');
        return;
      }

      fetchData();
    } catch (err) {
      console.error('Toggle service error:', err);
      setError('更新状态失败');
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

      let d: any = null;
      try {
        d = await res.json();
      } catch {
        d = null;
      }

      if (res.status === 401) {
        router.replace('/auth/login');
        return;
      }

      if (!res.ok) {
        setError(d?.error || '删除服务失败');
        return;
      }

      fetchData();
    } catch (err) {
      console.error('Delete service error:', err);
      setError('删除服务失败');
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
          <Button onClick={() => setAddModal(true)}>
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
                    <TableCell className="font-medium">{s.nameZh}</TableCell>
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
                        <button onClick={() => toggleActive(s.id, !!s.isActive)}>
                          {s.isActive ? (
                            <ToggleRight className="h-5 w-5 text-green-600" />
                          ) : (
                            <ToggleLeft className="h-5 w-5 text-gray-400" />
                          )}
                        </button>
                        <Button size="sm" variant="ghost">
                          <Edit className="h-4 w-4" />
                        </Button>
                        <Button
                          size="sm"
                          variant="ghost"
                          onClick={() => handleDelete(s.id)}
                        >
                          <Trash2 className="h-4 w-4 text-red-500" />
                        </Button>
                      </div>
                    </TableCell>
                  </TableRow>
                ))}

                {!services.length && (
                  <TableRow>
                    <TableCell colSpan={6} className="text-center text-gray-500 py-8">
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

      <Modal isOpen={addModal} onClose={() => setAddModal(false)} title="添加服务" size="lg">
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
            <label className="block text-sm font-medium text-gray-700 mb-1">
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
            <Button onClick={handleAdd} loading={saving}>
              保存
            </Button>
            <Button variant="outline" onClick={() => setAddModal(false)}>
              取消
            </Button>
          </div>
        </div>
      </Modal>
    </AdminLayout>
  );
}