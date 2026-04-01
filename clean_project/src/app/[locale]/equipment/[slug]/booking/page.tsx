'use client';

import { useEffect, useMemo, useState } from 'react';
import { useParams } from 'next/navigation';
import { Header } from '@/components/layout/header';
import { Footer } from '@/components/layout/footer';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Skeleton } from '@/components/ui/skeleton';
import { Link, useRouter } from '@/i18n/routing';
import {
  ArrowLeft,
  CalendarDays,
  Clock3,
  Wrench,
  ShieldCheck,
  AlertCircle,
} from 'lucide-react';

interface EquipmentDetail {
  id: string;
  slug: string;
  nameZh: string;
  nameEn?: string;
  model?: string;
  manufacturer?: string;
  descZh?: string;
  status: string;
  bookable?: boolean;
  hourlyRate?: string | number;
  dailyRate?: string | number;
  lab?: {
    id: string;
    nameZh: string;
    slug: string;
    city?: string;
  } | null;
}

interface AuthUser {
  id: string;
  email: string;
  role: string;
  name: string;
}

interface BookingFormState {
  bookingDate: string;
  startTime: string;
  endTime: string;
  contactName: string;
  contactPhone: string;
  serviceName: string;
  purpose: string;
  notes: string;
}

const statusMap: Record<
  string,
  { label: string; variant: 'success' | 'warning' | 'danger' | 'default' }
> = {
  AVAILABLE: { label: '可预约', variant: 'success' },
  IN_USE: { label: '使用中', variant: 'warning' },
  MAINTENANCE: { label: '维护中', variant: 'danger' },
  UNAVAILABLE: { label: '不可用', variant: 'default' },
};

function getToday() {
  return new Date().toISOString().split('T')[0];
}

