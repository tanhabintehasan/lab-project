'use client';

import { useState, useEffect } from 'react';
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
import { formatCurrency, cn } from '@/lib/utils';
import { toast } from 'sonner';
import {
  useServices,
  useServiceCategories,
  useCreateService,
  useUpdateService,
  useToggleServiceActive,
  useDeleteService,
} from '@/hooks/useServices';

interface CustomField {
  id?: string;
  _tempId?: string;
  label: string;
  fieldType: 'TEXT' | 'NUMBER' | 'SELECT' | 'TEXTAREA';
  options?: string | null;
  isRequired: boolean;
  placeholder?: string | null;
  sortOrder: number;
}

interface ServiceItem {
  id: string;
  slug: string;
  nameZh: string;
  shortDescZh?: string;
  categoryId?: string;
  category?: {
    id?: string;
    nameZh?: string;
    slug?: string;
  };
  priceMin?: number | null;
  turnaroundDays?: number | null;
  sampleCount?: string | null;
  sampleSize?: string | null;
  sampleWeight?: string | null;
  sampleCondition?: string | null;
  samplePreservation?: string | null;
  samplePreparation?: string | null;
  customFields?: CustomField[];
  isActive?: boolean;
}

const initialForm = {
  id: '',
  nameZh: '',
  shortDescZh: '',
  categoryId: '',
  priceMin: '',
  turnaroundDays: '',
  sampleCount: '',
  sampleSize: '',
  sampleWeight: '',
  sampleCondition: '',
  samplePreservation: '',
  samplePreparation: '',
  customFields: [] as CustomField[],
};

