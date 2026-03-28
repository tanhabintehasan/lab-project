'use client';

import { useState } from 'react';
import { useTranslations } from 'next-intl';
import { Link, useRouter } from '@/i18n/routing';
import { FlaskConical, Eye, EyeOff } from 'lucide-react';
import { Header } from '@/components/layout/header';
import { Footer } from '@/components/layout/footer';
import { Card } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { useAuthStore } from '@/store/auth-store';

export default function LoginPage() {
  const t = useTranslations('auth');
  const tCommon = useTranslations('common');
  const router = useRouter();

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const normalizeCallbackUrl = (callbackUrl: string | null) => {
    if (!callbackUrl) return null;

    // Allow only internal paths
    if (!callbackUrl.startsWith('/')) return null;

    // Remove locale prefix like /en/... or /zh-CN/... to avoid duplication
    const cleaned = callbackUrl.replace(/^\/(en|zh-CN)(?=\/|$)/, '') || '/';

    return cleaned;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    if (!email || !email.includes('@')) {
      setError(t('invalidCredentials'));
      return;
    }

    if (!password) {
      setError(t('invalidCredentials'));
      return;
    }

    setLoading(true);

    try {
      const res = await fetch('/api/auth/login', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        credentials: 'include',
        body: JSON.stringify({ email, password }),
      });

      const data = await res.json();

      if (!res.ok || !data?.success) {
        setError(data?.error || t('invalidCredentials'));
        return;
      }

      // Store user info only; token stays in HttpOnly cookie
      useAuthStore.getState().setUser(data.data.user);

      const role = data?.data?.user?.role;
      const params = new URLSearchParams(window.location.search);
      const callbackUrl = normalizeCallbackUrl(params.get('callbackUrl'));

      // Ignore bad/nonexistent admin callback routes
      const invalidAdminCallbacks = ['/adminlogin', '/en/adminlogin'];

      if (callbackUrl && !invalidAdminCallbacks.includes(callbackUrl)) {
        router.push(callbackUrl);
        return;
      }

      // Role-based fallback redirects
      if (role === 'SUPER_ADMIN') {
        router.push('/admin/dashboard');
      } else if (role === 'FINANCE_ADMIN') {
        router.push('/admin/finance');
      } else if (role === 'LAB_PARTNER') {
        router.push('/lab-portal/dashboard');
      } else if (role === 'ENTERPRISE_MEMBER') {
        router.push('/enterprise/workspace');
      } else {
        router.push('/dashboard');
      }
    } catch {
      setError(t('invalidCredentials'));
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex flex-col">
      <Header />

      <main className="flex-1 flex items-center justify-center bg-gray-50 py-12 px-4">
        <Card className="w-full max-w-md" padding="lg">
          <div className="text-center mb-8">
            <div className="inline-flex items-center justify-center w-12 h-12 bg-blue-100 rounded-xl mb-4">
              <FlaskConical className="h-6 w-6 text-blue-600" />
            </div>

            <h1 className="text-2xl font-bold text-gray-900">{t('login')}</h1>

            <p className="text-sm text-gray-500 mt-1">
              {tCommon('siteName')} - {tCommon('siteDesc')}
            </p>
          </div>

          <form onSubmit={handleSubmit} className="space-y-4">
            {error && (
              <div className="p-3 bg-red-50 border border-red-200 rounded-lg text-sm text-red-600">
                {error}
              </div>
            )}

            <Input
              id="email"
              type="email"
              label={t('email')}
              placeholder="your@email.com"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
            />

            <div className="relative">
              <Input
                id="password"
                type={showPassword ? 'text' : 'password'}
                label={t('password')}
                placeholder="••••••••"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
              />

              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="absolute right-3 top-[38px] text-gray-400 hover:text-gray-600"
              >
                {showPassword ? (
                  <EyeOff className="h-4 w-4" />
                ) : (
                  <Eye className="h-4 w-4" />
                )}
              </button>
            </div>

            <div className="flex items-center justify-end text-sm">
              <Link
                href="/auth/forgot-password"
                className="text-blue-600 hover:text-blue-700"
              >
                {t('forgotPassword')}
              </Link>
            </div>

            <Button type="submit" fullWidth loading={loading} size="lg">
              {t('login')}
            </Button>
          </form>

          <div className="mt-6 text-center text-sm text-gray-500">
            还没有账号？{' '}
            <Link
              href="/auth/register"
              className="text-blue-600 hover:text-blue-700 font-medium"
            >
              {t('register')}
            </Link>
          </div>
        </Card>
      </main>

      <Footer />
    </div>
  );
}