export default function EquipmentBookingPage() {
  const params = useParams();
  const router = useRouter();
  const slug = String(params.slug);

  const [equipment, setEquipment] = useState<EquipmentDetail | null>(null);
  const [user, setUser] = useState<AuthUser | null>(null);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [submitSuccess, setSubmitSuccess] = useState('');
  const [submitError, setSubmitError] = useState('');

  const [form, setForm] = useState<BookingFormState>({
    bookingDate: getToday(),
    startTime: '09:00',
    endTime: '10:00',
    contactName: '',
    contactPhone: '',
    serviceName: '',
    purpose: '',
    notes: '',
  });

  const [errors, setErrors] = useState<Partial<Record<keyof BookingFormState, string>>>({});

  useEffect(() => {
    let mounted = true;

    async function bootstrap() {
      try {
        setLoading(true);

        const [equipmentRes, meRes] = await Promise.all([
          fetch(`/api/equipment/${slug}`, {
            credentials: 'include',
            cache: 'no-store',
          }),
          fetch('/api/auth/me', {
            credentials: 'include',
            cache: 'no-store',
          }),
        ]);

        const equipmentJson = await equipmentRes.json().catch(() => null);
        const meJson = await meRes.json().catch(() => null);

        if (!mounted) return;

        if (equipmentJson?.success) {
          setEquipment(equipmentJson.data);
        }

        if (meJson?.success) {
          setUser(meJson.data);
          setForm(prev => ({
            ...prev,
            contactName: prev.contactName || meJson.data.name || '',
          }));
        }
      } finally {
        if (mounted) setLoading(false);
      }
    }

    bootstrap();

    return () => {
      mounted = false;
    };
  }, [slug]);

  const statusInfo = useMemo(() => {
    if (!equipment?.status) return statusMap.UNAVAILABLE;
    return statusMap[equipment.status] || statusMap.UNAVAILABLE;
  }, [equipment?.status]);

  const canSubmit = Boolean(equipment?.bookable) && equipment?.status === 'AVAILABLE';

  const updateField = (field: keyof BookingFormState, value: string) => {
    setForm(prev => ({ ...prev, [field]: value }));
    setErrors(prev => ({ ...prev, [field]: '' }));
    setSubmitError('');
  };

  const validateForm = () => {
    const nextErrors: Partial<Record<keyof BookingFormState, string>> = {};

    if (!form.bookingDate) nextErrors.bookingDate = '请选择预约日期';
    if (!form.startTime) nextErrors.startTime = '请选择开始时间';
    if (!form.endTime) nextErrors.endTime = '请选择结束时间';
    if (!form.contactName.trim()) nextErrors.contactName = '请输入联系人姓名';
    if (!form.contactPhone.trim()) nextErrors.contactPhone = '请输入联系电话';
    if (!form.purpose.trim()) nextErrors.purpose = '请填写预约用途';

    if (form.startTime && form.endTime && form.startTime >= form.endTime) {
      nextErrors.endTime = '结束时间必须晚于开始时间';
    }

    setErrors(nextErrors);
    return Object.keys(nextErrors).length === 0;
  };

  const handleSubmit = async () => {
    if (!equipment) return;
    if (!validateForm()) return;

    try {
      setSubmitting(true);
      setSubmitError('');
      setSubmitSuccess('');

      const res = await fetch('/api/bookings', {
        method: 'POST',
        credentials: 'include',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          equipmentId: equipment.id,
          bookingDate: form.bookingDate,
          startTime: form.startTime,
          endTime: form.endTime,
          contactName: form.contactName.trim(),
          contactPhone: form.contactPhone.trim(),
          serviceName: form.serviceName.trim() || null,
          purpose: form.purpose.trim(),
          notes: form.notes.trim() || null,
        }),
      });

      const data = await res.json().catch(() => null);

      if (res.status === 401) {
        router.push('/auth/login');
        return;
      }

      if (!res.ok || !data?.success) {
        setSubmitError(data?.error || '预约提交失败，请稍后重试');
        return;
      }

      setSubmitSuccess('预约已提交，等待管理员审核');
      setTimeout(() => {
        router.push('/dashboard/bookings');
      }, 800);
    } catch (error) {
      console.error('Create booking failed:', error);
      setSubmitError('预约提交失败，请稍后重试');
    } finally {
      setSubmitting(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen">
        <Header />
        <div className="max-w-5xl mx-auto px-4 py-10 space-y-4">
          <Skeleton className="h-8 w-48" />
          <div className="grid lg:grid-cols-[1.1fr_0.9fr] gap-6">
            <Skeleton className="h-[520px] w-full rounded-xl" />
            <Skeleton className="h-[520px] w-full rounded-xl" />
          </div>
        </div>
        <Footer />
      </div>
    );
  }

  if (!equipment) {
    return (
      <div className="min-h-screen">
        <Header />
        <div className="max-w-4xl mx-auto px-4 py-16 text-center">
          <p className="text-gray-500">设备未找到</p>
          <Link href="/equipment">
            <Button variant="outline" className="mt-4">
              <ArrowLeft className="h-4 w-4" />
              返回设备列表
            </Button>
          </Link>
        </div>
        <Footer />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <Header />

      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <Link
          href={`/equipment/${equipment.slug}`}
          className="inline-flex items-center gap-1 text-sm text-gray-500 hover:text-gray-700 mb-6"
        >
          <ArrowLeft className="h-4 w-4" />
          返回设备详情
        </Link>

        <div className="mb-6">
          <h1 className="text-3xl font-bold text-gray-900">预约设备</h1>
          <p className="text-gray-500 mt-2">填写预约信息后，提交审核并等待确认</p>
        </div>

        <div className="grid lg:grid-cols-[1.1fr_0.9fr] gap-6">
          <Card padding="lg" className="space-y-5">
            <div className="flex items-center justify-between">
              <h2 className="text-xl font-semibold text-gray-900">预约信息</h2>
              <Badge variant={statusInfo.variant}>{statusInfo.label}</Badge>
            </div>

            {submitError ? (
              <div className="rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700 flex items-start gap-2">
                <AlertCircle className="h-4 w-4 mt-0.5 flex-shrink-0" />
                <span>{submitError}</span>
              </div>
            ) : null}

            {submitSuccess ? (
              <div className="rounded-lg border border-green-200 bg-green-50 px-4 py-3 text-sm text-green-700 flex items-start gap-2">
                <ShieldCheck className="h-4 w-4 mt-0.5 flex-shrink-0" />
                <span>{submitSuccess}</span>
              </div>
            ) : null}

            <div className="grid sm:grid-cols-2 gap-4">
              <Input
                id="bookingDate"
                type="date"
                label="预约日期"
                min={getToday()}
                value={form.bookingDate}
                onChange={e => updateField('bookingDate', e.target.value)}
                error={errors.bookingDate}
                required
              />

              <Input
                id="serviceName"
                label="关联服务 / 项目"
                placeholder="如：材料成分分析、样品前处理"
                value={form.serviceName}
                onChange={e => updateField('serviceName', e.target.value)}
                hint="选填，用于帮助管理员理解预约场景"
              />

              <Input
                id="startTime"
                type="time"
                label="开始时间"
                value={form.startTime}
                onChange={e => updateField('startTime', e.target.value)}
                error={errors.startTime}
                required
              />

              <Input
                id="endTime"
                type="time"
                label="结束时间"
                value={form.endTime}
                onChange={e => updateField('endTime', e.target.value)}
                error={errors.endTime}
                required
              />

              <Input
                id="contactName"
                label="联系人"
                placeholder="请输入联系人姓名"
                value={form.contactName}
                onChange={e => updateField('contactName', e.target.value)}
                error={errors.contactName}
                required
              />

              <Input
                id="contactPhone"
                label="联系电话"
                placeholder="请输入联系电话"
                value={form.contactPhone}
                onChange={e => updateField('contactPhone', e.target.value)}
                error={errors.contactPhone}
                required
              />
            </div>

            <Textarea
              id="purpose"
              label="预约用途"
              placeholder="请简要说明实验内容、使用目的或样品情况"
              value={form.purpose}
              onChange={e => updateField('purpose', e.target.value)}
              error={errors.purpose}
              required
            />

            <Textarea
              id="notes"
              label="备注"
              placeholder="如有特殊准备要求、耗材需求、进场说明等，请填写"
              value={form.notes}
              onChange={e => updateField('notes', e.target.value)}
            />

            <div className="flex flex-wrap gap-3 pt-2">
              <Button
                size="lg"
                onClick={handleSubmit}
                loading={submitting}
                disabled={!canSubmit}
              >
                <CalendarDays className="h-4 w-4" />
                提交预约
              </Button>

              <Link href="/dashboard/bookings">
                <Button size="lg" variant="outline">
                  查看我的预约
                </Button>
              </Link>
            </div>

            {!canSubmit ? (
              <p className="text-sm text-amber-600">
                当前设备暂不可预约，请联系管理员或稍后再试。
              </p>
            ) : null}
          </Card>

          <div className="space-y-6">
            <Card padding="lg">
              <div className="flex items-center justify-center h-48 rounded-xl bg-gray-100 mb-5">
                <Wrench className="h-14 w-14 text-gray-300" />
              </div>

              <div className="space-y-3">
                <div>
                  <p className="text-sm text-gray-500">预约设备</p>
                  <h2 className="text-xl font-bold text-gray-900 mt-1">{equipment.nameZh}</h2>
                  {equipment.nameEn ? (
                    <p className="text-sm text-gray-500 mt-1">{equipment.nameEn}</p>
                  ) : null}
                </div>

                {equipment.model ? (
                  <div className="text-sm text-gray-600">型号：{equipment.model}</div>
                ) : null}

                {equipment.manufacturer ? (
                  <div className="text-sm text-gray-600">制造商：{equipment.manufacturer}</div>
                ) : null}

                {equipment.lab ? (
                  <div className="text-sm text-gray-600">
                    所属实验室：
                    <Link
                      href={`/labs/${equipment.lab.slug}`}
                      className="text-blue-600 hover:underline ml-1"
                    >
                      {equipment.lab.nameZh}
                    </Link>
                    {equipment.lab.city ? <span className="text-gray-400 ml-1">· {equipment.lab.city}</span> : null}
                  </div>
                ) : null}

                {(equipment.hourlyRate || equipment.dailyRate) ? (
                  <div className="flex flex-wrap gap-3 pt-1 text-sm">
                    {equipment.hourlyRate ? (
                      <span className="rounded-full bg-blue-50 text-blue-700 px-3 py-1">
                        ¥{String(equipment.hourlyRate)}/小时
                      </span>
                    ) : null}
                    {equipment.dailyRate ? (
                      <span className="rounded-full bg-green-50 text-green-700 px-3 py-1">
                        ¥{String(equipment.dailyRate)}/天
                      </span>
                    ) : null}
                  </div>
                ) : null}
              </div>
            </Card>

            <Card padding="lg">
              <h3 className="text-base font-semibold text-gray-900 mb-4">预约说明</h3>

              <div className="space-y-4 text-sm text-gray-600">
                <div className="flex gap-3">
                  <CalendarDays className="h-4 w-4 text-blue-600 mt-0.5 flex-shrink-0" />
                  <p>预约提交后将进入审核流程，管理员确认后方可生效。</p>
                </div>
                <div className="flex gap-3">
                  <Clock3 className="h-4 w-4 text-blue-600 mt-0.5 flex-shrink-0" />
                  <p>请确保开始时间和结束时间准确，避免与已有预约冲突。</p>
                </div>
                <div className="flex gap-3">
                  <ShieldCheck className="h-4 w-4 text-blue-600 mt-0.5 flex-shrink-0" />
                  <p>如涉及样品前处理、特殊耗材或实验辅助，请在备注中说明。</p>
                </div>
              </div>
            </Card>

            {equipment.descZh ? (
              <Card padding="lg">
                <h3 className="text-base font-semibold text-gray-900 mb-3">设备简介</h3>
                <p className="text-sm text-gray-600 leading-6">{equipment.descZh}</p>
              </Card>
            ) : null}
          </div>
        </div>
      </div>

      <Footer />
    </div>
  );
}