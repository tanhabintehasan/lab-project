'use client';

import { useState, useEffect, useCallback, useMemo } from 'react';
import { Header } from '@/components/layout/header';
import { Footer } from '@/components/layout/footer';
import { Link } from '@/i18n/routing';
import {
  Search,
  SlidersHorizontal,
  Clock,
  Star,
  Beaker,
  ArrowUpDown,
  Grid3X3,
  List,
  ChevronLeft,
  ChevronRight,
  X,
} from 'lucide-react';
import { ServiceCardSkeleton } from '@/components/ui/skeleton';

type ServiceCategory = {
  id: string;
  slug?: string;
  nameZh?: string;
  nameEn?: string;
  serviceCount?: number;
};

type ApiService = {
  id: string;
  slug?: string;
  nameZh?: string;
  nameEn?: string;
  shortDescZh?: string;
  shortDescEn?: string;
  description?: string;
  priceMin?: number | string | null;
  priceUnit?: string | null;
  turnaroundDays?: number | string | null;
  turnaround?: string | null;
  rating?: number | string | null;
  orderCount?: number | string | null;
  standards?: string[] | Array<{ code?: string; nameZh?: string }> | null;
  materials?: string[] | Array<{ nameZh?: string }> | null;
  image?: string | null;
  isHot?: boolean;
  hot?: boolean;
  isFeatured?: boolean;
  categoryId?: string | null;
  category?: {
    id?: string;
    slug?: string;
    nameZh?: string;
    nameEn?: string;
  } | null;
};

type NormalizedService = {
  id: string;
  slug: string;
  name: string;
  category: string;
  description: string;
  price: number | null;
  priceUnit: string;
  turnaround: string;
  rating: number;
  orderCount: number;
  standards: string[];
  materials: string[];
  hot: boolean;
};

