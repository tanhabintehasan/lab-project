'use client';

import { useEffect, useState, useMemo } from 'react';
import { Header } from '@/components/layout/header';
import { Footer } from '@/components/layout/footer';
import { Card } from '@/components/ui/card';
import { Link } from '@/i18n/routing';
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
  Award,
  Users,
  Star,
  MapPin,
  CheckCircle2,
  FileText,
  Shield,
  Clock,
  BookOpen,
  Edit,
  Globe,
  Send,
  BarChart,
  LucideIcon,
  Loader2,
} from 'lucide-react';
import type { CMSPage, CMSSection } from '@/types/cms';

const iconMap: Record<string, LucideIcon> = {
  Search,
  ArrowRight,
  FlaskConical,
  ShieldCheck,
  Building2,
  GraduationCap,
  Landmark,
  Wallet,
  ChevronRight,
  Award,
  Users,
  Star,
  MapPin,
  CheckCircle2,
  FileText,
  Shield,
  Clock,
  BookOpen,
  Edit,
  Globe,
  Send,
  BarChart,
};

function getIcon(name?: string | null): LucideIcon | null {
  if (!name) return null;
  return iconMap[name] || null;
}

type ThemeColor = 'blue' | 'green' | 'indigo' | 'amber' | 'rose' | 'cyan';

interface ServiceLandingTemplateProps {
  slug: string;
  themeColor?: ThemeColor;
}

const themeClasses: Record<ThemeColor, { heroFrom: string; heroTo: string; btn: string; btnHover: string; lightBg: string; text: string; ring: string }> = {
  blue: {
    heroFrom: 'from-blue-600',
    heroTo: 'to-indigo-800',
    btn: 'bg-blue-600',
    btnHover: 'hover:bg-blue-700',
    lightBg: 'bg-blue-50',
    text: 'text-blue-600',
    ring: 'ring-blue-200',
  },
  green: {
    heroFrom: 'from-emerald-600',
    heroTo: 'to-green-800',
    btn: 'bg-emerald-600',
    btnHover: 'hover:bg-emerald-700',
    lightBg: 'bg-emerald-50',
    text: 'text-emerald-600',
    ring: 'ring-emerald-200',
  },
  indigo: {
    heroFrom: 'from-indigo-600',
    heroTo: 'to-violet-800',
    btn: 'bg-indigo-600',
    btnHover: 'hover:bg-indigo-700',
    lightBg: 'bg-indigo-50',
    text: 'text-indigo-600',
    ring: 'ring-indigo-200',
  },
  amber: {
    heroFrom: 'from-amber-500',
    heroTo: 'to-orange-700',
    btn: 'bg-amber-600',
    btnHover: 'hover:bg-amber-700',
    lightBg: 'bg-amber-50',
    text: 'text-amber-600',
    ring: 'ring-amber-200',
  },
  rose: {
    heroFrom: 'from-rose-600',
    heroTo: 'to-pink-800',
    btn: 'bg-rose-600',
    btnHover: 'hover:bg-rose-700',
    lightBg: 'bg-rose-50',
    text: 'text-rose-600',
    ring: 'ring-rose-200',
  },
  cyan: {
    heroFrom: 'from-cyan-600',
    heroTo: 'to-teal-800',
    btn: 'bg-cyan-600',
    btnHover: 'hover:bg-cyan-700',
    lightBg: 'bg-cyan-50',
    text: 'text-cyan-600',
    ring: 'ring-cyan-200',
  },
};

