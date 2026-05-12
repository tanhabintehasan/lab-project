'use client';

import { useState } from 'react';
import { useTranslations } from 'next-intl';
import { Link } from '@/i18n/routing';
import { FlaskConical, ArrowLeft, CheckCircle2 } from 'lucide-react';
import { Header } from '@/components/layout/header';
import { Footer } from '@/components/layout/footer';
import { Card } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';

export default function ForgotPasswordPage() {
  const t = useTranslations('auth');
  const [email, setEmail] = useState('');
  const [sent, setSent] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email.includes('@')) return;
    setLoading(true);
    setError('');
    try {
      const res = await fetch('/api/auth/request-reset', {
        credentials: 'include',
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email }),
      });
      const data = await res.json();
      if (data.success) setSent(true);
      else setError(data.error || '请求失败');
    } catch {
      setError('网络错误，请重试');
    }
    setLoading(false);
  };

  return (
    <div className="min-h-screen flex flex-col">
      <Header />
      <main className="flex-1 flex items-center justify-center bg-gray-50 py-12 px-4">
        <Card className="w-full max-w-md" padding="lg">
          <div className="text-center mb-8">
            <div className="inline-flex items-center justify-center w-12 h-12 bg-blue-100 rounded-xl mb-4">
              {sent ? <CheckCircle2 className="h-6 w-6 text-green-600" /> : <FlaskConical className="h-6 w-6 text-blue-600" />}
            </div>
            <h1 className="text-2xl font-bold text-gray-900">{t('forgotPassword')}</h1>
            <p className="text-sm text-gray-500 mt-1">
              {sent ? '重置邮件已发送，请查收' : '输入您的邮箱，我们将发送重置链接'}
            </p>
          </div>

          {sent ? (
            <div className="space-y-4">
              <div className="p-4 bg-green-50 border border-green-200 rounded-lg text-sm text-green-700 text-center">
                如果该邮箱已注册，重置邮件已发送至 <strong>{email}</strong>
              </div>
              <Link href="/auth/login" className="flex items-center justify-center gap-2 text-sm text-blue-600 hover:text-blue-700">
                <ArrowLeft className="h-4 w-4" />返回登录
              </Link>
            </div>
          ) : (
            <form onSubmit={handleSubmit} className="space-y-4">
              {error && <div className="p-3 bg-red-50 border border-red-200 rounded-lg text-sm text-red-600">{error}</div>}
              <Input id="email" type="email" label={t('email')} placeholder="your@email.com" value={email} onChange={(e) => setEmail(e.target.value)} required />
              <Button type="submit" fullWidth loading={loading} size="lg">发送重置邮件</Button>
              <Link href="/auth/login" className="flex items-center justify-center gap-2 text-sm text-gray-500 hover:text-gray-700">
                <ArrowLeft className="h-4 w-4" />返回登录
              </Link>
            </form>
          )}
        </Card>
      </main>
      <Footer />
    </div>
  );
}
