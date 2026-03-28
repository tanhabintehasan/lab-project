'use client';

import { useCallback, useEffect, useMemo, useState } from 'react';
import { useTranslations } from 'next-intl';
import { Link, useRouter } from '@/i18n/routing';
import { Header } from '@/components/layout/header';
import { Footer } from '@/components/layout/footer';
import {
  FlaskConical,
  Search,
  ArrowRight,
} from 'lucide-react';

interface Service {
  id: string;
  slug: string;
  nameZh: string;
  category?: { nameZh?: string } | null;
  basePrice?: number | string | null;
  turnaroundDays?: number | string | null;
  isHot?: boolean;
}

interface Category {
  id: string;
  nameZh: string;
  slug: string;
  icon?: string | null;
  count?: number;
  serviceCount?: number;
}

interface Stats {
  services: number;
  labs: number;
  orders: number;
  reports: number;
  users: number;
}

function extractArray<T>(payload: unknown): T[] {
  if (Array.isArray(payload)) return payload as T[];

  const p = payload as {
    data?: unknown[] | { items?: unknown[]; data?: unknown[] };
    items?: unknown[];
    results?: unknown[];
  };

  if (Array.isArray(p?.data)) return p.data as T[];
  if (Array.isArray(p?.items)) return p.items as T[];
  if (Array.isArray(p?.results)) return p.results as T[];

  if (
    p?.data &&
    typeof p.data === 'object' &&
    Array.isArray((p.data as { items?: unknown[] }).items)
  ) {
    return ((p.data as { items?: unknown[] }).items ?? []) as T[];
  }

  if (
    p?.data &&
    typeof p.data === 'object' &&
    Array.isArray((p.data as { data?: unknown[] }).data)
  ) {
    return ((p.data as { data?: unknown[] }).data ?? []) as T[];
  }

  return [];
}

function toNumber(value: unknown, fallback = 0): number {
  if (typeof value === 'number' && !Number.isNaN(value)) return value;
  if (typeof value === 'string') {
    const parsed = Number(value);
    if (!Number.isNaN(parsed)) return parsed;
  }
  return fallback;
}