function extractArray<T>(payload: unknown): T[] {
  if (Array.isArray(payload)) return payload as T[];

  const p = payload as {
    data?: unknown[] | { items?: unknown[]; data?: unknown[] };
    items?: unknown[];
  };

  if (Array.isArray(p?.data)) return p.data as T[];
  if (Array.isArray(p?.items)) return p.items as T[];

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

function extractTotalPages(payload: unknown): number {
  const p = payload as {
    totalPages?: number;
    pagination?: { totalPages?: number };
    data?: {
      totalPages?: number;
      pagination?: { totalPages?: number };
      data?: {
        totalPages?: number;
        pagination?: { totalPages?: number };
      };
    };
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

  if (
    typeof p?.data?.data?.totalPages === 'number' &&
    p.data.data.totalPages > 0
  ) {
    return p.data.data.totalPages;
  }

  if (
    typeof p?.data?.data?.pagination?.totalPages === 'number' &&
    p.data.data.pagination.totalPages > 0
  ) {
    return p.data.data.pagination.totalPages;
  }

  return 1;
}

function toNumber(value: unknown, fallback = 0): number {
  if (typeof value === 'number' && !Number.isNaN(value)) return value;
  if (typeof value === 'string') {
    const parsed = Number(value);
    if (!Number.isNaN(parsed)) return parsed;
  }
  return fallback;
}

function formatPrice(value: number | null): string {
  if (value === null || Number.isNaN(value)) return '询价';
  return `¥${new Intl.NumberFormat('zh-CN').format(value)}`;
}

function normalizeStringArray(
  value: ApiService['standards'] | ApiService['materials']
): string[] {
  if (!Array.isArray(value)) return [];

  return value
    .map((item) => {
      if (typeof item === 'string') return item;
      if (item && typeof item === 'object') {
        if ('nameZh' in item && typeof item.nameZh === 'string') return item.nameZh;
        if ('code' in item && typeof item.code === 'string') return item.code;
      }
      return '';
    })
    .filter(Boolean);
}

function normalizeService(item: ApiService): NormalizedService {
  const days = toNumber(item.turnaroundDays, 0);
  const priceValue =
    item.priceMin === null || item.priceMin === undefined || item.priceMin === ''
      ? null
      : toNumber(item.priceMin, 0);

  return {
    id: String(item.id),
    slug: item.slug || String(item.id),
    name: item.nameZh || item.nameEn || '未命名服务',
    category: item.category?.nameZh || item.category?.nameEn || '未分类',
    description:
      item.shortDescZh ||
      item.shortDescEn ||
      item.description ||
      '查看服务详情了解更多检测内容。',
    price: priceValue,
    priceUnit: item.priceUnit || '元/项',
    turnaround: item.turnaround || (days > 0 ? `${days}个工作日` : '以实际评估为准'),
    rating: toNumber(item.rating, 4.8),
    orderCount: toNumber(item.orderCount, 0),
    standards: normalizeStringArray(item.standards),
    materials: normalizeStringArray(item.materials),
    hot: Boolean(item.isHot || item.hot || item.isFeatured),
  };
}

export default function ServicesPage() {
  const [searchQuery, setSearchQuery] = useState('');
  const [searchInput, setSearchInput] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('all');
  const [sortBy, setSortBy] = useState('popular');
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid');
  const [showFilters, setShowFilters] = useState(false);

  const [categories, setCategories] = useState<ServiceCategory[]>([]);
  const [apiServices, setApiServices] = useState<NormalizedService[]>([]);
  const [loading, setLoading] = useState(true);
  const [categoryLoading, setCategoryLoading] = useState(true);
  const [error, setError] = useState('');

  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);

  const categoryOptions = useMemo(() => {
    return [
      { id: 'all', name: '全部分类', count: undefined as number | undefined, value: 'all' },
      ...categories.map((cat) => ({
        id: cat.id,
        value: cat.slug || cat.id,
        name: cat.nameZh || cat.nameEn || '未命名分类',
        count: cat.serviceCount,
      })),
    ];
  }, [categories]);

  const fetchCategories = useCallback(async () => {
    try {
      setCategoryLoading(true);

      const res = await fetch('/api/service-categories?pageSize=100', {
        cache: 'no-store',
      });

      let data: unknown = null;
      try {
        data = await res.json();
      } catch {
        data = null;
      }

      if (!res.ok) {
        setCategories([]);
        return;
      }

      setCategories(extractArray<ServiceCategory>(data));
    } catch (err) {
      console.error('Failed to fetch categories:', err);
      setCategories([]);
    } finally {
      setCategoryLoading(false);
    }
  }, []);

  const fetchServices = useCallback(async () => {
    try {
      setLoading(true);
      setError('');

      const params = new URLSearchParams();
      params.set('page', String(currentPage));
      params.set('pageSize', '12');

      if (searchQuery.trim()) params.set('q', searchQuery.trim());
      if (selectedCategory !== 'all') params.set('category', selectedCategory);

      if (sortBy === 'price-asc') {
        params.set('sort', 'price');
        params.set('order', 'asc');
      } else if (sortBy === 'price-desc') {
        params.set('sort', 'price');
        params.set('order', 'desc');
      } else if (sortBy === 'popular') {
        params.set('sort', 'popular');
        params.set('order', 'desc');
      } else {
        params.set('order', 'desc');
      }

      const res = await fetch(`/api/services?${params.toString()}`, {
        cache: 'no-store',
      });

      let data: unknown = null;
      try {
        data = await res.json();
      } catch {
        data = null;
      }

      if (!res.ok) {
        setApiServices([]);
        setTotalPages(1);
        setError('服务列表加载失败');
        return;
      }

      const items = extractArray<ApiService>(data).map(normalizeService);
      setApiServices(items);
      setTotalPages(extractTotalPages(data));
    } catch (err) {
      console.error('Failed to fetch services:', err);
      setApiServices([]);
      setTotalPages(1);
      setError('服务列表加载失败');
    } finally {
      setLoading(false);
    }
  }, [currentPage, searchQuery, selectedCategory, sortBy]);

  useEffect(() => {
    fetchCategories();
  }, [fetchCategories]);

  useEffect(() => {
    fetchServices();
  }, [fetchServices]);

  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const q = params.get('q');
    const cat = params.get('category');

    if (q) {
      setSearchQuery(q);
      setSearchInput(q);
    }

    if (cat) {
      setSelectedCategory(cat);
    }
  }, []);

  const submitSearch = () => {
    setCurrentPage(1);
    setSearchQuery(searchInput);
  };

  const activeFilterCount = selectedCategory !== 'all' ? 1 : 0;

  const renderPagination = () => {
    if (totalPages <= 1) return null;

    const pages: number[] = [];
    const start = Math.max(1, currentPage - 2);
    const end = Math.min(totalPages, currentPage + 2);

    for (let i = start; i <= end; i += 1) {
      pages.push(i);
    }

    return (
      <div className="flex items-center justify-center gap-2 mt-10">
        <button
          type="button"
          onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
          disabled={currentPage === 1}
          className="p-2 rounded-lg border border-gray-200 text-gray-400 hover:text-gray-600 hover:border-gray-300 transition disabled:opacity-50 disabled:cursor-not-allowed"
        >
          <ChevronLeft className="w-5 h-5" />
        </button>

        {start > 1 && (
          <>
            <button
              type="button"
              onClick={() => setCurrentPage(1)}
              className="w-10 h-10 rounded-lg text-sm font-medium border border-gray-200 text-gray-600 hover:border-blue-300 hover:text-blue-600 transition"
            >
              1
            </button>
            {start > 2 && <span className="px-2 text-gray-400">...</span>}
          </>
        )}

        {pages.map((page) => (
          <button
            key={page}
            type="button"
            onClick={() => setCurrentPage(page)}
            className={`w-10 h-10 rounded-lg text-sm font-medium transition ${
              page === currentPage
                ? 'bg-blue-600 text-white'
                : 'border border-gray-200 text-gray-600 hover:border-blue-300 hover:text-blue-600'
            }`}
          >
            {page}
          </button>
        ))}

        {end < totalPages && (
          <>
            {end < totalPages - 1 && <span className="px-2 text-gray-400">...</span>}
            <button
              type="button"
              onClick={() => setCurrentPage(totalPages)}
              className="w-10 h-10 rounded-lg text-sm font-medium border border-gray-200 text-gray-600 hover:border-blue-300 hover:text-blue-600 transition"
            >
              {totalPages}
            </button>
          </>
        )}

        <button
          type="button"
          onClick={() => setCurrentPage((p) => Math.min(totalPages, p + 1))}
          disabled={currentPage === totalPages}
          className="p-2 rounded-lg border border-gray-200 text-gray-600 hover:text-blue-600 hover:border-blue-300 transition disabled:opacity-50 disabled:cursor-not-allowed"
        >
          <ChevronRight className="w-5 h-5" />
        </button>
      </div>
    );
  };

  return (
    <div className="min-h-screen flex flex-col bg-gray-50">
      <Header />

      <section className="bg-gradient-to-r from-blue-700 to-blue-900 text-white py-16">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <h1 className="text-4xl font-bold mb-4">检测服务</h1>
          <p className="text-blue-100 text-lg mb-8 max-w-2xl mx-auto">
            涵盖力学、化学、环境、电气等多领域专业检测，一站式满足您的质量检测需求
          </p>

          <div className="max-w-2xl mx-auto relative">
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
            <input
              type="text"
              placeholder="搜索检测服务、标准号、材料类型..."
              value={searchInput}
              onChange={(e) => setSearchInput(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === 'Enter') submitSearch();
              }}
              className="w-full pl-12 pr-24 py-4 rounded-xl text-gray-900 text-lg focus:outline-none focus:ring-4 focus:ring-blue-300"
            />
            <button
              type="button"
              onClick={submitSearch}
              className="absolute right-2 top-1/2 -translate-y-1/2 bg-blue-600 hover:bg-blue-700 text-white px-5 py-2.5 rounded-lg transition"
            >
              搜索
            </button>
          </div>

          <div className="flex flex-wrap justify-center gap-3 mt-6">
            <span className="text-blue-200 text-sm">热门搜索：</span>
            {['拉伸测试', '盐雾试验', 'RoHS检测', '硬度测试', '食品安全'].map((tag) => (
              <button
                key={tag}
                type="button"
                onClick={() => {
                  setSearchInput(tag);
                  setSearchQuery(tag);
                  setCurrentPage(1);
                }}
                className="px-3 py-1 bg-white/10 hover:bg-white/20 rounded-full text-sm transition"
              >
                {tag}
              </button>
            ))}
          </div>
        </div>
      </section>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 flex-1">
        <div className="flex gap-8">
          <aside className="hidden lg:block w-64 flex-shrink-0">
            <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6 sticky top-24">
              <h3 className="font-semibold text-gray-900 mb-4 flex items-center gap-2">
                <SlidersHorizontal className="w-4 h-4" />
                筛选条件
              </h3>

              <div className="mb-6">
                <h4 className="text-sm font-medium text-gray-700 mb-3">服务分类</h4>
                <div className="space-y-2">
                  {categoryOptions.map((cat) => (
                    <button
                      key={cat.id}
                      type="button"
                      onClick={() => {
                        setSelectedCategory(cat.value);
                        setCurrentPage(1);
                      }}
                      className={`w-full text-left px-3 py-2 rounded-lg text-sm transition flex justify-between items-center ${
                        selectedCategory === cat.value
                          ? 'bg-blue-50 text-blue-700 font-medium'
                          : 'text-gray-600 hover:bg-gray-50'
                      }`}
                    >
                      <span>{cat.name}</span>
                      {typeof cat.count === 'number' ? (
                        <span className="text-xs text-gray-400">{cat.count}</span>
                      ) : null}
                    </button>
                  ))}
                </div>

                {categoryLoading && (
                  <p className="text-xs text-gray-400 mt-3">分类加载中...</p>
                )}
              </div>

              {activeFilterCount > 0 && (
                <button
                  type="button"
                  onClick={() => {
                    setSelectedCategory('all');
                    setCurrentPage(1);
                  }}
                  className="w-full py-2 text-sm text-gray-500 hover:text-red-500 transition"
                >
                  清除筛选 ({activeFilterCount})
                </button>
              )}
            </div>
          </aside>

          <button
            type="button"
            onClick={() => setShowFilters(true)}
            className="lg:hidden fixed bottom-6 right-6 z-40 bg-blue-600 text-white p-4 rounded-full shadow-lg"
          >
            <SlidersHorizontal className="w-5 h-5" />
            {activeFilterCount > 0 && (
              <span className="absolute -top-1 -right-1 bg-red-500 text-white text-xs w-5 h-5 rounded-full flex items-center justify-center">
                {activeFilterCount}
              </span>
            )}
          </button>

          {showFilters && (
            <div className="lg:hidden fixed inset-0 z-50 bg-black/50">
              <div className="absolute right-0 top-0 bottom-0 w-80 bg-white p-6 overflow-y-auto">
                <div className="flex justify-between items-center mb-6">
                  <h3 className="font-semibold text-lg">筛选条件</h3>
                  <button type="button" onClick={() => setShowFilters(false)}>
                    <X className="w-5 h-5" />
                  </button>
                </div>

                <div className="mb-6">
                  <h4 className="text-sm font-medium text-gray-700 mb-3">服务分类</h4>
                  <div className="space-y-2">
                    {categoryOptions.map((cat) => (
                      <button
                        key={cat.id}
                        type="button"
                        onClick={() => {
                          setSelectedCategory(cat.value);
                          setCurrentPage(1);
                        }}
                        className={`w-full text-left px-3 py-2 rounded-lg text-sm transition ${
                          selectedCategory === cat.value
                            ? 'bg-blue-50 text-blue-700 font-medium'
                            : 'text-gray-600 hover:bg-gray-50'
                        }`}
                      >
                        {cat.name}
                      </button>
                    ))}
                  </div>
                </div>

                <button
                  type="button"
                  onClick={() => setShowFilters(false)}
                  className="w-full py-3 bg-blue-600 text-white rounded-lg mt-4"
                >
                  确认筛选
                </button>
              </div>
            </div>
          )}

          <div className="flex-1 min-w-0">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6">
              <p className="text-sm text-gray-500">
                当前页 <span className="font-semibold text-gray-900">{apiServices.length}</span> 项检测服务
              </p>

              <div className="flex items-center gap-4">
                <div className="flex items-center gap-2">
                  <ArrowUpDown className="w-4 h-4 text-gray-400" />
                  <select
                    value={sortBy}
                    onChange={(e) => {
                      setSortBy(e.target.value);
                      setCurrentPage(1);
                    }}
                    className="text-sm border border-gray-200 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
                  >
                    <option value="popular">综合排序</option>
                    <option value="price-asc">价格从低到高</option>
                    <option value="price-desc">价格从高到低</option>
                    <option value="newest">最新发布</option>
                  </select>
                </div>

                <div className="hidden sm:flex items-center border border-gray-200 rounded-lg overflow-hidden">
                  <button
                    type="button"
                    onClick={() => setViewMode('grid')}
                    className={`p-2 ${
                      viewMode === 'grid'
                        ? 'bg-blue-50 text-blue-600'
                        : 'text-gray-400 hover:text-gray-600'
                    }`}
                  >
                    <Grid3X3 className="w-4 h-4" />
                  </button>
                  <button
                    type="button"
                    onClick={() => setViewMode('list')}
                    className={`p-2 ${
                      viewMode === 'list'
                        ? 'bg-blue-50 text-blue-600'
                        : 'text-gray-400 hover:text-gray-600'
                    }`}
                  >
                    <List className="w-4 h-4" />
                  </button>
                </div>
              </div>
            </div>

            {error ? (
              <div className="bg-red-50 border border-red-200 text-red-600 rounded-xl p-4 mb-6">
                {error}
              </div>
            ) : null}

            {loading ? (
              <div
                className={
                  viewMode === 'grid'
                    ? 'grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6'
                    : 'space-y-4'
                }
              >
                {Array.from({ length: 6 }).map((_, index) => (
                  <ServiceCardSkeleton key={index} />
                ))}
              </div>
            ) : apiServices.length === 0 ? (
              <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-12 text-center">
                <div className="w-16 h-16 rounded-full bg-blue-50 flex items-center justify-center mx-auto mb-4">
                  <Beaker className="w-8 h-8 text-blue-400" />
                </div>
                <h3 className="text-xl font-semibold text-gray-900 mb-2">暂无匹配服务</h3>
                <p className="text-gray-500 mb-6">请尝试调整关键词或分类重新搜索。</p>
                <button
                  type="button"
                  onClick={() => {
                    setSearchInput('');
                    setSearchQuery('');
                    setSelectedCategory('all');
                    setSortBy('popular');
                    setCurrentPage(1);
                  }}
                  className="px-5 py-2.5 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition"
                >
                  重置筛选
                </button>
              </div>
            ) : (
              <>
                <div
                  className={
                    viewMode === 'grid'
                      ? 'grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6'
                      : 'space-y-4'
                  }
                >
                  {apiServices.map((service) => (
                    <Link
                      key={service.id}
                      href={`/services/${service.slug}`}
                      className={`bg-white rounded-xl shadow-sm border border-gray-100 hover:shadow-md hover:border-blue-100 transition group ${
                        viewMode === 'list' ? 'flex gap-6 p-6' : 'block'
                      }`}
                    >
                      <div
                        className={`bg-gradient-to-br from-blue-50 to-blue-100 flex items-center justify-center relative ${
                          viewMode === 'list'
                            ? 'w-48 h-36 rounded-lg flex-shrink-0'
                            : 'h-48 rounded-t-xl'
                        }`}
                      >
                        <Beaker className="w-12 h-12 text-blue-300" />
                        {service.hot && (
                          <span className="absolute top-3 left-3 bg-red-500 text-white text-xs px-2 py-1 rounded-full font-medium">
                            热门
                          </span>
                        )}
                      </div>

                      <div className={viewMode === 'list' ? 'flex-1 min-w-0' : 'p-5'}>
                        <div className="flex items-start justify-between gap-2 mb-2">
                          <div className="min-w-0">
                            <p className="text-xs text-blue-600 mb-1">{service.category}</p>
                            <h3 className="font-semibold text-gray-900 group-hover:text-blue-600 transition">
                              {service.name}
                            </h3>
                          </div>

                          <div className="flex items-center gap-1 text-yellow-500 flex-shrink-0">
                            <Star className="w-4 h-4 fill-current" />
                            <span className="text-sm font-medium">
                              {service.rating.toFixed(1)}
                            </span>
                          </div>
                        </div>

                        <p className="text-sm text-gray-500 mb-3 line-clamp-2">
                          {service.description}
                        </p>

                        {service.standards.length > 0 && (
                          <div className="flex flex-wrap gap-2 mb-3">
                            {service.standards.slice(0, 3).map((std) => (
                              <span
                                key={std}
                                className="text-xs bg-gray-100 text-gray-600 px-2 py-1 rounded"
                              >
                                {std}
                              </span>
                            ))}
                          </div>
                        )}

                        <div className="flex items-center justify-between pt-3 border-t border-gray-100">
                          <div className="flex items-center gap-1 text-sm text-gray-500">
                            <Clock className="w-4 h-4" />
                            <span>{service.turnaround}</span>
                          </div>

                          <div className="text-right">
                            <span className="text-lg font-bold text-blue-600">
                              {formatPrice(service.price)}
                            </span>
                            {service.price !== null && (
                              <span className="text-xs text-gray-400 ml-1">
                                {service.priceUnit}
                              </span>
                            )}
                          </div>
                        </div>

                        <p className="text-xs text-gray-400 mt-2">
                          已服务 {service.orderCount} 次
                        </p>
                      </div>
                    </Link>
                  ))}
                </div>

                {renderPagination()}
              </>
            )}
          </div>
        </div>
      </div>

      <Footer />
    </div>
  );
}