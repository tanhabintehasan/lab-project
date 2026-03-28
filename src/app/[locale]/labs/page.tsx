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
import { MapPin, Star, Building2 } from 'lucide-react';

export default function LabsPage() {
  const t = useTranslations('labs');
  const [labs, setLabs] = useState<Array<Record<string, unknown>>>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [selectedCity, setSelectedCity] = useState('');
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);

  const cities = ['北京', '上海', '广州', '深圳', '杭州', '成都', '武汉', '南京'];

  const fetchData = useCallback(() => {
    setLoading(true);
    const params = new URLSearchParams({ page: String(page), pageSize: '9' });
    if (search) params.set('q', search);
    if (selectedCity) params.set('city', selectedCity);

    fetch(`/api/labs?${params}`, {
      credentials: 'include',
    })
      .then(r => r.json())
      .then(data => {
        setLabs(data.data || []);
        setTotalPages(data.totalPages || 1);
      })
      .finally(() => setLoading(false));
  }, [search, selectedCity, page]);

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
            placeholder="搜索实验室名称..."
            onSearch={v => {
              setSearch(v);
              setPage(1);
            }}
            size="lg"
            className="max-w-xl mx-auto"
          />
        </div>
      </section>

      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="flex flex-wrap gap-2 mb-6">
          <button
            onClick={() => {
              setSelectedCity('');
              setPage(1);
            }}
            className={`px-4 py-2 rounded-lg text-sm font-medium ${
              !selectedCity
                ? 'bg-blue-600 text-white'
                : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
            }`}
          >
            全部
          </button>

          {cities.map(city => (
            <button
              key={city}
              onClick={() => {
                setSelectedCity(city);
                setPage(1);
              }}
              className={`px-4 py-2 rounded-lg text-sm font-medium ${
                selectedCity === city
                  ? 'bg-blue-600 text-white'
                  : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
              }`}
            >
              {city}
            </button>
          ))}
        </div>

        {loading ? (
          <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-6">
            {Array.from({ length: 6 }).map((_, i) => (
              <ServiceCardSkeleton key={i} />
            ))}
          </div>
        ) : labs.length === 0 ? (
          <div className="text-center py-16 text-gray-500">暂无实验室数据</div>
        ) : (
          <>
            <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-6">
              {labs.map(lab => {
                const id = lab.id as string;
                const slug = lab.slug as string;
                const nameZh = lab.nameZh as string;
                const shortDescZh = lab.shortDescZh as string | undefined;
                const city = lab.city as string | undefined;
                const rating = lab.rating as string | number | undefined;
                const certs = (lab.certifications as Array<{ name: string }>) || [];
                const count = lab._count as { orders: number; equipment: number } | undefined;

                return (
                  <Link key={id} href={`/labs/${slug}`}>
                    <Card hover padding="none" className="overflow-hidden">
                      <div className="h-32 bg-gradient-to-br from-blue-50 to-indigo-100 flex items-center justify-center">
                        <Building2 className="h-12 w-12 text-blue-300" />
                      </div>

                      <div className="p-4">
                        <h3 className="font-semibold text-gray-900 text-lg mb-1">{nameZh}</h3>

                        {shortDescZh ? (
                          <p className="text-sm text-gray-500 mb-3 line-clamp-2">{shortDescZh}</p>
                        ) : null}

                        <div className="flex items-center gap-3 text-sm text-gray-500 mb-3">
                          {city ? (
                            <span className="flex items-center gap-1">
                              <MapPin className="h-3.5 w-3.5" />
                              {city}
                            </span>
                          ) : null}

                          {rating ? (
                            <span className="flex items-center gap-1">
                              <Star className="h-3.5 w-3.5 text-yellow-500" />
                              {String(rating)}
                            </span>
                          ) : null}

                          {count ? <span>{count.orders} 订单</span> : null}
                        </div>

                        {certs.length > 0 ? (
                          <div className="flex flex-wrap gap-1">
                            {certs.slice(0, 3).map(c => (
                              <Badge key={c.name} variant="info" size="sm">
                                {c.name}
                              </Badge>
                            ))}
                          </div>
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