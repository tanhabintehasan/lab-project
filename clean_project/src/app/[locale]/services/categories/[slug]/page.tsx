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

type ServiceItem = {
  id: string;
  slug?: string;
  nameZh?: string;
  shortDescZh?: string;
  priceMin?: string | number | null;
  turnaroundDays?: string | number | null;
};

function extractArray<T>(payload: unknown): T[] {
  if (Array.isArray(payload)) return payload as T[];

  if (Array.isArray((payload as { data?: unknown[] })?.data)) {
    return ((payload as { data?: unknown[] }).data ?? []) as T[];
  }

  if (Array.isArray((payload as { items?: unknown[] })?.items)) {
    return ((payload as { items?: unknown[] }).items ?? []) as T[];
  }

  if (Array.isArray((payload as { data?: { items?: unknown[] } })?.data?.items)) {
    return ((payload as { data?: { items?: unknown[] } }).data?.items ?? []) as T[];
  }

  return [];
}

function extractTotalPages(payload: unknown): number {
  const p = payload as {
    totalPages?: number;
    pagination?: { totalPages?: number };
    data?: { totalPages?: number; pagination?: { totalPages?: number } };
  };

  if (typeof p?.totalPages === 'number' && p.totalPages > 0) return p.totalPages;
  if (typeof p?.pagination?.totalPages === 'number' && p.pagination.totalPages > 0) {
    return p.pagination.totalPages;
  }
  if (typeof p?.data?.totalPages === 'number' && p.data.totalPages > 0) {
    return p.data.totalPages;
  }
  if (
    typeof p?.data?.pagination?.totalPages === 'number' &&
    p.data.pagination.totalPages > 0
  ) {
    return p.data.pagination.totalPages;
  }

  return 1;
}

export default function CategoryServicesPage() {
  const params = useParams();
  const slug = params.slug as string;

  const [services, setServices] = useState<ServiceItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);

  const fetchData = useCallback(async () => {
    try {
      setLoading(true);

      const res = await fetch(
        `/api/services?category=${encodeURIComponent(slug)}&page=${page}&pageSize=12`,
        {
          credentials: 'include',
          cache: 'no-store',
        }
      );

      let data: unknown = null;
      try {
        data = await res.json();
      } catch {
        data = null;
      }

      if (!res.ok) {
        setServices([]);
        setTotalPages(1);
        return;
      }

      setServices(extractArray<ServiceItem>(data));
      setTotalPages(extractTotalPages(data));
    } catch (error) {
      console.error('Category services fetch error:', error);
      setServices([]);
      setTotalPages(1);
    } finally {
      setLoading(false);
    }
  }, [slug, page]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  return (
    <div className="min-h-screen">
      <Header />

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <Link
          href="/services/categories"
          className="inline-flex items-center gap-1 text-gray-500 hover:text-gray-700 text-sm mb-4"
        >
          <ArrowLeft className="h-4 w-4" />
          返回分类
        </Link>

        <h1 className="text-2xl font-bold text-gray-900 mb-8">
          分类: {slug}
        </h1>

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
              {services.map((service) => {
                const id = String(service.id);
                const serviceSlug = service.slug || id;
                const nameZh = service.nameZh || '未命名服务';
                const shortDescZh = service.shortDescZh || '';
                const priceMin = service.priceMin;
                const turnaroundDays = service.turnaroundDays;

                return (
                  <Link key={id} href={`/services/${serviceSlug}`}>
                    <Card hover padding="md">
                      <h3 className="font-semibold text-gray-900 mb-1">
                        {nameZh}
                      </h3>

                      <p className="text-sm text-gray-500 mb-3 line-clamp-2">
                        {shortDescZh}
                      </p>

                      <div className="flex items-center justify-between">
                        {priceMin !== null &&
                        priceMin !== undefined &&
                        priceMin !== '' ? (
                          <span className="text-blue-600 font-medium">
                            ¥{String(priceMin)} 起
                          </span>
                        ) : (
                          <span className="text-sm text-gray-400">询价</span>
                        )}

                        {turnaroundDays ? (
                          <Badge variant="outline">
                            {String(turnaroundDays)}天
                          </Badge>
                        ) : null}
                      </div>
                    </Card>
                  </Link>
                );
              })}
            </div>

            <div className="mt-8">
              <Pagination
                currentPage={page}
                totalPages={totalPages}
                onPageChange={setPage}
              />
            </div>
          </>
        )}
      </div>

      <Footer />
    </div>
  );
}