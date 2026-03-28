'use client';

import { useState, useEffect, useCallback } from 'react';
import { useTranslations } from 'next-intl';
import { Header } from '@/components/layout/header';
import { Footer } from '@/components/layout/footer';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { SearchInput } from '@/components/ui/search-input';
import { Pagination } from '@/components/ui/pagination';
import { ServiceCardSkeleton } from '@/components/ui/skeleton';
import { Link } from '@/i18n/routing';
import { Wrench } from 'lucide-react';

const statusMap: Record<
  string,
  { label: string; variant: 'success' | 'warning' | 'danger' | 'default' }
> = {
  AVAILABLE: { label: '可用', variant: 'success' },
  IN_USE: { label: '使用中', variant: 'warning' },
  MAINTENANCE: { label: '维护中', variant: 'danger' },
  UNAVAILABLE: { label: '不可用', variant: 'default' },
};

export default function EquipmentPage() {
  const t = useTranslations('equipment');
  const [equipment, setEquipment] = useState<Array<Record<string, unknown>>>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);

  const fetchData = useCallback(() => {
    setLoading(true);
    const params = new URLSearchParams();

    if (search) params.set('q', search);
    params.set('page', String(page));
    params.set('pageSize', '12');

    fetch(`/api/equipment?${params}`, {
      credentials: 'include',
    })
      .then(r => r.json())
      .then(data => {
        setEquipment(data.data || []);
        setTotalPages(data.totalPages || 1);
      })
      .finally(() => setLoading(false));
  }, [search, page]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  return (
    <div className="min-h-screen">
      <Header />

      <section className="bg-gradient-to-br from-blue-600 to-indigo-800 text-white py-12">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <h1 className="text-3xl font-bold mb-2">{t('title')}</h1>
          <p className="text-blue-100 mb-6">{t('subtitle')}</p>
          <SearchInput
            placeholder="搜索设备名称、型号..."
            onSearch={v => {
              setSearch(v);
              setPage(1);
            }}
            size="lg"
            className="max-w-xl mx-auto"
          />
        </div>
      </section>

      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        {loading ? (
          <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-6">
            {Array.from({ length: 6 }).map((_, i) => (
              <ServiceCardSkeleton key={i} />
            ))}
          </div>
        ) : equipment.length === 0 ? (
          <div className="text-center py-16 text-gray-500">暂无设备数据</div>
        ) : (
          <>
            <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-6">
              {equipment.map(eq => {
                const id = eq.id as string;
                const slug = eq.slug as string;
                const nameZh = eq.nameZh as string;
                const model = eq.model as string | undefined;
                const status = eq.status as string;
                const lab = eq.lab as { nameZh: string; city?: string } | null;

                const s = statusMap[status] || statusMap.UNAVAILABLE;
                const labText = lab ? `${lab.nameZh}${lab.city ? ` · ${lab.city}` : ''}` : null;

                return (
                  <Link key={id} href={`/equipment/${slug}`}>
                    <Card hover padding="none" className="overflow-hidden">
                      <div className="h-40 bg-gray-100 flex items-center justify-center">
                        <Wrench className="h-12 w-12 text-gray-300" />
                      </div>

                      <div className="p-4">
                        <div className="flex items-start justify-between mb-2">
                          <h3 className="font-semibold text-gray-900">{nameZh}</h3>
                          <Badge variant={s.variant}>{s.label}</Badge>
                        </div>

                        {model ? (
                          <p className="text-sm text-gray-500 mb-1">型号: {model}</p>
                        ) : null}

                        {labText ? (
                          <p className="text-sm text-gray-400">{labText}</p>
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
      </section>

      <Footer />
    </div>
  );
}