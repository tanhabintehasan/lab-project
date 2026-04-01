'use client';

import { useState, useEffect, useCallback } from 'react';
import { useParams } from 'next/navigation';
import { Header } from '@/components/layout/header';
import { Footer } from '@/components/layout/footer';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Pagination } from '@/components/ui/pagination';
import { ServiceCardSkeleton } from '@/components/ui/skeleton';
import { Link } from '@/i18n/routing';
import { ArrowLeft } from 'lucide-react';

export default function MaterialServicesPage() {
  const params = useParams();
  const slug = params.slug as string;

  const [services, setServices] = useState<Array<Record<string, unknown>>>([]);
  const [loading, setLoading] = useState(true);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);

  const fetchData = useCallback(() => {
    setLoading(true);

    fetch(`/api/services?material=${slug}&page=${page}&pageSize=12`, {
      credentials: 'include',
    })
      .then(r => r.json())
      .then(data => {
        setServices(data.data || []);
        setTotalPages(data.totalPages || 1);
      })
      .finally(() => setLoading(false));
  }, [slug, page]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  return (
    <div className="min-h-screen">
      <Header />

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <Link
          href="/services/materials"
          className="inline-flex items-center gap-1 text-gray-500 hover:text-gray-700 text-sm mb-4"
        >
          <ArrowLeft className="h-4 w-4" />
          返回材料
        </Link>

        <h1 className="text-2xl font-bold text-gray-900 mb-8">材料: {slug}</h1>

        {loading ? (
          <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-6">
            {Array.from({ length: 6 }).map((_, i) => (
              <ServiceCardSkeleton key={i} />
            ))}
          </div>
        ) : services.length === 0 ? (
          <p className="text-center py-16 text-gray-500">暂无服务</p>
        ) : (
          <>
            <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-6">
              {services.map(service => {
                const id = service.id as string;
                const serviceSlug = service.slug as string;
                const nameZh = service.nameZh as string;
                const shortDescZh = service.shortDescZh as string | undefined;
                const priceMin = service.priceMin as string | number | undefined;
                const turnaroundDays = service.turnaroundDays as string | number | undefined;

                return (
                  <Link key={id} href={`/services/${serviceSlug}`}>
                    <Card hover padding="md">
                      <h3 className="font-semibold text-gray-900 mb-1">{nameZh}</h3>

                      <p className="text-sm text-gray-500 mb-3 line-clamp-2">
                        {shortDescZh || ''}
                      </p>

                      <div className="flex items-center justify-between">
                        {priceMin ? (
                          <span className="text-blue-600 font-medium">
                            ¥{String(priceMin)} 起
                          </span>
                        ) : (
                          <span />
                        )}

                        {turnaroundDays ? (
                          <Badge variant="outline">{String(turnaroundDays)}天</Badge>
                        ) : null}
                      </div>
                    </Card>
                  </Link>
                );
              })}
            </div>

            <div className="mt-8">
              <Pagination currentPage={page} totalPages={totalPages} onPageChange={setPage} />
            </div>
          </>
        )}
      </div>

      <Footer />
    </div>
  );
}