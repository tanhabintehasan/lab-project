'use client';

import { useTranslations } from 'next-intl';
import { Header } from '@/components/layout/header';
import { Footer } from '@/components/layout/footer';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Link } from '@/i18n/routing';
import { ArrowLeft, Microscope, Atom, Waves, FlaskConical, Zap, Thermometer } from 'lucide-react';

const frontierServices = [
  {
    id: 'ft-1',
    name: '同步辐射X射线吸收谱 XAFS',
    description: '利用同步辐射光源进行X射线吸收精细结构分析，精准测定材料局域原子结构、配位环境与价态信息。',
    price: null,
    turnaroundDays: 7,
    icon: Atom,
  },
  {
    id: 'ft-2',
    name: '聚焦离子束扫描电镜',
    description: 'FIB-SEM双束系统，实现纳米级截面制备与高分辨形貌/成分同步表征，适用于半导体、材料微区分析。',
    price: null,
    turnaroundDays: 5,
    icon: Microscope,
  },
  {
    id: 'ft-3',
    name: '基质辅助激光解吸飞行时间质谱仪',
    description: 'MALDI-TOF MS高灵敏度质谱分析，适用于生物大分子、聚合物分子量测定及材料表面成分鉴定。',
    price: null,
    turnaroundDays: 5,
    icon: Zap,
  },
  {
    id: 'ft-4',
    name: '原位红外',
    description: '原位红外光谱表征系统，实时监测催化反应、吸附过程及材料在不同气氛/温度下的结构演变。',
    price: null,
    turnaroundDays: 4,
    icon: Waves,
  },
  {
    id: 'ft-5',
    name: '飞行时间二次离子质谱仪',
    description: 'TOF-SIMS超高表面灵敏度质谱成像，提供元素及分子离子三维分布信息，空间分辨率可达亚微米级。',
    price: null,
    turnaroundDays: 6,
    icon: FlaskConical,
  },
  {
    id: 'ft-6',
    name: '热裂解气质联用仪',
    description: 'Py-GC/MS联用分析系统，适用于高分子材料热裂解产物鉴定、共聚物组成分析及添加剂筛查。',
    price: null,
    turnaroundDays: 4,
    icon: Thermometer,
  },
];

export default function FrontierTestingPage() {
  const t = useTranslations('services');

  return (
    <div className="min-h-screen">
      <Header />

      {/* Hero with decorative gradient */}
      <div className="relative overflow-hidden bg-gradient-to-br from-blue-900 via-blue-800 to-indigo-900 text-white">
        <div className="absolute inset-0 opacity-10">
          <div className="absolute -top-24 -right-24 w-96 h-96 rounded-full bg-white/20 blur-3xl" />
          <div className="absolute top-1/2 -left-24 w-72 h-72 rounded-full bg-cyan-400/20 blur-3xl" />
          <div className="absolute -bottom-24 right-1/3 w-80 h-80 rounded-full bg-blue-300/20 blur-3xl" />
        </div>
        <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16">
          <Link
            href="/services/categories"
            className="inline-flex items-center gap-1 text-blue-200 hover:text-white text-sm mb-6 transition-colors"
          >
            <ArrowLeft className="h-4 w-4" />
            {t('backToCategories')}
          </Link>
          <h1 className="text-4xl font-bold mb-3">前沿测试</h1>
          <p className="text-blue-100 text-lg max-w-2xl">
            国际顶尖仪器设备，提供材料微观结构、表面成分及原位反应机理的精准表征
          </p>
        </div>
      </div>

      {/* Content with subtle background pattern */}
      <div className="relative bg-slate-50">
        <div
          className="absolute inset-0 opacity-40"
          style={{
            backgroundImage: 'radial-gradient(#cbd5e1 1px, transparent 1px)',
            backgroundSize: '20px 20px',
          }}
        ></div>
        <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
          <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-6">
            {frontierServices.map((service) => {
              const Icon = service.icon;
              return (
                <Card key={service.id} hover padding="md" className="flex flex-col">
                  <div className="flex items-start gap-3 mb-3">
                    <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-blue-50 text-blue-600">
                      <Icon className="h-5 w-5" />
                    </div>
                    <h3 className="font-semibold text-gray-900 leading-tight">
                      {service.name}
                    </h3>
                  </div>

                  <p className="text-sm text-gray-500 mb-4 line-clamp-3 flex-1">
                    {service.description}
                  </p>

                  <div className="flex items-center justify-between pt-3 border-t border-gray-100">
                    <span className="text-sm text-gray-400">{t('inquire')}</span>
                    {service.turnaroundDays ? (
                      <Badge variant="outline">
                        {service.turnaroundDays}{t('days')}
                      </Badge>
                    ) : null}
                  </div>
                </Card>
              );
            })}
          </div>
        </div>
      </div>

      <Footer />
    </div>
  );
}
