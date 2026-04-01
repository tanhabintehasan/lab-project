'use client';
import { Header } from '@/components/layout/header';
import { Footer } from '@/components/layout/footer';
import { Card } from '@/components/ui/card';
import { Link } from '@/i18n/routing';

const standards = [
  { org: 'GB', name: '中国国家标准', desc: '中华人民共和国国家标准' },
  { org: 'ISO', name: '国际标准化组织', desc: '国际通用标准' },
  { org: 'ASTM', name: '美国材料试验协会', desc: '美国材料与试验标准' },
  { org: 'DIN', name: '德国标准化学会', desc: '德国工业标准' },
  { org: 'JIS', name: '日本工业标准', desc: '日本工业规格' },
  { org: 'EN', name: '欧洲标准', desc: '欧洲标准化委员会' },
];

export default function StandardsPage() {
  return (
    <div className="min-h-screen"><Header />
      <div className="max-w-7xl mx-auto px-4 py-12">
        <h1 className="text-3xl font-bold text-gray-900 mb-2">检测标准</h1>
        <p className="text-gray-500 mb-8">我们支持国内外主流检测标准</p>
        <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-6">
          {standards.map(s => (
            <Link key={s.org} href={`/services?standard=${s.org}`}>
              <Card hover padding="lg">
                <p className="text-2xl font-bold text-blue-600 mb-2">{s.org}</p>
                <h3 className="font-semibold text-gray-900 mb-1">{s.name}</h3>
                <p className="text-sm text-gray-500">{s.desc}</p>
              </Card>
            </Link>
          ))}
        </div>
      </div>
    <Footer /></div>
  );
}
