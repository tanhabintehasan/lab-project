'use client';
import { Header } from '@/components/layout/header';
import { Footer } from '@/components/layout/footer';
import { Card } from '@/components/ui/card';
import { Link } from '@/i18n/routing';

const materials = [
  { slug: 'metals', name: '金属材料', icon: '🔩' },
  { slug: 'polymers', name: '高分子材料', icon: '🧬' },
  { slug: 'ceramics', name: '陶瓷材料', icon: '🏺' },
  { slug: 'composites', name: '复合材料', icon: '🧱' },
  { slug: 'electronics', name: '电子材料', icon: '💡' },
  { slug: 'textiles', name: '纺织材料', icon: '🧵' },
];

export default function MaterialsPage() {
  return (
    <div className="min-h-screen"><Header />
      <div className="max-w-7xl mx-auto px-4 py-12">
        <h1 className="text-3xl font-bold text-gray-900 mb-2">材料分类</h1>
        <p className="text-gray-500 mb-8">按材料类型浏览检测服务</p>
        <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-6">
          {materials.map(m => (
            <Link key={m.slug} href={`/services?material=${m.slug}`}>
              <Card hover padding="lg" className="text-center">
                <span className="text-4xl mb-3 block">{m.icon}</span>
                <h3 className="font-semibold text-gray-900">{m.name}</h3>
              </Card>
            </Link>
          ))}
        </div>
      </div>
    <Footer /></div>
  );
}
