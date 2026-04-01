'use client';

import { useEffect, useMemo, useState } from 'react';
import { useSearchParams } from 'next/navigation';
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
} from 'lucide-react';
import { formatCurrency } from '@/lib/utils';

type ServiceCategory = {
  id?: string;
  slug?: string;
  nameZh?: string;
  nameEn?: string | null;
};

type NamedItem = {
  id?: string;
  slug?: string;
  code?: string;
  nameZh?: string;
  nameEn?: string | null;
};

type ServiceData = {
  id?: string;
  slug?: string;
  categoryId?: string;
  nameZh?: string;
  nameEn?: string | null;
  shortDescZh?: string | null;
  shortDescEn?: string | null;
  fullDescZh?: string | null;
  fullDescEn?: string | null;
  priceMin?: number | string | null;
  priceMax?: number | string | null;
  currency?: string | null;
  turnaroundDays?: number | string | null;
  turnaroundDesc?: string | null;
  sampleRequirement?: string | null;
  isActive?: boolean;
  isFeatured?: boolean;
  isHot?: boolean;
  orderCount?: number | string | null;
  category?: ServiceCategory | null;
  materials?: NamedItem[] | null;
  industries?: NamedItem[] | null;
  standards?: NamedItem[] | null;
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
  const router = useRouter();
  const searchParams = useSearchParams();
  const serviceSlug = searchParams.get('service') || '';

  const [service, setService] = useState<ServiceData | null>(null);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState('');

  const [form, setForm] = useState({
    quantity: 1,
    contactName: '',
    contactEmail: '',
    contactPhone: '',
    companyName: '',
    sampleCount: 1,
    remarks: '',
    needInvoice: false,
    invoiceTitle: '',
  });

  useEffect(() => {
    if (!serviceSlug) {
      setLoading(false);
      setError('缺少服务参数');
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
            setError(data?.error || '服务加载失败');
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
          setError('服务信息不存在');
          return;
        }

        setService(matched);
      } catch (err) {
        console.error('Load checkout service error:', err);
        setError('服务加载失败');
      } finally {
        setLoading(false);
      }
    };

    loadService();
  }, [serviceSlug]);

  const nameZh = service?.nameZh || '';
  const nameEn = service?.nameEn || '';
  const category = service?.category || null;
  const shortDescZh = service?.shortDescZh || '';
  const shortDescEn = service?.shortDescEn || '';
  const fullDescZh = service?.fullDescZh || '';
  const fullDescEn = service?.fullDescEn || '';
  const sampleRequirement = service?.sampleRequirement || '';
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
      setError('请输入联系人姓名');
      return;
    }

    if (!form.contactEmail.trim()) {
      setError('请输入联系邮箱');
      return;
    }

    if (!form.contactPhone.trim()) {
      setError('请输入联系电话');
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
        }),
      });

      const data = await res.json();

      if (res.status === 401) {
        router.push(`/auth/login?redirect=/checkout?service=${serviceSlug}`);
        return;
      }

      if (!res.ok || !data?.success) {
        setError(data?.error || '创建订单失败');
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
      setError('提交订单失败');
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
          <h1 className="mb-4 text-2xl font-bold text-gray-900">无法进入结算</h1>
          <p className="mb-6 text-gray-600">{error || '服务信息不存在'}</p>
          <Button variant="outline" onClick={handleBack}>
            <ArrowLeft className="h-4 w-4" />
            返回
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
              className="mr-3 inline-flex items-center gap-1 hover:text-blue-600"
            >
              <ArrowLeft className="h-4 w-4" />
              返回
            </button>
            <Link href="/" className="hover:text-blue-600">
              首页
            </Link>
            <span>/</span>
            <Link href="/services" className="hover:text-blue-600">
              检测服务
            </Link>
            <span>/</span>
            <Link href={`/services/${serviceSlug}`} className="hover:text-blue-600">
              {nameZh || nameEn}
            </Link>
            <span>/</span>
            <span className="text-gray-900">结算</span>
          </div>
        </div>
      </div>

      <div className="mx-auto max-w-6xl px-4 py-8">
        <div className="grid gap-8 lg:grid-cols-[1.35fr_0.85fr]">
          <div className="space-y-6">
            <Card padding="lg" className="rounded-3xl">
              <div className="mb-5 flex items-start justify-between gap-4">
                <div>
                  <div className="mb-2 flex flex-wrap items-center gap-2">
                    {category ? <Badge variant="outline">{category.nameZh}</Badge> : null}
                    <span className="inline-flex items-center gap-1 rounded-full bg-emerald-50 px-3 py-1 text-xs font-medium text-emerald-600">
                      <BadgeCheck className="h-3.5 w-3.5" />
                      可直接下单
                    </span>
                  </div>
                  <h1 className="text-2xl font-bold text-gray-900">{nameZh || nameEn}</h1>
                  <p className="mt-2 text-sm leading-6 text-gray-600">
                    {shortDescZh || shortDescEn || '请确认服务内容、数量后提交订单。'}
                  </p>
                </div>

                <div className="hidden rounded-3xl bg-blue-50 p-4 md:block">
                  <FlaskConical className="h-8 w-8 text-blue-600" />
                </div>
              </div>

              <div className="grid gap-4 md:grid-cols-2">
                <div className="rounded-2xl bg-slate-50 p-4">
                  <div className="mb-2 flex items-center gap-2 text-sm text-gray-500">
                    <Wallet className="h-4 w-4 text-blue-600" />
                    固定价格
                  </div>
                  <div className="font-semibold text-gray-900">
                    {unitPrice > 0
                      ? maxPrice > unitPrice
                        ? `${formatCurrency(unitPrice)} - ${formatCurrency(maxPrice)}`
                        : formatCurrency(unitPrice)
                      : '询价'}
                  </div>
                </div>

                <div className="rounded-2xl bg-slate-50 p-4">
                  <div className="mb-2 flex items-center gap-2 text-sm text-gray-500">
                    <Clock className="h-4 w-4 text-blue-600" />
                    交付周期
                  </div>
                  <div className="font-semibold text-gray-900">
                    {turnaroundDesc ||
                      (turnaroundDays ? `${String(turnaroundDays)} 个工作日` : '咨询确认')}
                  </div>
                </div>

                <div className="rounded-2xl bg-slate-50 p-4">
                  <div className="mb-2 flex items-center gap-2 text-sm text-gray-500">
                    <Shield className="h-4 w-4 text-blue-600" />
                    服务状态
                  </div>
                  <div className="font-semibold text-gray-900">已服务 {orderCount} 次</div>
                </div>

                <div className="rounded-2xl bg-slate-50 p-4">
                  <div className="mb-2 flex items-center gap-2 text-sm text-gray-500">
                    <FileText className="h-4 w-4 text-blue-600" />
                    说明
                  </div>
                  <div className="font-semibold text-gray-900">标准检测报告 / 结果说明</div>
                </div>
              </div>

              {fullDescZh || fullDescEn ? (
                <div className="mt-4 rounded-2xl border border-gray-200 p-4">
                  <p className="mb-2 text-sm font-medium text-gray-900">服务详情</p>
                  <p className="whitespace-pre-line text-sm leading-6 text-gray-600">
                    {fullDescZh || fullDescEn}
                  </p>
                </div>
              ) : null}

              {sampleRequirement ? (
                <div className="mt-4 rounded-2xl border border-gray-200 p-4">
                  <p className="mb-2 text-sm font-medium text-gray-900">样品要求</p>
                  <p className="text-sm leading-6 text-gray-600">{sampleRequirement}</p>
                </div>
              ) : null}

              {standards.length > 0 ? (
                <div className="mt-4 rounded-2xl border border-gray-200 p-4">
                  <div className="mb-2 flex items-center gap-2 text-sm font-medium text-gray-900">
                    <BookOpen className="h-4 w-4 text-blue-600" />
                    检测标准
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
                    <Boxes className="h-4 w-4 text-blue-600" />
                    适用材料
                  </div>
                  <div className="flex flex-wrap gap-2">
                    {materials.map((item) => (
                      <span
                        key={item.id || item.slug || item.nameZh}
                        className="rounded-full bg-blue-50 px-3 py-1 text-xs text-blue-700"
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
                    <Factory className="h-4 w-4 text-blue-600" />
                    适用行业
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

            <Card padding="lg" className="rounded-3xl">
              <h2 className="mb-4 text-lg font-semibold text-gray-900">订单信息</h2>

              {error ? (
                <div className="mb-4 rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
                  {error}
                </div>
              ) : null}

              <div className="grid gap-4 md:grid-cols-2">
                <div>
                  <label className="mb-2 block text-sm font-medium text-gray-700">联系人姓名</label>
                  <input
                    value={form.contactName}
                    onChange={(e) => setForm((s) => ({ ...s, contactName: e.target.value }))}
                    className="w-full rounded-xl border border-gray-200 px-4 py-3 text-sm"
                    placeholder="请输入联系人"
                  />
                </div>

                <div>
                  <label className="mb-2 block text-sm font-medium text-gray-700">联系邮箱</label>
                  <input
                    type="email"
                    value={form.contactEmail}
                    onChange={(e) => setForm((s) => ({ ...s, contactEmail: e.target.value }))}
                    className="w-full rounded-xl border border-gray-200 px-4 py-3 text-sm"
                    placeholder="请输入邮箱"
                  />
                </div>

                <div>
                  <label className="mb-2 block text-sm font-medium text-gray-700">联系电话</label>
                  <input
                    value={form.contactPhone}
                    onChange={(e) => setForm((s) => ({ ...s, contactPhone: e.target.value }))}
                    className="w-full rounded-xl border border-gray-200 px-4 py-3 text-sm"
                    placeholder="请输入手机号"
                  />
                </div>

                <div>
                  <label className="mb-2 block text-sm font-medium text-gray-700">单位名称</label>
                  <input
                    value={form.companyName}
                    onChange={(e) => setForm((s) => ({ ...s, companyName: e.target.value }))}
                    className="w-full rounded-xl border border-gray-200 px-4 py-3 text-sm"
                    placeholder="企业 / 高校 / 研究机构"
                  />
                </div>

                <div>
                  <label className="mb-2 block text-sm font-medium text-gray-700">下单数量</label>
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
                    className="w-full rounded-xl border border-gray-200 px-4 py-3 text-sm"
                  />
                </div>

                <div>
                  <label className="mb-2 block text-sm font-medium text-gray-700">样品数量</label>
                  <input
                    type="number"
                    min={1}
                    value={form.sampleCount}
                    onChange={(e) =>
                      setForm((s) => ({
                        ...s,
                        sampleCount: Math.max(1, Number(e.target.value) || 1),
                      }))
                    }
                    className="w-full rounded-xl border border-gray-200 px-4 py-3 text-sm"
                  />
                </div>
              </div>

              <div className="mt-4">
                <label className="mb-2 block text-sm font-medium text-gray-700">备注说明</label>
                <textarea
                  value={form.remarks}
                  onChange={(e) => setForm((s) => ({ ...s, remarks: e.target.value }))}
                  className="min-h-[110px] w-full rounded-xl border border-gray-200 px-4 py-3 text-sm"
                  placeholder="填写特殊说明、样品情况、加急需求等"
                />
              </div>

              <div className="mt-4 rounded-2xl border border-gray-200 p-4">
                <label className="flex items-center gap-2 text-sm text-gray-700">
                  <input
                    type="checkbox"
                    checked={form.needInvoice}
                    onChange={(e) => setForm((s) => ({ ...s, needInvoice: e.target.checked }))}
                  />
                  需要发票
                </label>

                {form.needInvoice ? (
                  <div className="mt-3">
                    <input
                      value={form.invoiceTitle}
                      onChange={(e) => setForm((s) => ({ ...s, invoiceTitle: e.target.value }))}
                      placeholder="发票抬头"
                      className="w-full rounded-xl border border-gray-200 px-4 py-3 text-sm"
                    />
                  </div>
                ) : null}
              </div>
            </Card>

            <Card padding="lg" className="rounded-3xl">
              <div className="mb-4 flex items-center gap-2">
                <CreditCard className="h-5 w-5 text-blue-600" />
                <h2 className="text-lg font-semibold text-gray-900">支付方式</h2>
              </div>

              <div className="rounded-xl border border-blue-200 bg-blue-50 px-4 py-3 text-sm text-blue-700">
                系统默认支付方式将在下单后自动分配
              </div>
            </Card>
          </div>

          <div className="space-y-6">
            <Card padding="lg" className="sticky top-24 rounded-3xl">
              <h2 className="mb-4 text-lg font-semibold text-gray-900">订单汇总</h2>

              <div className="space-y-3 text-sm">
                <div className="flex items-center justify-between gap-3">
                  <span className="text-gray-500">服务</span>
                  <span className="font-medium text-gray-900">{nameZh || nameEn}</span>
                </div>

                <div className="flex items-center justify-between gap-3">
                  <span className="text-gray-500">固定单价</span>
                  <span className="font-medium text-gray-900">
                    {unitPrice > 0 ? formatCurrency(unitPrice) : '询价'}
                  </span>
                </div>

                <div className="flex items-center justify-between gap-3">
                  <span className="text-gray-500">数量</span>
                  <span className="font-medium text-gray-900">{form.quantity}</span>
                </div>

                <div className="flex items-center justify-between gap-3">
                  <span className="text-gray-500">样品数</span>
                  <span className="font-medium text-gray-900">{form.sampleCount}</span>
                </div>

                <div className="flex items-center justify-between gap-3">
                  <span className="text-gray-500">支付方式</span>
                  <span className="font-medium text-gray-900">系统默认</span>
                </div>
              </div>

              <div className="my-4 border-t border-gray-200" />

              <div className="space-y-3 text-sm">
                <div className="flex items-center justify-between gap-3">
                  <span className="text-gray-500">小计</span>
                  <span className="font-medium text-gray-900">{formatCurrency(subtotal)}</span>
                </div>

                <div className="flex items-center justify-between gap-3">
                  <span className="flex items-center gap-2 text-gray-500">
                    <Wallet className="h-4 w-4" />
                    平台服务费
                  </span>
                  <span className="font-medium text-gray-900">
                    {formatCurrency(serviceFee)}
                  </span>
                </div>
              </div>

              <div className="my-4 border-t border-gray-200" />

              <div className="flex items-end justify-between gap-3">
                <span className="text-base font-medium text-gray-700">应付总额</span>
                <span className="text-3xl font-bold text-blue-600">
                  {formatCurrency(totalAmount)}
                </span>
              </div>

              <div className="mt-6 space-y-3">
                <Button fullWidth size="lg" onClick={handleSubmit} loading={submitting}>
                  立即支付并创建订单
                </Button>

                <Button
                  fullWidth
                  size="lg"
                  variant="outline"
                  onClick={() => router.push(`/rfq/new?service=${serviceSlug}`)}
                >
                  改为申请报价
                </Button>
              </div>
            </Card>
          </div>
        </div>
      </div>

      <Footer />
    </div>
  );
}