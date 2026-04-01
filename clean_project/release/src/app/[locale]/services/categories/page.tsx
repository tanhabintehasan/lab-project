'use client';

import { Header } from '@/components/layout/header';
import { Footer } from '@/components/layout/footer';
import { Card } from '@/components/ui/card';
import { Link } from '@/i18n/routing';

const categories = [
  { slug: 'mechanical', icon: '🔬', name: '力学性能测试', count: 45 },
  { slug: 'chemical', icon: '🧪', name: '化学成分分析', count: 32 },
  { slug: 'environmental', icon: '🌡️', name: '环境模拟试验', count: 28 },
  { slug: 'dimensional', icon: '📐', name: '尺寸计量检测', count: 20 },
  { slug: 'electrical', icon: '⚡', name: '电子电气测试', count: 35 },
  { slug: 'reliability', icon: '🛡️', name: '可靠性测试', count: 18 },
  { slug: 'ndt', icon: '🔩', name: '无损检测', count: 22 },
  { slug: 'micro', icon: '🧬', name: '材料微观分析', count: 15 },
];

export default function CategoriesPage() {
  return (
    <div className="min-h-screen">
      <Header />

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <h1 className="text-3xl font-bold text-gray-900 mb-2">服务分类</h1>
        <p className="text-gray-500 mb-8">按检测类型浏览我们的服务</p>

        <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-6">
          {categories.map((category) => (
            <Link
              key={category.slug}
              href={`/services/categories/${category.slug}`}
            >
              <Card hover padding="lg" className="text-center">
                <span className="text-4xl mb-3 block">{category.icon}</span>
                <h3 className="font-semibold text-gray-900 mb-1">
                  {category.name}
                </h3>
                <p className="text-sm text-gray-500">
                  {category.count} 项服务
                </p>
              </Card>
            </Link>
          ))}
        </div>
      </div>

      <Footer />
    </div>
  );
}