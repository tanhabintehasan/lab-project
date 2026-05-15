'use client';

import { useCallback, useEffect, useMemo, useState } from 'react';
import { Header } from '@/components/layout/header';
import { Footer } from '@/components/layout/footer';
import { Link, useRouter } from '@/i18n/routing';
import { useTranslations } from 'next-intl';
import { useSiteSettings } from '@/components/providers/SiteSettingsProvider';
import Image from 'next/image';
import {
  Search,
  ArrowRight,
  FlaskConical,
  ShieldCheck,
  Building2,
  ChevronRight,
  ChevronLeft,
  Award,
  Users,
  BarChart,
  MapPin,
  CheckCircle2,
} from 'lucide-react';
import type { CMSSection, CMSPage } from '@/types/cms';
import { extractArray, toNumber, getIcon } from '@/lib/homepage-utils';
import {
  defaultServiceCategories,
  defaultAdvantages,
  defaultStatsBanner,
  defaultWhyChooseStats,
  defaultOfficeCities,

  defaultPartners,
  defaultEquipment,
} from '@/lib/homepage-data';

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

interface SiteSettings {
  supportPhone?: string | null;
  supportEmail?: string | null;
  addressZh?: string | null;
  footerTextZh?: string | null;
}

export default function HomePage() {
  const t = useTranslations('home');
  const router = useRouter();

  const [searchQuery, setSearchQuery] = useState('');
  const [hotServices, setHotServices] = useState<Service[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [stats, setStats] = useState<Stats | null>(null);
  const [cmsPage, setCmsPage] = useState<CMSPage | null>(null);
  const [backendLabs, setBackendLabs] = useState<Array<{ id: string; nameZh: string; city?: string; shortDescZh?: string; slug?: string; imageUrl?: string; coverImage?: string }>>([]);
  const { settings: siteSettings } = useSiteSettings();
  const [loading, setLoading] = useState(true);
  const [currentSlide, setCurrentSlide] = useState(0);
  const [hydrated, setHydrated] = useState(false);

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

  const getSection = useCallback(
    (key: string) => {
      if (!cmsPage?.sections) return null;
      return cmsPage.sections.find((s) => s.sectionKey === key) || null;
    },
    [cmsPage]
  );

  const fetchHomeData = useCallback(async () => {
    try {
      setLoading(true);

      const [servicesRes, categoriesRes, statsRes, cmsRes, labsRes] = await Promise.all([
        fetch('/api/services?pageSize=8&sort=popular&order=desc', { cache: 'no-store' }),
        fetch('/api/service-categories?pageSize=10', { cache: 'no-store' }),
        fetch('/api/stats', { cache: 'no-store' }),
        fetch('/api/cms/homepage', { cache: 'no-store' }),
        fetch('/api/labs?pageSize=4&status=ACTIVE', { cache: 'no-store' }),
      ]);

      const [servicesData, categoriesData, statsData, cmsData, labsData] = await Promise.all([
        servicesRes.json().catch(() => null),
        categoriesRes.json().catch(() => null),
        statsRes.json().catch(() => null),
        cmsRes.json().catch(() => null),
        labsRes.json().catch(() => null),
      ]);

      const serviceItems = extractArray<Service>(servicesData);
      const categoryItems = extractArray<Category>(categoriesData);

      setHotServices(Array.isArray(serviceItems) ? serviceItems : []);
      setCategories(Array.isArray(categoryItems) ? categoryItems.slice(0, 10) : []);
      setStats(statsData?.success ? statsData.data : null);

      if (cmsData?.success && cmsData.data) {
        setCmsPage(cmsData.data as CMSPage);
      }

      const labsItems = extractArray(labsData) as Array<{
        id: string;
        nameZh: string;
        city?: string;
        shortDescZh?: string;
        slug?: string;
        coverImage?: string;
        imageUrl?: string;
      }>;
      setBackendLabs(Array.isArray(labsItems) ? labsItems : []);
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

  useEffect(() => {
    const timer = setInterval(() => {
      setCurrentSlide((s) => (s === 1 ? 0 : s + 1));
    }, 5000);
    return () => clearInterval(timer);
  }, []);

  useEffect(() => {
    setHydrated(true);
  }, []);

  const safeHotServices = useMemo(() => (Array.isArray(hotServices) ? hotServices : []), [hotServices]);
  const safeCategories = useMemo(() => (Array.isArray(categories) ? categories : []), [categories]);

  const formatStat = (num: number) => {
    if (num >= 10000) return `${Math.floor(num / 1000) / 10}万+`;
    if (num >= 1000) return `${Math.floor(num / 100) / 10}k+`;
    return `${num}+`;
  };

  const heroSection = getSection('hero');
  const serviceCategoriesSection = getSection('service_categories');
  const advantagesSection = getSection('advantages');
  const statsBannerSection = getSection('stats_banner');
  const whyChooseSection = getSection('why_choose_us');
  const labsSection = getSection('labs');
  const partnersSection = getSection('partners');
  const sampleShowcaseSection = getSection('sample_showcase');
  const equipmentShowcaseSection = getSection('equipment_showcase');
  const bannersSection = getSection('banners');

  const brandColor = siteSettings?.brandColor || '#0066B3';
  const heroBadge = heroSection?.badgeZh || '国家科研与检测协同服务入口';

  // Hero carousel slides from CMS (fallback to defaults)
  const heroSlides = useMemo(() => {
    const cms = (heroSection?.items || [])
      .filter((i) => i.isEnabled && i.imageUrl)
      .map((i) => ({
        id: i.id,
        image: i.imageUrl!,
        title: i.titleZh || '',
        subtitle: i.subtitleZh || '',
      }));
    if (cms.length > 0) return cms;
    return [
      { id: 'default-slide-1', image: '/uploads/settings/slide-1-pic.jpg', title: '', subtitle: '' },
      { id: 'default-slide-2', image: '/uploads/settings/slide-2-pic.jpg', title: '', subtitle: '' },
    ];
  }, [heroSection]);

  // Stats banner background from CMS
  const statsBannerBg = statsBannerSection?.imageUrl || '/uploads/settings/slide-1-pic.jpg';

  // Why choose us background from CMS
  const whyChooseBg = whyChooseSection?.imageUrl || '/uploads/settings/slide-2-pic.jpg';

  // Banners from CMS
  const displayBanners = useMemo(() => {
    return (bannersSection?.items || [])
      .filter((i) => i.isEnabled && i.imageUrl)
      .map((i) => ({
        id: i.id,
        image: i.imageUrl!,
        title: i.titleZh || '',
        link: i.linkUrl || '',
      }));
  }, [bannersSection]);

  const serviceCatTitle = serviceCategoriesSection?.titleZh || '服务分类';
  const serviceCatSubtitle = serviceCategoriesSection?.subtitleZh || '按研究与检测方向快速进入';
  const cmsServiceCategories = (serviceCategoriesSection?.items || [])
    .filter((i) => i.isEnabled)
    .map((i) => ({
      id: i.id,
      name: i.titleZh || '',
      icon: i.icon || '🔬',
      imageUrl: i.imageUrl || '',
      slug: i.linkUrl || '',
    }));

  const advantagesTitle = advantagesSection?.titleZh || '平台核心优势';
  const advantagesSubtitle = advantagesSection?.subtitleZh || '专业、权威、可信赖的科研检测服务';

  const advantageColors = [
    { color: 'text-blue-700', bg: 'bg-gradient-to-br from-blue-50 to-blue-100/50', border: 'border-blue-100' },
    { color: 'text-emerald-700', bg: 'bg-gradient-to-br from-emerald-50 to-emerald-100/50', border: 'border-emerald-100' },
    { color: 'text-amber-700', bg: 'bg-gradient-to-br from-amber-50 to-amber-100/50', border: 'border-amber-100' },
    { color: 'text-purple-700', bg: 'bg-gradient-to-br from-purple-50 to-purple-100/50', border: 'border-purple-100' },
  ];

  const displayAdvantages = useMemo(() => {
    // Prevent hydration mismatch: always render defaults on first paint
    if (!hydrated) return defaultAdvantages;
    const cms = (advantagesSection?.items || [])
      .filter((i) => i.isEnabled)
      .map((i, idx) => {
        const Icon = getIcon(i.icon) || FlaskConical;
        const c = advantageColors[idx % advantageColors.length];
        return {
          id: i.id,
          title: i.titleZh || '',
          icon: Icon,
          color: c.color,
          bg: c.bg,
          border: c.border,
          items: (i.points || [])
            .filter((p) => p.isEnabled)
            .map((p) => p.textZh)
            .filter(Boolean),
        };
      })
      .filter((a) => a.title && a.items.length > 0);
    return cms.length > 0 ? cms : defaultAdvantages;
  }, [advantagesSection, hydrated]);

  const statsBannerTitle = statsBannerSection?.titleZh;
  const statsBannerSubtitle = statsBannerSection?.subtitleZh;
  const displayStatsBanner = useMemo(() => {
    const cms = (statsBannerSection?.items || [])
      .filter((i) => i.isEnabled)
      .map((i) => ({
        id: i.id,
        value: i.value || '',
        label: i.titleZh || '',
      }))
      .filter((s) => s.value && s.label);
    return cms.length > 0 ? cms : defaultStatsBanner;
  }, [statsBannerSection]);

  const whyChooseTitle = whyChooseSection?.titleZh || '为什么选择我们';
  const whyChooseSubtitle = whyChooseSection?.subtitleZh || '用数据说话，让科研检测更高效';
  const displayWhyChooseStats = useMemo(() => {
    const cms = (whyChooseSection?.items || [])
      .filter((i) => i.isEnabled && i.value)
      .map((i) => ({
        id: i.id,
        value: i.value || '',
        label: i.titleZh || '',
        sub: i.subtitleZh || '',
      }));
    return cms.length > 0 ? cms : defaultWhyChooseStats;
  }, [whyChooseSection]);

  const displayOfficeCities = useMemo(() => {
    const cms = (whyChooseSection?.items || [])
      .filter((i) => i.isEnabled && !i.value)
      .map((i) => ({ id: i.id, name: i.titleZh || '' }))
      .filter((c) => c.name);
    return cms.length > 0 ? cms : defaultOfficeCities;
  }, [whyChooseSection]);

  const labsTitle = labsSection?.titleZh || '前沿实验室';
  const labsSubtitle = labsSection?.subtitleZh || '领先的科研检测实验室网络';
  const displayLabs = useMemo(() => {
    return backendLabs.map((lab) => ({
      id: lab.id,
      name: lab.nameZh || '',
      location: lab.city || '',
      specialties: lab.shortDescZh || '',
      imageBg: '',
      image: lab.imageUrl || lab.coverImage || '',
      slug: lab.slug || '',
    }));
  }, [backendLabs]);

  const partnersTitle = partnersSection?.titleZh || '合作伙伴生态';
  const partnersSubtitle = partnersSection?.subtitleZh || '优先服务高校、科研院所、企业研发部门，再联动检测服务单位';
  const displayPartners = useMemo(() => {
    const cms = (partnersSection?.items || [])
      .filter((i) => i.isEnabled)
      .map((i) => {
        const Icon = getIcon(i.icon);
        return {
          id: i.id,
          title: i.titleZh || '',
          sub: i.subtitleZh || '',
          icon: Icon || Building2,
          items: (i.points || [])
            .filter((p) => p.isEnabled)
            .map((p) => p.textZh)
            .filter(Boolean),
        };
      })
      .filter((p) => p.title);
    return cms.length > 0 ? cms : defaultPartners;
  }, [partnersSection]);

  const samplesTitle = sampleShowcaseSection?.titleZh || '典型样品与案例';
  const samplesSubtitle = sampleShowcaseSection?.subtitleZh || '覆盖材料、生物、环境、能源等多领域样品测试';
  const displaySamples = useMemo(() => {
    return (sampleShowcaseSection?.items || [])
      .filter((i) => i.isEnabled)
      .map((i) => ({
        id: i.id,
        title: i.titleZh || '',
        description: i.descriptionZh || '',
        image: i.imageUrl || '',
      }))
      .filter((s) => s.title);
  }, [sampleShowcaseSection]);

  const equipmentTitle = equipmentShowcaseSection?.titleZh || '高端检测设备';
  const equipmentSubtitle = equipmentShowcaseSection?.subtitleZh || '国际领先的检测与分析仪器设备';
  const displayEquipment = useMemo(() => {
    const cms = (equipmentShowcaseSection?.items || [])
      .filter((i) => i.isEnabled)
      .map((i) => ({
        id: i.id,
        title: i.titleZh || '',
        description: i.descriptionZh || '',
        image: i.imageUrl || '',
      }))
      .filter((e) => e.title);
    return cms.length > 0 ? cms : defaultEquipment;
  }, [equipmentShowcaseSection]);

  return (
    <div className="min-h-screen bg-white">
      <Header />

      {/* Hero Carousel */}
      <section className="relative overflow-hidden text-white">
        {/* Carousel slides */}
        <div className="absolute inset-0">
          {heroSlides.map((slide, idx) => (
            <div
              key={slide.id}
              className={`absolute inset-0 transition-opacity duration-1000 ${idx === currentSlide ? 'opacity-100' : 'opacity-0'}`}
            >
              <Image
                src={slide.image}
                alt={slide.title || ''}
                fill
                className="object-cover"
                priority={idx === 0}
                sizes="(max-width: 768px) 100vw, 50vw"
              />
            </div>
          ))}
          <div className="absolute inset-0 bg-black/50" />
        </div>

        {/* Carousel controls */}
        <button
          type="button"
          onClick={() => setCurrentSlide((s) => (s === 0 ? heroSlides.length - 1 : s - 1))}
          className="absolute left-4 top-1/2 z-10 -translate-y-1/2 rounded-full bg-white/20 p-2 backdrop-blur transition-colors hover:bg-white/30"
        >
          <ChevronLeft className="h-6 w-6" />
        </button>
        <button
          type="button"
          onClick={() => setCurrentSlide((s) => (s === heroSlides.length - 1 ? 0 : s + 1))}
          className="absolute right-4 top-1/2 z-10 -translate-y-1/2 rounded-full bg-white/20 p-2 backdrop-blur transition-colors hover:bg-white/30"
        >
          <ChevronRight className="h-6 w-6" />
        </button>

        {/* Dots */}
        <div className="absolute bottom-4 left-1/2 z-10 flex -translate-x-1/2 gap-2">
          {heroSlides.map((_, i) => (
            <button
              key={`hero-dot-${i}`}
              type="button"
              onClick={() => setCurrentSlide(i)}
              className={`h-2 rounded-full transition-all ${i === currentSlide ? 'w-8 bg-white' : 'w-2 bg-white/50 hover:bg-white/75'}`}
            />
          ))}
        </div>

        <div className="relative z-0 mx-auto max-w-7xl px-4 py-16 sm:px-6 lg:px-8 lg:py-20">
          <div className="grid items-center gap-10">
            <div className="max-w-3xl">
              <div
                className="mb-5 inline-flex items-center gap-2 rounded-full bg-white/90 px-4 py-1.5 text-sm font-medium text-gray-800 shadow-sm backdrop-blur"
                translate="no"           // Stops translation extensions from breaking the HTML
                suppressHydrationWarning // Tells React to ignore minor mismatches here
              >
                <ShieldCheck className="h-4 w-4 text-blue-600" />
                {heroBadge}
              </div>

              {/* Search card with backdrop blur for better visibility */}
              <div className="rounded-2xl bg-white/10 backdrop-blur-md border border-slate-700/50 p-5">
                <div className="mb-4 flex flex-col gap-3 sm:flex-row">
                  <div className="relative flex-1">
                    <Search className="absolute left-4 top-1/2 h-5 w-5 -translate-y-1/2 text-slate-400" />
                    <input
                      type="text"
                      value={searchQuery}
                      onChange={(e) => setSearchQuery(e.target.value)}
                      onKeyDown={(e) => {
                        if (e.key === 'Enter') handleSearch(searchQuery);
                      }}
                      placeholder={t('hero.searchPlaceholder')}
                      className="w-full rounded-xl border border-slate-600/50 bg-slate-800/60 py-3.5 pl-12 pr-4 text-base text-white shadow-lg placeholder:text-slate-400 focus:border-blue-400 focus:outline-none focus:ring-2 focus:ring-blue-400/30"
                    />
                  </div>

                  <button
                    type="button"
                    onClick={() => handleSearch(searchQuery)}
                    className="rounded-xl bg-orange-500 px-8 py-3.5 font-semibold text-white shadow-lg transition-colors hover:bg-orange-600"
                  >
                    {t('hero.searchButton')}
                  </button>

                  <button
                    type="button"
                    onClick={handleCustomTesting}
                    className="rounded-xl bg-white px-8 py-3.5 font-semibold text-gray-900 shadow-lg transition-colors hover:bg-gray-100"
                  >
                    {t('hero.customTesting')}
                  </button>
                </div>

                <div className="flex flex-wrap gap-2">
                  {['拉伸试验', '硬度测试', '化学成分', 'GB/T 228', '盐雾试验'].map((tag) => (
                    <button
                      key={tag}
                      type="button"
                      onClick={() => handleSearch(tag)}
                      className="rounded-full bg-white/90 px-3 py-1.5 text-sm font-medium text-gray-700 shadow-sm transition-colors hover:bg-white"
                    >
                      {tag}
                    </button>
                  ))}
                </div>
              </div>

              <div className="mt-5">
                <button
                  type="button"
                  onClick={handleCustomTesting}
                  className="text-sm font-medium text-white underline underline-offset-4 transition-colors hover:text-blue-200"
                >
                  {t('hero.noServiceFound')}
                </button>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Service Categories */}
      <section className="border-b border-gray-100 bg-white py-12">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="mb-8 flex items-center justify-between">
            <div>
              <h2 className="text-2xl font-bold text-gray-900">{serviceCatTitle}</h2>
              <p className="mt-1 text-sm text-gray-500">{serviceCatSubtitle}</p>
            </div>
            {/* Removed "全部服务" link per PPT requirement */}
          </div>

          <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5">
            {(cmsServiceCategories.length >= 8 ? cmsServiceCategories : defaultServiceCategories).map((cat) => {
              const isCms = cmsServiceCategories.length >= 8;
              const slug = (cat as any).slug || '';
              const href = slug.startsWith('/') ? slug : `/services/categories/${slug}`;
              // Priority: iconUrl > imageUrl > icon emoji
              const iconSrc = (cat as any).iconUrl || '';
              const cardClass = isCms
                ? 'rounded-2xl border border-gray-100 bg-white px-3 py-4 sm:px-4 sm:py-5 text-center transition-all hover:-translate-y-1 hover:shadow-lg'
                : `group rounded-2xl border ${(cat as any).borderColor} ${(cat as any).bgColor} px-3 py-4 sm:px-4 sm:py-5 text-center transition-all hover:-translate-y-1 hover:shadow-lg`;
              return (
                <Link key={(cat as any).id} href={href} className={cardClass}>
                  <div className="mx-auto mb-2 sm:mb-3 flex h-12 w-12 items-center justify-center">
                    {iconSrc ? (
                      <img
                        src={iconSrc}
                        alt={(cat as any).name}
                        className="h-12 w-12 object-contain"
                        loading="lazy"
                      />
                    ) : (
                      <span className="text-3xl leading-none">{(cat as any).icon || '🔬'}</span>
                    )}
                  </div>
                  <div className="text-xs sm:text-sm font-semibold text-gray-900">{(cat as any).name}</div>
                </Link>
              );
            })}
          </div>
        </div>
      </section>

      {/* Banners */}
      {displayBanners.length > 0 && (
        <section className="bg-white py-8">
          <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
              {displayBanners.map((banner) => (
                <Link
                  key={banner.id}
                  href={banner.link || '#'}
                  className="group relative overflow-hidden rounded-2xl border border-gray-200 transition-all hover:-translate-y-1 hover:shadow-lg"
                >
                  <div className="relative aspect-[16/7] w-full">
                    <Image
                      src={banner.image}
                      alt={banner.title}
                      fill
                      className="object-cover transition-transform duration-500 group-hover:scale-105"
                      sizes="(max-width: 768px) 100vw, 33vw"
                    />
                    <div className="absolute inset-0 bg-black/20 group-hover:bg-black/30 transition-colors" />
                    {banner.title && (
                      <div className="absolute bottom-0 left-0 right-0 p-4">
                        <h3 className="text-lg font-bold text-white drop-shadow-md">{banner.title}</h3>
                      </div>
                    )}
                  </div>
                </Link>
              ))}
            </div>
          </div>
        </section>
      )}

      {/* Four Advantages */}
      <section className="bg-slate-50 py-16">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="mb-10 text-center">
            <h2 className="text-3xl font-bold text-gray-900">{advantagesTitle}</h2>
            <p className="mt-2 text-base text-gray-500">{advantagesSubtitle}</p>
          </div>

          <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-4">
            {displayAdvantages.map((adv: any) => {
              const Icon = adv.icon;
              return (
                <div
                  key={adv.id}
                  className={`rounded-3xl border ${adv.border} ${adv.bg} p-6 transition-all hover:-translate-y-1 hover:shadow-lg`}
                >
                  <div className={`mb-4 inline-flex rounded-2xl bg-white p-3 shadow-sm ${adv.color}`}>
                    <Icon className="h-7 w-7" />
                  </div>
                  <h3 className="mb-3 text-lg font-bold text-gray-900">{adv.title}</h3>
                  <ul className="space-y-2 text-sm text-gray-700">
                    {adv.items.map((item: string, itemIdx: number) => (
                      <li key={`${adv.id}-pt-${itemIdx}`} className="flex items-start gap-2">
                        <CheckCircle2 className={`mt-0.5 h-4 w-4 shrink-0 ${adv.color}`} />
                        <span suppressHydrationWarning>{item}</span>
                      </li>
                    ))}
                  </ul>
                </div>
              );
            })}
          </div>
        </div>
      </section>

      {/* Stats Banner */}
      <section className="relative overflow-hidden py-14 text-white">
        <div className="absolute inset-0">
          <Image src={statsBannerBg} alt="" fill className="object-cover" sizes="(max-width: 768px) 100vw, 50vw" />
          <div
            className="absolute inset-0"
            style={{ background: `linear-gradient(90deg, color-mix(in srgb, ${brandColor} 90%, black) 0%, color-mix(in srgb, ${brandColor} 80%, transparent) 100%)` }}
          />
        </div>
        <div className="relative mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          {(statsBannerTitle || statsBannerSubtitle) && (
            <div className="mb-8 text-center">
              {statsBannerTitle && <h2 className="text-2xl font-bold">{statsBannerTitle}</h2>}
              {statsBannerSubtitle && <p className="mt-1 text-sm text-blue-100">{statsBannerSubtitle}</p>}
            </div>
          )}
          <div className="grid grid-cols-2 gap-8 md:grid-cols-4">
            {displayStatsBanner.map((stat: any) => (
              <div key={stat.id} className="text-center">
                <div className="text-3xl font-bold lg:text-4xl">{stat.value}</div>
                <div className="mt-1 text-sm text-blue-100">{stat.label}</div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Hot Services */}
      <section className="bg-white py-16">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="mb-8 flex items-center justify-between">
            <h2 className="text-2xl font-bold text-gray-900">{t('hotServices')}</h2>
            <Link
              href="/services"
              className="inline-flex items-center gap-1 text-sm font-medium text-primary hover:opacity-80"
            >
              {t('viewAllServices')} <ArrowRight className="h-4 w-4" />
            </Link>
          </div>

          {loading ? (
            <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-4">
              {Array.from({ length: 8 }).map((_, i) => (
                <div key={`stat-skeleton-${i}`} className="h-56 animate-pulse rounded-2xl bg-gray-200" />
              ))}
            </div>
          ) : safeHotServices.length === 0 ? (
            <div className="rounded-2xl border border-gray-200 bg-white p-8 text-center text-gray-500">{t('noHotServices')}</div>
          ) : (
            <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-4">
              {safeHotServices.map((service) => (
                <Link
                  key={service.id}
                  href={`/services/${service.slug}`}
                  className="group flex flex-col rounded-2xl border border-gray-200 bg-white p-5 transition-all hover:border-primary/30 hover:shadow-lg"
                >
                  <div className="mb-4 flex items-start justify-between">
                    <div className="flex flex-wrap gap-2">
                      <span className="rounded-full bg-primary/10 px-2.5 py-0.5 text-xs font-medium text-primary">
                        {service.category?.nameZh ?? t('uncategorized')}
                      </span>
                      {service.isHot && (
                        <span className="rounded-full bg-orange-50 px-2.5 py-0.5 text-xs font-medium text-orange-600">{t('hot')}</span>
                      )}
                    </div>
                    <FlaskConical className="h-5 w-5 text-gray-300 transition-colors group-hover:text-primary" />
                  </div>

                  <h3 className="mb-2 text-lg font-semibold text-gray-900 transition-colors group-hover:text-primary">
                    {service.nameZh || t('unnamedService')}
                  </h3>

                  <div className="mt-auto flex items-center justify-between border-t border-gray-100 pt-4">
                    <div>
                      <span className="text-lg font-bold text-primary">¥{toNumber(service.basePrice, 0)}</span>
                      <span className="ml-1 text-xs text-gray-400">{t('fromPrice')}</span>
                    </div>
                    <span className="text-xs text-gray-500">{toNumber(service.turnaroundDays, 0)}{t('workDays')}</span>
                  </div>
                </Link>
              ))}
            </div>
          )}
        </div>
      </section>

      {/* Why Choose Us */}
      <section className="relative py-16">
        <div className="absolute inset-0">
          <Image src={whyChooseBg} alt="" fill className="object-cover opacity-5" sizes="(max-width: 768px) 100vw, 50vw" />
          <div className="absolute inset-0 bg-gradient-to-br from-slate-50/95 to-blue-50/95" />
        </div>
        <div className="relative mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="mb-10 text-center">
            <h2 className="text-3xl font-bold text-gray-900">{whyChooseTitle}</h2>
            <p className="mt-2 text-base text-gray-500">{whyChooseSubtitle}</p>
          </div>

          <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-5">
            {displayWhyChooseStats.map((stat: any) => (
              <div
                key={stat.id}
                className="rounded-3xl bg-white p-6 text-center shadow-sm ring-1 ring-gray-200 transition-all hover:shadow-md"
              >
                <div className="text-3xl font-bold text-primary">{stat.value}</div>
                <div className="mt-1 text-sm font-medium text-gray-900">{stat.label}</div>
                <div className="mt-1 text-xs text-gray-500">{stat.sub}</div>
              </div>
            ))}
          </div>

          <div className="mt-10 rounded-3xl bg-white p-6 shadow-sm ring-1 ring-gray-200">
            <div className="mb-4 flex items-center gap-2 text-base font-semibold text-gray-900">
              <MapPin className="h-5 w-5 text-primary" />
              {t('nationwideOffices')}
            </div>
            <div className="flex flex-wrap gap-3">
              {displayOfficeCities.map((city: any) => (
                <span
                  key={city.id}
                  className="inline-flex items-center gap-1.5 rounded-full bg-slate-100 px-4 py-2 text-sm font-medium text-gray-700"
                >
                  <span className="h-2 w-2 rounded-full bg-primary" />
                  {city.name}
                </span>
              ))}
            </div>
          </div>
        </div>
      </section>

     {/* Labs Section */}
<section className="bg-white py-16">
  <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
    <div className="mb-8 text-center">
      <h2 className="text-3xl font-bold text-gray-900">{labsTitle}</h2>
      <p className="mt-2 text-base text-gray-500">{labsSubtitle}</p>
    </div>

    <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-4">
      {displayLabs.map((lab, idx) => {
        const l = lab as any;
        
        // FIX 1: Generate a truly unique key to prevent React from reusing components/images incorrectly
        const stableKey = `lab-${l.id || l.slug || idx}`;
        
        const bgs = [
          'bg-gradient-to-br from-blue-100 to-blue-50',
          'bg-gradient-to-br from-emerald-100 to-emerald-50',
          'bg-gradient-to-br from-amber-100 to-amber-50',
          'bg-gradient-to-br from-purple-100 to-purple-50',
        ];
        const imageBg = l.imageBg || bgs[idx % bgs.length];

        const card = (
          <div className="group overflow-hidden rounded-3xl border border-gray-200 bg-white transition-all hover:-translate-y-1 hover:shadow-lg h-full flex flex-col">
            {/* FIX 2: Use fixed aspect ratio and standard height to ensure layout stability */}
            <div className={`relative aspect-video w-full ${imageBg} flex items-center justify-center overflow-hidden`}>
              {l.image && l.image.trim().length > 0 ? (
                <Image
                  src={l.image.trim()}
                  alt={l.name}
                  fill
                  className="object-cover transition-transform duration-500 group-hover:scale-105"
                  sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 25vw"
                  // FIX 3: Prioritize the first row to prevent blank spaces on load
                  priority={idx < 4}
                  suppressHydrationWarning={true}
                />
              ) : (
                <FlaskConical className="h-12 w-12 text-gray-400/70 transition-colors group-hover:text-primary" />
              )}
            </div>

            <div className="p-5 flex-grow">
              <h3 className="text-base font-bold text-gray-900 line-clamp-1">{l.name}</h3>
              <p className="mt-1 text-sm text-primary font-medium">{l.location || l.subtitle || ''}</p>
              <p className="mt-2 text-sm text-gray-500 line-clamp-2 leading-relaxed">
                {l.specialties || l.description || ''}
              </p>
            </div>
          </div>
        );

        return l.slug ? (
          <Link key={stableKey} href={`/labs/${l.slug}`} className="h-full">
            {card}
          </Link>
        ) : (
          <div key={stableKey} className="h-full">{card}</div>
        );
      })}
    </div>
  </div>
</section>

      {/* Sample Showcase */}
      {displaySamples.length > 0 && (
        <section className="bg-slate-50 py-16">
          <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
            <div className="mb-8 text-center">
              <h2 className="text-3xl font-bold text-gray-900">{samplesTitle}</h2>
              <p className="mt-2 text-base text-gray-500">{samplesSubtitle}</p>
            </div>
            <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
              {displaySamples.map((sample) => (
                <div
                  key={sample.id}
                  className="overflow-hidden rounded-3xl border border-gray-200 bg-white transition-all hover:-translate-y-1 hover:shadow-lg"
                >
                  <div className="relative h-48 w-full bg-gray-100">
                    {sample.image ? (
                      <Image src={sample.image} alt={sample.title} fill className="object-cover" sizes="(max-width: 768px) 100vw, 50vw" />
                    ) : (
                      <div className="flex h-full w-full items-center justify-center bg-gradient-to-br from-blue-50 to-indigo-50">
                        <FlaskConical className="h-12 w-12 text-gray-300" />
                      </div>
                    )}
                  </div>
                  <div className="p-5">
                    <h3 className="text-base font-bold text-gray-900">{sample.title}</h3>
                    <p className="mt-2 text-sm text-gray-500 line-clamp-3">{sample.description}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </section>
      )}

      {/* Equipment Showcase */}
    <section className="bg-white py-16">
  <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
    <div className="mb-10 text-center">
      <h2 className="text-3xl font-bold text-gray-900">设备展示</h2>
      <p className="mt-2 text-base text-gray-500">设备介绍与能力展示</p>
    </div>
    <div className="grid gap-6 md:grid-cols-3">
      {displayEquipment.map((equip, idx) => {
        const bgs = [
          'bg-emerald-50/70',
          'bg-cyan-50/70',
          'bg-teal-50/70',
          'bg-indigo-50/70',
        ];
        const bg = bgs[idx % bgs.length];

        // Use the image from data, or fallback to the specific png
        const imgSrc = equip.image || "/uploads/settings/equip-1.png";

        return (
          <div
            key={equip.id}
            className="group overflow-hidden rounded-3xl border border-gray-100 bg-white transition-all hover:-translate-y-1 hover:shadow-lg"
          >
            <div className={`relative aspect-square overflow-hidden ${bg}`}>
              <Image
                src={imgSrc}
                alt={equip.title}
                fill
                className="object-cover transition-transform duration-500 group-hover:scale-105"
                sizes="(max-width: 768px) 100vw, 33vw"
                unoptimized={true}
              />
            </div>
            <div className="p-5">
              <h3 className="text-base font-bold text-gray-900">{equip.title}</h3>
              <p className="mt-1 text-sm text-gray-500">{equip.description}</p>
            </div>
          </div>
        );
      })}
    </div>
  </div>
</section>

      {/* Professional Services */}
      <section className="bg-slate-50 py-16">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="grid gap-8 lg:grid-cols-12">
            {/* Left panel */}
            <div className="lg:col-span-5">
              <div className="relative overflow-hidden rounded-3xl bg-gradient-to-br from-cyan-500 to-teal-600 p-8 text-white shadow-lg h-full">
                <div className="relative z-10">
                  <div className="mb-6 inline-flex rounded-2xl bg-white/20 p-3 backdrop-blur">
                    <Users className="h-8 w-8 text-white" />
                  </div>
                  <h2 className="mb-6 text-3xl font-bold">专业服务</h2>
                  <ul className="space-y-4 text-sm text-white/90">
                    <li className="flex items-start gap-2">
                      <span className="mt-1.5 h-1.5 w-1.5 shrink-0 rounded-full bg-white" />
                      <span>国内外知名专家团队</span>
                    </li>
                    <li className="flex items-start gap-2">
                      <span className="mt-1.5 h-1.5 w-1.5 shrink-0 rounded-full bg-white" />
                      <span>实战经验丰富的技术工程师</span>
                    </li>
                    <li className="flex items-start gap-2">
                      <span className="mt-1.5 h-1.5 w-1.5 shrink-0 rounded-full bg-white" />
                      <span>提供个性化定制服务</span>
                    </li>
                    <li className="flex items-start gap-2">
                      <span className="mt-1.5 h-1.5 w-1.5 shrink-0 rounded-full bg-white" />
                      <span>科研项目覆盖率96.3%</span>
                    </li>
                    <li className="flex items-start gap-2">
                      <span className="mt-1.5 h-1.5 w-1.5 shrink-0 rounded-full bg-white" />
                      <span>行业服务满意度98.7%</span>
                    </li>
                  </ul>
                </div>
              </div>
            </div>

            {/* Right cards */}
            <div className="lg:col-span-7">
              <div className="grid gap-4 sm:grid-cols-3 h-full">
                {[
                  {
                    num: '01',
                    icon: Award,
                    title: '权威认证',
                    desc: '重量级的资格证书',
                  },
                  {
                    num: '02',
                    icon: BarChart,
                    title: '高效运营',
                    desc: '市场化的运营管理',
                  },
                  {
                    num: '03',
                    icon: FlaskConical,
                    title: '科研无忧',
                    desc: '全方面的解决方案',
                  },
                ].map((card) => (
                  <div
                    key={card.num}
                    className="relative overflow-hidden rounded-3xl bg-white p-6 shadow-sm ring-1 ring-gray-200 transition-all hover:-translate-y-1 hover:shadow-md flex flex-col h-full"
                  >
                    <div className="mb-4 text-4xl font-bold text-gray-100">{card.num}</div>
                    <div className="mb-4 inline-flex rounded-2xl bg-cyan-50 p-3 text-cyan-600 w-fit">
                      <card.icon className="h-6 w-6" />
                    </div>
                    <h3 className="text-lg font-bold text-gray-900">{card.title}</h3>
                    <p className="mt-1 text-sm text-gray-500">{card.desc}</p>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Partner Ecosystem */}
      <section className="bg-slate-50 py-16">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="mb-8 flex items-center justify-between">
            <div>
              <h2 className="text-2xl font-bold text-gray-900">{partnersTitle}</h2>
              <p className="mt-1 text-sm text-gray-500">{partnersSubtitle}</p>
            </div>
            {/* Removed "了解更多" link per PPT requirement */}
          </div>

          <div className="grid gap-6 lg:grid-cols-3">
            {displayPartners.map((p, idx) => {
              const Icon = p.icon as React.ComponentType<{ className?: string }>;
              const iconBgs = ['bg-blue-50', 'bg-emerald-50', 'bg-amber-50'];
              const iconColors = ['text-primary', 'text-emerald-600', 'text-amber-600'];
              const iconBg = (p as any).iconBg || iconBgs[idx % iconBgs.length];
              const iconColor = (p as any).iconColor || iconColors[idx % iconColors.length];
              return (
                <div key={(p as any).id} className="rounded-3xl bg-white p-6 shadow-sm ring-1 ring-gray-200">
                  <div className="mb-4 flex items-center gap-3">
                    <div className={`rounded-2xl ${iconBg} p-3`}>
                      <Icon className={`h-6 w-6 ${iconColor}`} />
                    </div>
                    <div>
                      <h3 className="text-lg font-semibold text-gray-900">{p.title}</h3>
                      <p className="text-sm text-gray-500">{p.sub}</p>
                    </div>
                  </div>
                  <div className="space-y-3 text-sm text-gray-700">
                    {p.items.map((item: string, itemIdx: number) => (
                      <div key={`${(p as any).id}-pt-${itemIdx}`} className="rounded-2xl bg-slate-50 px-4 py-3">
                        {item}
                      </div>
                    ))}
                  </div>
                </div>
              );
            })}
          </div>

          <div
            className="mt-6 rounded-3xl px-6 py-5 text-white"
            style={{ background: `linear-gradient(90deg, color-mix(in srgb, ${brandColor} 85%, black) 0%, color-mix(in srgb, ${brandColor} 70%, black) 100%)` }}
          >
            <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
              <div>
                <h3 className="text-lg font-semibold">{t('partnerPlatformTitle')}</h3>
                <p className="mt-1 text-sm text-blue-100">{t('partnerPlatformDesc')}</p>
              </div>
              <Link
                href="/contact"
                className="inline-flex items-center gap-2 rounded-xl bg-white px-5 py-3 text-sm font-semibold hover:bg-slate-100"
                style={{ color: brandColor }}
              >
                {t('applyCooperation')} <ChevronRight className="h-4 w-4" />
              </Link>
            </div>
          </div>
        </div>
      </section>

      <Footer />
    </div>
  );
}
