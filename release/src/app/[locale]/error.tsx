'use client';

import { useEffect } from 'react';
import { Header } from '@/components/layout/header';
import { Footer } from '@/components/layout/footer';
import { Button } from '@/components/ui/button';
import { AlertTriangle, RotateCcw, Home } from 'lucide-react';
import { Link } from '@/i18n/routing';

export default function ErrorPage({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    console.error('Page error:', error);
  }, [error]);

  return (
    <div className="min-h-screen flex flex-col">
      <Header />
      <main className="flex-1 flex items-center justify-center bg-gray-50 px-4">
        <div className="text-center">
          <div className="inline-flex items-center justify-center w-16 h-16 bg-red-100 rounded-full mb-4">
            <AlertTriangle className="h-8 w-8 text-red-600" />
          </div>
          <h1 className="text-2xl font-bold text-gray-900 mb-2">出错了</h1>
          <p className="text-gray-500 mb-8 max-w-md mx-auto">
            抱歉，页面加载时发生了错误。请重试或返回首页。
          </p>
          <div className="flex items-center justify-center gap-3">
            <Button variant="primary" size="lg" onClick={reset}>
              <RotateCcw className="h-4 w-4" />重试
            </Button>
            <Link href="/">
              <Button variant="outline" size="lg"><Home className="h-4 w-4" />返回首页</Button>
            </Link>
          </div>
        </div>
      </main>
      <Footer />
    </div>
  );
}
