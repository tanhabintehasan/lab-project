'use client';

import { useCallback, useEffect, useMemo, useState } from 'react';
import { Header } from '@/components/layout/header';
import { Footer } from '@/components/layout/footer';
import { Link, useRouter } from '@/i18n/routing';
import {
  Search,
  ArrowRight,
  FlaskConical,
  ShieldCheck,
  Building2,
  GraduationCap,
  Landmark,
  Wallet,
  ChevronRight,
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

const defaultCategoryIcons = ['🔬', '🧪', '🌡️', '📐', '⚡', '🛡️', '🔩', '🧬', '🧫', '📊'];

export default function HomePage() {
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

  const handleCustomTesting = useCallback(() => {
    router.push('/rfq/new');
  }, [router]);

  const fetchHomeData = useCallback(async () => {
    try {
      setLoading(true);

      const [servicesRes, categoriesRes, statsRes] = await Promise.all([
        fetch('/api/services?pageSize=6&sort=popular&order=desc', {
          cache: 'no-store',
        }),
        fetch('/api/service-categories?pageSize=10', {
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
      setCategories(Array.isArray(categoryItems) ? categoryItems.slice(0, 10) : []);
      setStats(statsData?.success ? statsData.data : null);
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
    <div className="min-h-screen bg-white">
      <Header />

      <section className="relative overflow-hidden bg-gradient-to-br from-blue-700 via-indigo-700 to-slate-900 text-white">
        <div className="absolute inset-0 opacity-10 bg-[url('/grid.svg')]" />
        <div className="relative mx-auto max-w-7xl px-4 py-16 sm:px-6 lg:px-8 lg:py-20">
          <div className="grid items-center gap-10 lg:grid-cols-[1.3fr_0.9fr]">
            <div>
              <div className="mb-5 inline-flex items-center gap-2 rounded-full bg-white/10 px-3 py-1 text-sm">
                <ShieldCheck className="h-4 w-4" />
                国家科研与检测协同服务入口
              </div>

              <h1 className="mb-5 text-4xl font-bold leading-tight lg:text-5xl">
                度量衡科研平台
              </h1>

              <p className="mb-8 text-lg leading-relaxed text-blue-100 lg:text-xl">
                立足科学前沿，服务中国创新
              </p>

              <div className="mb-6 flex flex-col gap-3 sm:flex-row">
                <div className="relative flex-1">
                  <Search className="absolute left-4 top-1/2 h-5 w-5 -translate-y-1/2 text-gray-400" />
                  <input
                    type="text"
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    onKeyDown={(e) => {
                      if (e.key === 'Enter') handleSearch(searchQuery);
                    }}
                    placeholder="搜索检测服务、材料、标准、实验室..."
                    className="w-full rounded-xl py-3.5 pl-12 pr-4 text-base text-gray-900 shadow-lg focus:outline-none focus:ring-2 focus:ring-blue-300"
                  />
                </div>

                <button
                  type="button"
                  onClick={() => handleSearch(searchQuery)}
                  className="rounded-xl bg-orange-500 px-8 py-3.5 font-semibold shadow-lg transition-colors hover:bg-orange-600"
                >
                  搜索
                </button>

                <button
                  type="button"
                  onClick={handleCustomTesting}
                  className="rounded-xl bg-blue-600 px-8 py-3.5 font-semibold shadow-lg transition-colors hover:bg-blue-700"
                >
                  发布定制测试
                </button>
              </div>

              <div className="flex flex-wrap gap-2">
                {['拉伸试验', '硬度测试', '化学成分', 'GB/T 228', '盐雾试验'].map((tag) => (
                  <button
                    key={tag}
                    type="button"
                    onClick={() => handleSearch(tag)}
                    className="rounded-full bg-white/10 px-3 py-1.5 text-sm transition-colors hover:bg-white/20"
                  >
                    {tag}
                  </button>
                ))}
              </div>

              <div className="mt-6">
                <button
                  type="button"
                  onClick={handleCustomTesting}
                  className="text-sm text-blue-100 underline underline-offset-4 transition-colors hover:text-white"
                >
                  没找到合适服务？立即提交定制测试需求 →
                </button>
              </div>
            </div>

            <div className="overflow-hidden rounded-3xl bg-white text-gray-900 shadow-2xl ring-1 ring-black/5">
              <div className="bg-gradient-to-r from-amber-400 via-orange-400 to-yellow-300 px-6 py-4">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-amber-950/80">专项资金模块</p>
                    <h3 className="text-2xl font-bold text-amber-950">阳光预存</h3>
                  </div>
                  <div className="rounded-2xl bg-white/70 p-3">
                    <Wallet className="h-7 w-7 text-amber-700" />
                  </div>
                </div>
              </div>

              <div className="px-6 py-6">
                <p className="text-sm leading-6 text-gray-600">
                  面向高校、科研院所、企业研发中心的统一预存结算工具，支持项目预存、分账户管理、订单抵扣、对账留痕。
                </p>

                <div className="mt-5 grid grid-cols-2 gap-3">
                  <div className="rounded-2xl bg-amber-50 p-4">
                    <p className="text-xs text-gray-500">适用对象</p>
                    <p className="mt-1 font-semibold text-gray-900">高校 / 企业 / 科研院所</p>
                  </div>
                  <div className="rounded-2xl bg-blue-50 p-4">
                    <p className="text-xs text-gray-500">结算模式</p>
                    <p className="mt-1 font-semibold text-gray-900">预存抵扣 / 对账开票</p>
                  </div>
                </div>

                <div className="mt-5 space-y-2 text-sm text-gray-700">
                  <div>• 资金用途透明，支持项目维度追踪</div>
                  <div>• 支持团队共享与审批</div>
                  <div>• 与检测订单、报告、发票联动</div>
                </div>

                <div className="mt-6 flex gap-3">
                  <Link
                    href="/enterprise/workspace"
                    className="inline-flex items-center justify-center rounded-xl bg-amber-500 px-5 py-3 text-sm font-semibold text-white hover:bg-amber-600"
                  >
                    开通阳光预存
                  </Link>
                  <Link
                    href="/help"
                    className="inline-flex items-center justify-center rounded-xl border border-gray-200 px-5 py-3 text-sm font-semibold text-gray-700 hover:bg-gray-50"
                  >
                    More
                  </Link>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      <section className="border-b border-gray-100 bg-white">
        <div className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8">
          <div className="mb-5 flex items-center justify-between">
            <div>
              <h2 className="text-2xl font-bold text-gray-900">服务分类</h2>
              <p className="mt-1 text-sm text-gray-500">按研究与检测方向快速进入</p>
            </div>
            <Link
              href="/services/categories"
              className="inline-flex items-center gap-1 text-sm font-medium text-blue-600 hover:text-blue-700"
            >
              More <ArrowRight className="h-4 w-4" />
            </Link>
          </div>

          <div className="grid grid-cols-4 gap-3 md:grid-cols-5 lg:grid-cols-10">
            {safeCategories.map((cat, idx) => (
              <Link
                key={cat.id}
                href={`/services/categories/${cat.slug}`}
                className="group rounded-2xl border border-gray-200 bg-white px-3 py-4 text-center transition-all hover:-translate-y-0.5 hover:border-blue-200 hover:shadow-md"
              >
                <div className="mx-auto mb-2 flex h-14 w-14 items-center justify-center rounded-2xl bg-blue-50 text-2xl text-blue-600">
                  <span>{cat.icon || defaultCategoryIcons[idx % defaultCategoryIcons.length]}</span>
                </div>
                <div className="line-clamp-2 text-sm font-medium text-gray-900">{cat.nameZh}</div>
                <div className="mt-1 text-xs text-gray-400">
                  {cat.serviceCount ?? cat.count ?? 0}项
                </div>
              </Link>
            ))}
          </div>
        </div>
      </section>

      <section className="border-b border-gray-100 bg-slate-50">
        <div className="mx-auto max-w-7xl px-4 py-10 sm:px-6 lg:px-8">
          <div className="grid grid-cols-2 gap-8 md:grid-cols-4">
            {(stats
              ? [
                  { value: formatStat(stats.services), label: '检测项目' },
                  { value: formatStat(stats.labs), label: '合作机构' },
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
            <h2 className="text-2xl font-bold text-gray-900">热门检测服务</h2>
            <Link
              href="/services"
              className="inline-flex items-center gap-1 text-sm font-medium text-blue-600 hover:text-blue-700"
            >
              More <ArrowRight className="h-4 w-4" />
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
                  className="group rounded-2xl border border-gray-200 bg-white p-6 transition-all hover:border-blue-200 hover:shadow-md"
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

      <section className="bg-slate-50 py-16">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="mb-8 flex items-center justify-between">
            <div>
              <h2 className="text-2xl font-bold text-gray-900">合作伙伴生态</h2>
              <p className="mt-1 text-sm text-gray-500">
                优先服务高校、科研院所、企业研发部门，再联动检测服务单位
              </p>
            </div>
            <Link
              href="/about"
              className="inline-flex items-center gap-1 text-sm font-medium text-blue-600 hover:text-blue-700"
            >
              More <ArrowRight className="h-4 w-4" />
            </Link>
          </div>

          <div className="grid gap-6 lg:grid-cols-3">
            <div className="rounded-3xl bg-white p-6 shadow-sm ring-1 ring-gray-200">
              <div className="mb-4 flex items-center gap-3">
                <div className="rounded-2xl bg-blue-50 p-3">
                  <GraduationCap className="h-6 w-6 text-blue-600" />
                </div>
                <div>
                  <h3 className="text-lg font-semibold text-gray-900">高校合作</h3>
                  <p className="text-sm text-gray-500">重点优先</p>
                </div>
              </div>
              <div className="space-y-3 text-sm text-gray-700">
                <div className="rounded-2xl bg-slate-50 px-4 py-3">重点实验室共享服务</div>
                <div className="rounded-2xl bg-slate-50 px-4 py-3">科研课题测试支撑</div>
                <div className="rounded-2xl bg-slate-50 px-4 py-3">高校仪器开放合作</div>
              </div>
            </div>

            <div className="rounded-3xl bg-white p-6 shadow-sm ring-1 ring-gray-200">
              <div className="mb-4 flex items-center gap-3">
                <div className="rounded-2xl bg-emerald-50 p-3">
                  <Building2 className="h-6 w-6 text-emerald-600" />
                </div>
                <div>
                  <h3 className="text-lg font-semibold text-gray-900">企业合作</h3>
                  <p className="text-sm text-gray-500">产业创新协同</p>
                </div>
              </div>
              <div className="space-y-3 text-sm text-gray-700">
                <div className="rounded-2xl bg-slate-50 px-4 py-3">研发测试与中试验证</div>
                <div className="rounded-2xl bg-slate-50 px-4 py-3">供应链质量评价</div>
                <div className="rounded-2xl bg-slate-50 px-4 py-3">批量委托与年度协议</div>
              </div>
            </div>

            <div className="rounded-3xl bg-white p-6 shadow-sm ring-1 ring-gray-200">
              <div className="mb-4 flex items-center gap-3">
                <div className="rounded-2xl bg-amber-50 p-3">
                  <Landmark className="h-6 w-6 text-amber-600" />
                </div>
                <div>
                  <h3 className="text-lg font-semibold text-gray-900">检测与支撑单位</h3>
                  <p className="text-sm text-gray-500">协同服务网络</p>
                </div>
              </div>
              <div className="space-y-3 text-sm text-gray-700">
                <div className="rounded-2xl bg-slate-50 px-4 py-3">第三方检测机构</div>
                <div className="rounded-2xl bg-slate-50 px-4 py-3">行业技术中心</div>
                <div className="rounded-2xl bg-slate-50 px-4 py-3">公共实验平台</div>
              </div>
            </div>
          </div>

          <div className="mt-6 rounded-3xl bg-gradient-to-r from-slate-900 to-blue-900 px-6 py-5 text-white">
            <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
              <div>
                <h3 className="text-lg font-semibold">合作单位接入平台</h3>
                <p className="mt-1 text-sm text-blue-100">
                  支持高校、企业、科研院所、检测单位多角色协同接入
                </p>
              </div>
              <Link
                href="/contact"
                className="inline-flex items-center gap-2 rounded-xl bg-white px-5 py-3 text-sm font-semibold text-slate-900 hover:bg-slate-100"
              >
                申请合作 <ChevronRight className="h-4 w-4" />
              </Link>
            </div>
          </div>
        </div>
      </section>

      <Footer />
    </div>
  );
}