export function ServiceLandingTemplate({ slug, themeColor = 'blue' }: ServiceLandingTemplateProps) {
  const [page, setPage] = useState<CMSPage | null>(null);
  const [loading, setLoading] = useState(true);
  const t = themeClasses[themeColor];

  useEffect(() => {
    let cancelled = false;
    setLoading(true);
    fetch(`/api/cms/page/${slug}`)
      .then((res) => res.json())
      .then((json) => {
        if (!cancelled) {
          if (json?.success && json.data) setPage(json.data);
          setLoading(false);
        }
      })
      .catch(() => {
        if (!cancelled) setLoading(false);
      });
    return () => {
      cancelled = true;
    };
  }, [slug]);

  const sections = useMemo(() => page?.sections || [], [page]);

  const getSection = (key: string) => sections.find((s) => s.sectionKey === key);

  const heroSection = getSection('hero');
  const featuresSection = getSection('features');
  const ctaSection = getSection('cta');

  if (loading) {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-gray-400" />
      </div>
    );
  }

  if (!page) {
    return (
      <div className="flex min-h-screen items-center justify-center text-gray-600">
        内容加载失败，请稍后重试
      </div>
    );
  }

  return (
    <div className="min-h-screen">
      <Header />

      {/* Hero */}
      {heroSection && (
        <section className={`relative bg-gradient-to-br ${t.heroFrom} ${t.heroTo} text-white py-16`}>
          <div className="mx-auto max-w-7xl px-4 text-center sm:px-6 lg:px-8">
            {heroSection.badgeZh ? (
              <span className="mb-4 inline-block rounded-full bg-white/20 px-3 py-1 text-sm font-medium backdrop-blur">
                {heroSection.badgeZh}
              </span>
            ) : null}
            <h1 className="text-3xl font-bold sm:text-4xl md:text-5xl">{heroSection.titleZh || page.titleZh}</h1>
            {heroSection.subtitleZh ? (
              <p className="mx-auto mt-4 max-w-2xl text-lg text-white/90">{heroSection.subtitleZh}</p>
            ) : null}
            {heroSection.descriptionZh ? (
              <p className="mx-auto mt-3 max-w-3xl text-white/80">{heroSection.descriptionZh}</p>
            ) : null}
          </div>
        </section>
      )}

      {/* Features */}
      {featuresSection && (
        <section className="mx-auto max-w-7xl px-4 py-12 sm:px-6 lg:px-8">
          <div className="mb-10 text-center">
            <h2 className="text-2xl font-bold text-gray-900">{featuresSection.titleZh}</h2>
            {featuresSection.subtitleZh ? <p className="mt-2 text-gray-600">{featuresSection.subtitleZh}</p> : null}
          </div>
          <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
            {(featuresSection.items || []).map((item) => {
              const Icon = getIcon(item.icon) || CheckCircle2;
              return (
                <Card key={item.id} hover padding="none" className="overflow-hidden">
                  <div className={`flex h-32 items-center justify-center ${t.lightBg}`}>
                    <Icon className={`h-12 w-12 ${t.text} opacity-80`} />
                  </div>
                  <div className="p-5">
                    <h3 className="text-lg font-semibold text-gray-900">{item.titleZh}</h3>
                    {item.descriptionZh ? <p className="mt-2 text-sm text-gray-500 line-clamp-3">{item.descriptionZh}</p> : null}
                    {(item.points || []).length > 0 && (
                      <ul className="mt-4 space-y-2">
                        {(item.points || []).map((pt) => (
                          <li key={pt.id} className="flex items-start gap-2 text-sm text-gray-600">
                            <CheckCircle2 className={`mt-0.5 h-4 w-4 shrink-0 ${t.text}`} />
                            <span>{pt.textZh}</span>
                          </li>
                        ))}
                      </ul>
                    )}
                    {item.linkUrl ? (
                      <div className="mt-4">
                        <Link
                          href={item.linkUrl}
                          className={`inline-flex items-center gap-1 text-sm font-medium ${t.text} hover:underline`}
                        >
                          了解更多 <ArrowRight className="h-4 w-4" />
                        </Link>
                      </div>
                    ) : null}
                  </div>
                </Card>
              );
            })}
          </div>
        </section>
      )}

      {/* CTA */}
      {ctaSection && (
        <section className={`${t.lightBg} py-14`}>
          <div className="mx-auto max-w-4xl px-4 text-center sm:px-6 lg:px-8">
            <h2 className="text-2xl font-bold text-gray-900">{ctaSection.titleZh}</h2>
            {ctaSection.subtitleZh ? <p className="mt-3 text-gray-600">{ctaSection.subtitleZh}</p> : null}
            {ctaSection.descriptionZh ? <p className="mt-2 text-gray-500">{ctaSection.descriptionZh}</p> : null}
            <div className="mt-6">
              <Link
                href="/contact"
                className={`inline-flex items-center gap-2 rounded-xl ${t.btn} px-6 py-3 text-white font-semibold ${t.btnHover}`}
              >
                立即咨询 <ArrowRight className="h-4 w-4" />
              </Link>
            </div>
          </div>
        </section>
      )}

      {/* Fallback for other sections */}
      {sections
        .filter((s) => !['hero', 'features', 'cta'].includes(s.sectionKey))
        .map((sec) => (
          <section key={sec.id} className="mx-auto max-w-7xl px-4 py-10 sm:px-6 lg:px-8">
            <div className="mb-6">
              <h2 className="text-xl font-bold text-gray-900">{sec.titleZh}</h2>
              {sec.subtitleZh ? <p className="mt-1 text-gray-600">{sec.subtitleZh}</p> : null}
            </div>
            <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
              {(sec.items || []).map((item) => (
                <Card key={item.id} padding="md">
                  <h3 className="font-medium text-gray-900">{item.titleZh}</h3>
                  {item.descriptionZh ? <p className="mt-1 text-sm text-gray-500">{item.descriptionZh}</p> : null}
                </Card>
              ))}
            </div>
          </section>
        ))}

      <Footer />
    </div>
  );
}
