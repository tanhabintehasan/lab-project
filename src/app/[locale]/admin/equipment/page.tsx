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

interface LabOption {
  id: string;
  nameZh: string;
}

interface EquipmentItem {
  id: string;
  slug: string;
  nameZh: string;
  // nameEn removed - Chinese only
  model?: string;
  manufacturer?: string;
  labId?: string | null;
  lab?: LabOption | null;
  status: 'AVAILABLE' | 'IN_USE' | 'MAINTENANCE' | 'UNAVAILABLE';
  bookable: boolean;
  quantity: number;
  hourlyRate?: string | number | null;
  dailyRate?: string | number | null;
  imageUrl?: string | null;
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
  AVAILABLE: '可预约',
  IN_USE: '使用中',
  MAINTENANCE: '维护中',
  UNAVAILABLE: '不可用',
};

const initialForm = {
  nameZh: '',
  model: '',
  manufacturer: '',
  labId: '',
  descZh: '',
  status: 'AVAILABLE' as EquipmentItem['status'],
  bookable: false,
  quantity: '1',
  hourlyRate: '',
  dailyRate: '',
  imageUrl: '',
};

export default function AdminEquipmentPage() {
  const router = useRouter();
  const { user } = useAuthStore();

  const [items, setItems] = useState<EquipmentItem[]>([]);
  const [labs, setLabs] = useState<LabOption[]>([]);
  const [loading, setLoading] = useState(true);
  const [labsLoading, setLabsLoading] = useState(false);
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

  const fetchLabs = useCallback(async () => {
    try {
      setLabsLoading(true);
      const res = await fetch('/api/admin/labs?page=1&pageSize=200', {
        credentials: 'include',
        cache: 'no-store',
      });
      if (!res.ok) {
        setLabs([]);
        return;
      }
      const data = await parseApiResponse(res);
      setLabs(extractArray<LabOption>(data));
    } catch {
      setLabs([]);
    } finally {
      setLabsLoading(false);
    }
  }, []);

  const fetchData = useCallback(async () => {
    try {
      setLoading(true);
      setError('');
      const params = new URLSearchParams({ page: String(page), pageSize: '15' });
      if (search) params.set('q', search);

      const res = await fetch(`/api/admin/equipment?${params.toString()}`, {
        credentials: 'include',
        cache: 'no-store',
      });

      if (res.status === 401) {
        router.replace('/auth/login');
        return;
      }
      if (res.status === 403) {
        setError('您没有权限访问设备管理');
        setItems([]);
        setTotalPages(1);
        return;
      }

      const data = await parseApiResponse(res);
      if (!res.ok) {
        setError(data?.error || '加载设备失败');
        setItems([]);
        setTotalPages(1);
        return;
      }

      setItems(extractArray<EquipmentItem>(data));
      setTotalPages(extractTotalPages(data));
    } catch (err) {
      setError(err instanceof Error ? err.message : '加载设备失败');
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

  useEffect(() => {
    if (!modalOpen) return;
    fetchLabs();
  }, [modalOpen, fetchLabs]);

  const resetForm = () => {
    setForm(initialForm);
    setEditingId(null);
  };

  const openCreateModal = () => {
    resetForm();
    setError('');
    setModalOpen(true);
  };

  const openEditModal = async (eq: EquipmentItem) => {
    setEditingId(eq.id);
    setError('');
    let fullEq = eq;
    try {
      const res = await fetch(`/api/admin/equipment/${eq.id}`, { credentials: 'include', cache: 'no-store' });
      if (res.ok) {
        const data = await parseApiResponse(res);
        if (data?.success && data.data) {
          fullEq = data.data as EquipmentItem;
        }
      }
    } catch {}
    // Extract image URL from images JSON (stored as { urls: [...] })
    let imageUrl = '';
    if ((fullEq as any).images) {
      try {
        const imgData = typeof (fullEq as any).images === 'string'
          ? JSON.parse((fullEq as any).images)
          : (fullEq as any).images;
        if (imgData?.urls?.length > 0) imageUrl = imgData.urls[0];
      } catch { /* ignore */ }
    }
    setForm({
      nameZh: fullEq.nameZh || '',
      // nameEn removed - Chinese only
      model: fullEq.model || '',
      manufacturer: fullEq.manufacturer || '',
      labId: fullEq.labId || fullEq.lab?.id || '',
      descZh: (fullEq as any).descZh || '',
      status: fullEq.status || 'AVAILABLE',
      bookable: fullEq.bookable ?? false,
      quantity: String(fullEq.quantity ?? 1),
      hourlyRate: fullEq.hourlyRate !== undefined && fullEq.hourlyRate !== null ? String(fullEq.hourlyRate) : '',
      dailyRate: fullEq.dailyRate !== undefined && fullEq.dailyRate !== null ? String(fullEq.dailyRate) : '',
      imageUrl,
    });
    setModalOpen(true);
  };

  const handleSave = async () => {
    if (!form.nameZh.trim()) {
      setError('设备名称（中文）不能为空');
      return;
    }

    const quantityNum = parseInt(form.quantity, 10);
    if (Number.isNaN(quantityNum) || quantityNum < 1) {
      setError('数量必须大于等于 1');
      return;
    }

    try {
      setSaving(true);
      setError('');

      const payload: Record<string, unknown> = {
        nameZh: form.nameZh.trim(),
        model: form.model.trim() || undefined,
        manufacturer: form.manufacturer.trim() || undefined,
        labId: form.labId || undefined,
        descZh: form.descZh.trim() || undefined,
        status: form.status,
        bookable: form.bookable,
        quantity: quantityNum,
        hourlyRate: form.hourlyRate ? parseFloat(form.hourlyRate) : undefined,
        dailyRate: form.dailyRate ? parseFloat(form.dailyRate) : undefined,
        imageUrl: form.imageUrl.trim() || null,
      };

      const res = await fetch(
        editingId ? `/api/admin/equipment/${editingId}` : '/api/admin/equipment',
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
        setError(data?.error || (editingId ? '更新设备失败' : '添加设备失败'));
        return;
      }

      setModalOpen(false);
      resetForm();
      fetchData();
    } catch (err) {
      setError(err instanceof Error ? err.message : editingId ? '更新设备失败' : '添加设备失败');
    } finally {
      setSaving(false);
    }
  };

  const toggleBookable = async (id: string, bookable: boolean) => {
    try {
      setError('');
      const res = await fetch(`/api/admin/equipment/${id}`, {
        credentials: 'include',
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ bookable: !bookable }),
      });

      if (res.status === 401) {
        router.replace('/auth/login');
        return;
      }

      const data = await parseApiResponse(res);
      if (!res.ok) {
        setError(data?.error || '更新预约状态失败');
        return;
      }

      fetchData();
    } catch (err) {
      setError(err instanceof Error ? err.message : '更新预约状态失败');
    }
  };

  const handleDelete = async (id: string) => {
    const confirmed = window.confirm('确定要删除这个设备吗？此操作不可撤销。');
    if (!confirmed) return;

    try {
      setError('');
      const res = await fetch(`/api/admin/equipment/${id}`, {
        credentials: 'include',
        method: 'DELETE',
      });

      if (res.status === 401) {
        router.replace('/auth/login');
        return;
      }

      const data = await parseApiResponse(res);
      if (!res.ok) {
        setError(data?.error || '删除设备失败');
        return;
      }

      fetchData();
    } catch (err) {
      setError(err instanceof Error ? err.message : '删除设备失败');
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
          只有超级管理员可以访问设备管理
        </div>
      </AdminLayout>
    );
  }

  return (
    <AdminLayout>
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <h1 className="text-2xl font-bold text-gray-900">设备管理</h1>
          <Button onClick={openCreateModal}>
            <Plus className="h-4 w-4" />
            添加设备
          </Button>
        </div>

        {error && (
          <div className="rounded-lg border border-red-200 bg-red-50 p-4 text-red-600">
            {error}
          </div>
        )}

        <SearchInput
          placeholder="搜索设备..."
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
                  <TableHead>设备</TableHead>
                  <TableHead>所属实验室</TableHead>
                  <TableHead>状态</TableHead>
                  <TableHead>数量</TableHead>
                  <TableHead>可预约</TableHead>
                  <TableHead>创建时间</TableHead>
                  <TableHead>操作</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {items.map((item) => (
                  <TableRow key={item.id}>
                    <TableCell>
                      <div className="flex items-center gap-3">
                        <div className="h-10 w-10 rounded-lg bg-gray-100 flex-shrink-0 overflow-hidden">
                          {item.imageUrl ? (
                            <img
                              src={item.imageUrl}
                              alt={item.nameZh}
                              className="h-full w-full object-cover"
                            />
                          ) : (
                            <div className="h-full w-full flex items-center justify-center text-gray-300 text-xs">无图</div>
                          )}
                        </div>
                        <div>
                          <div className="font-medium text-gray-900">{item.nameZh}</div>
                          {item.model ? (
                            <div className="mt-0.5 line-clamp-1 text-xs text-gray-500">型号: {item.model}</div>
                          ) : null}
                        </div>
                      </div>
                    </TableCell>
                    <TableCell className="text-sm">{item.lab?.nameZh || '-'}</TableCell>
                    <TableCell>
                      <Badge variant={item.status === 'AVAILABLE' ? 'success' : item.status === 'MAINTENANCE' ? 'danger' : 'warning'}>
                        {statusLabelMap[item.status] || item.status}
                      </Badge>
                    </TableCell>
                    <TableCell className="text-sm">{item.quantity}</TableCell>
                    <TableCell>
                      <button
                        type="button"
                        onClick={() => toggleBookable(item.id, item.bookable)}
                        className="inline-flex items-center justify-center rounded-md p-1 hover:bg-gray-100"
                      >
                        {item.bookable ? (
                          <ToggleRight className="h-5 w-5 text-green-600" />
                        ) : (
                          <ToggleLeft className="h-5 w-5 text-gray-400" />
                        )}
                      </button>
                    </TableCell>
                    <TableCell className="text-sm text-gray-500">{formatDate(item.createdAt)}</TableCell>
                    <TableCell>
                      <div className="flex gap-1">
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
                    <TableCell colSpan={7} className="py-8 text-center text-gray-500">
                      暂无设备数据
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
        title={editingId ? '编辑设备' : '添加设备'}
        size="lg"
      >
        <div className="space-y-3">
          <Input
            label="设备名称"
            required
            value={form.nameZh}
            onChange={(e) => setForm((p) => ({ ...p, nameZh: e.target.value }))}
          />
          <div className="grid grid-cols-2 gap-3">
            <Input
              label="型号"
              value={form.model}
              onChange={(e) => setForm((p) => ({ ...p, model: e.target.value }))}
            />
            <Input
              label="制造商"
              value={form.manufacturer}
              onChange={(e) => setForm((p) => ({ ...p, manufacturer: e.target.value }))}
            />
          </div>
          <div>
            <label className="mb-1 block text-sm font-medium text-gray-700">
              所属实验室
            </label>
            <select
              className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm"
              value={form.labId}
              onChange={(e) => setForm((p) => ({ ...p, labId: e.target.value }))}
              disabled={labsLoading}
            >
              <option value="">请选择实验室</option>
              {labs.map((lab) => (
                <option key={lab.id} value={lab.id}>{lab.nameZh}</option>
              ))}
            </select>
          </div>
          <div>
            <label className="mb-1 block text-sm font-medium text-gray-700">设备描述</label>
            <textarea
              className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm min-h-[80px]"
              value={form.descZh}
              onChange={(e) => setForm((p) => ({ ...p, descZh: e.target.value }))}
            />
          </div>

          {/* Dual-mode image upload */}
          <div className="rounded-lg border border-gray-200 p-4 space-y-3">
            <label className="block text-sm font-medium text-gray-700">设备图片</label>

            {/* URL input */}
            <div>
              <label className="mb-1 block text-xs text-gray-500">图片链接</label>
              <div className="flex gap-2">
                <input
                  type="text"
                  placeholder="https://example.com/image.jpg"
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
            </div>

            {/* File upload */}
            <div>
              <label className="mb-1 block text-xs text-gray-500">或上传文件</label>
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
                    uploadForm.append('folder', 'equipment');
                    uploadForm.append('entityType', 'EQUIPMENT');
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
            </div>

            {/* Preview */}
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

          <div className="grid grid-cols-3 gap-3">
            <div>
              <label className="mb-1 block text-sm font-medium text-gray-700">状态</label>
              <select
                className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm"
                value={form.status}
                onChange={(e) => setForm((p) => ({ ...p, status: e.target.value as EquipmentItem['status'] }))}
              >
                <option value="AVAILABLE">可预约</option>
                <option value="IN_USE">使用中</option>
                <option value="MAINTENANCE">维护中</option>
                <option value="UNAVAILABLE">不可用</option>
              </select>
            </div>
            <Input
              label="数量"
              type="number"
              min={1}
              value={form.quantity}
              onChange={(e) => setForm((p) => ({ ...p, quantity: e.target.value }))}
            />
            <div className="flex items-center gap-2 pt-6">
              <input
                id="bookable"
                type="checkbox"
                className="h-4 w-4 rounded border-gray-300 text-blue-600"
                checked={form.bookable}
                onChange={(e) => setForm((p) => ({ ...p, bookable: e.target.checked }))}
              />
              <label htmlFor="bookable" className="text-sm text-gray-700">允许预约</label>
            </div>
          </div>
          <div className="grid grid-cols-2 gap-3">
            <Input
              label="每小时价格 (¥)"
              type="number"
              min={0}
              step="0.01"
              value={form.hourlyRate}
              onChange={(e) => setForm((p) => ({ ...p, hourlyRate: e.target.value }))}
            />
            <Input
              label="每天价格 (¥)"
              type="number"
              min={0}
              step="0.01"
              value={form.dailyRate}
              onChange={(e) => setForm((p) => ({ ...p, dailyRate: e.target.value }))}
            />
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