export default function HomePage() {
  const t = useTranslations('home');
  const tCommon = useTranslations('common');
  const router = useRouter();

  const [searchQuery, setSearchQuery] = useState('');
  const [hotServices, setHotServices] = useState<Service[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [stats, setStats] = useState<Stats | null>(null);
  const [loading, setLoading] = useState(true);

  const handleSearch = useCallback(
    (query: string) => {
      const trimmed = query.trim();
      if (!trimmed) return;
      router.push(`/services?q=${encodeURIComponent(trimmed)}`);
    },
    [router]
  );

  const fetchHomeData = useCallback(async () => {
    try {
      setLoading(true);

      const [servicesRes, categoriesRes, statsRes] = await Promise.all([
        fetch('/api/services?pageSize=6&sort=popular&order=desc', {
          cache: 'no-store',
        }),
        fetch('/api/service-categories?pageSize=8', {
          cache: 'no-store',
        }),
        fetch('/api/stats', {
          cache: 'no-store',
        }),
      ]);

      const [servicesData, categoriesData, statsData] = await Promise.all([
        servicesRes.json().catch(() => null),
        categoriesRes.json().catch(() => null),
        statsRes.json().catch(() => null),
      ]);

      const serviceItems = extractArray<Service>(servicesData);
      const categoryItems = extractArray<Category>(categoriesData);

      setHotServices(Array.isArray(serviceItems) ? serviceItems : []);
      setCategories(Array.isArray(categoryItems) ? categoryItems.slice(0, 8) : []);
      setStats(statsData?.success ? statsData.data : null);

      console.log('home servicesData:', servicesData);
      console.log('home parsed hotServices:', serviceItems);
    } catch (error) {
      console.error('Home data fetch error:', error);
      setHotServices([]);
      setCategories([]);
      setStats(null);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchHomeData();
  }, [fetchHomeData]);

  const safeHotServices = useMemo(
    () => (Array.isArray(hotServices) ? hotServices : []),
    [hotServices]
  );

  const safeCategories = useMemo(
    () => (Array.isArray(categories) ? categories : []),
    [categories]
  );

  const formatStat = (num: number) => {
    if (num >= 10000) return `${Math.floor(num / 1000) / 10}万+`;
    if (num >= 1000) return `${Math.floor(num / 100) / 10}k+`;
    return `${num}+`;
  };

  return (
    <div className="min-h-screen">
      <Header />

      <section className="relative overflow-hidden bg-gradient-to-br from-blue-600 via-blue-700 to-indigo-800 text-white">
        <div className="absolute inset-0 opacity-10 bg-[url('/grid.svg')]" />
        <div className="relative mx-auto max-w-7xl px-4 py-20 sm:px-6 lg:px-8 lg:py-28">
          <div className="max-w-3xl">
            <h1 className="mb-6 text-4xl font-bold leading-tight lg:text-5xl">
              {t('hero.title')}
            </h1>

            <p className="mb-8 text-lg leading-relaxed text-blue-100 lg:text-xl">
              {t('hero.subtitle')}
            </p>

            <div className="mb-8 flex flex-col gap-3 sm:flex-row">
              <div className="relative flex-1">
                <Search className="absolute left-4 top-1/2 h-5 w-5 -translate-y-1/2 text-gray-400" />
                <input
                  type="text"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter') handleSearch(searchQuery);
                  }}
                  placeholder={t('hero.searchPlaceholder')}
                  className="w-full rounded-xl py-3.5 pl-12 pr-4 text-base text-gray-900 shadow-lg focus:outline-none focus:ring-2 focus:ring-blue-400"
                />
              </div>

              <button
                type="button"
                onClick={() => handleSearch(searchQuery)}
                className="rounded-xl bg-orange-500 px-8 py-3.5 font-semibold shadow-lg transition-colors hover:bg-orange-600"
              >
                {tCommon('search')}
              </button>
            </div>

            <div className="flex flex-wrap gap-2">
              {['拉伸试验', '硬度测试', '化学成分', 'GB/T 228', '盐雾试验'].map((tag) => (
                <button
                  key={tag}
                  type="button"
                  onClick={() => handleSearch(tag)}
                  className="cursor-pointer rounded-full bg-white/10 px-3 py-1.5 text-sm transition-colors hover:bg-white/20"
                >
                  {tag}
                </button>
              ))}
            </div>
          </div>
        </div>
      </section>

      <section className="border-b border-gray-100 bg-white">
        <div className="mx-auto max-w-7xl px-4 py-10 sm:px-6 lg:px-8">
          <div className="grid grid-cols-2 gap-8 md:grid-cols-4">
            {(stats
              ? [
                  { value: formatStat(stats.services), label: '检测项目' },
                  { value: formatStat(stats.labs), label: '合作实验室' },
                  { value: formatStat(stats.users), label: '服务客户' },
                  { value: formatStat(stats.reports), label: '检测报告' },
                ]
              : []
            ).map((stat) => (
              <div key={stat.label} className="text-center">
                <div className="text-3xl font-bold text-blue-600 lg:text-4xl">
                  {stat.value}
                </div>
                <div className="mt-1 text-sm text-gray-500">{stat.label}</div>
              </div>
            ))}
          </div>
        </div>
      </section>

      <section className="py-16">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="mb-8 flex items-center justify-between">
            <h2 className="text-2xl font-bold">{t('hotServices')}</h2>
            <Link
              href="/services"
              className="flex items-center gap-1 text-sm text-blue-600 hover:text-blue-700"
            >
              {tCommon('viewAll')} <ArrowRight className="h-4 w-4" />
            </Link>
          </div>

          {loading ? (
            <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3">
              {Array.from({ length: 6 }).map((_, i) => (
                <div key={i} className="h-48 animate-pulse rounded-xl bg-gray-200" />
              ))}
            </div>
          ) : safeHotServices.length === 0 ? (
            <div className="rounded-xl border border-gray-200 bg-white p-8 text-center text-gray-500">
              暂无热门服务
            </div>
          ) : (
            <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3">
              {safeHotServices.map((service) => (
                <Link
                  key={service.id}
                  href={`/services/${service.slug}`}
                  className="group rounded-xl border border-gray-200 bg-white p-6 transition-all hover:border-blue-200 hover:shadow-md"
                >
                  <div className="mb-3 flex items-start justify-between">
                    <div>
                      <span className="rounded-full bg-blue-50 px-2 py-0.5 text-xs text-blue-600">
                        {service.category?.nameZh ?? '未分类'}
                      </span>
                      {service.isHot && (
                        <span className="ml-2 rounded-full bg-orange-50 px-2 py-0.5 text-xs text-orange-600">
                          热门
                        </span>
                      )}
                    </div>
                    <FlaskConical className="h-5 w-5 text-gray-300 transition-colors group-hover:text-blue-400" />
                  </div>

                  <h3 className="mb-2 text-lg font-semibold text-gray-900 transition-colors group-hover:text-blue-600">
                    {service.nameZh || '未命名服务'}
                  </h3>

                  <div className="mt-4 flex items-center justify-between border-t border-gray-100 pt-4">
                    <div>
                      <span className="text-lg font-bold text-blue-600">
                        ¥{toNumber(service.basePrice, 0)}
                      </span>
                      <span className="ml-1 text-xs text-gray-400">起</span>
                    </div>
                    <span className="text-xs text-gray-500">
                      {toNumber(service.turnaroundDays, 0)}个工作日
                    </span>
                  </div>
                </Link>
              ))}
            </div>
          )}
        </div>
      </section>

      <section className="py-16">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="mb-8 flex items-center justify-between">
            <h2 className="text-2xl font-bold">服务分类</h2>
            <Link
              href="/services/categories"
              className="flex items-center gap-1 text-sm text-blue-600 hover:text-blue-700"
            >
              {tCommon('viewAll')} <ArrowRight className="h-4 w-4" />
            </Link>
          </div>

          <div className="grid grid-cols-2 gap-4 sm:grid-cols-4 lg:grid-cols-8">
            {safeCategories.map((cat) => (
              <Link
                key={cat.id}
                href={`/services/categories/${cat.slug || cat.id}`}
                className="flex flex-col items-center rounded-xl border border-gray-200 bg-white p-4 transition-all hover:border-blue-200 hover:shadow-sm"
              >
                <FlaskConical className="mb-2 h-8 w-8 text-blue-500" />
                <span className="line-clamp-2 text-center text-sm font-medium text-gray-800">
                  {cat.nameZh}
                </span>
                <span className="mt-1 text-xs text-gray-400">
                  {cat.serviceCount ?? cat.count ?? 0}项
                </span>
              </Link>
            ))}
          </div>
        </div>
      </section>

      <Footer />
    </div>
  );
}