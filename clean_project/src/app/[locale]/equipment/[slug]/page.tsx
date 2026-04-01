'use client';

import { useEffect, useMemo, useState } from 'react';
import { useParams } from 'next/navigation';
import { Header } from '@/components/layout/header';
import { Footer } from '@/components/layout/footer';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';
import { Link } from '@/i18n/routing';
import { ArrowLeft, CalendarDays, Wrench } from 'lucide-react';

type EquipmentStatus = 'AVAILABLE' | 'IN_USE' | 'MAINTENANCE' | 'UNAVAILABLE' | string;

interface EquipmentLab {
  nameZh: string;
  slug: string;
  city?: string;
}

interface EquipmentDetail {
  id?: string;
  slug: string;
  nameZh: string;
  nameEn?: string;
  model?: string;
  manufacturer?: string;
  descZh?: string;
  status: EquipmentStatus;
  bookable?: boolean;
  hourlyRate?: string | number;
  dailyRate?: string | number;
  specifications?: Record<string, string> | null;
  lab?: EquipmentLab | null;
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

export default function EquipmentDetailPage() {
  const params = useParams();
  const slug = String(params.slug);

  const [eq, setEq] = useState<EquipmentDetail | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let mounted = true;

    fetch(`/api/equipment/${slug}`, {
      credentials: 'include',
      cache: 'no-store',
    })
      .then(r => r.json())
      .then(data => {
        if (mounted && data?.success) {
          setEq(data.data);
        }
      })
      .catch(error => {
        console.error('Failed to fetch equipment detail:', error);
      })
      .finally(() => {
        if (mounted) setLoading(false);
      });

    return () => {
      mounted = false;
    };
  }, [slug]);

  const statusInfo = useMemo(() => {
    if (!eq?.status) return statusMap.UNAVAILABLE;
    return statusMap[eq.status] || { label: eq.status, variant: 'default' as const };
  }, [eq?.status]);

  if (loading) {
    return (
      <div className="min-h-screen">
        <Header />
        <div className="max-w-4xl mx-auto px-4 py-16 space-y-4">
          <Skeleton className="h-8 w-1/3" />
          <Skeleton className="h-64 w-full" />
        </div>
        <Footer />
      </div>
    );
  }

  if (!eq) {
    return (
      <div className="min-h-screen">
        <Header />
        <div className="max-w-4xl mx-auto px-4 py-16 text-center">
          <p className="text-gray-500">设备未找到</p>
          <Link href="/equipment">
            <Button variant="outline" className="mt-4">
              <ArrowLeft className="h-4 w-4" />
              返回
            </Button>
          </Link>
        </div>
        <Footer />
      </div>
    );
  }

  const lab = eq.lab ?? null;
  const specs = eq.specifications ?? null;

  const canBook = Boolean(eq.bookable) && eq.status === 'AVAILABLE';

  return (
    <div className="min-h-screen">
      <Header />

      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <Link
          href="/equipment"
          className="inline-flex items-center gap-1 text-gray-500 hover:text-gray-700 text-sm mb-6"
        >
          <ArrowLeft className="h-4 w-4" />
          返回设备列表
        </Link>

        <div className="grid md:grid-cols-2 gap-8">
          <div className="bg-gray-100 rounded-xl flex items-center justify-center min-h-[300px]">
            <Wrench className="h-16 w-16 text-gray-300" />
          </div>

          <div>
            <Badge variant={statusInfo.variant} className="mb-2">
              {statusInfo.label}
            </Badge>

            <h1 className="text-2xl font-bold text-gray-900 mb-1">{eq.nameZh}</h1>

            {eq.nameEn ? <p className="text-gray-500 mb-4">{eq.nameEn}</p> : null}
            {eq.model ? <p className="text-sm text-gray-600 mb-1">型号: {eq.model}</p> : null}
            {eq.manufacturer ? (
              <p className="text-sm text-gray-600 mb-4">制造商: {eq.manufacturer}</p>
            ) : null}

            {lab ? (
              <p className="text-sm text-gray-500">
                所属实验室:{' '}
                <Link href={`/labs/${lab.slug}`} className="text-blue-600 hover:underline">
                  {lab.nameZh}
                </Link>
                {lab.city ? <span className="text-gray-400 ml-1">· {lab.city}</span> : null}
              </p>
            ) : null}

            <div className="flex gap-3 mt-6 flex-wrap">
              {eq.bookable ? (
                canBook ? (
                  <Link href={`/equipment/${eq.slug}/booking`}>
                    <Button size="lg">
                      <CalendarDays className="h-4 w-4" />
                      预约使用
                    </Button>
                  </Link>
                ) : (
                  <Button size="lg" disabled>
                    <CalendarDays className="h-4 w-4" />
                    当前不可预约
                  </Button>
                )
              ) : null}

              <Link href="/contact">
                <Button variant="outline" size="lg">
                  咨询详情
                </Button>
              </Link>
            </div>

            {(eq.hourlyRate || eq.dailyRate) ? (
              <div className="mt-4 flex gap-4 text-sm flex-wrap">
                {eq.hourlyRate ? (
                  <span className="text-gray-600">¥{String(eq.hourlyRate)}/小时</span>
                ) : null}
                {eq.dailyRate ? (
                  <span className="text-gray-600">¥{String(eq.dailyRate)}/天</span>
                ) : null}
              </div>
            ) : null}
          </div>
        </div>

        {eq.descZh ? (
          <Card padding="lg" className="mt-8">
            <h2 className="text-lg font-bold text-gray-900 mb-3">设备描述</h2>
            <p className="text-gray-600 leading-relaxed">{eq.descZh}</p>
          </Card>
        ) : null}

        {specs && Object.keys(specs).length > 0 ? (
          <Card padding="lg" className="mt-6">
            <h2 className="text-lg font-bold text-gray-900 mb-3">技术参数</h2>
            <div className="grid sm:grid-cols-2 gap-3">
              {Object.entries(specs).map(([k, v]) => (
                <div key={k} className="flex justify-between py-2 border-b border-gray-100">
                  <span className="text-gray-500 text-sm">{k}</span>
                  <span className="text-gray-900 text-sm font-medium">{v}</span>
                </div>
              ))}
            </div>
          </Card>
        ) : null}
      </div>

      <Footer />
    </div>
  );
}