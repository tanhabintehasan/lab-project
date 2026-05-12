'use client';

import { useEffect, useState } from 'react';
import { useTranslations } from 'next-intl';
import { Link } from '@/i18n/routing';
import { FlaskConical, Phone, Mail, MapPin } from 'lucide-react';

interface SiteSettings {
  siteName?: string | null;
  siteNameEn?: string | null;
  logoUrl?: string | null;
  logoUploadUrl?: string | null;
  supportPhone?: string | null;
  supportEmail?: string | null;
  addressZh?: string | null;
  footerTextZh?: string | null;
}

export function Footer() {
  const t = useTranslations('footer');
  const tNav = useTranslations('nav');
  const [settings, setSettings] = useState<SiteSettings | null>(null);

  useEffect(() => {
    let mounted = true;
    fetch('/api/site-settings', { cache: 'no-store' })
      .then(async (r) => {
        if (!r.ok) return null;
        try { return await r.json(); } catch { return null; }
      })
      .then((data) => {
        if (mounted && data?.success) {
          setSettings(data.data as SiteSettings);
        }
      })
      .catch(() => {});
    return () => {
      mounted = false;
    };
  }, []);

  const siteName = settings?.siteName || '度量衡科研平台';
  const tagline = settings?.footerTextZh || '立足科学前沿，服务中国创新';
  const phone = settings?.supportPhone || '400-888-8888';
  const email = settings?.supportEmail || 'contact@labtest.com';
  const address = settings?.addressZh || '北京市朝阳区科技园区';
  const logoUrl = settings?.logoUploadUrl || settings?.logoUrl;

  const footerLinks = [
    {
      title: t('services'),
      links: [
        { href: '/services', label: t('allServices') },
        { href: '/services/materials', label: tNav('materials') },
        { href: '/services/industries', label: tNav('industries') },
        { href: '/services/standards', label: tNav('standards') },
        { href: '/rfq', label: tNav('rfq') },
      ],
    },
    {
      title: t('aboutPlatform'),
      links: [
        { href: '/about', label: t('about') },
        { href: '/labs', label: tNav('labs') },
        { href: '/equipment', label: tNav('equipment') },
        { href: '/about#cases', label: t('caseStudies') },
        { href: '/about#certifications', label: t('certifications') },
      ],
    },
    {
      title: t('helpSupport'),
      links: [
        { href: '/help', label: t('help') },
        { href: '/help#faq', label: t('faq') },
        { href: '/help#guide', label: t('guide') },
        { href: '/contact', label: t('contact') },
        { href: '/help#feedback', label: t('feedback') },
      ],
    },
  ];

  return (
    <footer className="bg-white text-gray-700">
      {/* Main footer */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-8">
          {/* Brand */}
          <div className="lg:col-span-2">
            <div className="flex items-center gap-2 mb-4">
              <span className="text-lg font-bold text-gray-900">{siteName}</span>
            </div>
            <p className="text-sm text-gray-400 mb-6 max-w-sm">{tagline}</p>
            <div className="space-y-2 text-sm">
              <div className="flex items-center gap-2">
                <Phone className="h-4 w-4 text-primary/60" />
                <span>{phone}</span>
              </div>
              <div className="flex items-center gap-2">
                <Mail className="h-4 w-4 text-primary/60" />
                <span>{email}</span>
              </div>
              <div className="flex items-center gap-2">
                <MapPin className="h-4 w-4 text-primary/60" />
                <span>{address}</span>
              </div>
            </div>
          </div>

          {/* Links */}
          {footerLinks.map((section) => (
            <div key={section.title}>
              <h3 className="text-sm font-semibold text-gray-900 mb-4">{section.title}</h3>
              <ul className="space-y-2.5">
                {section.links.map((link) => (
                  <li key={link.href}>
                    <Link
                      href={link.href}
                      className="text-sm text-gray-500 hover:text-primary transition-colors"
                    >
                      {link.label}
                    </Link>
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>
      </div>

      {/* Bottom bar */}
      <div className="border-t border-gray-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4 flex flex-col sm:flex-row items-center justify-between gap-2 text-xs text-gray-400">
          <p>{t('copyright')}</p>
          <div className="flex items-center gap-4">
            <Link href="/terms" className="hover:text-gray-600">{t('terms')}</Link>
            <Link href="/privacy" className="hover:text-gray-600">{t('privacy')}</Link>
            <span>{t('icp')}</span>
          </div>
        </div>
      </div>
    </footer>
  );
}
