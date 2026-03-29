'use client';

import { useTranslations } from 'next-intl';
import { Link } from '@/i18n/routing';
import { FlaskConical, Phone, Mail, MapPin } from 'lucide-react';

export function Footer() {
  const t = useTranslations('footer');
  const tNav = useTranslations('nav');

  const footerLinks = [
    {
      title: '检测服务',
      links: [
        { href: '/services', label: '全部服务' },
        { href: '/services/materials', label: '材料测试' },
        { href: '/services/industries', label: '行业分类' },
        { href: '/services/standards', label: '标准分类' },
        { href: '/rfq', label: '定制检测' },
      ],
    },
    {
      title: '关于平台',
      links: [
        { href: '/about', label: '关于我们' },
        { href: '/labs', label: '合作实验室' },
        { href: '/equipment', label: '设备展示' },
        { href: '/about#cases', label: '案例展示' },
        { href: '/about#certifications', label: '资质证书' },
      ],
    },
    {
      title: '帮助支持',
      links: [
        { href: '/help', label: '帮助中心' },
        { href: '/help#faq', label: '常见问题' },
        { href: '/help#guide', label: '使用指南' },
        { href: '/contact', label: '联系我们' },
        { href: '/help#feedback', label: '意见反馈' },
      ],
    },
  ];

  return (
    <footer className="bg-gray-900 text-gray-300">
      {/* Main footer */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-8">
          {/* Brand */}
          <div className="lg:col-span-2">
            <div className="flex items-center gap-2 mb-4">
              <FlaskConical className="h-7 w-7 text-blue-400" />
              <span className="text-lg font-bold text-white">度量衡科研平台</span>
            </div>
            <p className="text-sm text-gray-400 mb-6 max-w-sm">
              立足科学前沿，服务中国创新
            </p>
            <div className="space-y-2 text-sm">
              <div className="flex items-center gap-2">
                <Phone className="h-4 w-4 text-gray-500" />
                <span>400-888-8888</span>
              </div>
              <div className="flex items-center gap-2">
                <Mail className="h-4 w-4 text-gray-500" />
                <span>contact@labtest.com</span>
              </div>
              <div className="flex items-center gap-2">
                <MapPin className="h-4 w-4 text-gray-500" />
                <span>北京市朝阳区科技园区</span>
              </div>
            </div>
          </div>

          {/* Links */}
          {footerLinks.map((section) => (
            <div key={section.title}>
              <h3 className="text-sm font-semibold text-white mb-4">{section.title}</h3>
              <ul className="space-y-2.5">
                {section.links.map((link) => (
                  <li key={link.href}>
                    <Link
                      href={link.href}
                      className="text-sm text-gray-400 hover:text-white transition-colors"
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
      <div className="border-t border-gray-800">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4 flex flex-col sm:flex-row items-center justify-between gap-2 text-xs text-gray-500">
          <p>{t('copyright')}</p>
          <div className="flex items-center gap-4">
            <Link href="/terms" className="hover:text-gray-300">{t('terms')}</Link>
            <Link href="/privacy" className="hover:text-gray-300">{t('privacy')}</Link>
            <span>{t('icp')}</span>
          </div>
        </div>
      </div>
    </footer>
  );
}