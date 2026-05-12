'use client';

import { useTranslations } from 'next-intl';
import { Link } from '@/i18n/routing';
import { Header } from '@/components/layout/header';
import { Footer } from '@/components/layout/footer';
import { Button } from '@/components/ui/button';
import { Home, ArrowLeft } from 'lucide-react';

export default function NotFoundPage() {
  const tCommon = useTranslations('common');

  return (
    <div className="min-h-screen flex flex-col">
      <Header />
      <main className="flex-1 flex items-center justify-center bg-gray-50 px-4">
        <div className="text-center">
          <p className="text-7xl font-bold text-blue-600 mb-4">404</p>
          <h1 className="text-2xl font-bold text-gray-900 mb-2">页面未找到</h1>
          <p className="text-gray-500 mb-8 max-w-md mx-auto">抱歉，您访问的页面不存在或已被移动。请检查链接是否正确。</p>
          <div className="flex items-center justify-center gap-3">
            <Link href="/">
              <Button variant="primary" size="lg"><Home className="h-4 w-4" />返回首页</Button>
            </Link>
            <Button variant="outline" size="lg" onClick={() => window.history.back()}>
              <ArrowLeft className="h-4 w-4" />{tCommon('back')}
            </Button>
          </div>
        </div>
      </main>
      <Footer />
    </div>
  );
}