export default function AdminServicesPage() {
  const router = useRouter();
  const { user } = useAuthStore();

  const [page, setPage] = useState(1);
  const [search, setSearch] = useState('');
  const [modalOpen, setModalOpen] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);
  const [form, setForm] = useState(initialForm);

  const {
    data: servicesData,
    isLoading: servicesLoading,
    isFetching: servicesFetching,
  } = useServices(page, search);

  const { data: categories, isLoading: categoriesLoading } = useServiceCategories();

  const createService = useCreateService();
  const updateService = useUpdateService(editingId || undefined);
  const toggleActive = useToggleServiceActive();
  const deleteService = useDeleteService();

  const services = servicesData?.data || [];
  const totalPages = servicesData?.totalPages || 1;

  // Auto-correct page if it exceeds totalPages after mutation/delete
  useEffect(() => {
    if (page > totalPages && totalPages > 0) {
      setPage(totalPages);
    }
  }, [page, totalPages]);

  useEffect(() => {
    if (!user) return;
    if (user.role !== 'SUPER_ADMIN') {
      router.replace('/admin/finance');
    }
  }, [user, router]);

  const resetForm = () => {
    setForm(initialForm);
    setEditingId(null);
  };

  const openCreateModal = () => {
    resetForm();
    setModalOpen(true);
  };

  const openEditModal = (service: ServiceItem) => {
    setEditingId(service.id);
    setForm({
      id: service.id,
      nameZh: service.nameZh || '',
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
      sampleCount: service.sampleCount || '',
      sampleSize: service.sampleSize || '',
      sampleWeight: service.sampleWeight || '',
      sampleCondition: service.sampleCondition || '',
      samplePreservation: service.samplePreservation || '',
      samplePreparation: service.samplePreparation || '',
      customFields: (service.customFields || []).map((f) => ({
        id: f.id,
        label: f.label,
        fieldType: f.fieldType as CustomField['fieldType'],
        options: f.options,
        isRequired: f.isRequired,
        placeholder: f.placeholder,
        sortOrder: f.sortOrder,
      })),
    });
    setModalOpen(true);
  };

  const handleSave = async () => {
    if (!form.nameZh.trim()) {
      toast.error('服务名称（中文）不能为空');
      return;
    }

    if (!form.categoryId.trim()) {
      toast.error('请选择服务分类');
      return;
    }

    try {
      setSaving(true);

      const payload = {
        nameZh: form.nameZh.trim(),
        shortDescZh: form.shortDescZh.trim() || undefined,
        categoryId: form.categoryId,
        priceMin: form.priceMin ? parseFloat(form.priceMin) : undefined,
        turnaroundDays: form.turnaroundDays ? parseInt(form.turnaroundDays, 10) : undefined,
        sampleCount: form.sampleCount.trim() || undefined,
        sampleSize: form.sampleSize.trim() || undefined,
        sampleWeight: form.sampleWeight.trim() || undefined,
        sampleCondition: form.sampleCondition.trim() || undefined,
        samplePreservation: form.samplePreservation.trim() || undefined,
        samplePreparation: form.samplePreparation.trim() || undefined,
        customFields: form.customFields.map((f) => ({
          label: f.label.trim(),
          fieldType: f.fieldType,
          options: f.options?.trim() || undefined,
          isRequired: f.isRequired,
          placeholder: f.placeholder?.trim() || undefined,
          sortOrder: f.sortOrder,
        })),
      };

      if (editingId) {
        await updateService.mutateAsync(payload);
        toast.success('服务更新成功');
      } else {
        await createService.mutateAsync(payload);
        toast.success('服务添加成功');
      }

      setModalOpen(false);
      resetForm();
    } catch (err: any) {
      console.error('Save service error:', err);
      toast.error(err?.data?.error || err?.message || (editingId ? '更新服务失败' : '添加服务失败'));
    } finally {
      setSaving(false);
    }
  };

  const handleToggleActive = async (id: string, isActive: boolean) => {
    try {
      await toggleActive.mutateAsync({ id, isActive: !isActive });
      toast.success('状态更新成功');
    } catch (err: any) {
      console.error('Toggle service error:', err);
      toast.error(err?.data?.error || err?.message || '更新状态失败');
    }
  };

  const handleDelete = async (id: string) => {
    const confirmed = window.confirm('确定要删除这个服务吗？此操作不可撤销。');
    if (!confirmed) return;

    try {
      await deleteService.mutateAsync(id);
      toast.success('服务删除成功');
    } catch (err: any) {
      console.error('Delete service error:', err);
      toast.error(err?.data?.error || err?.message || '删除服务失败');
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

        <SearchInput
          placeholder="搜索服务..."
          onSearch={(v) => {
            setSearch(v);
            setPage(1);
          }}
          className="max-w-xs"
          size="sm"
        />

        {servicesLoading ? (
          <TableSkeleton rows={8} />
        ) : (
          <div className="relative">
            <Card padding="none" className={cn(servicesFetching && 'opacity-60 transition-opacity')}>
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
                            onClick={() => handleToggleActive(s.id, !!s.isActive)}
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

                  {!services.length ? (
                    <TableRow>
                      <TableCell colSpan={6} className="py-8 text-center text-gray-500">
                        暂无服务数据
                      </TableCell>
                    </TableRow>
                  ) : null}
                </TableBody>
              </Table>
            </Card>

            {servicesFetching && (
              <div className="absolute inset-0 flex items-center justify-center bg-white/30">
                <div className="h-8 w-8 animate-spin rounded-full border-2 border-gray-300 border-t-blue-600" />
              </div>
            )}
          </div>
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
        loading={saving}
      >
        <div className="space-y-3">
          <Input
            label="服务名称"
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
              {categories?.map((cat) => (
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

          <div className="border-t border-gray-100 pt-3">
            <p className="mb-2 text-sm font-medium text-gray-700">样品要求</p>
            <div className="grid grid-cols-2 gap-3">
              <Input
                label="样品数量"
                value={form.sampleCount}
                onChange={(e) => setForm((p) => ({ ...p, sampleCount: e.target.value }))}
                placeholder="例如：≥3件"
              />
              <Input
                label="样品尺寸"
                value={form.sampleSize}
                onChange={(e) => setForm((p) => ({ ...p, sampleSize: e.target.value }))}
                placeholder="例如：10 mm × 10 mm"
              />
              <Input
                label="样品重量"
                value={form.sampleWeight}
                onChange={(e) => setForm((p) => ({ ...p, sampleWeight: e.target.value }))}
                placeholder="例如：≥50 g"
              />
              <Input
                label="样品状态/特性"
                value={form.sampleCondition}
                onChange={(e) => setForm((p) => ({ ...p, sampleCondition: e.target.value }))}
                placeholder="例如：干燥、密封"
              />
              <Input
                label="样品保存条件"
                value={form.samplePreservation}
                onChange={(e) => setForm((p) => ({ ...p, samplePreservation: e.target.value }))}
                placeholder="例如：常温/冷藏"
              />
              <Input
                label="样品制备要求"
                value={form.samplePreparation}
                onChange={(e) => setForm((p) => ({ ...p, samplePreparation: e.target.value }))}
                placeholder="例如：需抛光至镜面"
              />
            </div>
          </div>

          <div className="border-t border-gray-100 pt-3">
            <div className="mb-2 flex items-center justify-between">
              <p className="text-sm font-medium text-gray-700">自定义检测项</p>
              <Button
                variant="outline"
                size="sm"
                onClick={() =>
                  setForm((p) => ({
                    ...p,
                    customFields: [
                      ...p.customFields,
                      { _tempId: `tmp-${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 6)}`, label: '', fieldType: 'TEXT' as const, isRequired: false, sortOrder: p.customFields.length, placeholder: '' },
                    ],
                  }))
                }
              >
                <Plus className="mr-1 h-3 w-3" /> 添加检测项
              </Button>
            </div>
            {form.customFields.length === 0 ? (
              <p className="text-xs text-gray-400">暂无自定义检测项</p>
            ) : (
              <div className="space-y-3">
                {form.customFields.map((field, idx) => (
                  <div key={field.id || field._tempId || `field-${idx}`} className="rounded-xl border border-gray-200 p-3">
                    <div className="mb-2 grid grid-cols-2 gap-3">
                      <Input
                        label="名称"
                        value={field.label}
                        onChange={(e) =>
                          setForm((p) => ({
                            ...p,
                            customFields: p.customFields.map((f, i) =>
                              i === idx ? { ...f, label: e.target.value } : f
                            ),
                          }))
                        }
                        placeholder="例如：样品颜色"
                      />
                      <div>
                        <label className="mb-1 block text-sm font-medium text-gray-700">类型</label>
                        <select
                          className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm"
                          value={field.fieldType}
                          onChange={(e) =>
                            setForm((p) => ({
                              ...p,
                              customFields: p.customFields.map((f, i) =>
                                i === idx ? { ...f, fieldType: e.target.value as CustomField['fieldType'] } : f
                              ),
                            }))
                          }
                        >
                          <option value="TEXT">文本</option>
                          <option value="NUMBER">数字</option>
                          <option value="SELECT">下拉选择</option>
                          <option value="TEXTAREA">多行文本</option>
                        </select>
                      </div>
                      <Input
                        label="提示文字"
                        value={field.placeholder || ''}
                        onChange={(e) =>
                          setForm((p) => ({
                            ...p,
                            customFields: p.customFields.map((f, i) =>
                              i === idx ? { ...f, placeholder: e.target.value } : f
                            ),
                          }))
                        }
                        placeholder="输入框占位提示"
                      />
                      {field.fieldType === 'SELECT' ? (
                        <Input
                          label="选项（用逗号分隔）"
                          value={field.options || ''}
                          onChange={(e) =>
                            setForm((p) => ({
                              ...p,
                              customFields: p.customFields.map((f, i) =>
                                i === idx ? { ...f, options: e.target.value } : f
                              ),
                            }))
                          }
                          placeholder="例如：红色,蓝色,绿色"
                        />
                      ) : (
                        <div />
                      )}
                    </div>
                    <div className="flex items-center justify-between">
                      <label className="flex items-center gap-2 text-sm text-gray-700">
                        <input
                          type="checkbox"
                          checked={field.isRequired}
                          onChange={(e) =>
                            setForm((p) => ({
                              ...p,
                              customFields: p.customFields.map((f, i) =>
                                i === idx ? { ...f, isRequired: e.target.checked } : f
                              ),
                            }))
                          }
                          className="h-4 w-4 rounded border-gray-300"
                        />
                        必填
                      </label>
                      <div className="flex gap-2">
                        <Button
                          variant="ghost"
                          size="sm"
                          disabled={idx === 0}
                          onClick={() =>
                            setForm((p) => {
                              const arr = [...p.customFields];
                              [arr[idx - 1], arr[idx]] = [arr[idx], arr[idx - 1]];
                              return { ...p, customFields: arr.map((f, i) => ({ ...f, sortOrder: i })) };
                            })
                          }
                        >
                          ↑
                        </Button>
                        <Button
                          variant="ghost"
                          size="sm"
                          disabled={idx === form.customFields.length - 1}
                          onClick={() =>
                            setForm((p) => {
                              const arr = [...p.customFields];
                              [arr[idx], arr[idx + 1]] = [arr[idx + 1], arr[idx]];
                              return { ...p, customFields: arr.map((f, i) => ({ ...f, sortOrder: i })) };
                            })
                          }
                        >
                          ↓
                        </Button>
                        <Button
                          variant="ghost"
                          size="sm"
                          className="text-red-600"
                          onClick={() =>
                            setForm((p) => ({
                              ...p,
                              customFields: p.customFields.filter((_, i) => i !== idx).map((f, i) => ({ ...f, sortOrder: i })),
                            }))
                          }
                        >
                          <Trash2 className="h-3.5 w-3.5" />
                        </Button>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          <div className="flex gap-3 pt-2">
            <Button onClick={handleSave} loading={saving} disabled={saving}>
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
