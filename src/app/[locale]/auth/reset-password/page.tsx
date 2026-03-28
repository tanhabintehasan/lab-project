'use client';

import { useState, useEffect } from 'react';
import { useTranslations } from 'next-intl';
import { Link, useRouter } from '@/i18n/routing';
import { FlaskConical, CheckCircle2, AlertTriangle } from 'lucide-react';
import { Header } from '@/components/layout/header';
import { Footer } from '@/components/layout/footer';
import { Card } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';

export default function ResetPasswordPage() {
  const t = useTranslations('auth');
  const router = useRouter();
  const [token, setToken] = useState('');
  const [password, setPassword] = useState('');
  const [confirm, setConfirm] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState(false);

  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const t = params.get('token');
    if (t) setToken(t);
    else setError('重置链接无效');
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    if (!token) { setError('重置链接无效'); return; }
    if (password.length < 8) { setError('密码至少8位'); return; }
    if (password !== confirm) { setError('两次密码不一致'); return; }

    setLoading(true);
    try {
      const res = await fetch('/api/auth/reset-password', {
        credentials: 'include',
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ token, password }),
      });
      const data = await res.json();
      if (data.success) {
        setSuccess(true);
        setTimeout(() => router.push('/auth/login'), 3000);
      } else {
        setError(data.error || '重置失败');
      }
    } catch {
      setError('网络错误');
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
              {success ? <CheckCircle2 className="h-6 w-6 text-green-600" /> : <FlaskConical className="h-6 w-6 text-blue-600" />}
            </div>
            <h1 className="text-2xl font-bold text-gray-900">{t('resetPassword')}</h1>
          </div>

          {success ? (
            <div className="text-center space-y-4">
              <div className="p-4 bg-green-50 border border-green-200 rounded-lg text-sm text-green-700">
                密码已重置成功，正在跳转到登录页面...
              </div>
              <Link href="/auth/login" className="text-blue-600 hover:underline text-sm">立即登录</Link>
            </div>
          ) : (
            <form onSubmit={handleSubmit} className="space-y-4">
              {error && <div className="p-3 bg-red-50 border border-red-200 rounded-lg text-sm text-red-600">{error}</div>}
              <Input id="password" type="password" label="新密码" placeholder="至少8位" value={password} onChange={e => setPassword(e.target.value)} required />
              <Input id="confirm" type="password" label="确认新密码" value={confirm} onChange={e => setConfirm(e.target.value)} required />
              <Button type="submit" fullWidth loading={loading} size="lg" disabled={!token}>重置密码</Button>
              <Link href="/auth/login" className="flex items-center justify-center text-sm text-gray-500 hover:text-gray-700">返回登录</Link>
            </form>
          )}
        </Card>
      </main>
      <Footer />
    </div>
  );
}
