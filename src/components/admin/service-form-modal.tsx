'use client';

import { useState, useEffect, useCallback } from 'react';
import { Modal } from '@/components/ui/modal';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { ServiceCustomFieldsEditor, CustomField } from './service-custom-fields-editor';
import type { Service, ServiceCreateInput, ServiceUpdateInput } from '@/services/api/admin/services';
import { Upload, X, AlertTriangle } from 'lucide-react';

interface ServiceFormModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: (payload: ServiceCreateInput | ServiceUpdateInput) => void;
  isSaving?: boolean;
  editingId?: string | null;
  initialData?: Service | null;
  categories: { id: string; name: { zh: string }; slug: string }[];
  laboratories?: { id: string; nameZh: string; slug: string }[];
  onUploadMedia?: (file: File, caption?: string) => Promise<void>;
  onDeleteMedia?: (mediaId: string) => Promise<void>;
  isUploadingMedia?: boolean;
}

const emptyForm = {
  nameZh: '',
  nameEn: '',
  shortDescZh: '',
  shortDescEn: '',
  categoryId: '',
  fullDescZh: '',
  fullDescEn: '',
  pricingModel: 'FIXED' as const,
  priceMin: '',
  priceMax: '',
  basePrice: '',
  discountPrice: '',
  turnaroundDays: '',
  turnaroundDesc: '',
  turnaroundTime: '',
  sampleRequirement: '',
  sampleCount: '',
  sampleSize: '',
  sampleWeight: '',
  sampleCondition: '',
  samplePreservation: '',
  samplePreparation: '',
  deliverables: '',
  sortOrder: '0',
  status: 'DRAFT' as 'DRAFT' | 'PUBLISHED',
  isFeatured: false,
  isHot: false,
  isActive: true,
  seoTitleZh: '',
  seoTitleEn: '',
  seoDescZh: '',
  seoDescEn: '',
  customFields: [] as CustomField[],
  labIds: [] as string[],
};

