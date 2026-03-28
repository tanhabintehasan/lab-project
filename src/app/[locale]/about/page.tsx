'use client';

import { useTranslations } from 'next-intl';
import { Header } from '@/components/layout/header';
import { Footer } from '@/components/layout/footer';
import { Card } from '@/components/ui/card';
import { Shield, Award, Users, Target, Eye, Heart, CheckCircle2 } from 'lucide-react';

const certifications = [
  { name: 'CMA', desc: '中国计量认证' },
  { name: 'CNAS', desc: '中国合格评定国家认可委员会' },
  { name: 'ILAC-MRA', desc: '国际实验室认可合作组织' },
  { name: 'ISO 17025', desc: '检测和校准实验室能力认可' },
];

const stats = [
  { value: '2000+', label: '检测项目' },
  { value: '150+', label: '合作实验室' },
  { value: '10000+', label: '服务客户' },
  { value: '50000+', label: '检测报告' },
];

export default function AboutPage() {
  const t = useTranslations('about');

  return (
    <div className="min-h-screen">
      <Header />
      {/* Hero */}
      <section className="bg-gradient-to-br from-blue-600 to-indigo-800 text-white py-20">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <h1 className="text-4xl font-bold mb-4">{t('title')}</h1>
          <p className="text-xl text-blue-100 max-w-2xl mx-auto">
            专业的一站式检测服务平台，连接企业与优质实验室，提供高效、透明、可靠的检测解决方案。
          </p>
        </div>
      </section>

      {/* Company Intro */}
      <section className="py-16">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid md:grid-cols-2 gap-12 items-center">
            <div>
              <h2 className="text-3xl font-bold text-gray-900 mb-6">关于精测实验</h2>
              <p className="text-gray-600 leading-relaxed mb-4">
                精测实验是中国领先的一站式检测服务平台，致力于为各行业企业提供专业、高效、透明的检测解决方案。
                我们整合国内优质实验室资源，通过智能化平台连接检测需求与实验室服务能力。
              </p>
              <p className="text-gray-600 leading-relaxed">
                平台涵盖力学性能、化学分析、环境模拟、无损检测等八大检测领域，
                服务覆盖汽车、航空航天、电子电气、新能源等多个行业。
              </p>
            </div>
            <div className="bg-gradient-to-br from-blue-50 to-indigo-50 rounded-2xl p-8 flex items-center justify-center min-h-[300px]">
              <div className="text-center text-gray-400">
                <Shield className="h-16 w-16 mx-auto mb-4 text-blue-300" />
                <p>公司图片</p>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Mission & Vision */}
      <section className="py-16 bg-gray-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <h2 className="text-3xl font-bold text-gray-900 text-center mb-12">{t('mission')}</h2>
          <div className="grid md:grid-cols-3 gap-8">
            <Card padding="lg" className="text-center">
              <Target className="h-10 w-10 text-blue-600 mx-auto mb-4" />
              <h3 className="text-lg font-semibold text-gray-900 mb-2">使命</h3>
              <p className="text-gray-600">让专业检测触手可及，助力中国制造品质升级</p>
            </Card>
            <Card padding="lg" className="text-center">
              <Eye className="h-10 w-10 text-blue-600 mx-auto mb-4" />
              <h3 className="text-lg font-semibold text-gray-900 mb-2">愿景</h3>
              <p className="text-gray-600">成为全球最受信赖的检测服务平台</p>
            </Card>
            <Card padding="lg" className="text-center">
              <Heart className="h-10 w-10 text-blue-600 mx-auto mb-4" />
              <h3 className="text-lg font-semibold text-gray-900 mb-2">价值观</h3>
              <p className="text-gray-600">专业、透明、高效、创新</p>
            </Card>
          </div>
        </div>
      </section>

      {/* Stats */}
      <section className="py-16">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-8">
            {stats.map(s => (
              <div key={s.label} className="text-center">
                <p className="text-4xl font-bold text-blue-600 mb-2">{s.value}</p>
                <p className="text-gray-500">{s.label}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Team */}
      <section className="py-16 bg-gray-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <h2 className="text-3xl font-bold text-gray-900 text-center mb-12">{t('team')}</h2>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
            {['CEO', 'CTO', '技术总监', '运营总监'].map(role => (
              <Card key={role} padding="md" className="text-center">
                <div className="w-20 h-20 bg-gray-200 rounded-full mx-auto mb-3 flex items-center justify-center">
                  <Users className="h-8 w-8 text-gray-400" />
                </div>
                <p className="font-medium text-gray-900">团队成员</p>
                <p className="text-sm text-gray-500">{role}</p>
              </Card>
            ))}
          </div>
        </div>
      </section>

      {/* Certifications */}
      <section className="py-16">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <h2 className="text-3xl font-bold text-gray-900 text-center mb-12">{t('certifications')}</h2>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
            {certifications.map(cert => (
              <Card key={cert.name} padding="md" className="text-center">
                <Award className="h-10 w-10 text-yellow-500 mx-auto mb-3" />
                <p className="font-bold text-lg text-gray-900">{cert.name}</p>
                <p className="text-sm text-gray-500">{cert.desc}</p>
              </Card>
            ))}
          </div>
        </div>
      </section>

      {/* CTA */}
      <section className="py-16 bg-blue-600 text-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <h2 className="text-3xl font-bold mb-4">准备开始检测了吗？</h2>
          <p className="text-blue-100 mb-8">联系我们的专业团队，获取定制检测方案</p>
          <div className="flex items-center justify-center gap-4">
            <a href="/contact" className="px-8 py-3 bg-white text-blue-600 rounded-lg font-semibold hover:bg-blue-50 transition-colors">
              联系我们
            </a>
            <a href="/services" className="px-8 py-3 bg-blue-500 text-white rounded-lg font-semibold hover:bg-blue-400 transition-colors">
              浏览服务
            </a>
          </div>
        </div>
      </section>

      <Footer />
    </div>
  );
}
