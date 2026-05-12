'use client';

import { useEffect, useMemo, useState } from 'react';
import { useSearchParams } from 'next/navigation';
import { useTranslations } from 'next-intl';
import { Header } from '@/components/layout/header';
import { Footer } from '@/components/layout/footer';
import { Link, useRouter } from '@/i18n/routing';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import {
  ArrowLeft,
  BadgeCheck,
  Clock,
  CreditCard,
  FileText,
  FlaskConical,
  Shield,
  Wallet,
  Boxes,
  BookOpen,
  Factory,
  User,
  Mail,
  Phone,
  Building,
  Hash,
  ClipboardList,
  Beaker,
  Ruler,
  FileCheck,
  Truck,
  Info,
  MapPin,
} from 'lucide-react';
import { formatCurrency } from '@/lib/utils';

type ServiceCategory = {
  id?: string;
  slug?: string;
  nameZh?: string;
  // nameEn removed - Chinese only
};

type NamedItem = {
  id?: string;
  slug?: string;
  code?: string;
  nameZh?: string;
  // nameEn removed - Chinese only
};

type ServiceData = {
  id?: string;
  slug?: string;
  categoryId?: string;
  nameZh?: string;
  // English fields removed - Chinese only
  shortDescZh?: string | null;
  fullDescZh?: string | null;
  priceMin?: number | string | null;
  priceMax?: number | string | null;
  currency?: string | null;
  turnaroundDays?: number | string | null;
  turnaroundDesc?: string | null;
  sampleRequirement?: string | null;
  sampleCount?: string | null;
  sampleSize?: string | null;
  sampleWeight?: string | null;
  sampleCondition?: string | null;
  samplePreservation?: string | null;
  samplePreparation?: string | null;
  isActive?: boolean;
  isFeatured?: boolean;
  isHot?: boolean;
  orderCount?: number | string | null;
  category?: ServiceCategory | null;
  materials?: NamedItem[] | null;
  industries?: NamedItem[] | null;
  standards?: NamedItem[] | null;
  customFields?: Array<{
    id: string;
    label: string;
    fieldType: string;
    options?: string | null;
    isRequired: boolean;
    placeholder?: string | null;
  }> | null;
};

function toNumber(value: unknown, fallback = 0): number {
  if (typeof value === 'number' && !Number.isNaN(value)) return value;
  if (typeof value === 'string') {
    const parsed = Number(value);
    if (!Number.isNaN(parsed)) return parsed;
  }
  return fallback;
}

function extractServiceItems(payload: any): ServiceData[] {
  if (Array.isArray(payload)) return payload;
  if (Array.isArray(payload?.data)) return payload.data;
  if (Array.isArray(payload?.data?.data)) return payload.data.data;
  return [];
}

function extractTotalPages(payload: any): number {
  if (typeof payload?.totalPages === 'number' && payload.totalPages > 0) {
    return payload.totalPages;
  }
  if (typeof payload?.data?.totalPages === 'number' && payload.data.totalPages > 0) {
    return payload.data.totalPages;
  }
  return 1;
}

