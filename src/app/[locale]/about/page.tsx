'use client';

import { useEffect, useState } from 'react';
import { useTranslations } from 'next-intl';
import { Header } from '@/components/layout/header';
import { Footer } from '@/components/layout/footer';
import { Link } from '@/i18n/routing';
import { Card } from '@/components/ui/card';
import { Shield, Award, Users, Target, Eye, Heart, CheckCircle2 } from 'lucide-react';

interface CMSPage {
  id: string;
  slug: string;
  titleZh?: string;
  contentZh?: string;
  sections?: Array<{
    id: string;
    sectionKey: string;
    name?: string;
    titleZh?: string;
    subtitleZh?: string;
    descriptionZh?: string;
    items?: Array<{
      id: string;
      titleZh?: string;
      descriptionZh?: string;
      icon?: string;
      imageUrl?: string;
      value?: string;
    }>;
  }>;
}

const defaultCertifications = [
  { name: 'CMA', descKey: 'certCMA' },
  { name: 'CNAS', descKey: 'certCNAS' },
  { name: 'ILAC-MRA', descKey: 'certILAC' },
  { name: 'ISO 17025', descKey: 'certISO' },
];

const defaultStats = [
  { value: '2000+', labelKey: 'statServices' },
  { value: '150+', labelKey: 'statLabs' },
  { value: '10000+', labelKey: 'statCustomers' },
  { value: '50000+', labelKey: 'statReports' },
];

const defaultTeam = ['CEO', 'CTO', '技术总监', '运营总监'];

function getSection(page: CMSPage | null, key: string) {
  return page?.sections?.find((s) => s.sectionKey === key);
}

export default function AboutPage() {
  const t = useTranslations('about');
  const [cmsPage, setCmsPage] = useState<CMSPage | null>(null);

  useEffect(() => {
    let mounted = true;
    fetch('/api/cms/page/about', { cache: 'no-store' })
      .then((r) => r.json())
      .then((data) => {
        if (mounted && data?.success) {
          setCmsPage(data.data);
        }
      })
      .catch(() => {});
    return () => {
      mounted = false;
    };
  }, []);

  const heroTitle = cmsPage?.titleZh || t('title');
  const heroSubtitle = cmsPage?.contentZh || t('heroSubtitle');

  const introSection = getSection(cmsPage, 'about_intro');
  const missionSection = getSection(cmsPage, 'about_mission');
  const statsSection = getSection(cmsPage, 'about_stats');
  const teamSection = getSection(cmsPage, 'about_team');
  const certSection = getSection(cmsPage, 'about_certifications');
  const ctaSection = getSection(cmsPage, 'about_cta');

  const missionItems = missionSection?.items?.length
    ? missionSection.items
    : [
        { id: 'm1', titleZh: t('missionTitle'), descriptionZh: t('missionDesc'), icon: 'Target' },
        { id: 'm2', titleZh: t('visionTitle'), descriptionZh: t('visionDesc'), icon: 'Eye' },
        { id: 'm3', titleZh: t('valuesTitle'), descriptionZh: t('valuesDesc'), icon: 'Heart' },
      ];

  const statsItems = statsSection?.items?.length
    ? statsSection.items.map((i) => ({ value: i.value || '', label: i.titleZh || '' }))
    : defaultStats.map((s) => ({ value: s.value, label: t(s.labelKey as 'statServices') }));

  const teamItems = teamSection?.items?.length
    ? teamSection.items.map((i) => i.titleZh || '')
    : defaultTeam;

  const certItems = certSection?.items?.length
    ? certSection.items.map((i) => ({ name: i.titleZh || '', desc: i.descriptionZh || '' }))
    : defaultCertifications;

  const ctaTitle = ctaSection?.titleZh || t('ctaTitle');
  const ctaSubtitle = ctaSection?.subtitleZh || t('ctaSubtitle');

  return (
    <div className="min-h-screen">
      <Header />
      {/* Hero */}
      <section className="bg-gradient-to-br from-blue-600 to-indigo-800 text-white py-20">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <h1 className="text-4xl font-bold mb-4">{heroTitle}</h1>
          <p className="text-xl text-blue-100 max-w-2xl mx-auto">{heroSubtitle}</p>
        </div>
      </section>

      {/* Company Intro */}
      <section className="py-16">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid md:grid-cols-2 gap-12 items-center">
            <div>
              <h2 className="text-3xl font-bold text-gray-900 mb-6">{introSection?.titleZh || t('introTitle')}</h2>
              <p className="text-gray-600 leading-relaxed mb-4">
                {introSection?.descriptionZh || t('introDesc1')}
              </p>
              <p className="text-gray-600 leading-relaxed">
                {introSection?.subtitleZh || t('introDesc2')}
              </p>
            </div>
            <div className="bg-gradient-to-br from-blue-50 to-indigo-50 rounded-2xl p-8 flex items-center justify-center min-h-[300px]">
              <div className="text-center text-gray-400">
                <Shield className="h-16 w-16 mx-auto mb-4 text-blue-300" />
                <p>{t('companyImage')}</p>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Mission & Vision */}
      <section className="py-16 bg-gray-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <h2 className="text-3xl font-bold text-gray-900 text-center mb-12">{missionSection?.titleZh || t('mission')}</h2>
          <div className="grid md:grid-cols-3 gap-8">
            {missionItems.map((item, idx) => {
              const icons = [Target, Eye, Heart];
              const Icon = icons[idx % icons.length];
              return (
                <Card key={item.id || idx} padding="lg" className="text-center">
                  <Icon className="h-10 w-10 text-blue-600 mx-auto mb-4" />
                  <h3 className="text-lg font-semibold text-gray-900 mb-2">{item.titleZh}</h3>
                  <p className="text-gray-600">{item.descriptionZh}</p>
                </Card>
              );
            })}
          </div>
        </div>
      </section>

      {/* Stats */}
      <section className="py-16">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-8">
            {statsItems.map((s, idx) => (
              <div key={s.label || idx} className="text-center">
                <p className="text-4xl font-bold text-blue-600 mb-2">{s.value}</p>
                <p className="text-gray-500">{s.label}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Certifications */}
      <section className="py-16">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <h2 className="text-3xl font-bold text-gray-900 text-center mb-12">{certSection?.titleZh || t('certifications')}</h2>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
            {certItems.map((cert, idx) => (
              <Card key={cert.name || idx} padding="md" className="text-center">
                <Award className="h-10 w-10 text-yellow-500 mx-auto mb-3" />
                <p className="font-bold text-lg text-gray-900">{cert.name}</p>
                <p className="text-sm text-gray-500">{'descKey' in cert ? t(cert.descKey as 'certCMA') : cert.desc}</p>
              </Card>
            ))}
          </div>
        </div>
      </section>

      {/* CTA */}
      <section className="py-16 bg-blue-600 text-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <h2 className="text-3xl font-bold mb-4">{ctaTitle}</h2>
          <p className="text-blue-100 mb-8">{ctaSubtitle}</p>
          <div className="flex items-center justify-center gap-4">
            <Link href="/contact" className="px-8 py-3 bg-white text-blue-600 rounded-lg font-semibold hover:bg-blue-50 transition-colors">
              {t('contactUs')}
            </Link>
            <Link href="/services" className="px-8 py-3 bg-blue-500 text-white rounded-lg font-semibold hover:bg-blue-400 transition-colors">
              {t('browseServices')}
            </Link>
          </div>
        </div>
      </section>

      <Footer />
    </div>
  );
}