export function ServiceFormModal({
  isOpen,
  onClose,
  onSave,
  isSaving,
  editingId,
  initialData,
  categories,
  laboratories = [],
  onUploadMedia,
  onDeleteMedia,
  isUploadingMedia,
}: ServiceFormModalProps) {
  const [form, setForm] = useState({ ...emptyForm });
  const [dragOver, setDragOver] = useState(false);

  useEffect(() => {
    if (isOpen && initialData) {
      setForm({
        nameZh: initialData.nameZh || '',
        nameEn: initialData.nameEn || '',
        shortDescZh: initialData.shortDescZh || '',
        shortDescEn: initialData.shortDescEn || '',
        categoryId: initialData.categoryId || '',
        fullDescZh: initialData.fullDescZh || '',
        fullDescEn: initialData.fullDescEn || '',
        pricingModel: (initialData.pricingModel as any) || 'FIXED',
        priceMin: initialData.priceMin !== null && initialData.priceMin !== undefined ? String(initialData.priceMin) : '',
        priceMax: initialData.priceMax !== null && initialData.priceMax !== undefined ? String(initialData.priceMax) : '',
        basePrice: initialData.basePrice !== null && initialData.basePrice !== undefined ? String(initialData.basePrice) : '',
        discountPrice: initialData.discountPrice !== null && initialData.discountPrice !== undefined ? String(initialData.discountPrice) : '',
        turnaroundDays: initialData.turnaroundDays !== null && initialData.turnaroundDays !== undefined ? String(initialData.turnaroundDays) : '',
        turnaroundDesc: initialData.turnaroundDesc || '',
        turnaroundTime: initialData.turnaroundTime || '',
        sampleRequirement: initialData.sampleRequirement || '',
        sampleCount: initialData.sampleCount || '',
        sampleSize: initialData.sampleSize || '',
        sampleWeight: initialData.sampleWeight || '',
        sampleCondition: initialData.sampleCondition || '',
        samplePreservation: initialData.samplePreservation || '',
        samplePreparation: initialData.samplePreparation || '',
        deliverables: initialData.deliverables || '',
        sortOrder: String(initialData.sortOrder ?? 0),
        status: initialData.status || 'DRAFT',
        isFeatured: initialData.isFeatured ?? false,
        isHot: initialData.isHot ?? false,
        isActive: initialData.isActive ?? true,
        seoTitleZh: initialData.seoTitleZh || '',
        seoTitleEn: initialData.seoTitleEn || '',
        seoDescZh: initialData.seoDescZh || '',
        seoDescEn: initialData.seoDescEn || '',
        customFields: (initialData.customFields || []).map((f) => ({
          id: f.id,
          label: f.label,
          fieldType: f.fieldType as CustomField['fieldType'],
          options: f.options,
          isRequired: f.isRequired,
          placeholder: f.placeholder,
          sortOrder: f.sortOrder,
        })),
        labIds: (initialData.labServices || []).map((l) => l.labId),
      });
    } else if (isOpen) {
      setForm({ ...emptyForm });
    }
  }, [isOpen, initialData]);

  const update = <K extends keyof typeof form>(key: K, value: typeof form[K]) => {
    setForm((p) => ({ ...p, [key]: value }));
  };

  const mediaCount = initialData?.media?.length ?? 0;
  const showPublishWarning = form.status === 'PUBLISHED' && mediaCount === 0 && !!editingId;

  const handleSave = () => {
    if (!form.nameZh.trim()) {
      alert('服务名称（中文）不能为空');
      return;
    }
    if (!form.categoryId.trim()) {
      alert('请选择服务分类');
      return;
    }
    if (showPublishWarning) {
      alert('发布状态的服务必须先上传至少一张图片');
      return;
    }

    const payload: ServiceCreateInput = {
      nameZh: form.nameZh.trim(),
      nameEn: form.nameEn.trim() || null,
      shortDescZh: form.shortDescZh.trim() || null,
      shortDescEn: form.shortDescEn.trim() || null,
      categoryId: form.categoryId,
      fullDescZh: form.fullDescZh.trim() || null,
      fullDescEn: form.fullDescEn.trim() || null,
      pricingModel: form.pricingModel,
      priceMin: form.priceMin ? parseFloat(form.priceMin) : null,
      priceMax: form.priceMax ? parseFloat(form.priceMax) : null,
      basePrice: form.basePrice ? parseFloat(form.basePrice) : null,
      discountPrice: form.discountPrice ? parseFloat(form.discountPrice) : null,
      turnaroundDays: form.turnaroundDays ? parseInt(form.turnaroundDays, 10) : null,
      turnaroundTime: form.turnaroundTime.trim() || null,
      sampleRequirement: form.sampleRequirement.trim() || null,
      sampleCount: form.sampleCount.trim() || null,
      sampleSize: form.sampleSize.trim() || null,
      sampleWeight: form.sampleWeight.trim() || null,
      sampleCondition: form.sampleCondition.trim() || null,
      samplePreservation: form.samplePreservation.trim() || null,
      samplePreparation: form.samplePreparation.trim() || null,
      deliverables: form.deliverables.trim() || null,
      sortOrder: parseInt(form.sortOrder, 10) || 0,
      status: form.status,
      isFeatured: form.isFeatured,
      isHot: form.isHot,
      isActive: form.isActive,
      seoTitleZh: form.seoTitleZh.trim() || null,
      seoTitleEn: form.seoTitleEn.trim() || null,
      seoDescZh: form.seoDescZh.trim() || null,
      seoDescEn: form.seoDescEn.trim() || null,
      customFields: form.customFields.map((f) => ({
        id: f.id,
        label: f.label.trim(),
        fieldType: f.fieldType,
        options: f.options?.trim() || null,
        isRequired: f.isRequired,
        placeholder: f.placeholder?.trim() || null,
        sortOrder: f.sortOrder,
      })),
      labIds: form.labIds,
    };

    onSave(payload);
  };

  const handleFileDrop = useCallback(
    async (e: React.DragEvent) => {
      e.preventDefault();
      setDragOver(false);
      if (!onUploadMedia) return;
      const files = Array.from(e.dataTransfer.files).filter((f) => f.type.startsWith('image/'));
      for (const file of files) {
        await onUploadMedia(file);
      }
    },
    [onUploadMedia]
  );

  const handleFileSelect = useCallback(
    async (e: React.ChangeEvent<HTMLInputElement>) => {
      if (!onUploadMedia || !e.target.files) return;
      const files = Array.from(e.target.files).filter((f) => f.type.startsWith('image/'));
      for (const file of files) {
        await onUploadMedia(file);
      }
      e.target.value = '';
    },
    [onUploadMedia]
  );

  const Section = ({ title, children }: { title: string; children: React.ReactNode }) => (
    <div className="border-t border-gray-100 pt-3">
      <p className="mb-2 text-sm font-medium text-gray-700">{title}</p>
      {children}
    </div>
  );

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title={editingId ? '编辑服务' : '添加服务'}
      size="xl"
      loading={isSaving}
    >
      <div className="space-y-4 max-h-[70vh] overflow-y-auto pr-1">
        {/* Basic Info */}
        <div className="grid grid-cols-2 gap-3">
          <Input
            label="服务名称（中文）"
            required
            value={form.nameZh}
            onChange={(e) => update('nameZh', e.target.value)}
          />
          <Input
            label="服务名称（英文）"
            value={form.nameEn}
            onChange={(e) => update('nameEn', e.target.value)}
          />
          <Input
            label="简短描述（中文）"
            value={form.shortDescZh}
            onChange={(e) => update('shortDescZh', e.target.value)}
          />
          <Input
            label="简短描述（英文）"
            value={form.shortDescEn}
            onChange={(e) => update('shortDescEn', e.target.value)}
          />
        </div>

        {/* Category */}
        <div>
          <label className="mb-1 block text-sm font-medium text-gray-700">
            服务分类 <span className="text-red-500">*</span>
          </label>
          <select
            className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm"
            value={form.categoryId}
            onChange={(e) => update('categoryId', e.target.value)}
          >
            <option value="">请选择分类</option>
            {categories.map((cat) => (
              <option key={cat.id} value={cat.id}>
                {cat.name?.zh}
              </option>
            ))}
          </select>
        </div>

        {/* Description */}
        <Section title="详细描述">
          <div className="grid grid-cols-2 gap-3">
            <textarea
              className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm min-h-[80px]"
              placeholder="详细描述（中文）"
              value={form.fullDescZh}
              onChange={(e) => update('fullDescZh', e.target.value)}
            />
            <textarea
              className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm min-h-[80px]"
              placeholder="详细描述（英文）"
              value={form.fullDescEn}
              onChange={(e) => update('fullDescEn', e.target.value)}
            />
          </div>
        </Section>

        {/* Pricing */}
        <Section title="定价与周期">
          <div className="grid grid-cols-3 gap-3">
            <div>
              <label className="mb-1 block text-sm font-medium text-gray-700">定价模式</label>
              <select
                className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm"
                value={form.pricingModel}
                onChange={(e) => update('pricingModel', e.target.value as any)}
              >
                <option value="FIXED">固定价格</option>
                <option value="RANGE">价格区间</option>
                <option value="QUOTE_ONLY">仅报价</option>
                <option value="TIERED">阶梯定价</option>
              </select>
            </div>
            <Input
              label="基础价格"
              type="number"
              value={form.basePrice}
              onChange={(e) => update('basePrice', e.target.value)}
            />
            <Input
              label="折扣价格"
              type="number"
              value={form.discountPrice}
              onChange={(e) => update('discountPrice', e.target.value)}
            />
            <Input
              label="检测周期 (天)"
              type="number"
              value={form.turnaroundDays}
              onChange={(e) => update('turnaroundDays', e.target.value)}
            />
            <Input
              label="周期说明"
              value={form.turnaroundTime}
              onChange={(e) => update('turnaroundTime', e.target.value)}
              placeholder="例如：常规5天，加急3天"
            />
            <Input
              label="排序"
              type="number"
              value={form.sortOrder}
              onChange={(e) => update('sortOrder', e.target.value)}
              hint="数字越小越靠前"
            />
          </div>
        </Section>

        {/* Sample Requirements */}
        <Section title="样品要求">
          <div className="grid grid-cols-2 gap-3">
            <textarea
              className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm min-h-[60px]"
              placeholder="样品要求总述"
              value={form.sampleRequirement}
              onChange={(e) => update('sampleRequirement', e.target.value)}
            />
            <textarea
              className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm min-h-[60px]"
              placeholder="交付物说明"
              value={form.deliverables}
              onChange={(e) => update('deliverables', e.target.value)}
            />
            <Input
              label="样品数量"
              value={form.sampleCount}
              onChange={(e) => update('sampleCount', e.target.value)}
              placeholder="例如：≥3件"
            />
            <Input
              label="样品尺寸"
              value={form.sampleSize}
              onChange={(e) => update('sampleSize', e.target.value)}
              placeholder="例如：10 mm × 10 mm"
            />
            <Input
              label="样品重量"
              value={form.sampleWeight}
              onChange={(e) => update('sampleWeight', e.target.value)}
              placeholder="例如：≥50 g"
            />
            <Input
              label="样品状态/特性"
              value={form.sampleCondition}
              onChange={(e) => update('sampleCondition', e.target.value)}
              placeholder="例如：干燥、密封"
            />
            <Input
              label="样品保存条件"
              value={form.samplePreservation}
              onChange={(e) => update('samplePreservation', e.target.value)}
              placeholder="例如：常温/冷藏"
            />
            <Input
              label="样品制备要求"
              value={form.samplePreparation}
              onChange={(e) => update('samplePreparation', e.target.value)}
              placeholder="例如：需抛光至镜面"
            />
          </div>
        </Section>

        {/* Laboratories */}
        <Section title="提供实验室">
          <div className="max-h-40 overflow-y-auto border border-gray-200 rounded-lg p-2 space-y-1">
            {laboratories.length === 0 ? (
              <p className="text-xs text-gray-400">暂无实验室数据</p>
            ) : (
              laboratories.map((lab) => (
                <label key={lab.id} className="flex items-center gap-2 text-sm text-gray-700 py-1">
                  <input
                    type="checkbox"
                    checked={form.labIds.includes(lab.id)}
                    onChange={(e) => {
                      const checked = e.target.checked;
                      setForm((p) => ({
                        ...p,
                        labIds: checked
                          ? [...p.labIds, lab.id]
                          : p.labIds.filter((id) => id !== lab.id),
                      }));
                    }}
                    className="h-4 w-4 rounded border-gray-300"
                  />
                  {lab.nameZh}
                </label>
              ))
            )}
          </div>
        </Section>

        {/* SEO */}
        <Section title="SEO 设置">
          <div className="grid grid-cols-2 gap-3">
            <Input
              label="SEO 标题（中文）"
              value={form.seoTitleZh}
              onChange={(e) => update('seoTitleZh', e.target.value)}
            />
            <Input
              label="SEO 标题（英文）"
              value={form.seoTitleEn}
              onChange={(e) => update('seoTitleEn', e.target.value)}
            />
            <Input
              label="SEO 描述（中文）"
              value={form.seoDescZh}
              onChange={(e) => update('seoDescZh', e.target.value)}
            />
            <Input
              label="SEO 描述（英文）"
              value={form.seoDescEn}
              onChange={(e) => update('seoDescEn', e.target.value)}
            />
          </div>
        </Section>

        {/* Status & Flags */}
        <div className="border-t border-gray-100 pt-3">
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="mb-1 block text-sm font-medium text-gray-700">发布状态</label>
              <select
                className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm"
                value={form.status}
                onChange={(e) => update('status', e.target.value as 'DRAFT' | 'PUBLISHED')}
              >
                <option value="DRAFT">草稿</option>
                <option value="PUBLISHED">已发布</option>
              </select>
              {showPublishWarning && (
                <div className="mt-1 flex items-center gap-1 text-xs text-amber-600">
                  <AlertTriangle className="h-3 w-3" />
                  发布前必须先上传至少一张图片
                </div>
              )}
            </div>
          </div>
          <div className="flex gap-4 mt-3">
            <label className="flex items-center gap-2 text-sm text-gray-700">
              <input
                type="checkbox"
                checked={form.isFeatured}
                onChange={(e) => update('isFeatured', e.target.checked)}
                className="h-4 w-4 rounded border-gray-300"
              />
              精选推荐
            </label>
            <label className="flex items-center gap-2 text-sm text-gray-700">
              <input
                type="checkbox"
                checked={form.isHot}
                onChange={(e) => update('isHot', e.target.checked)}
                className="h-4 w-4 rounded border-gray-300"
              />
              热门服务
            </label>
            <label className="flex items-center gap-2 text-sm text-gray-700">
              <input
                type="checkbox"
                checked={form.isActive}
                onChange={(e) => update('isActive', e.target.checked)}
                className="h-4 w-4 rounded border-gray-300"
              />
              启用
            </label>
          </div>
        </div>

        {/* Image Upload */}
        {editingId && (
          <Section title="服务图片">
            <div
              className={cn(
                'border-2 border-dashed rounded-lg p-4 text-center transition-colors',
                dragOver ? 'border-blue-400 bg-blue-50' : 'border-gray-300'
              )}
              onDragOver={(e) => { e.preventDefault(); setDragOver(true); }}
              onDragLeave={() => setDragOver(false)}
              onDrop={handleFileDrop}
            >
              <Upload className="h-6 w-6 mx-auto text-gray-400 mb-2" />
              <p className="text-sm text-gray-600">拖拽图片到此处，或</p>
              <label className="inline-block mt-1">
                <input
                  type="file"
                  accept="image/*"
                  multiple
                  className="hidden"
                  onChange={handleFileSelect}
                />
                <span className="text-sm text-blue-600 cursor-pointer hover:underline">
                  点击选择图片
                </span>
              </label>
            </div>

            {isUploadingMedia && (
              <p className="text-xs text-gray-500 mt-2">上传中...</p>
            )}

            {initialData?.media && initialData.media.length > 0 && (
              <div className="grid grid-cols-4 gap-2 mt-3">
                {initialData.media.map((m) => (
                  <div key={m.id} className="relative group">
                    <img
                      src={m.url}
                      alt={m.caption || 'service image'}
                      className="h-24 w-full object-cover rounded-lg border border-gray-200"
                    />
                    <button
                      type="button"
                      onClick={() => onDeleteMedia?.(m.id)}
                      className="absolute -top-1 -right-1 p-0.5 bg-red-500 text-white rounded-full opacity-0 group-hover:opacity-100 transition-opacity"
                    >
                      <X className="h-3 w-3" />
                    </button>
                  </div>
                ))}
              </div>
            )}
          </Section>
        )}

        {/* Custom Fields */}
        <ServiceCustomFieldsEditor
          fields={form.customFields}
          onChange={(fields) => update('customFields', fields)}
        />

        <div className="flex justify-end gap-2 pt-2">
          <Button variant="outline" onClick={onClose}>
            取消
          </Button>
          <Button onClick={handleSave} loading={isSaving}>
            保存
          </Button>
        </div>
      </div>
    </Modal>
  );
}

function cn(...classes: (string | false | undefined)[]) {
  return classes.filter(Boolean).join(' ');
}
