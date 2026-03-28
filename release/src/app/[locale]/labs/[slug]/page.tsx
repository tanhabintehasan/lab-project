'use client';

import { useState, useEffect } from 'react';
import { useTranslations } from 'next-intl';
import { useParams } from 'next/navigation';
import { Header } from '@/components/layout/header';
import { Footer } from '@/components/layout/footer';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';
import { Link } from '@/i18n/routing';
import { MapPin, Star, Clock, ArrowLeft } from 'lucide-react';

export default function LabDetailPage() {
  const t = useTranslations('labs');
  const params = useParams();
  const slug = params.slug as string;
  const [lab, setLab] = useState<Record<string, unknown> | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch(`/api/labs/${slug}`, {
      credentials: 'include',
    })
      .then(r => r.json())
      .then(data => {
        if (data.success) setLab(data.data);
      })
      .finally(() => setLoading(false));
  }, [slug]);

  if (loading) {
    return (
      <div className="min-h-screen">
        <Header />
        <div className="max-w-7xl mx-auto px-4 py-16 space-y-4">
          <Skeleton className="h-8 w-1/3" />
          <Skeleton className="h-48 w-full" />
          <Skeleton className="h-32 w-full" />
        </div>
        <Footer />
      </div>
    );
  }

  if (!lab) {
    return (
      <div className="min-h-screen">
        <Header />
        <div className="max-w-7xl mx-auto px-4 py-16 text-center">
          <h1 className="text-2xl font-bold text-gray-900">实验室未找到</h1>
          <Link href="/labs">
            <Button variant="outline" className="mt-4">
              <ArrowLeft className="h-4 w-4" />
              返回列表
            </Button>
          </Link>
        </div>
        <Footer />
      </div>
    );
  }

  const services =
    (lab.services as Array<{ service: { nameZh: string; slug: string; priceMin?: number } }>) || [];
  const equipment =
    (lab.equipment as Array<{ id: string; nameZh: string; slug: string; model?: string; status: string }>) || [];
  const certs = (lab.certifications as Array<{ name: string }>) || [];

  const nameZh = lab.nameZh as string;
  const nameEn = lab.nameEn as string | undefined;
  const city = lab.city as string | undefined;
  const rating = lab.rating as string | number | undefined;
  const avgTurnaroundDays = lab.avgTurnaroundDays as string | number | undefined;
  const fullDescZh = lab.fullDescZh as string | undefined;

  return (
    <div className="min-h-screen">
      <Header />

      <section className="bg-gradient-to-r from-blue-600 to-indigo-700 text-white py-12">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <Link
            href="/labs"
            className="inline-flex items-center gap-1 text-blue-200 hover:text-white text-sm mb-4"
          >
            <ArrowLeft className="h-4 w-4" />
            返回列表
          </Link>

          <div className="flex items-start gap-6">
            <div className="w-20 h-20 bg-white/20 rounded-xl flex items-center justify-center text-3xl font-bold">
              {nameZh?.[0]}
            </div>

            <div>
              <h1 className="text-3xl font-bold">{nameZh}</h1>
              {nameEn ? <p className="text-blue-200">{nameEn}</p> : null}

              <div className="flex items-center gap-4 mt-3 text-sm text-blue-100">
                {city ? (
                  <span className="flex items-center gap-1">
                    <MapPin className="h-4 w-4" />
                    {city}
                  </span>
                ) : null}

                {rating ? (
                  <span className="flex items-center gap-1">
                    <Star className="h-4 w-4 text-yellow-400" />
                    {String(rating)}
                  </span>
                ) : null}

                <span className="flex items-center gap-1">
                  <Clock className="h-4 w-4" />
                  平均 {avgTurnaroundDays ? `${String(avgTurnaroundDays)}天` : 'N/A'}
                </span>
              </div>

              <div className="flex gap-2 mt-3">
                {certs.map(c => (
                  <Badge key={c.name} variant="info">
                    {c.name}
                  </Badge>
                ))}
              </div>
            </div>
          </div>
        </div>
      </section>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12 space-y-8">
        {fullDescZh ? (
          <Card padding="lg">
            <h2 className="text-xl font-bold text-gray-900 mb-4">实验室简介</h2>
            <p className="text-gray-600 leading-relaxed">{fullDescZh}</p>
          </Card>
        ) : null}

        {services.length > 0 ? (
          <Card padding="lg">
            <h2 className="text-xl font-bold text-gray-900 mb-4">
              {t('servicesProvided')} ({services.length})
            </h2>
            <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-3">
              {services.map(s => (
                <Link
                  key={s.service.slug}
                  href={`/services/${s.service.slug}`}
                  className="p-3 border border-gray-200 rounded-lg hover:border-blue-300 hover:bg-blue-50 transition-colors"
                >
                  <p className="font-medium text-gray-900">{s.service.nameZh}</p>
                  {s.service.priceMin ? (
                    <p className="text-sm text-blue-600 mt-1">¥{String(s.service.priceMin)} 起</p>
                  ) : null}
                </Link>
              ))}
            </div>
          </Card>
        ) : null}

        {equipment.length > 0 ? (
          <Card padding="lg">
            <h2 className="text-xl font-bold text-gray-900 mb-4">
              {t('equipmentList')} ({equipment.length})
            </h2>
            <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-3">
              {equipment.map(eq => (
                <Link
                  key={eq.id}
                  href={`/equipment/${eq.slug}`}
                  className="p-3 border border-gray-200 rounded-lg hover:border-blue-300 transition-colors"
                >
                  <p className="font-medium text-gray-900">{eq.nameZh}</p>
                  {eq.model ? <p className="text-sm text-gray-500">{eq.model}</p> : null}
                  <Badge variant={eq.status === 'AVAILABLE' ? 'success' : 'warning'} className="mt-2">
                    {eq.status}
                  </Badge>
                </Link>
              ))}
            </div>
          </Card>
        ) : null}

        <div className="text-center">
          <Button size="lg">{t('cooperate')}</Button>
        </div>
      </div>

      <Footer />
    </div>
  );
}