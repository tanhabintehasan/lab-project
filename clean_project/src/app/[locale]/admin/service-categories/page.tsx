'use client';

import { useEffect, useMemo, useState } from 'react';
import { AdminLayout } from '@/components/layout/admin-layout';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';

type CategoryItem = {
  id: string;
  nameZh: string;
  nameEn?: string | null;
  slug: string;
  descZh?: string | null;
  icon?: string | null;
  sortOrder?: number;
  isActive: boolean;
  _count?: {
    services: number;
    children?: number;
  };
  parent?: {
    id: string;
    nameZh: string;
    slug: string;
  } | null;
};

type ApiResponse = {
  success?: boolean;
  data?: CategoryItem[];
  total?: number;
  totalPages?: number;
};

const initialForm = {
  nameZh: '',
  nameEn: '',
  slug: '',
  descZh: '',
  icon: '',
  sortOrder: 0,
  isActive: true,
};

function slugify(value: string) {
  return value
    .trim()
    .toLowerCase()
    .replace(/[^\w\u4e00-\u9fa5\s-]/g, '')
    .replace(/\s+/g, '-')
    .replace(/-+/g, '-');
}

export default function AdminServiceCategoriesPage() {
  const [categories, setCategories] = useState<CategoryItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [query, setQuery] = useState('');
  const [error, setError] = useState('');
  const [form, setForm] = useState(initialForm);

  const fetchCategories = async () => {
    try {
      setLoading(true);
      setError('');

      const res = await fetch(
        `/api/admin/service-categories?q=${encodeURIComponent(query)}&page=1&pageSize=100`,
        {
          credentials: 'include',
          cache: 'no-store',
        }
      );

      const data: ApiResponse & { error?: string } = await res.json();

      if (!res.ok || !data?.success) {
        setCategories([]);
        setError(data?.error || '获取分类列表失败');
        return;
      }

      setCategories(Array.isArray(data.data) ? data.data : []);
    } catch (error) {
      console.error('Fetch categories failed:', error);
      setCategories([]);
      setError('获取分类列表失败');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchCategories();
  }, [query]);

  const submitLabel = useMemo(() => (editingId ? '保存修改' : '新增分类'), [editingId]);

  const handleSubmit = async () => {
    try {
      setSaving(true);
      setError('');

      if (!form.nameZh.trim()) {
        setError('分类中文名不能为空');
        return;
      }

      if (!form.slug.trim()) {
        setError('slug 不能为空');
        return;
      }

      const payload = {
        ...form,
        nameZh: form.nameZh.trim(),
        nameEn: form.nameEn.trim() || null,
        slug: form.slug.trim().toLowerCase(),
        descZh: form.descZh.trim() || null,
        icon: form.icon.trim() || null,
        sortOrder: Number(form.sortOrder) || 0,
      };

      const res = await fetch(
        editingId
          ? `/api/admin/service-categories/${editingId}`
          : '/api/admin/service-categories',
        {
          method: editingId ? 'PATCH' : 'POST',
          credentials: 'include',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify(payload),
        }
      );

      const data = await res.json();

      if (!res.ok) {
        setError(data?.error || '保存失败');
        return;
      }

      setForm(initialForm);
      setEditingId(null);
      await fetchCategories();
    } catch (error) {
      console.error('Save category failed:', error);
      setError('保存失败');
    } finally {
      setSaving(false);
    }
  };

  const handleEdit = (item: CategoryItem) => {
    setEditingId(item.id);
    setError('');
    setForm({
      nameZh: item.nameZh || '',
      nameEn: item.nameEn || '',
      slug: item.slug || '',
      descZh: item.descZh || '',
      icon: item.icon || '',
      sortOrder: item.sortOrder || 0,
      isActive: item.isActive,
    });
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const handleDelete = async (id: string) => {
    const confirmed = window.confirm('确认删除该分类？删除后不可恢复。');
    if (!confirmed) return;

    try {
      setError('');

      const res = await fetch(`/api/admin/service-categories/${id}`, {
        method: 'DELETE',
        credentials: 'include',
      });

      const data = await res.json();

      if (!res.ok) {
        setError(data?.error || '删除失败');
        return;
      }

      await fetchCategories();
    } catch (error) {
      console.error('Delete category failed:', error);
      setError('删除失败');
    }
  };

  const handleReset = () => {
    setEditingId(null);
    setError('');
    setForm(initialForm);
  };

  return (
    <AdminLayout>
      <div className="space-y-6">
        <div className="flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
          <div>
            <h1 className="text-2xl font-bold text-gray-900">服务分类管理</h1>
            <p className="mt-1 text-sm text-gray-500">维护分类入口，并为服务提供归属分类</p>
          </div>

          <div className="flex gap-2">
            <input
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="搜索分类名称 / slug"
              className="w-64 rounded-xl border border-gray-200 px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
            <Button variant="outline" onClick={fetchCategories}>
              刷新
            </Button>
          </div>
        </div>

        <Card padding="lg">
          <h2 className="mb-4 text-lg font-semibold text-gray-900">
            {editingId ? '编辑分类' : '新增分类'}
          </h2>

          {error ? (
            <div className="mb-4 rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
              {error}
            </div>
          ) : null}

          <div className="grid gap-4 md:grid-cols-2">
            <input
              value={form.nameZh}
              onChange={(e) => {
                const value = e.target.value;
                setForm((s) => ({
                  ...s,
                  nameZh: value,
                  slug: editingId ? s.slug : slugify(value),
                }));
              }}
              placeholder="分类中文名"
              className="rounded-xl border border-gray-200 px-4 py-3 text-sm"
            />

            <input
              value={form.nameEn}
              onChange={(e) => setForm((s) => ({ ...s, nameEn: e.target.value }))}
              placeholder="分类英文名"
              className="rounded-xl border border-gray-200 px-4 py-3 text-sm"
            />

            <input
              value={form.slug}
              onChange={(e) => setForm((s) => ({ ...s, slug: slugify(e.target.value) }))}
              placeholder="slug"
              className="rounded-xl border border-gray-200 px-4 py-3 text-sm"
            />

            <input
              value={form.icon}
              onChange={(e) => setForm((s) => ({ ...s, icon: e.target.value }))}
              placeholder="图标，可填 emoji，如 🔬"
              className="rounded-xl border border-gray-200 px-4 py-3 text-sm"
            />

            <input
              value={form.sortOrder}
              onChange={(e) => setForm((s) => ({ ...s, sortOrder: Number(e.target.value) }))}
              placeholder="排序"
              type="number"
              className="rounded-xl border border-gray-200 px-4 py-3 text-sm"
            />

            <label className="flex items-center gap-2 rounded-xl border border-gray-200 px-4 py-3 text-sm text-gray-700">
              <input
                type="checkbox"
                checked={form.isActive}
                onChange={(e) => setForm((s) => ({ ...s, isActive: e.target.checked }))}
              />
              启用分类
            </label>
          </div>

          <textarea
            value={form.descZh}
            onChange={(e) => setForm((s) => ({ ...s, descZh: e.target.value }))}
            placeholder="分类描述"
            className="mt-4 min-h-[100px] w-full rounded-xl border border-gray-200 px-4 py-3 text-sm"
          />

          <div className="mt-4 flex gap-3">
            <Button onClick={handleSubmit} loading={saving}>
              {submitLabel}
            </Button>
            <Button variant="outline" onClick={handleReset}>
              重置
            </Button>
          </div>
        </Card>

        <div className="grid gap-4">
          {loading ? (
            <div className="rounded-2xl border border-gray-200 bg-white p-6 text-sm text-gray-500">
              加载中...
            </div>
          ) : categories.length === 0 ? (
            <div className="rounded-2xl border border-gray-200 bg-white p-6 text-sm text-gray-500">
              暂无分类
            </div>
          ) : (
            categories.map((item) => (
              <Card key={item.id} padding="lg">
                <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
                  <div className="min-w-0">
                    <div className="flex items-center gap-3">
                      <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-blue-50 text-2xl">
                        {item.icon || '📁'}
                      </div>
                      <div>
                        <div className="flex items-center gap-2 flex-wrap">
                          <h3 className="text-lg font-semibold text-gray-900">{item.nameZh}</h3>
                          <span
                            className={`rounded-full px-2.5 py-1 text-xs font-medium ${
                              item.isActive
                                ? 'bg-green-50 text-green-700'
                                : 'bg-gray-100 text-gray-500'
                            }`}
                          >
                            {item.isActive ? '启用中' : '已停用'}
                          </span>
                        </div>
                        <p className="text-sm text-gray-500">
                          slug: {item.slug} · 服务数: {item._count?.services ?? 0}
                          {typeof item._count?.children === 'number'
                            ? ` · 子分类: ${item._count.children}`
                            : ''}
                        </p>
                      </div>
                    </div>

                    {item.descZh ? (
                      <p className="mt-3 text-sm text-gray-600">{item.descZh}</p>
                    ) : null}
                  </div>

                  <div className="flex gap-2">
                    <Button variant="outline" onClick={() => handleEdit(item)}>
                      编辑
                    </Button>
                    <Button variant="outline" onClick={() => handleDelete(item.id)}>
                      删除
                    </Button>
                  </div>
                </div>
              </Card>
            ))
          )}
        </div>
      </div>
    </AdminLayout>
  );
}