export default function CheckoutPage() {
  const t = useTranslations('checkout');
  const router = useRouter();
  const searchParams = useSearchParams();
  const serviceSlug = searchParams.get('service') || '';

  const [service, setService] = useState<ServiceData | null>(null);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState('');

  const [form, setForm] = useState({
    quantity: 1,
    sampleCount: 1,
    sampleName: '',
    sampleSpec: '',
    testRequirement: '',
    contactName: '',
    contactEmail: '',
    contactPhone: '',
    companyName: '',
    remarks: '',
    needInvoice: false,
    invoiceTitle: '',
    customFieldValues: {} as Record<string, string>,
  });

  useEffect(() => {
    if (!serviceSlug) {
      setLoading(false);
      setError(t('missingParam'));
      return;
    }

    const loadService = async () => {
      try {
        setLoading(true);
        setError('');

        let currentPage = 1;
        let totalPages = 1;
        let matched: ServiceData | null = null;

        while (currentPage <= totalPages && !matched) {
          const res = await fetch(`/api/services?page=${currentPage}&pageSize=100`, {
            credentials: 'include',
            cache: 'no-store',
          });

          const data = await res.json();

          if (!res.ok || !data?.success) {
            setError(data?.error || t('loadFailed'));
            return;
          }

          const items = extractServiceItems(data);
          totalPages = extractTotalPages(data);

          matched =
            items.find((item) => item.slug === serviceSlug) ||
            items.find((item) => item.id === serviceSlug) ||
            null;

          currentPage += 1;
        }

        if (!matched) {
          setError(t('serviceNotFound'));
          return;
        }

        setService(matched);
      } catch (err) {
        console.error('Load checkout service error:', err);
        setError(t('loadFailed'));
      } finally {
        setLoading(false);
      }
    };

    loadService();
  }, [serviceSlug]);

  const nameZh = service?.nameZh || '';
  const category = service?.category || null;
  const shortDescZh = service?.shortDescZh || '';
  const fullDescZh = service?.fullDescZh || '';
  const sampleRequirement = service?.sampleRequirement || '';
  const serviceSampleCount = service?.sampleCount as string | undefined;
  const serviceSampleSize = service?.sampleSize as string | undefined;
  const serviceSampleWeight = service?.sampleWeight as string | undefined;
  const serviceSampleCondition = service?.sampleCondition as string | undefined;
  const serviceSamplePreservation = service?.samplePreservation as string | undefined;
  const serviceSamplePreparation = service?.samplePreparation as string | undefined;
  const turnaroundDesc = service?.turnaroundDesc || '';
  const turnaroundDays = service?.turnaroundDays;
  const currency = service?.currency || 'CNY';
  const priceMin = service?.priceMin;
  const priceMax = service?.priceMax;
  const orderCount = toNumber(service?.orderCount, 0);

  const materials = service?.materials || [];
  const industries = service?.industries || [];
  const standards = service?.standards || [];

  const unitPrice = useMemo(() => {
    if (priceMin === undefined || priceMin === null || priceMin === '') return 0;
    return toNumber(priceMin, 0);
  }, [priceMin]);

  const maxPrice = useMemo(() => {
    if (priceMax === undefined || priceMax === null || priceMax === '') return unitPrice;
    return toNumber(priceMax, unitPrice);
  }, [priceMax, unitPrice]);

  const subtotal = useMemo(() => unitPrice * form.quantity, [unitPrice, form.quantity]);
  const serviceFee = useMemo(() => 0, []);
  const totalAmount = useMemo(() => subtotal + serviceFee, [subtotal, serviceFee]);

  const handleBack = () => {
    if (typeof window !== 'undefined' && window.history.length > 1) {
      router.back();
    } else if (serviceSlug) {
      router.push(`/services/${serviceSlug}`);
    } else {
      router.push('/services');
    }
  };

  const handleSubmit = async () => {
    if (!service) return;

    if (!form.contactName.trim()) {
      setError(t('validation.nameRequired'));
      return;
    }

    if (!form.contactEmail.trim()) {
      setError(t('validation.emailRequired'));
      return;
    }

    if (!form.contactPhone.trim()) {
      setError(t('validation.phoneRequired'));
      return;
    }

    if (!form.sampleName.trim()) {
      setError(t('validation.sampleNameRequired'));
      return;
    }

    if (!form.sampleSpec.trim()) {
      setError(t('validation.sampleSpecRequired'));
      return;
    }

    if (!form.testRequirement.trim()) {
      setError(t('validation.testRequirementRequired'));
      return;
    }

    // Validate required custom fields
    const missingCustomFields = (service?.customFields || []).filter(
      (f) => f.isRequired && !form.customFieldValues[f.id]?.trim()
    );
    if (missingCustomFields.length > 0) {
      setError(`请填写必填的检测项：${missingCustomFields.map((f) => f.label).join('、')}`);
      return;
    }

    try {
      setSubmitting(true);
      setError('');

      const res = await fetch('/api/orders', {
        method: 'POST',
        credentials: 'include',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          serviceSlug,
          quantity: form.quantity,
          sampleCount: form.sampleCount,
          sampleName: form.sampleName.trim(),
          sampleSpec: form.sampleSpec.trim(),
          testRequirement: form.testRequirement.trim(),
          contactName: form.contactName.trim(),
          contactEmail: form.contactEmail.trim(),
          contactPhone: form.contactPhone.trim(),
          companyName: form.companyName.trim() || null,
          remarks: form.remarks.trim() || null,
          needInvoice: form.needInvoice,
          invoiceTitle: form.needInvoice ? form.invoiceTitle.trim() || null : null,
          unitPrice,
          totalAmount,
          currency,
          customFieldValues: Object.keys(form.customFieldValues).length > 0 ? form.customFieldValues : undefined,
        }),
      });

      const data = await res.json();

      if (res.status === 401) {
        router.push(`/auth/login?redirect=/checkout?service=${serviceSlug}`);
        return;
      }

      if (!res.ok || !data?.success) {
        setError(data?.error || t('orderFailed'));
        return;
      }

      if (data?.data?.paymentUrl) {
        window.location.href = data.data.paymentUrl;
        return;
      }

      if (data?.data?.orderId) {
        router.push(`/dashboard/orders/${data.data.orderId}`);
        return;
      }

      router.push('/dashboard/orders');
    } catch (err) {
      console.error('Checkout submit error:', err);
      setError(t('orderFailed'));
    } finally {
      setSubmitting(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-slate-50">
        <Header />
        <div className="mx-auto max-w-6xl space-y-4 px-4 py-10">
          <Skeleton className="h-8 w-40" />
          <Skeleton className="h-12 w-72" />
          <Skeleton className="h-80 w-full rounded-3xl" />
        </div>
        <Footer />
      </div>
    );
  }

  if (!service) {
    return (
      <div className="min-h-screen bg-slate-50">
        <Header />
        <div className="mx-auto max-w-4xl px-4 py-16 text-center">
          <h1 className="mb-4 text-2xl font-bold text-gray-900">{t('cannotCheckout')}</h1>
          <p className="mb-6 text-gray-600">{error || t('serviceNotFound')}</p>
          <Button variant="outline" onClick={handleBack}>
            <ArrowLeft className="h-4 w-4" />
            {t('back')}
          </Button>
        </div>
        <Footer />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-50">
      <Header />

      <div className="border-b border-gray-200 bg-white">
        <div className="mx-auto max-w-6xl px-4 py-3">
          <div className="flex flex-wrap items-center gap-2 text-sm text-gray-500">
            <button
              type="button"
              onClick={handleBack}
              className="mr-3 inline-flex items-center gap-1 hover:text-[#0066B3]"
            >
              <ArrowLeft className="h-4 w-4" />
              {t('back')}
            </button>
            <Link href="/" className="hover:text-[#0066B3]">
              {t('home')}
            </Link>
            <span>/</span>
            <Link href="/services" className="hover:text-[#0066B3]">
              {t('testingServices')}
            </Link>
            <span>/</span>
            <Link href={`/services/${serviceSlug}`} className="hover:text-[#0066B3]">
              {nameZh}
            </Link>
            <span>/</span>
            <span className="text-gray-900">{t('title')}</span>
          </div>
        </div>
      </div>

      <div className="mx-auto max-w-6xl px-4 py-8">
        <div className="grid gap-8 lg:grid-cols-[1.35fr_0.85fr]">
          <div className="space-y-6">
            {/* Service Info Card */}
            <Card padding="lg" className="rounded-3xl border-l-4 border-l-[#0066B3]">
              <div className="mb-5 flex items-start justify-between gap-4">
                <div>
                  <div className="mb-2 flex flex-wrap items-center gap-2">
                    {category ? <Badge variant="outline">{category.nameZh}</Badge> : null}
                    <span className="inline-flex items-center gap-1 rounded-full bg-emerald-50 px-3 py-1 text-xs font-medium text-emerald-600">
                      <BadgeCheck className="h-3.5 w-3.5" />
                      {t('availableForOrder')}
                    </span>
                  </div>
                  <h1 className="text-2xl font-bold text-gray-900">{nameZh}</h1>
                  <p className="mt-2 text-sm leading-6 text-gray-600">
                    {shortDescZh || t('confirmOrderDesc')}
                  </p>
                </div>

                <div className="hidden rounded-3xl bg-gradient-to-br from-[#0066B3]/10 to-[#0066B3]/5 p-4 md:block">
                  <FlaskConical className="h-8 w-8 text-[#0066B3]" />
                </div>
              </div>

              <div className="grid gap-4 md:grid-cols-2">
                <div className="rounded-2xl bg-slate-50 p-4">
                  <div className="mb-2 flex items-center gap-2 text-sm text-gray-500">
                    <Wallet className="h-4 w-4 text-[#0066B3]" />
                    {t('fixedPrice')}
                  </div>
                  <div className="font-semibold text-gray-900">
                    {unitPrice > 0
                      ? maxPrice > unitPrice
                        ? `${formatCurrency(unitPrice)} - ${formatCurrency(maxPrice)}`
                        : formatCurrency(unitPrice)
                      : t('inquiry')}
                  </div>
                </div>

                <div className="rounded-2xl bg-slate-50 p-4">
                  <div className="mb-2 flex items-center gap-2 text-sm text-gray-500">
                    <Clock className="h-4 w-4 text-[#0066B3]" />
                    {t('deliveryTime')}
                  </div>
                  <div className="font-semibold text-gray-900">
                    {turnaroundDesc ||
                      (turnaroundDays ? `${String(turnaroundDays)} ${t('workDays')}` : t('consultConfirm'))}
                  </div>
                </div>

                <div className="rounded-2xl bg-slate-50 p-4">
                  <div className="mb-2 flex items-center gap-2 text-sm text-gray-500">
                    <Shield className="h-4 w-4 text-[#0066B3]" />
                    {t('serviceStatus')}
                  </div>
                  <div className="font-semibold text-gray-900">{t('servedNTimes', { count: orderCount })}</div>
                </div>

                <div className="rounded-2xl bg-slate-50 p-4">
                  <div className="mb-2 flex items-center gap-2 text-sm text-gray-500">
                    <FileText className="h-4 w-4 text-[#0066B3]" />
                    {t('description')}
                  </div>
                  <div className="font-semibold text-gray-900">{t('standardReport')}</div>
                </div>
              </div>

              {fullDescZh ? (
                <div className="mt-5 rounded-2xl border border-gray-200 p-4">
                  <p className="mb-2 text-sm font-medium text-gray-900">{t('serviceDetails')}</p>
                  <p className="whitespace-pre-line text-sm leading-6 text-gray-600">
                    {fullDescZh}
                  </p>
                </div>
              ) : null}

              {sampleRequirement ? (
                <div className="mt-4 rounded-2xl border border-gray-200 p-4">
                  <p className="mb-2 text-sm font-medium text-gray-900">{t('sampleRequirements')}</p>
                  <p className="text-sm leading-6 text-gray-600">{sampleRequirement}</p>
                </div>
              ) : null}

              {standards.length > 0 ? (
                <div className="mt-4 rounded-2xl border border-gray-200 p-4">
                  <div className="mb-2 flex items-center gap-2 text-sm font-medium text-gray-900">
                    <BookOpen className="h-4 w-4 text-[#0066B3]" />
                    {t('testingStandards')}
                  </div>
                  <div className="flex flex-wrap gap-2">
                    {standards.map((item) => (
                      <span
                        key={item.id || item.code || item.nameZh}
                        className="rounded-full bg-gray-100 px-3 py-1 text-xs text-gray-700"
                      >
                        {item.code || item.nameZh}
                      </span>
                    ))}
                  </div>
                </div>
              ) : null}

              {materials.length > 0 ? (
                <div className="mt-4 rounded-2xl border border-gray-200 p-4">
                  <div className="mb-2 flex items-center gap-2 text-sm font-medium text-gray-900">
                    <Boxes className="h-4 w-4 text-[#0066B3]" />
                    {t('applicableMaterials')}
                  </div>
                  <div className="flex flex-wrap gap-2">
                    {materials.map((item) => (
                      <span
                        key={item.id || item.slug || item.nameZh}
                        className="rounded-full bg-[#0066B3]/10 px-3 py-1 text-xs text-[#0066B3]"
                      >
                        {item.nameZh}
                      </span>
                    ))}
                  </div>
                </div>
              ) : null}

              {industries.length > 0 ? (
                <div className="mt-4 rounded-2xl border border-gray-200 p-4">
                  <div className="mb-2 flex items-center gap-2 text-sm font-medium text-gray-900">
                    <Factory className="h-4 w-4 text-[#0066B3]" />
                    {t('applicableIndustries')}
                  </div>
                  <div className="flex flex-wrap gap-2">
                    {industries.map((item) => (
                      <span
                        key={item.id || item.slug || item.nameZh}
                        className="rounded-full bg-emerald-50 px-3 py-1 text-xs text-emerald-700"
                      >
                        {item.nameZh}
                      </span>
                    ))}
                  </div>
                </div>
              ) : null}
            </Card>

            {/* Order Info / Sample Form */}
            <Card padding="lg" className="rounded-3xl">
              <div className="mb-5 flex items-center gap-3 border-b border-gray-100 pb-4">
                <div className="rounded-xl bg-[#0066B3]/10 p-2">
                  <ClipboardList className="h-5 w-5 text-[#0066B3]" />
                </div>
                <div>
                  <h2 className="text-lg font-semibold text-gray-900">{t('orderInfo')}</h2>
                  <p className="text-xs text-gray-500">{t('requiredFields')}</p>
                </div>
              </div>

              {error ? (
                <div className="mb-5 rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
                  {error}
                </div>
              ) : null}

              {/* Sample Info */}
              <div className="mb-6 rounded-2xl bg-slate-50/70 p-4">
                <div className="mb-4 flex items-center gap-2 text-sm font-semibold text-gray-900">
                  <Beaker className="h-4 w-4 text-[#0066B3]" />
                  {t('sampleInfo')}
                </div>

                {(serviceSampleCount || serviceSampleSize || serviceSampleWeight || serviceSampleCondition || serviceSamplePreservation || serviceSamplePreparation || sampleRequirement) ? (
                  <div className="mb-4 grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
                    {serviceSampleCount ? (
                      <div className="rounded-xl border border-gray-100 bg-white p-3">
                        <div className="text-xs text-gray-500">{t('sampleQuantity')}</div>
                        <div className="text-sm font-medium text-gray-900">{serviceSampleCount}</div>
                      </div>
                    ) : null}
                    {serviceSampleSize ? (
                      <div className="rounded-xl border border-gray-100 bg-white p-3">
                        <div className="text-xs text-gray-500">{t('sampleSize')}</div>
                        <div className="text-sm font-medium text-gray-900">{serviceSampleSize}</div>
                      </div>
                    ) : null}
                    {serviceSampleWeight ? (
                      <div className="rounded-xl border border-gray-100 bg-white p-3">
                        <div className="text-xs text-gray-500">{t('sampleWeight')}</div>
                        <div className="text-sm font-medium text-gray-900">{serviceSampleWeight}</div>
                      </div>
                    ) : null}
                    {serviceSampleCondition ? (
                      <div className="rounded-xl border border-gray-100 bg-white p-3">
                        <div className="text-xs text-gray-500">{t('sampleCondition')}</div>
                        <div className="text-sm font-medium text-gray-900">{serviceSampleCondition}</div>
                      </div>
                    ) : null}
                    {serviceSamplePreservation ? (
                      <div className="rounded-xl border border-gray-100 bg-white p-3">
                        <div className="text-xs text-gray-500">{t('samplePreservation')}</div>
                        <div className="text-sm font-medium text-gray-900">{serviceSamplePreservation}</div>
                      </div>
                    ) : null}
                    {serviceSamplePreparation ? (
                      <div className="rounded-xl border border-gray-100 bg-white p-3">
                        <div className="text-xs text-gray-500">{t('samplePreparation')}</div>
                        <div className="text-sm font-medium text-gray-900">{serviceSamplePreparation}</div>
                      </div>
                    ) : null}
                    {sampleRequirement ? (
                      <div className="sm:col-span-2 lg:col-span-3 rounded-xl border border-amber-100 bg-amber-50 p-3">
                        <div className="text-xs text-amber-700">{t('sampleReqNotes')}</div>
                        <div className="text-sm font-medium text-amber-900">{sampleRequirement}</div>
                      </div>
                    ) : null}
                  </div>
                ) : null}
                <div className="grid gap-4 md:grid-cols-2">
                  <div>
                    <label className="mb-2 block text-sm font-medium text-gray-700">
                      {t('sampleName')} <span className="text-red-500">*</span>
                    </label>
                    <input
                      value={form.sampleName}
                      onChange={(e) => setForm((s) => ({ ...s, sampleName: e.target.value }))}
                      className="w-full rounded-xl border border-gray-200 px-4 py-3 text-sm focus:border-[#0066B3] focus:outline-none focus:ring-1 focus:ring-[#0066B3]"
                      placeholder={t('placeholder.sampleName')}
                    />
                  </div>

                  <div>
                    <label className="mb-2 block text-sm font-medium text-gray-700">
                      {t('sampleSpec')} <span className="text-red-500">*</span>
                    </label>
                    <input
                      value={form.sampleSpec}
                      onChange={(e) => setForm((s) => ({ ...s, sampleSpec: e.target.value }))}
                      className="w-full rounded-xl border border-gray-200 px-4 py-3 text-sm focus:border-[#0066B3] focus:outline-none focus:ring-1 focus:ring-[#0066B3]"
                      placeholder={t('placeholder.sampleSpec')}
                    />
                  </div>

                  <div>
                    <label className="mb-2 block text-sm font-medium text-gray-700">
                      {t('sampleQuantity')}
                    </label>
                    <input
                      type="number"
                      min={1}
                      value={form.quantity}
                      onChange={(e) =>
                        setForm((s) => ({
                          ...s,
                          quantity: Math.max(1, Number(e.target.value) || 1),
                        }))
                      }
                      className="w-full rounded-xl border border-gray-200 px-4 py-3 text-sm focus:border-[#0066B3] focus:outline-none focus:ring-1 focus:ring-[#0066B3]"
                    />
                  </div>
                </div>

                <div className="mt-4">
                  <label className="mb-2 block text-sm font-medium text-gray-700">
                    {t('testRequirements')} <span className="text-red-500">*</span>
                  </label>
                  <textarea
                    value={form.testRequirement}
                    onChange={(e) => setForm((s) => ({ ...s, testRequirement: e.target.value }))}
                    className="min-h-[90px] w-full rounded-xl border border-gray-200 px-4 py-3 text-sm focus:border-[#0066B3] focus:outline-none focus:ring-1 focus:ring-[#0066B3]"
                    placeholder={t('placeholder.testRequirement')}
                  />
                </div>

                {/* Custom Fields */}
                {service?.customFields && service.customFields.length > 0 ? (
                  <div className="mt-4 grid gap-4 md:grid-cols-2">
                    {service.customFields.map((field) => (
                      <div key={field.id}>
                        <label className="mb-2 block text-sm font-medium text-gray-700">
                          {field.label} {field.isRequired ? <span className="text-red-500">*</span> : null}
                        </label>
                        {field.fieldType === 'TEXTAREA' ? (
                          <textarea
                            value={form.customFieldValues[field.id] || ''}
                            onChange={(e) =>
                              setForm((s) => ({
                                ...s,
                                customFieldValues: { ...s.customFieldValues, [field.id]: e.target.value },
                              }))
                            }
                            className="min-h-[80px] w-full rounded-xl border border-gray-200 px-4 py-3 text-sm focus:border-[#0066B3] focus:outline-none focus:ring-1 focus:ring-[#0066B3]"
                            placeholder={field.placeholder || ''}
                          />
                        ) : field.fieldType === 'SELECT' && field.options ? (
                          <select
                            value={form.customFieldValues[field.id] || ''}
                            onChange={(e) =>
                              setForm((s) => ({
                                ...s,
                                customFieldValues: { ...s.customFieldValues, [field.id]: e.target.value },
                              }))
                            }
                            className="w-full rounded-xl border border-gray-200 px-4 py-3 text-sm focus:border-[#0066B3] focus:outline-none focus:ring-1 focus:ring-[#0066B3]"
                          >
                            <option value="">请选择</option>
                            {field.options.split(/[,，]/).map((opt) => (
                              <option key={opt.trim()} value={opt.trim()}>
                                {opt.trim()}
                              </option>
                            ))}
                          </select>
                        ) : field.fieldType === 'NUMBER' ? (
                          <input
                            type="number"
                            value={form.customFieldValues[field.id] || ''}
                            onChange={(e) =>
                              setForm((s) => ({
                                ...s,
                                customFieldValues: { ...s.customFieldValues, [field.id]: e.target.value },
                              }))
                            }
                            className="w-full rounded-xl border border-gray-200 px-4 py-3 text-sm focus:border-[#0066B3] focus:outline-none focus:ring-1 focus:ring-[#0066B3]"
                            placeholder={field.placeholder || ''}
                          />
                        ) : (
                          <input
                            type="text"
                            value={form.customFieldValues[field.id] || ''}
                            onChange={(e) =>
                              setForm((s) => ({
                                ...s,
                                customFieldValues: { ...s.customFieldValues, [field.id]: e.target.value },
                              }))
                            }
                            className="w-full rounded-xl border border-gray-200 px-4 py-3 text-sm focus:border-[#0066B3] focus:outline-none focus:ring-1 focus:ring-[#0066B3]"
                            placeholder={field.placeholder || ''}
                          />
                        )}
                      </div>
                    ))}
                  </div>
                ) : null}
              </div>

              {/* Contact Info */}
              <div className="mb-6 rounded-2xl bg-slate-50/70 p-4">
                <div className="mb-4 flex items-center gap-2 text-sm font-semibold text-gray-900">
                  <User className="h-4 w-4 text-[#0066B3]" />
                  {t('contactInfo')}
                </div>
                <div className="grid gap-4 md:grid-cols-2">
                  <div>
                    <label className="mb-2 block text-sm font-medium text-gray-700">
                      {t('contactName')} <span className="text-red-500">*</span>
                    </label>
                    <div className="relative">
                      <User className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400" />
                      <input
                        value={form.contactName}
                        onChange={(e) => setForm((s) => ({ ...s, contactName: e.target.value }))}
                        className="w-full rounded-xl border border-gray-200 py-3 pl-10 pr-4 text-sm focus:border-[#0066B3] focus:outline-none focus:ring-1 focus:ring-[#0066B3]"
                        placeholder={t('placeholder.contactName')}
                      />
                    </div>
                  </div>

                  <div>
                    <label className="mb-2 block text-sm font-medium text-gray-700">
                      {t('contactEmail')} <span className="text-red-500">*</span>
                    </label>
                    <div className="relative">
                      <Mail className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400" />
                      <input
                        type="email"
                        value={form.contactEmail}
                        onChange={(e) => setForm((s) => ({ ...s, contactEmail: e.target.value }))}
                        className="w-full rounded-xl border border-gray-200 py-3 pl-10 pr-4 text-sm focus:border-[#0066B3] focus:outline-none focus:ring-1 focus:ring-[#0066B3]"
                        placeholder={t('placeholder.contactEmail')}
                      />
                    </div>
                  </div>

                  <div>
                    <label className="mb-2 block text-sm font-medium text-gray-700">
                      {t('contactPhone')} <span className="text-red-500">*</span>
                    </label>
                    <div className="relative">
                      <Phone className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400" />
                      <input
                        value={form.contactPhone}
                        onChange={(e) => setForm((s) => ({ ...s, contactPhone: e.target.value }))}
                        className="w-full rounded-xl border border-gray-200 py-3 pl-10 pr-4 text-sm focus:border-[#0066B3] focus:outline-none focus:ring-1 focus:ring-[#0066B3]"
                        placeholder={t('placeholder.contactPhone')}
                      />
                    </div>
                  </div>

                  <div>
                    <label className="mb-2 block text-sm font-medium text-gray-700">
                      {t('companyName')}
                    </label>
                    <div className="relative">
                      <Building className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400" />
                      <input
                        value={form.companyName}
                        onChange={(e) => setForm((s) => ({ ...s, companyName: e.target.value }))}
                        className="w-full rounded-xl border border-gray-200 py-3 pl-10 pr-4 text-sm focus:border-[#0066B3] focus:outline-none focus:ring-1 focus:ring-[#0066B3]"
                        placeholder={t('placeholder.companyName')}
                      />
                    </div>
                  </div>
                </div>
              </div>

              {/* Remarks */}
              <div className="rounded-2xl bg-slate-50/70 p-4">
                <div className="mb-4 flex items-center gap-2 text-sm font-semibold text-gray-900">
                  <Info className="h-4 w-4 text-[#0066B3]" />
                  {t('otherNotes')}
                </div>
                <div>
                  <label className="mb-2 block text-sm font-medium text-gray-700">{t('remarks')}</label>
                  <textarea
                    value={form.remarks}
                    onChange={(e) => setForm((s) => ({ ...s, remarks: e.target.value }))}
                    className="min-h-[100px] w-full rounded-xl border border-gray-200 px-4 py-3 text-sm focus:border-[#0066B3] focus:outline-none focus:ring-1 focus:ring-[#0066B3]"
                    placeholder={t('placeholder.remarks')}
                  />
                </div>

                <div className="mt-4 rounded-2xl border border-gray-200 bg-white p-4">
                  <label className="flex items-center gap-2 text-sm text-gray-700">
                    <input
                      type="checkbox"
                      checked={form.needInvoice}
                      onChange={(e) => setForm((s) => ({ ...s, needInvoice: e.target.checked }))}
                      className="h-4 w-4 rounded border-gray-300 text-[#0066B3] focus:ring-[#0066B3]"
                    />
                    {t('needInvoice')}
                  </label>

                  {form.needInvoice ? (
                    <div className="mt-3">
                      <input
                        value={form.invoiceTitle}
                        onChange={(e) => setForm((s) => ({ ...s, invoiceTitle: e.target.value }))}
                        placeholder={t('invoiceTitle')}
                        className="w-full rounded-xl border border-gray-200 px-4 py-3 text-sm focus:border-[#0066B3] focus:outline-none focus:ring-1 focus:ring-[#0066B3]"
                      />
                    </div>
                  ) : null}
                </div>
              </div>
            </Card>

            {/* Payment Method */}
            <Card padding="lg" className="rounded-3xl">
              <div className="mb-4 flex items-center gap-2">
                <CreditCard className="h-5 w-5 text-[#0066B3]" />
                <h2 className="text-lg font-semibold text-gray-900">{t('paymentMethod')}</h2>
              </div>

              <div className="rounded-xl border border-[#0066B3]/20 bg-[#0066B3]/5 px-4 py-3 text-sm text-[#0066B3]">
                {t('paymentDefaultDesc')}
              </div>
            </Card>
          </div>

          {/* Order Summary */}
          <div className="space-y-6">
            <Card padding="lg" className="sticky top-24 rounded-3xl bg-gradient-to-b from-white to-slate-50/50">
              <div className="mb-4 flex items-center gap-2">
                <FileCheck className="h-5 w-5 text-[#0066B3]" />
                <h2 className="text-lg font-semibold text-gray-900">{t('orderSummary')}</h2>
              </div>

              <div className="space-y-3 text-sm">
                <div className="flex items-center justify-between gap-3">
                  <span className="text-gray-500">{t('service')}</span>
                  <span className="font-medium text-gray-900">{nameZh}</span>
                </div>

                <div className="flex items-center justify-between gap-3">
                  <span className="text-gray-500">{t('unitPrice')}</span>
                  <span className="font-medium text-gray-900">
                    {unitPrice > 0 ? formatCurrency(unitPrice) : t('inquiry')}
                  </span>
                </div>

                <div className="flex items-center justify-between gap-3">
                  <span className="text-gray-500">{t('sampleQuantity')}</span>
                  <span className="font-medium text-gray-900">{form.quantity}</span>
                </div>

                <div className="flex items-center justify-between gap-3">
                  <span className="text-gray-500">{t('paymentMethodLabel')}</span>
                  <span className="font-medium text-gray-900">{t('systemDefault')}</span>
                </div>
              </div>

              <div className="my-4 border-t border-gray-200" />

              <div className="space-y-3 text-sm">
                <div className="flex items-center justify-between gap-3">
                  <span className="text-gray-500">{t('subtotal')}</span>
                  <span className="font-medium text-gray-900">{formatCurrency(subtotal)}</span>
                </div>

                <div className="flex items-center justify-between gap-3">
                  <span className="flex items-center gap-2 text-gray-500">
                    <Wallet className="h-4 w-4" />
                    {t('platformFee')}
                  </span>
                  <span className="font-medium text-gray-900">
                    {formatCurrency(serviceFee)}
                  </span>
                </div>
              </div>

              <div className="my-4 border-t border-gray-200" />

              <div className="flex items-end justify-between gap-3">
                <span className="text-base font-medium text-gray-700">{t('totalPayable')}</span>
                <span className="text-3xl font-bold text-[#0066B3]">
                  {formatCurrency(totalAmount)}
                </span>
              </div>

              <div className="mt-6 space-y-3">
                <Button
                  fullWidth
                  size="lg"
                  onClick={handleSubmit}
                  loading={submitting}
                  className="bg-[#0066B3] hover:bg-[#004E8C]"
                >
                  {t('payAndCreateOrder')}
                </Button>

                <Button
                  fullWidth
                  size="lg"
                  variant="outline"
                  onClick={() => router.push(`/rfq/new?service=${serviceSlug}`)}
                >
                  {t('requestQuote')}
                </Button>
              </div>

              <div className="mt-4 flex items-start gap-2 text-xs text-gray-500">
                <Shield className="mt-0.5 h-3.5 w-3.5 shrink-0" />
                <span>{t('agreement')}</span>
              </div>
            </Card>
          </div>
        </div>
      </div>

      <Footer />
    </div>
  );
}
