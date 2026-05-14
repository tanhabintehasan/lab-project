'use client';

import { useState, useCallback, useRef, ChangeEvent } from 'react';
import { Modal } from '@/components/ui/modal';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Upload, X, Image as ImageIcon } from 'lucide-react';
import { Laboratory } from '@/services/api/admin/labs';

interface LabFormModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: (payload: any) => void;
  initialData?: Laboratory | null;
  isSaving?: boolean;
}

const statusOptions = [
  { value: 'PENDING', label: '待审核' },
  { value: 'ACTIVE', label: '启用' },
  { value: 'SUSPENDED', label: '暂停' },
  { value: 'INACTIVE', label: '停用' },
];

const tierOptions = [
  { value: 'PREMIUM', label: '金牌' },
  { value: 'STANDARD', label: '标准' },
  { value: 'BASIC', label: '基础' },
];

function safeJsonStringify(value: any): string {
  if (!value) return '';
  if (typeof value === 'string') return value;
  try {
    return JSON.stringify(value, null, 2);
  } catch {
    return '';
  }
}

function safeJsonParse(value: string): any {
  if (!value.trim()) return null;
  try {
    return JSON.parse(value);
  } catch {
    return value;
  }
}

export function LabFormModal({ isOpen, onClose, onSave, initialData, isSaving }: LabFormModalProps) {
  const [form, setForm] = useState<any>(() => buildFormState(initialData));
  const [error, setError] = useState('');
  const [media, setMedia] = useState(initialData?.media || []);
  const [uploading, setUploading] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const labId = initialData?.id;

  const updateField = useCallback((field: string, value: any) => {
    setForm((prev: any) => ({ ...prev, [field]: value }));
  }, []);

  const handleUpload = async (files: FileList | null) => {
    if (!files || files.length === 0 || !labId) return;
    setUploading(true);
    setError('');

    for (const file of Array.from(files)) {
      const formData = new FormData();
      formData.append('file', file);
      try {
        const res = await fetch(`/api/admin/labs/${labId}/media`, {
          method: 'POST',
          credentials: 'include',
          body: formData,
        });
        const data = await res.json();
        if (data?.success && data.data) {
          setMedia((prev: any[]) => [...prev, data.data]);
        } else {
          setError(data?.error || '上传图片失败');
        }
      } catch {
        setError('上传图片失败');
      }
    }
    setUploading(false);
    if (fileInputRef.current) fileInputRef.current.value = '';
  };

  const handleDeleteMedia = async (mediaId: string) => {
    if (!labId) return;
    if (!window.confirm('确定要删除这张图片吗？')) return;
    try {
      const res = await fetch(`/api/admin/labs/${labId}/media?mediaId=${mediaId}`, {
        method: 'DELETE',
        credentials: 'include',
      });
      const data = await res.json();
      if (data?.success) {
        setMedia((prev: any[]) => prev.filter((m) => m.id !== mediaId));
      } else {
        setError(data?.error || '删除图片失败');
      }
    } catch {
      setError('删除图片失败');
    }
  };

  const handleSave = () => {
    setError('');
    if (!form.nameZh?.trim()) {
      setError('实验室名称不能为空');
      return;
    }

    const payload: any = {
      nameZh: form.nameZh.trim(),
      nameEn: form.nameEn?.trim() || undefined,
      slug: form.slug?.trim() || undefined,
      shortDescZh: form.shortDescZh?.trim() || undefined,
      shortDescEn: form.shortDescEn?.trim() || undefined,
      fullDescZh: form.fullDescZh?.trim() || undefined,
      fullDescEn: form.fullDescEn?.trim() || undefined,
      address: form.address?.trim() || undefined,
      city: form.city?.trim() || undefined,
      province: form.province?.trim() || undefined,
      phone: form.phone?.trim() || undefined,
      email: form.email?.trim() || undefined,
      website: form.website?.trim() || undefined,
      logo: form.logo?.trim() || undefined,
      coverImage: form.coverImage?.trim() || undefined,
      status: form.status,
      vendorCode: form.vendorCode?.trim() || undefined,
      commissionRate: form.commissionRate !== '' ? Number(form.commissionRate) : undefined,
      contractStartDate: form.contractStartDate || undefined,
      contractEndDate: form.contractEndDate || undefined,
      vendorTier: form.vendorTier || undefined,
      billingEmail: form.billingEmail?.trim() || undefined,
      billingAddress: form.billingAddress?.trim() || undefined,
      taxId: form.taxId?.trim() || undefined,
      businessLicense: form.businessLicense?.trim() || undefined,
      primaryContactName: form.primaryContactName?.trim() || undefined,
      primaryContactPhone: form.primaryContactPhone?.trim() || undefined,
    };

    const certifications = safeJsonParse(form.certificationsJson);
    if (certifications !== null) payload.certifications = certifications;

    const specialties = safeJsonParse(form.specialtiesJson);
    if (specialties !== null) payload.specialties = specialties;

    onSave(payload);
  };

  return (
    <Modal isOpen={isOpen} onClose={onClose} title={initialData ? '编辑实验室' : '添加实验室'} size="xl">
      <div className="max-h-[80vh] overflow-y-auto pr-1">
        <div className="space-y-6">
          {error && (
            <div className="rounded-lg border border-red-200 bg-red-50 p-3 text-sm text-red-600">
              {error}
            </div>
          )}

          {/* Section: Basic Info */}
          <section>
            <h3 className="mb-3 text-sm font-semibold text-gray-900">基本信息</h3>
            <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
              <Input
                label="实验室名称"
                required
                value={form.nameZh}
                onChange={(e) => updateField('nameZh', e.target.value)}
              />
              <Input
                label="英文名称"
                value={form.nameEn}
                onChange={(e) => updateField('nameEn', e.target.value)}
              />
              <Input
                label="Slug"
                value={form.slug}
                onChange={(e) => updateField('slug', e.target.value)}
              />
              <Input
                label="网站"
                value={form.website}
                onChange={(e) => updateField('website', e.target.value)}
              />
            </div>
          </section>

          {/* Section: Contact */}
          <section>
            <h3 className="mb-3 text-sm font-semibold text-gray-900">联系方式</h3>
            <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
              <Input
                label="联系电话"
                value={form.phone}
                onChange={(e) => updateField('phone', e.target.value)}
              />
              <Input
                label="邮箱"
                type="email"
                value={form.email}
                onChange={(e) => updateField('email', e.target.value)}
              />
              <Input
                label="主要联系人"
                value={form.primaryContactName}
                onChange={(e) => updateField('primaryContactName', e.target.value)}
              />
              <Input
                label="联系人电话"
                value={form.primaryContactPhone}
                onChange={(e) => updateField('primaryContactPhone', e.target.value)}
              />
            </div>
          </section>

          {/* Section: Address */}
          <section>
            <h3 className="mb-3 text-sm font-semibold text-gray-900">地址</h3>
            <div className="grid grid-cols-1 gap-3 sm:grid-cols-3">
              <Input
                label="省份"
                value={form.province}
                onChange={(e) => updateField('province', e.target.value)}
              />
              <Input
                label="城市"
                value={form.city}
                onChange={(e) => updateField('city', e.target.value)}
              />
              <Input
                label="详细地址"
                value={form.address}
                onChange={(e) => updateField('address', e.target.value)}
              />
            </div>
          </section>

          {/* Section: Vendor / Commercial */}
          <section>
            <h3 className="mb-3 text-sm font-semibold text-gray-900">供应商 / 商务信息</h3>
            <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
              <Input
                label="供应商编号"
                value={form.vendorCode}
                onChange={(e) => updateField('vendorCode', e.target.value)}
              />
              <div>
                <label className="mb-1 block text-sm font-medium text-gray-700">供应商等级</label>
                <select
                  className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm"
                  value={form.vendorTier}
                  onChange={(e) => updateField('vendorTier', e.target.value)}
                >
                  <option value="">请选择</option>
                  {tierOptions.map((t) => (
                    <option key={t.value} value={t.value}>{t.label}</option>
                  ))}
                </select>
              </div>
              <Input
                label="佣金比例 (%)"
                type="number"
                min={0}
                max={100}
                step={0.01}
                value={form.commissionRate}
                onChange={(e) => updateField('commissionRate', e.target.value)}
              />
              <div />
              <Input
                label="合同开始日期"
                type="date"
                value={form.contractStartDate}
                onChange={(e) => updateField('contractStartDate', e.target.value)}
              />
              <Input
                label="合同结束日期"
                type="date"
                value={form.contractEndDate}
                onChange={(e) => updateField('contractEndDate', e.target.value)}
              />
              <Input
                label="税号"
                value={form.taxId}
                onChange={(e) => updateField('taxId', e.target.value)}
              />
              <Input
                label="营业执照号"
                value={form.businessLicense}
                onChange={(e) => updateField('businessLicense', e.target.value)}
              />
              <div className="flex items-center gap-2 pt-6">
                <input
                  type="checkbox"
                  id="isVerified"
                  checked={form.isVerified}
                  onChange={(e) => updateField('isVerified', e.target.checked)}
                  className="h-4 w-4 rounded border-gray-300 text-primary"
                />
                <label htmlFor="isVerified" className="text-sm font-medium text-gray-700">
                  已认证（通过审核）
                </label>
              </div>
            </div>
          </section>

          {/* Section: Billing */}
          <section>
            <h3 className="mb-3 text-sm font-semibold text-gray-900">账单信息</h3>
            <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
              <Input
                label="账单邮箱"
                type="email"
                value={form.billingEmail}
                onChange={(e) => updateField('billingEmail', e.target.value)}
              />
              <Input
                label="账单地址"
                value={form.billingAddress}
                onChange={(e) => updateField('billingAddress', e.target.value)}
              />
            </div>
          </section>

          {/* Section: Branding */}
          <section>
            <h3 className="mb-3 text-sm font-semibold text-gray-900">品牌形象</h3>
            <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
              <Input
                label="Logo URL"
                value={form.logo}
                onChange={(e) => updateField('logo', e.target.value)}
              />
              <Input
                label="封面图 URL"
                value={form.coverImage}
                onChange={(e) => updateField('coverImage', e.target.value)}
              />
            </div>
            {form.logo && (
              <img src={form.logo} alt="Logo preview" className="mt-2 h-16 w-16 rounded object-contain border" />
            )}
          </section>

          {/* Section: Descriptions */}
          <section>
            <h3 className="mb-3 text-sm font-semibold text-gray-900">描述</h3>
            <div className="space-y-3">
              <Input
                label="简短描述（中文）"
                value={form.shortDescZh}
                onChange={(e) => updateField('shortDescZh', e.target.value)}
              />
              <Input
                label="简短描述（英文）"
                value={form.shortDescEn}
                onChange={(e) => updateField('shortDescEn', e.target.value)}
              />
              <div>
                <label className="mb-1 block text-sm font-medium text-gray-700">详细介绍（中文）</label>
                <textarea
                  className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm min-h-[80px]"
                  value={form.fullDescZh}
                  onChange={(e) => updateField('fullDescZh', e.target.value)}
                />
              </div>
              <div>
                <label className="mb-1 block text-sm font-medium text-gray-700">详细介绍（英文）</label>
                <textarea
                  className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm min-h-[80px]"
                  value={form.fullDescEn}
                  onChange={(e) => updateField('fullDescEn', e.target.value)}
                />
              </div>
            </div>
          </section>

          {/* Section: Certifications & Specialties */}
          <section>
            <h3 className="mb-3 text-sm font-semibold text-gray-900">资质与专长 (JSON)</h3>
            <div className="space-y-3">
              <div>
                <label className="mb-1 block text-sm font-medium text-gray-700">认证资质</label>
                <textarea
                  className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm font-mono min-h-[80px]"
                  placeholder={`{"items": [{"name": "CNAS", "code": "L1234"}]}`}
                  value={form.certificationsJson}
                  onChange={(e) => updateField('certificationsJson', e.target.value)}
                />
              </div>
              <div>
                <label className="mb-1 block text-sm font-medium text-gray-700">专业领域</label>
                <textarea
                  className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm font-mono min-h-[80px]"
                  placeholder={`{"items": ["材料分析", "环境检测"]}`}
                  value={form.specialtiesJson}
                  onChange={(e) => updateField('specialtiesJson', e.target.value)}
                />
              </div>
            </div>
          </section>

          {/* Section: Media Gallery */}
          {labId && (
            <section>
              <h3 className="mb-3 text-sm font-semibold text-gray-900">媒体相册</h3>
              <div
                className="border-2 border-dashed rounded-lg p-4 text-center transition-colors border-gray-300 hover:border-gray-400 cursor-pointer"
                onClick={() => fileInputRef.current?.click()}
              >
                <Upload className="h-8 w-8 mx-auto mb-2 text-gray-400" />
                <p className="text-sm text-gray-600">
                  {uploading ? '上传中...' : '点击上传图片'}
                </p>
                <input
                  ref={fileInputRef}
                  type="file"
                  accept="image/*"
                  multiple
                  className="hidden"
                  onChange={(e) => handleUpload(e.target.files)}
                />
              </div>
              {media.length > 0 && (
                <div className="mt-3 grid grid-cols-4 gap-2">
                  {media.map((m: any) => (
                    <div key={m.id} className="relative group rounded border overflow-hidden">
                      <img src={m.url} alt="" className="h-20 w-full object-cover" />
                      <button
                        type="button"
                        onClick={() => handleDeleteMedia(m.id)}
                        className="absolute top-0.5 right-0.5 rounded-full bg-red-600 p-0.5 text-white opacity-0 group-hover:opacity-100 transition-opacity"
                      >
                        <X className="h-3 w-3" />
                      </button>
                    </div>
                  ))}
                </div>
              )}
            </section>
          )}

          {/* Section: Status */}
          <section>
            <h3 className="mb-3 text-sm font-semibold text-gray-900">状态</h3>
            <div>
              <label className="mb-1 block text-sm font-medium text-gray-700">实验室状态</label>
              <select
                className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm"
                value={form.status}
                onChange={(e) => updateField('status', e.target.value)}
              >
                {statusOptions.map((s) => (
                  <option key={s.value} value={s.value}>{s.label}</option>
                ))}
              </select>
            </div>
          </section>

          <div className="flex gap-3 pt-2">
            <Button onClick={handleSave} loading={isSaving}>
              {initialData ? '保存修改' : '保存'}
            </Button>
            <Button variant="outline" onClick={onClose}>
              取消
            </Button>
          </div>
        </div>
      </div>
    </Modal>
  );
}

