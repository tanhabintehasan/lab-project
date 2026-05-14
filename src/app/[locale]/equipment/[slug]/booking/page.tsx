'use client';

import { useEffect, useMemo, useState } from 'react';
import { useTranslations } from 'next-intl';
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
  Loader2,
} from 'lucide-react';

interface EquipmentDetail {
  id: string;
  slug: string;
  nameZh: string;
  model?: string;
  manufacturer?: string;
  descZh?: string;
  status: string;
  bookable?: boolean;
  quantity?: number;
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

interface TimeSlot {
  start: string;
  end: string;
}

interface AvailabilityData {
  availableSlots: TimeSlot[];
  labHours?: { open: string; close: string } | null;
  reason?: string;
}

const statusMap = (t: (key: string) => string): Record<
  string,
  { label: string; variant: 'success' | 'warning' | 'danger' | 'default' }
> => ({
  AVAILABLE: { label: t('statusBookable'), variant: 'success' },
  IN_USE: { label: t('statusInUse'), variant: 'warning' },
  MAINTENANCE: { label: t('statusMaintenance'), variant: 'danger' },
  UNAVAILABLE: { label: t('statusUnavailable'), variant: 'default' },
});

function getToday() {
  return new Date().toISOString().split('T')[0];
}

export default function EquipmentBookingPage() {
  const t = useTranslations('booking');
  const tEquip = useTranslations('equipment');
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
  const [availability, setAvailability] = useState<AvailabilityData | null>(null);
  const [availabilityLoading, setAvailabilityLoading] = useState(false);

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

  // Fetch availability when date or equipment changes
  useEffect(() => {
    if (!equipment?.id || !form.bookingDate) return;

    let mounted = true;
    setAvailabilityLoading(true);

    fetch(`/api/bookings/availability?equipmentId=${equipment.id}&date=${form.bookingDate}`, {
      credentials: 'include',
    })
      .then(r => r.json())
      .then(data => {
        if (!mounted) return;
        if (data?.success) {
          setAvailability(data.data);
        } else {
          setAvailability({ availableSlots: [], reason: data?.error });
        }
      })
      .catch(() => {
        if (mounted) setAvailability({ availableSlots: [], reason: 'Failed to load availability' });
      })
      .finally(() => {
        if (mounted) setAvailabilityLoading(false);
      });

    return () => { mounted = false; };
  }, [equipment?.id, form.bookingDate]);

  const statusInfo = useMemo(() => {
    if (!equipment?.status) return statusMap(tEquip).UNAVAILABLE;
    return statusMap(tEquip)[equipment.status] || statusMap(tEquip).UNAVAILABLE;
  }, [equipment?.status, tEquip]);

  const canSubmit = Boolean(equipment?.bookable) && equipment?.status === 'AVAILABLE';

  const updateField = (field: keyof BookingFormState, value: string) => {
    setForm(prev => ({ ...prev, [field]: value }));
    setErrors(prev => ({ ...prev, [field]: '' }));
    setSubmitError('');
  };

  const selectTimeSlot = (slot: TimeSlot) => {
    setForm(prev => ({ ...prev, startTime: slot.start, endTime: slot.end }));
    setErrors(prev => ({ ...prev, startTime: '', endTime: '' }));
  };

  const validateForm = () => {
    const nextErrors: Partial<Record<keyof BookingFormState, string>> = {};

    if (!form.bookingDate) nextErrors.bookingDate = t('errorDateRequired');
    if (!form.startTime) nextErrors.startTime = t('errorStartTimeRequired');
    if (!form.endTime) nextErrors.endTime = t('errorEndTimeRequired');
    if (!form.contactName.trim()) nextErrors.contactName = t('errorContactNameRequired');
    if (!form.contactPhone.trim()) nextErrors.contactPhone = t('errorContactPhoneRequired');
    if (!form.purpose.trim()) nextErrors.purpose = t('errorPurposeRequired');

    if (form.startTime && form.endTime && form.startTime >= form.endTime) {
      nextErrors.endTime = t('errorEndTimeAfterStart');
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
        setSubmitError(data?.error || t('submitFailed'));
        return;
      }

      setSubmitSuccess(t('submitSuccess'));
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
          <p className="text-gray-500">{t('notFound')}</p>
          <Link href="/equipment">
            <Button variant="outline" className="mt-4">
              <ArrowLeft className="h-4 w-4" />
              {t('backToList')}
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
          {t('backToDetail')}
        </Link>

        <div className="mb-6">
          <h1 className="text-3xl font-bold text-gray-900">{t('title')}</h1>
          <p className="text-gray-500 mt-2">{t('subtitle')}</p>
        </div>

        <div className="grid lg:grid-cols-[1.1fr_0.9fr] gap-6">
          <Card padding="lg" className="space-y-5">
            <div className="flex items-center justify-between">
              <h2 className="text-xl font-semibold text-gray-900">{t('bookingInfo')}</h2>
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
                label={t('bookingDate')}
                min={getToday()}
                value={form.bookingDate}
                onChange={e => updateField('bookingDate', e.target.value)}
                error={errors.bookingDate}
                required
              />

              <Input
                id="serviceName"
                label={t('serviceProject')}
                placeholder={t('serviceProjectPlaceholder')}
                value={form.serviceName}
                onChange={e => updateField('serviceName', e.target.value)}
                hint={t('serviceProjectHint')}
              />

              <Input
                id="startTime"
                type="time"
                label={t('startTime')}
                value={form.startTime}
                onChange={e => updateField('startTime', e.target.value)}
                error={errors.startTime}
                required
              />

              <Input
                id="endTime"
                type="time"
                label={t('endTime')}
                value={form.endTime}
                onChange={e => updateField('endTime', e.target.value)}
                error={errors.endTime}
                required
              />

              <Input
                id="contactName"
                label={t('contactName')}
                placeholder={t('contactNamePlaceholder')}
                value={form.contactName}
                onChange={e => updateField('contactName', e.target.value)}
                error={errors.contactName}
                required
              />

              <Input
                id="contactPhone"
                label={t('contactPhone')}
                placeholder={t('contactPhonePlaceholder')}
                value={form.contactPhone}
                onChange={e => updateField('contactPhone', e.target.value)}
                error={errors.contactPhone}
                required
              />
            </div>

            <Textarea
              id="purpose"
              label={t('purpose')}
              placeholder={t('purposePlaceholder')}
              value={form.purpose}
              onChange={e => updateField('purpose', e.target.value)}
              error={errors.purpose}
              required
            />

            <Textarea
              id="notes"
              label={t('notes')}
              placeholder={t('notesPlaceholder')}
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
                {t('submit')}
              </Button>

              <Link href="/dashboard/bookings">
                <Button size="lg" variant="outline">
                  {t('viewMyBookings')}
                </Button>
              </Link>
            </div>

            {!canSubmit ? (
              <p className="text-sm text-amber-600">
                {t('notBookable')}
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
                  <p className="text-sm text-gray-500">{t('equipmentLabel')}</p>
                  <h2 className="text-xl font-bold text-gray-900 mt-1">{equipment.nameZh}</h2>
                </div>

                {equipment.model ? (
                  <div className="text-sm text-gray-600">{tEquip('model')}：{equipment.model}</div>
                ) : null}

                {equipment.manufacturer ? (
                  <div className="text-sm text-gray-600">{tEquip('usageGuide')}：{equipment.manufacturer}</div>
                ) : null}

                {equipment.lab ? (
                  <div className="text-sm text-gray-600">
                    {tEquip('belongsToLab')}：
                    <Link
                      href={`/labs/${equipment.lab.slug}`}
                      className="text-blue-600 hover:underline ml-1"
                    >
                      {equipment.lab.nameZh}
                    </Link>
                    {equipment.lab.city ? <span className="text-gray-400 ml-1">· {equipment.lab.city}</span> : null}
                  </div>
                ) : null}

                <div className="text-sm text-gray-600">{tEquip('quantity')}：{equipment.quantity ?? 1}</div>

                {(equipment.hourlyRate || equipment.dailyRate) ? (
                  <div className="flex flex-wrap gap-3 pt-1 text-sm">
                    {equipment.hourlyRate ? (
                      <span className="rounded-full bg-blue-50 text-blue-700 px-3 py-1">
                        ¥{String(equipment.hourlyRate)}{tEquip('hourlyRate')}
                      </span>
                    ) : null}
                    {equipment.dailyRate ? (
                      <span className="rounded-full bg-green-50 text-green-700 px-3 py-1">
                        ¥{String(equipment.dailyRate)}{tEquip('dailyRate')}
                      </span>
                    ) : null}
                  </div>
                ) : null}
              </div>
            </Card>

            {/* Availability Panel */}
            <Card padding="lg">
              <h3 className="text-base font-semibold text-gray-900 mb-4 flex items-center gap-2">
                <Clock3 className="h-4 w-4 text-blue-600" />
                Availability on {form.bookingDate}
              </h3>

              {availabilityLoading ? (
                <div className="flex items-center gap-2 text-sm text-gray-500">
                  <Loader2 className="h-4 w-4 animate-spin" />
                  Checking availability...
                </div>
              ) : !availability ? (
                <p className="text-sm text-gray-400">Select a date to see available slots.</p>
              ) : availability.reason && availability.availableSlots.length === 0 ? (
                <div className="rounded-lg bg-amber-50 border border-amber-200 px-3 py-2 text-sm text-amber-700">
                  {availability.reason}
                </div>
              ) : availability.availableSlots.length === 0 ? (
                <div className="rounded-lg bg-gray-50 border border-gray-200 px-3 py-2 text-sm text-gray-500">
                  No available slots for this date.
                </div>
              ) : (
                <div className="space-y-3">
                  {availability.labHours && (
                    <p className="text-xs text-gray-500">
                      Lab hours: {availability.labHours.open} - {availability.labHours.close}
                    </p>
                  )}
                  <div className="flex flex-wrap gap-2">
                    {availability.availableSlots.map((slot, idx) => {
                      const isSelected = form.startTime === slot.start && form.endTime === slot.end;
                      return (
                        <button
                          key={idx}
                          onClick={() => selectTimeSlot(slot)}
                          className={`px-3 py-1.5 rounded-lg text-xs font-medium border transition-colors ${
                            isSelected
                              ? 'bg-blue-600 text-white border-blue-600'
                              : 'bg-white text-gray-700 border-gray-200 hover:bg-blue-50 hover:border-blue-300'
                          }`}
                        >
                          {slot.start} - {slot.end}
                        </button>
                      );
                    })}
                  </div>
                </div>
              )}
            </Card>

            <Card padding="lg">
              <h3 className="text-base font-semibold text-gray-900 mb-4">{t('bookingNotes')}</h3>

              <div className="space-y-4 text-sm text-gray-600">
                <div className="flex gap-3">
                  <CalendarDays className="h-4 w-4 text-blue-600 mt-0.5 flex-shrink-0" />
                  <p>{t('note1')}</p>
                </div>
                <div className="flex gap-3">
                  <Clock3 className="h-4 w-4 text-blue-600 mt-0.5 flex-shrink-0" />
                  <p>{t('note2')}</p>
                </div>
                <div className="flex gap-3">
                  <ShieldCheck className="h-4 w-4 text-blue-600 mt-0.5 flex-shrink-0" />
                  <p>{t('note3')}</p>
                </div>
              </div>
            </Card>

            {equipment.descZh ? (
              <Card padding="lg">
                <h3 className="text-base font-semibold text-gray-900 mb-3">{t('equipmentIntro')}</h3>
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
