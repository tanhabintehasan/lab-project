'use client';

import { useTranslations } from 'next-intl';
import { Link } from '@/i18n/routing';
import { useSiteSettings } from '@/components/providers/SiteSettingsProvider';
import { useMemo, useState, useEffect } from 'react';
import Image from 'next/image';

export function Footer() {
  const t = useTranslations('footer');
  const tNav = useTranslations('nav');
  const { settings } = useSiteSettings();

  // new Date().getFullYear() must run inside useEffect, not during render,
  // to avoid SSR/hydration text-node mismatches (server time vs client time).
  const [year, setYear] = useState(2026);
  useEffect(() => {
    setYear(new Date().getFullYear());
  }, []);

  const {
    siteName,
    tagline,
    phone,
    email,
    address,
    copyright,
    icp,
  } = useMemo(() => ({
    siteName: settings?.siteName || '度量衡科研平台',
    tagline: settings?.footerTextZh || '立足科学前沿，服务中国创新',
    phone: settings?.footerContactPhone || settings?.supportPhone || '400-888-8888',
    email: settings?.footerContactEmail || settings?.supportEmail || 'contact@labtest.com',
    address: settings?.footerContactAddress || settings?.addressZh || '北京市朝阳区科技园区',
    copyright: settings?.footerCopyrightZh || `© ${year} ${settings?.siteName || '度量衡科研平台'}`,
    icp: settings?.footerIcp || '',
  }), [settings, year]);

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
    <footer className="bg-slate-50 text-gray-700">
      {/* Main footer */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-8">
          {/* Brand */}
          <div className="lg:col-span-2">
            <div className="flex items-center gap-3 mb-4">
              <Image
                src="/images/bg-remove-logo.png"
                alt={siteName}
                width={40}
                height={40}
                className="rounded-lg object-contain"
              />
              <span className="text-lg font-bold text-gray-900">{siteName}</span>
            </div>
            <p className="text-sm text-gray-400 mb-6 max-w-sm">{tagline}</p>
            <div className="space-y-3 text-sm">
              <div className="flex items-center gap-2.5">
                <span className="inline-flex h-8 w-8 items-center justify-center rounded-lg bg-primary/10 text-primary">
                  <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M22 16.92v3a2 2 0 0 1-2.18 2 19.79 19.79 0 0 1-8.63-3.07 19.5 19.5 0 0 1-6-6 19.79 19.79 0 0 1-3.07-8.67A2 2 0 0 1 4.11 2h3a2 2 0 0 1 2 1.72 12.84 12.84 0 0 0 .7 2.81 2 2 0 0 1-.45 2.11L8.09 9.91a16 16 0 0 0 6 6l1.27-1.27a2 2 0 0 1 2.11-.45 12.84 12.84 0 0 0 2.81.7A2 2 0 0 1 22 16.92z"/></svg>
                </span>
                <span className="text-gray-600">{phone}</span>
              </div>
              <div className="flex items-center gap-2.5">
                <span className="inline-flex h-8 w-8 items-center justify-center rounded-lg bg-primary/10 text-primary">
                  <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect width="20" height="16" x="2" y="4" rx="2"/><path d="m22 7-8.97 5.7a1.94 1.94 0 0 1-2.06 0L2 7"/></svg>
                </span>
                <span className="text-gray-600">{email}</span>
              </div>
              <div className="flex items-center gap-2.5">
                <span className="inline-flex h-8 w-8 items-center justify-center rounded-lg bg-primary/10 text-primary">
                  <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M20 10c0 6-8 12-8 12s-8-6-8-12a8 8 0 0 1 16 0Z"/><circle cx="12" cy="10" r="3"/></svg>
                </span>
                <span className="text-gray-600">{address}</span>
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
          <p>{copyright}</p>
          <div className="flex items-center gap-4">
            <Link href="/terms" className="hover:text-gray-600">{t('terms')}</Link>
            <Link href="/privacy" className="hover:text-gray-600">{t('privacy')}</Link>
            {icp && <span>{icp}</span>}
          </div>
        </div>
      </div>
    </footer>
  );
}