function buildFormState(data?: Laboratory | null): any {
  if (!data) {
    return {
      nameZh: '',
      nameEn: '',
      slug: '',
      shortDescZh: '',
      shortDescEn: '',
      fullDescZh: '',
      fullDescEn: '',
      address: '',
      city: '',
      province: '',
      phone: '',
      email: '',
      website: '',
      logo: '',
      coverImage: '',
      status: 'PENDING',
      vendorCode: '',
      commissionRate: '',
      contractStartDate: '',
      contractEndDate: '',
      vendorTier: '',
      billingEmail: '',
      billingAddress: '',
      taxId: '',
      businessLicense: '',
      primaryContactName: '',
      primaryContactPhone: '',
      certificationsJson: '',
      specialtiesJson: '',
    };
  }

  return {
    nameZh: data.nameZh || '',
    nameEn: data.nameEn || '',
    slug: data.slug || '',
    shortDescZh: data.shortDescZh || '',
    shortDescEn: data.shortDescEn || '',
    fullDescZh: data.fullDescZh || '',
    fullDescEn: data.fullDescEn || '',
    address: data.address || '',
    city: data.city || '',
    province: data.province || '',
    phone: data.phone || '',
    email: data.email || '',
    website: data.website || '',
    logo: data.logo || '',
    coverImage: data.coverImage || '',
    status: data.status || 'PENDING',
    vendorCode: data.vendorCode || '',
    commissionRate: data.commissionRate ?? '',
    contractStartDate: data.contractStartDate ? data.contractStartDate.slice(0, 10) : '',
    contractEndDate: data.contractEndDate ? data.contractEndDate.slice(0, 10) : '',
    vendorTier: data.vendorTier || '',
    billingEmail: data.billingEmail || '',
    billingAddress: data.billingAddress || '',
    taxId: data.taxId || '',
    businessLicense: data.businessLicense || '',
    primaryContactName: data.primaryContactName || '',
    primaryContactPhone: data.primaryContactPhone || '',
    isVerified: data.isVerified || false,
    certificationsJson: safeJsonStringify(data.certifications),
    specialtiesJson: safeJsonStringify(data.specialties),
  };
}
