'use client';
import { Header } from '@/components/layout/header';
import { Footer } from '@/components/layout/footer';
import { Card } from '@/components/ui/card';
import { Link } from '@/i18n/routing';

const industries = [
  { slug: 'automotive', name: '汽车工业', icon: '🚗' },
  { slug: 'aerospace', name: '航空航天', icon: '✈️' },
  { slug: 'electronics', name: '电子电气', icon: '📱' },
  { slug: 'energy', name: '新能源', icon: '⚡' },
  { slug: 'medical', name: '医疗器械', icon: '🏥' },
  { slug: 'construction', name: '建筑工程', icon: '🏗️' },
];

export default function IndustriesPage() {
  return (
    <div className="min-h-screen"><Header />
      <div className="max-w-7xl mx-auto px-4 py-12">
        <h1 className="text-3xl font-bold text-gray-900 mb-2">行业分类</h1>
        <p className="text-gray-500 mb-8">按行业领域浏览检测服务</p>
        <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-6">
          {industries.map(ind => (
            <Link key={ind.slug} href={`/services?industry=${ind.slug}`}>
              <Card hover padding="lg" className="text-center">
                <span className="text-4xl mb-3 block">{ind.icon}</span>
                <h3 className="font-semibold text-gray-900">{ind.name}</h3>
              </Card>
            </Link>
          ))}
        </div>
      </div>
    <Footer /></div>
  );
}
