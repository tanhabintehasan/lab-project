'use client';

import { useState, useCallback, useRef } from 'react';
import { Modal } from '@/components/ui/modal';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Upload, X } from 'lucide-react';
import { Equipment } from '@/services/api/admin/equipment';

interface LabOption {
  id: string;
  nameZh: string;
}

interface ServiceOption {
  id: string;
  nameZh: string;
  status: string;
}

interface EquipmentFormModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: (payload: any) => void;
  initialData?: Equipment | null;
  labs: LabOption[];
  services: ServiceOption[];
  labsLoading?: boolean;
  isSaving?: boolean;
  onUploadMedia?: (files: FileList) => void;
  onDeleteMedia?: (mediaId: string) => void;
  uploadingMedia?: boolean;
}

const statusOptions = [
  { value: 'AVAILABLE', label: '可预约' },
  { value: 'IN_USE', label: '使用中' },
  { value: 'MAINTENANCE', label: '维护中' },
  { value: 'UNAVAILABLE', label: '不可用' },
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

export function EquipmentFormModal({
  isOpen,
  onClose,
  onSave,
  initialData,
  labs,
  services,
  labsLoading,
  isSaving,
  onUploadMedia,
  onDeleteMedia,
  uploadingMedia,
}: EquipmentFormModalProps) {
  const [form, setForm] = useState<any>(() => buildFormState(initialData));
  const [error, setError] = useState('');
  const fileInputRef = useRef<HTMLInputElement>(null);
  const equipmentId = initialData?.id;

  const updateField = useCallback((field: string, value: any) => {
    setForm((prev: any) => ({ ...prev, [field]: value }));
  }, []);

  const toggleService = (serviceId: string) => {
    setForm((prev: any) => {
      const current = new Set(prev.serviceIds);
      if (current.has(serviceId)) current.delete(serviceId);
      else current.add(serviceId);
      return { ...prev, serviceIds: Array.from(current) };
    });
  };

  const handleSave = () => {
    setError('');
    if (!form.nameZh?.trim()) {
      setError('设备名称不能为空');
      return;
    }

    const quantityNum = parseInt(form.quantity, 10);
    if (Number.isNaN(quantityNum) || quantityNum < 1) {
      setError('数量必须大于等于 1');
      return;
    }

    const payload: any = {
      nameZh: form.nameZh.trim(),
      nameEn: form.nameEn?.trim() || undefined,
      model: form.model?.trim() || undefined,
      manufacturer: form.manufacturer?.trim() || undefined,
      labId: form.labId || undefined,
      descZh: form.descZh?.trim() || undefined,
      descEn: form.descEn?.trim() || undefined,
      videoUrl: form.videoUrl?.trim() || undefined,
      usageInstructions: form.usageInstructions?.trim() || undefined,
      lastCalibratedAt: form.lastCalibratedAt || undefined,
      nextCalibrationDue: form.nextCalibrationDue || undefined,
      calibrationCertificateUrl: form.calibrationCertificateUrl?.trim() || undefined,
      status: form.status,
      bookable: form.bookable,
      isActive: form.isActive,
      quantity: quantityNum,
      hourlyRate: form.hourlyRate ? parseFloat(form.hourlyRate) : undefined,
      dailyRate: form.dailyRate ? parseFloat(form.dailyRate) : undefined,
      serviceIds: form.serviceIds.length > 0 ? form.serviceIds : undefined,
    };

    const specifications = safeJsonParse(form.specificationsJson);
    if (specifications !== null) payload.specifications = specifications;

    const certifications = safeJsonParse(form.certificationsJson);
    if (certifications !== null) payload.certifications = certifications;

    const images = safeJsonParse(form.imagesJson);
    if (images !== null) payload.images = images;

    onSave(payload);
  };

  const media = initialData?.media || [];

  return (
    <Modal isOpen={isOpen} onClose={onClose} title={initialData ? '编辑设备' : '添加设备'} size="xl">
      <div className="max-h-[80vh] overflow-y-auto pr-1">
        <div className="space-y-6">
          {error && (
            <div className="rounded-lg border border-red-200 bg-red-50 p-3 text-sm text-red-600">
              {error}
            </div>
          )}

          <section>
            <h3 className="mb-3 text-sm font-semibold text-gray-900">基本信息</h3>
            <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
              <Input label="设备名称" required value={form.nameZh} onChange={(e) => updateField('nameZh', e.target.value)} />
              <Input label="英文名称" value={form.nameEn} onChange={(e) => updateField('nameEn', e.target.value)} />
              <Input label="型号" value={form.model} onChange={(e) => updateField('model', e.target.value)} />
              <Input label="制造商" value={form.manufacturer} onChange={(e) => updateField('manufacturer', e.target.value)} />
            </div>
          </section>

          <section>
            <h3 className="mb-3 text-sm font-semibold text-gray-900">所属实验室</h3>
            <select
              className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm"
              value={form.labId}
              onChange={(e) => updateField('labId', e.target.value)}
              disabled={labsLoading}
            >
              <option value="">无</option>
              {labs.map((lab) => (
                <option key={lab.id} value={lab.id}>{lab.nameZh}</option>
              ))}
            </select>
          </section>

          <section>
            <h3 className="mb-3 text-sm font-semibold text-gray-900">描述</h3>
            <div className="space-y-3">
              <div>
                <label className="mb-1 block text-sm font-medium text-gray-700">中文描述</label>
                <textarea className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm min-h-[60px]" value={form.descZh} onChange={(e) => updateField('descZh', e.target.value)} />
              </div>
              <div>
                <label className="mb-1 block text-sm font-medium text-gray-700">英文描述</label>
                <textarea className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm min-h-[60px]" value={form.descEn} onChange={(e) => updateField('descEn', e.target.value)} />
              </div>
            </div>
          </section>

          <section>
            <h3 className="mb-3 text-sm font-semibold text-gray-900">校准信息</h3>
            <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
              <Input label="上次校准日期" type="date" value={form.lastCalibratedAt} onChange={(e) => updateField('lastCalibratedAt', e.target.value)} />
              <Input label="下次校准日期" type="date" value={form.nextCalibrationDue} onChange={(e) => updateField('nextCalibrationDue', e.target.value)} />
              <Input label="校准证书 URL" value={form.calibrationCertificateUrl} onChange={(e) => updateField('calibrationCertificateUrl', e.target.value)} />
            </div>
          </section>

          <section>
            <h3 className="mb-3 text-sm font-semibold text-gray-900">媒体与资料</h3>
            <div className="space-y-3">
              <div>
                <label className="mb-1 block text-sm font-medium text-gray-700">图片 URLs (JSON 数组)</label>
                <textarea className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm font-mono min-h-[60px]" placeholder={`["https://example.com/img1.jpg"]`} value={form.imagesJson} onChange={(e) => updateField('imagesJson', e.target.value)} />
              </div>
              <Input label="视频 URL" value={form.videoUrl} onChange={(e) => updateField('videoUrl', e.target.value)} />
              <div>
                <label className="mb-1 block text-sm font-medium text-gray-700">使用说明</label>
                <textarea className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm min-h-[60px]" value={form.usageInstructions} onChange={(e) => updateField('usageInstructions', e.target.value)} />
              </div>
            </div>

            {equipmentId && (
              <div className="mt-3">
                <div
                  className="border-2 border-dashed rounded-lg p-3 text-center transition-colors border-gray-300 hover:border-gray-400 cursor-pointer"
                  onClick={() => fileInputRef.current?.click()}
                >
                  <Upload className="h-6 w-6 mx-auto mb-1 text-gray-400" />
                  <p className="text-sm text-gray-600">
                    {uploadingMedia ? '上传中...' : '点击上传高清图片'}
                  </p>
                  <input
                    ref={fileInputRef}
                    type="file"
                    accept="image/*"
                    multiple
                    className="hidden"
                    onChange={(e) => { if (e.target.files) onUploadMedia?.(e.target.files); if (fileInputRef.current) fileInputRef.current.value = ''; }}
                  />
                </div>
                {media.length > 0 && (
                  <div className="mt-2 grid grid-cols-4 gap-2">
                    {media.map((m: any) => (
                      <div key={m.id} className="relative group rounded border overflow-hidden">
                        <img src={m.url} alt="" className="h-16 w-full object-cover" />
                        <button type="button" onClick={() => onDeleteMedia?.(m.id)} className="absolute top-0.5 right-0.5 rounded-full bg-red-600 p-0.5 text-white opacity-0 group-hover:opacity-100 transition-opacity">
                          <X className="h-3 w-3" />
                        </button>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            )}
          </section>

          <section>
            <h3 className="mb-3 text-sm font-semibold text-gray-900">技术规格 (JSON)</h3>
            <div className="space-y-3">
              <div>
                <label className="mb-1 block text-sm font-medium text-gray-700">规格参数</label>
                <textarea className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm font-mono min-h-[60px]" placeholder={`{"resolution": "4K", "weight": "2.5kg"}`} value={form.specificationsJson} onChange={(e) => updateField('specificationsJson', e.target.value)} />
              </div>
              <div>
                <label className="mb-1 block text-sm font-medium text-gray-700">认证信息</label>
                <textarea className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm font-mono min-h-[60px]" placeholder={`{"items": [{"name": "ISO 9001"}]}`} value={form.certificationsJson} onChange={(e) => updateField('certificationsJson', e.target.value)} />
              </div>
            </div>
          </section>

          <section>
            <h3 className="mb-3 text-sm font-semibold text-gray-900">关联服务</h3>
            <div className="max-h-40 overflow-y-auto rounded-lg border border-gray-200 p-2 space-y-1">
              {services.length === 0 && (
                <p className="text-sm text-gray-400">暂无服务数据</p>
              )}
              {services.map((svc) => {
                const checked = form.serviceIds.includes(svc.id);
                return (
                  <label key={svc.id} className="flex items-center gap-2 px-2 py-1.5 rounded hover:bg-gray-50 cursor-pointer">
                    <input
                      type="checkbox"
                      className="h-4 w-4 rounded border-gray-300"
                      checked={checked}
                      onChange={() => toggleService(svc.id)}
                    />
                    <span className="text-sm text-gray-700">{svc.nameZh}</span>
                    {svc.status === 'PUBLISHED' && (
                      <span className="ml-auto text-xs text-green-600 bg-green-50 px-1.5 py-0.5 rounded">已发布</span>
                    )}
                  </label>
                );
              })}
            </div>
          </section>

          <section>
            <h3 className="mb-3 text-sm font-semibold text-gray-900">状态与库存</h3>
            <div className="grid grid-cols-1 gap-3 sm:grid-cols-3">
              <div>
                <label className="mb-1 block text-sm font-medium text-gray-700">设备状态</label>
                <select className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm" value={form.status} onChange={(e) => updateField('status', e.target.value)}>
                  {statusOptions.map((s) => (
                    <option key={s.value} value={s.value}>{s.label}</option>
                  ))}
                </select>
              </div>
              <Input label="数量" type="number" min={1} value={form.quantity} onChange={(e) => updateField('quantity', e.target.value)} />
              <div className="flex items-center gap-4 pt-6">
                <div className="flex items-center gap-2">
                  <input id="bookable" type="checkbox" className="h-4 w-4 rounded border-gray-300" checked={form.bookable} onChange={(e) => updateField('bookable', e.target.checked)} />
                  <label htmlFor="bookable" className="text-sm text-gray-700">允许预约</label>
                </div>
                <div className="flex items-center gap-2">
                  <input id="isActive" type="checkbox" className="h-4 w-4 rounded border-gray-300" checked={form.isActive} onChange={(e) => updateField('isActive', e.target.checked)} />
                  <label htmlFor="isActive" className="text-sm text-gray-700">启用</label>
                </div>
              </div>
            </div>
          </section>

          <section>
            <h3 className="mb-3 text-sm font-semibold text-gray-900">定价</h3>
            <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
              <Input label="每小时价格 (¥)" type="number" min={0} step="0.01" value={form.hourlyRate} onChange={(e) => updateField('hourlyRate', e.target.value)} />
              <Input label="每天价格 (¥)" type="number" min={0} step="0.01" value={form.dailyRate} onChange={(e) => updateField('dailyRate', e.target.value)} />
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

function buildFormState(data?: Equipment | null): any {
  if (!data) {
    return {
      nameZh: '', nameEn: '', model: '', manufacturer: '', labId: '',
      descZh: '', descEn: '', imagesJson: '', videoUrl: '', usageInstructions: '',
      lastCalibratedAt: '', nextCalibrationDue: '', calibrationCertificateUrl: '',
      specificationsJson: '', certificationsJson: '',
      status: 'AVAILABLE', bookable: false, isActive: true,
      quantity: '1', hourlyRate: '', dailyRate: '', serviceIds: [],
    };
  }

  return {
    nameZh: data.nameZh || '', nameEn: data.nameEn || '', model: data.model || '',
    manufacturer: data.manufacturer || '', labId: data.labId || '',
    descZh: data.descZh || '', descEn: data.descEn || '',
    imagesJson: safeJsonStringify(data.images),
    videoUrl: data.videoUrl || '', usageInstructions: data.usageInstructions || '',
    lastCalibratedAt: data.lastCalibratedAt ? data.lastCalibratedAt.slice(0, 10) : '',
    nextCalibrationDue: data.nextCalibrationDue ? data.nextCalibrationDue.slice(0, 10) : '',
    calibrationCertificateUrl: data.calibrationCertificateUrl || '',
    specificationsJson: safeJsonStringify(data.specifications),
    certificationsJson: safeJsonStringify(data.certifications),
    status: data.status || 'AVAILABLE',
    bookable: data.bookable ?? false,
    isActive: data.isActive ?? true,
    quantity: String(data.quantity ?? 1),
    hourlyRate: data.hourlyRate !== undefined && data.hourlyRate !== null ? String(data.hourlyRate) : '',
    dailyRate: data.dailyRate !== undefined && data.dailyRate !== null ? String(data.dailyRate) : '',
    serviceIds: data.services?.map((s) => s.serviceId) || [],
  };
}
