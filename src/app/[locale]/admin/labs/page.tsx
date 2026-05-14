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
import { formatDate } from '@/lib/utils';

interface LabItem {
  id: string;
  slug: string;
  nameZh: string;
  // nameEn removed - Chinese only
  shortDescZh?: string;
  fullDescZh?: string;
  city?: string;
  address?: string;
  province?: string;
  phone?: string;
  email?: string;
  imageUrl?: string | null;
  status: 'PENDING' | 'ACTIVE' | 'SUSPENDED' | 'INACTIVE';
  createdAt: string;
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

const statusLabelMap: Record<string, string> = {
  PENDING: '待审核',
  ACTIVE: '启用',
  SUSPENDED: '暂停',
  INACTIVE: '停用',
};

const initialForm = {
  nameZh: '',
  shortDescZh: '',
  fullDescZh: '',
  city: '',
  address: '',
  province: '',
  phone: '',
  email: '',
  status: 'PENDING' as LabItem['status'],
  imageUrl: '',
};

export default function AdminLabsPage() {
  const router = useRouter();
  const { user } = useAuthStore();

  const [items, setItems] = useState<LabItem[]>([]);
  const [loading, setLoading] = useState(true);
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

  const fetchData = useCallback(async () => {
    try {
      setLoading(true);
      setError('');
      const params = new URLSearchParams({ page: String(page), pageSize: '15' });
      if (search) params.set('q', search);

      const res = await fetch(`/api/admin/labs?${params.toString()}`, {
        credentials: 'include',
        cache: 'no-store',
      });

      if (res.status === 401) {
        router.replace('/auth/login');
        return;
      }
      if (res.status === 403) {
        setError('您没有权限访问实验室管理');
        setItems([]);
        setTotalPages(1);
        return;
      }

      const data = await parseApiResponse(res);
      if (!res.ok) {
        setError(data?.error || '加载实验室失败');
        setItems([]);
        setTotalPages(1);
        return;
      }

      setItems(extractArray<LabItem>(data));
      setTotalPages(extractTotalPages(data));
    } catch (err) {
      setError(err instanceof Error ? err.message : '加载实验室失败');
      setItems([]);
      setTotalPages(1);
    } finally {
      setLoading(false);
    }
  }, [page, search, router]);

  useEffect(() => {
    if (!user || user.role !== 'SUPER_ADMIN') return;
    fetchData();
  }, [fetchData, user]);

  const resetForm = () => {
    setForm(initialForm);
    setEditingId(null);
  };

  const openCreateModal = () => {
    resetForm();
    setError('');
    setModalOpen(true);
  };

  const openEditModal = async (lab: LabItem) => {
    setEditingId(lab.id);
    setError('');
    let fullLab = lab;
    try {
      const res = await fetch(`/api/admin/labs/${lab.id}`, { credentials: 'include', cache: 'no-store' });
      if (res.ok) {
        const data = await parseApiResponse(res);
        if (data?.success && data.data) {
          fullLab = data.data as LabItem;
        }
      }
    } catch {}
    setForm({
      nameZh: fullLab.nameZh || '',
      // nameEn removed - Chinese only
      shortDescZh: fullLab.shortDescZh || '',
      fullDescZh: fullLab.fullDescZh || '',
      city: fullLab.city || '',
      address: fullLab.address || '',
      province: fullLab.province || '',
      phone: fullLab.phone || '',
      email: fullLab.email || '',
      status: fullLab.status || 'PENDING',
      imageUrl: fullLab.imageUrl || '',
    });
    setModalOpen(true);
  };

  const handleSave = async () => {
    if (!form.nameZh.trim()) {
      setError('实验室名称（中文）不能为空');
      return;
    }

    try {
      setSaving(true);
      setError('');

      const payload = {
        nameZh: form.nameZh.trim(),
        shortDescZh: form.shortDescZh.trim() || undefined,
        fullDescZh: form.fullDescZh.trim() || undefined,
        city: form.city.trim() || undefined,
        address: form.address.trim() || undefined,
        province: form.province.trim() || undefined,
        phone: form.phone.trim() || undefined,
        email: form.email.trim() || undefined,
        status: form.status,
        imageUrl: form.imageUrl.trim() || null,
      };

      const res = await fetch(
        editingId ? `/api/admin/labs/${editingId}` : '/api/admin/labs',
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
        setError(data?.error || (editingId ? '更新实验室失败' : '添加实验室失败'));
        return;
      }

      setModalOpen(false);
      resetForm();
      fetchData();
    } catch (err) {
      setError(err instanceof Error ? err.message : editingId ? '更新实验室失败' : '添加实验室失败');
    } finally {
      setSaving(false);
    }
  };

  const toggleStatus = async (id: string, currentStatus: LabItem['status']) => {
    const nextStatus = currentStatus === 'ACTIVE' ? 'INACTIVE' : 'ACTIVE';
    try {
      setError('');
      const res = await fetch(`/api/admin/labs/${id}`, {
        credentials: 'include',
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status: nextStatus }),
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
    }
  };

  const handleDelete = async (id: string) => {
    const confirmed = window.confirm('确定要删除这个实验室吗？此操作不可撤销。');
    if (!confirmed) return;

    try {
      setError('');
      const res = await fetch(`/api/admin/labs/${id}`, {
        credentials: 'include',
        method: 'DELETE',
      });

      if (res.status === 401) {
        router.replace('/auth/login');
        return;
      }

      const data = await parseApiResponse(res);
      if (!res.ok) {
        setError(data?.error || '删除实验室失败');
        return;
      }

      fetchData();
    } catch (err) {
      setError(err instanceof Error ? err.message : '删除实验室失败');
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
          只有超级管理员可以访问实验室管理
        </div>
      </AdminLayout>
    );
  }

  return (
    <AdminLayout>
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <h1 className="text-2xl font-bold text-gray-900">实验室管理</h1>
          <Button onClick={openCreateModal}>
            <Plus className="h-4 w-4" />
            添加实验室
          </Button>
        </div>

        {error && (
          <div className="rounded-lg border border-red-200 bg-red-50 p-4 text-red-600">
            {error}
          </div>
        )}

        <SearchInput
          placeholder="搜索实验室..."
          onSearch={(v) => { setSearch(v); setPage(1); }}
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
                  <TableHead>城市</TableHead>
                  <TableHead>状态</TableHead>
                  <TableHead>创建时间</TableHead>
                  <TableHead>操作</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {items.map((item) => (
                  <TableRow key={item.id}>
                    <TableCell>
                      <div>
                        <div className="font-medium text-gray-900">{item.nameZh}</div>
                        {item.shortDescZh ? (
                          <div className="mt-1 line-clamp-1 text-xs text-gray-500">{item.shortDescZh}</div>
                        ) : null}
                      </div>
                    </TableCell>
                    <TableCell className="text-sm">{item.city || '-'}</TableCell>
                    <TableCell>
                      <Badge variant={item.status === 'ACTIVE' ? 'success' : 'default'}>
                        {statusLabelMap[item.status] || item.status}
                      </Badge>
                    </TableCell>
                    <TableCell className="text-sm text-gray-500">{formatDate(item.createdAt)}</TableCell>
                    <TableCell>
                      <div className="flex gap-1">
                        <button
                          type="button"
                          onClick={() => toggleStatus(item.id, item.status)}
                          className="inline-flex items-center justify-center rounded-md p-1 hover:bg-gray-100"
                        >
                          {item.status === 'ACTIVE' ? (
                            <ToggleRight className="h-5 w-5 text-green-600" />
                          ) : (
                            <ToggleLeft className="h-5 w-5 text-gray-400" />
                          )}
                        </button>
                        <Button size="sm" variant="ghost" onClick={() => openEditModal(item)}>
                          <Edit className="h-4 w-4" />
                        </Button>
                        <Button size="sm" variant="ghost" onClick={() => handleDelete(item.id)}>
                          <Trash2 className="h-4 w-4 text-red-500" />
                        </Button>
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
                {!items.length && (
                  <TableRow>
                    <TableCell colSpan={5} className="py-8 text-center text-gray-500">
                      暂无实验室数据
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
        onClose={() => { setModalOpen(false); resetForm(); }}
        title={editingId ? '编辑实验室' : '添加实验室'}
        size="lg"
      >
        <div className="space-y-3">
          <Input
            label="实验室名称"
            required
            value={form.nameZh}
            onChange={(e) => setForm((p) => ({ ...p, nameZh: e.target.value }))}
          />
          <Input
            label="简短描述"
            value={form.shortDescZh}
            onChange={(e) => setForm((p) => ({ ...p, shortDescZh: e.target.value }))}
          />
          <div>
            <label className="mb-1 block text-sm font-medium text-gray-700">详细介绍</label>
            <textarea
              className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm min-h-[80px]"
              value={form.fullDescZh}
              onChange={(e) => setForm((p) => ({ ...p, fullDescZh: e.target.value }))}
            />
          </div>
          <div className="grid grid-cols-2 gap-3">
            <Input
              label="城市"
              value={form.city}
              onChange={(e) => setForm((p) => ({ ...p, city: e.target.value }))}
            />
            <Input
              label="省份"
              value={form.province}
              onChange={(e) => setForm((p) => ({ ...p, province: e.target.value }))}
            />
          </div>
          <Input
            label="详细地址"
            value={form.address}
            onChange={(e) => setForm((p) => ({ ...p, address: e.target.value }))}
          />
          <div className="grid grid-cols-2 gap-3">
            <Input
              label="联系电话"
              value={form.phone}
              onChange={(e) => setForm((p) => ({ ...p, phone: e.target.value }))}
            />
            <Input
              label="邮箱"
              type="email"
              value={form.email}
              onChange={(e) => setForm((p) => ({ ...p, email: e.target.value }))}
            />
          </div>
          <div>
            <label className="mb-1 block text-sm font-medium text-gray-700">状态</label>
            <select
              className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm"
              value={form.status}
              onChange={(e) => setForm((p) => ({ ...p, status: e.target.value as LabItem['status'] }))}
            >
              <option value="PENDING">待审核</option>
              <option value="ACTIVE">启用</option>
              <option value="SUSPENDED">暂停</option>
              <option value="INACTIVE">停用</option>
            </select>
          </div>

          {/* Dual-mode image upload */}
          <div className="rounded-lg border border-gray-200 p-4 space-y-3">
            <label className="block text-sm font-medium text-gray-700">实验室图片</label>
            <div className="flex gap-2">
              <input
                type="text"
                placeholder="https://example.com/lab.jpg"
                value={form.imageUrl}
                onChange={(e) => setForm((p) => ({ ...p, imageUrl: e.target.value }))}
                className="flex-1 rounded-lg border border-gray-300 px-3 py-2 text-sm"
              />
              {form.imageUrl && (
                <button
                  type="button"
                  onClick={() => setForm((p) => ({ ...p, imageUrl: '' }))}
                  className="rounded-lg border border-gray-300 px-3 py-2 text-sm text-gray-500 hover:text-red-500 transition"
                >
                  清除
                </button>
              )}
            </div>
            <input
              type="file"
              accept="image/*"
              onChange={async (e) => {
                const file = e.target.files?.[0];
                if (!file) return;
                try {
                  setSaving(true);
                  const uploadForm = new FormData();
                  uploadForm.append('file', file);
                  uploadForm.append('folder', 'lab-media');
                  uploadForm.append('entityType', 'LAB');
                  const res = await fetch('/api/admin/upload', {
                    method: 'POST',
                    credentials: 'include',
                    body: uploadForm,
                  });
                  const data = await res.json();
                  if (res.ok && data?.success && data.data?.url) {
                    setForm((p) => ({ ...p, imageUrl: data.data.url }));
                  } else {
                    setError(data?.error || '上传图片失败');
                  }
                } catch {
                  setError('上传图片失败');
                } finally {
                  setSaving(false);
                  e.target.value = '';
                }
              }}
              className="block w-full text-sm text-gray-500 file:mr-4 file:rounded-lg file:border-0 file:bg-blue-50 file:px-4 file:py-2 file:text-sm file:font-medium file:text-blue-700 hover:file:bg-blue-100"
            />
            {form.imageUrl && (
              <div className="relative h-32 w-full overflow-hidden rounded-lg border border-gray-200 bg-gray-50">
                <img
                  src={form.imageUrl}
                  alt="Preview"
                  className="h-full w-full object-contain"
                  onError={(e) => { (e.target as HTMLImageElement).style.display = 'none'; }}
                />
              </div>
            )}
          </div>

          <div className="flex gap-3 pt-2">
            <Button onClick={handleSave} loading={saving}>
              {editingId ? '保存修改' : '保存'}
            </Button>
            <Button variant="outline" onClick={() => { setModalOpen(false); resetForm(); }}>
              取消
            </Button>
          </div>
        </div>
      </Modal>
    </AdminLayout>
  );
}
