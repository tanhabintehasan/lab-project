'use client';

import { useState, useEffect, useMemo } from 'react';
import { useTranslations } from 'next-intl';
import { useParams } from 'next/navigation';
import { Header } from '@/components/layout/header';
import { Footer } from '@/components/layout/footer';
import { Link, useRouter } from '@/i18n/routing';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';
import {
  ChevronRight,
  Clock,
  Shield,
  Star,
  FileText,
  ShoppingCart,
  ArrowLeft,
  Eye,
  BadgeCheck,
  FlaskConical,
  Building2,
  CheckCircle2,
} from 'lucide-react';
import { formatCurrency } from '@/lib/utils';

type ServiceData = Record<string, unknown>;

export default function ServiceDetailPage() {
  const t = useTranslations('services');
  const params = useParams();
  const router = useRouter();
  const slug = params.slug as string;

  const [service, setService] = useState<ServiceData | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch(`/api/services/${slug}`, {
      credentials: 'include',
      cache: 'no-store',
    })
      .then((r) => r.json())
      .then((data) => {
        if (data?.success) setService(data.data);
      })
      .finally(() => setLoading(false));
  }, [slug]);

  const handleBack = () => {
    if (typeof window !== 'undefined' && window.history.length > 1) {
      router.back();
    } else {
      router.push('/services');
    }
  };

  const materials =
    (service?.materials as Array<{ material?: { nameZh?: string; slug?: string } }>) || [];
  const standards =
    (service?.standards as Array<{ standard?: { code?: string; nameZh?: string } }>) || [];
  const industries =
    (service?.industries as Array<{ industry?: { nameZh?: string } }>) || [];
  const labServices =
    (service?.labServices as Array<{
      lab?: { nameZh?: string; slug?: string; city?: string; rating?: number };
    }>) || [];

  const category = service?.category as Record<string, string> | null;

  const nameZh = (service?.nameZh as string) || '';
  const nameEn = service?.nameEn as string | undefined;
  const isHot = Boolean(service?.isHot);
  const isFeatured = Boolean(service?.isFeatured);
  const shortDescZh = service?.shortDescZh as string | undefined;
  const fullDescZh = service?.fullDescZh as string | undefined;
  const turnaroundDays = service?.turnaroundDays as string | number | undefined;
  const turnaroundDesc = service?.turnaroundDesc as string | undefined;
  const viewCount = service?.viewCount as string | number | undefined;
  const orderCount = service?.orderCount as string | number | undefined;
  const sampleRequirement = service?.sampleRequirement as string | undefined;
  const deliverables = service?.deliverables as string | undefined;
  const priceMin = service?.priceMin as string | number | undefined;
  const priceMax = service?.priceMax as string | number | undefined;

  const deliveryItems = useMemo(() => {
    const items: string[] = [];
    if (deliverables) {
      items.push(...deliverables.split('\n').map((item) => item.trim()).filter(Boolean));
    }
    if (items.length === 0) {
      items.push('标准检测报告');
      items.push('检测结果说明');
      items.push('必要时提供数据文件');
    }
    return items.slice(0, 4);
  }, [deliverables]);

  if (loading) {
    return (
      <div className="min-h-screen bg-slate-50">
        <Header />
        <div className="mx-auto max-w-6xl px-4 py-12 space-y-4">
          <Skeleton className="h-8 w-40" />
          <Skeleton className="h-10 w-2/3" />
          <Skeleton className="h-5 w-full" />
          <Skeleton className="h-72 w-full rounded-3xl" />
        </div>
        <Footer />
      </div>
    );
  }

  if (!service) {
    return (
      <div className="min-h-screen bg-slate-50">
        <Header />
        <div className="mx-auto max-w-5xl px-4 py-16 text-center">
          <h1 className="mb-4 text-2xl font-bold text-gray-900">服务未找到</h1>
          <Link href="/services">
            <Button variant="outline">
              <ArrowLeft className="h-4 w-4" />
              返回服务列表
            </Button>
          </Link>
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
            <button type="button" onClick={handleBack} className="mr-3 inline-flex items-center gap-1 hover:text-blue-600">
              <ArrowLeft className="h-4 w-4" />
              返回
            </button>
            <Link href="/" className="hover:text-blue-600">
              首页
            </Link>
            <ChevronRight className="h-3 w-3" />
            <Link href="/services" className="hover:text-blue-600">
              检测服务
            </Link>
            <ChevronRight className="h-3 w-3" />
            {category ? (
              <>
                <span>{category.nameZh}</span>
                <ChevronRight className="h-3 w-3" />
              </>
            ) : null}
            <span className="text-gray-900">{nameZh}</span>
          </div>
        </div>
      </div>

      <div className="mx-auto max-w-6xl px-4 py-8">
        <div className="grid gap-8 lg:grid-cols-[1.5fr_0.9fr]">
          <div className="space-y-6">
            <div className="overflow-hidden rounded-3xl bg-gradient-to-br from-slate-900 via-blue-900 to-indigo-800 p-8 text-white">
              <div className="mb-4 flex flex-wrap items-center gap-2">
                {category ? <Badge variant="outline">{category.nameZh}</Badge> : null}
                {isHot ? <Badge variant="danger">热门</Badge> : null}
                {isFeatured ? <Badge variant="info">推荐</Badge> : null}
                <span className="inline-flex items-center gap-1 rounded-full bg-white/10 px-3 py-1 text-xs">
                  <BadgeCheck className="h-3.5 w-3.5" />
                  支持报告
                </span>
              </div>

              <div className="flex items-start justify-between gap-4">
                <div>
                  <h1 className="mb-2 text-3xl font-bold lg:text-4xl">{nameZh}</h1>
                  {nameEn ? <p className="text-sm text-blue-100">{nameEn}</p> : null}
                </div>
                <div className="hidden rounded-3xl bg-white/10 p-4 md:block">
                  <FlaskConical className="h-8 w-8 text-white" />
                </div>
              </div>

              <p className="mt-5 max-w-3xl text-sm leading-7 text-blue-100">
                {shortDescZh ||
                  '适用于科研测试、产品验证和企业质量场景，支持标准化交付与专业检测服务。'}
              </p>

              <div className="mt-6 grid gap-4 sm:grid-cols-3">
                <div className="rounded-2xl bg-white/10 p-4">
                  <div className="mb-1 flex items-center gap-2 text-blue-100">
                    <Clock className="h-4 w-4" />
                    <span className="text-sm">交付周期</span>
                  </div>
                  <div className="text-lg font-semibold">
                    {turnaroundDays ? `${String(turnaroundDays)} 个工作日` : turnaroundDesc || '咨询确认'}
                  </div>
                </div>

                <div className="rounded-2xl bg-white/10 p-4">
                  <div className="mb-1 flex items-center gap-2 text-blue-100">
                    <Eye className="h-4 w-4" />
                    <span className="text-sm">浏览与下单</span>
                  </div>
                  <div className="text-lg font-semibold">
                    {String(viewCount || 0)} 浏览 / {String(orderCount || 0)} 下单
                  </div>
                </div>

                <div className="rounded-2xl bg-white/10 p-4">
                  <div className="mb-1 flex items-center gap-2 text-blue-100">
                    <Shield className="h-4 w-4" />
                    <span className="text-sm">交付保障</span>
                  </div>
                  <div className="text-lg font-semibold">专业报告 / 可咨询证书</div>
                </div>
              </div>
            </div>

            <Card padding="lg">
              <h2 className="mb-3 text-xl font-semibold text-gray-900">{t('detail.overview')}</h2>
              <div className="space-y-3 text-sm leading-7 text-gray-600">
                <p>{shortDescZh || '该服务适用于标准检测与科研分析场景。'}</p>
                {fullDescZh ? <p>{fullDescZh}</p> : null}
              </div>
            </Card>

            <div className="grid gap-6 md:grid-cols-2">
              <Card padding="lg">
                <h2 className="mb-4 text-lg font-semibold text-gray-900">{t('detail.sampleReq')}</h2>
                <p className="text-sm leading-7 text-gray-600">
                  {sampleRequirement || '支持常规样品提交，特殊样品形态、尺寸、数量请先与平台沟通确认。'}
                </p>
              </Card>

              <Card padding="lg">
                <h2 className="mb-4 text-lg font-semibold text-gray-900">{t('detail.deliverables')}</h2>
                <div className="space-y-3">
                  {deliveryItems.map((item) => (
                    <div key={item} className="flex items-start gap-2 text-sm text-gray-600">
                      <CheckCircle2 className="mt-0.5 h-4 w-4 text-emerald-600" />
                      <span>{item}</span>
                    </div>
                  ))}
                </div>
              </Card>
            </div>

            {standards.length > 0 ? (
              <Card padding="lg">
                <h2 className="mb-3 text-lg font-semibold text-gray-900">{t('detail.standards')}</h2>
                <div className="flex flex-wrap gap-2">
                  {standards.map((s) => (
                    <Badge key={s.standard?.code} variant="outline">
                      {s.standard?.code} {s.standard?.nameZh}
                    </Badge>
                  ))}
                </div>
              </Card>
            ) : null}

            {materials.length > 0 ? (
              <Card padding="lg">
                <h2 className="mb-3 text-lg font-semibold text-gray-900">{t('detail.materials')}</h2>
                <div className="flex flex-wrap gap-2">
                  {materials.map((m) => (
                    <Badge key={m.material?.slug} variant="info">
                      {m.material?.nameZh}
                    </Badge>
                  ))}
                </div>
              </Card>
            ) : null}

            {industries.length > 0 ? (
              <Card padding="lg">
                <h2 className="mb-3 text-lg font-semibold text-gray-900">{t('detail.industries')}</h2>
                <div className="flex flex-wrap gap-2">
                  {industries.map((ind) => (
                    <Badge key={ind.industry?.nameZh} variant="default">
                      {ind.industry?.nameZh}
                    </Badge>
                  ))}
                </div>
              </Card>
            ) : null}

            {labServices.length > 0 ? (
              <Card padding="lg">
                <div className="mb-4 flex items-center gap-2">
                  <Building2 className="h-5 w-5 text-blue-600" />
                  <h2 className="text-lg font-semibold text-gray-900">提供此服务的实验室</h2>
                </div>
                <div className="space-y-3">
                  {labServices.map((ls) => (
                    <Link
                      key={ls.lab?.slug}
                      href={`/labs/${ls.lab?.slug}`}
                      className="flex items-center justify-between rounded-2xl border border-gray-200 p-4 transition-colors hover:border-blue-300 hover:bg-blue-50/30"
                    >
                      <div>
                        <p className="font-medium text-gray-900">{ls.lab?.nameZh}</p>
                        {ls.lab?.city ? <p className="text-sm text-gray-500">{ls.lab.city}</p> : null}
                      </div>
                      {ls.lab?.rating ? (
                        <div className="flex items-center gap-1 text-sm text-gray-600">
                          <Star className="h-4 w-4 text-yellow-500" />
                          {String(ls.lab.rating)}
                        </div>
                      ) : null}
                    </Link>
                  ))}
                </div>
              </Card>
            ) : null}
          </div>

          <div className="space-y-6">
            <Card padding="lg" className="sticky top-24 rounded-3xl">
              <div className="space-y-5">
                <div>
                  <p className="text-sm text-gray-500">{t('detail.pricing')}</p>
                  {priceMin ? (
                    <p className="mt-1 text-3xl font-bold text-blue-600">
                      {formatCurrency(Number(priceMin))}
                      {priceMax && Number(priceMax) !== Number(priceMin) ? (
                        <span className="text-lg font-normal text-gray-400">
                          {' '}
                          - {formatCurrency(Number(priceMax))}
                        </span>
                      ) : null}
                    </p>
                  ) : (
                    <p className="mt-1 text-2xl font-bold text-gray-900">询价服务</p>
                  )}
                </div>

                <div className="space-y-3 rounded-2xl bg-slate-50 p-4 text-sm text-gray-600">
                  <div className="flex items-center justify-between gap-3">
                    <span className="flex items-center gap-2">
                      <Clock className="h-4 w-4 text-blue-600" />
                      交付周期
                    </span>
                    <span className="font-medium text-gray-900">
                      {turnaroundDays ? `${String(turnaroundDays)} 个工作日` : '咨询确认'}
                    </span>
                  </div>

                  <div className="flex items-center justify-between gap-3">
                    <span className="flex items-center gap-2">
                      <Shield className="h-4 w-4 text-blue-600" />
                      交付说明
                    </span>
                    <span className="font-medium text-gray-900">支持标准报告</span>
                  </div>

                  <div className="flex items-center justify-between gap-3">
                    <span className="flex items-center gap-2">
                      <FileText className="h-4 w-4 text-blue-600" />
                      适用场景
                    </span>
                    <span className="font-medium text-gray-900">科研 / 企业研发</span>
                  </div>
                </div>

                <div className="space-y-3">
                 <Button
  fullWidth
  size="lg"
  onClick={() => router.push(`/checkout?service=${slug}`)}
>
  <ShoppingCart className="h-4 w-4" />
  {t('orderNow')}
</Button>

                  <Button
                    fullWidth
                    size="lg"
                    variant="outline"
                    onClick={() => router.push(`/rfq/new?service=${slug}`)}
                  >
                    <FileText className="h-4 w-4" />
                    {t('detail.requestQuote')}
                  </Button>

                  <Button
                    fullWidth
                    size="lg"
                    variant="ghost"
                    onClick={() => router.push('/custom-testing')}
                  >
                    没找到完全匹配的服务？提交定制测试
                  </Button>
                </div>
              </div>
            </Card>
          </div>
        </div>
      </div>

      <Footer />
    </div>
  );
}