'use client';

import { useState } from 'react';
import { useTranslations } from 'next-intl';
import { Link, useRouter } from '@/i18n/routing';
import { FlaskConical, Eye, EyeOff, Lock, MessageSquare } from 'lucide-react';
import { Header } from '@/components/layout/header';
import { Footer } from '@/components/layout/footer';
import { Card } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { useAuthStore } from '@/store/auth-store';

type LoginMethod = 'code' | 'password';

export default function LoginPage() {
  const t = useTranslations('auth');
  const tCommon = useTranslations('common');
  const router = useRouter();

  const [method, setMethod] = useState<LoginMethod>('code');

  // Shared phone state
  const [phone, setPhone] = useState('');

  // Password login state
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);

  // Phone code login state
  const [code, setCode] = useState('');
  const [countdown, setCountdown] = useState(0);

  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const normalizeCallbackUrl = (callbackUrl: string | null) => {
    if (!callbackUrl) return null;
    if (!callbackUrl.startsWith('/')) return null;
    const cleaned = callbackUrl.replace(/^\/(en|zh-CN)(?=\/|$)/, '') || '/';
    return cleaned;
  };

  const normalizePhone = (p: string) => {
    const trimmed = p.trim().replace(/\s/g, '');
    if (trimmed.startsWith('+')) return trimmed;
    if (/^1[3-9]\d{9}$/.test(trimmed)) return trimmed;
    return '';
  };

  const startCountdown = () => {
    setCountdown(60);
    const timer = setInterval(() => {
      setCountdown((c) => {
        if (c <= 1) { clearInterval(timer); return 0; }
        return c - 1;
      });
    }, 1000);
  };

  const sendOTP = async () => {
    setError('');
    const normalized = normalizePhone(phone);
    if (!normalized) {
      setError(t('invalidPhone'));
      return;
    }
    setLoading(true);
    try {
      const res = await fetch('/api/auth/send-otp', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ phone: normalized, type: 'login' }),
      });
      const data = await res.json();
      if (!res.ok || !data.success) {
        setError(data.error || t('sendCodeFailed'));
        return;
      }
      startCountdown();
    } catch {
      setError(t('sendCodeRetry'));
    } finally {
      setLoading(false);
    }
  };

  const handlePasswordLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    const normalized = normalizePhone(phone);
    if (!normalized) {
      setError(t('invalidPhone'));
      return;
    }

    if (!password) {
      setError(t('invalidCredentials'));
      return;
    }

    setLoading(true);

    try {
      const res = await fetch('/api/auth/login-phone-password', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({ phone: normalized, password }),
      });

      const data = await res.json();

      if (!res.ok || !data?.success) {
        setError(data?.error || t('invalidCredentials'));
        return;
      }

      useAuthStore.getState().setUser(data.user);
      doRedirect(data.user?.role);
    } catch {
      setError(t('loginRetry'));
    } finally {
      setLoading(false);
    }
  };

  const handlePhoneCodeLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    const normalized = normalizePhone(phone);
    if (!normalized) {
      setError(t('invalidPhone'));
      return;
    }
    if (code.length !== 6) {
      setError(t('invalidCode'));
      return;
    }

    setLoading(true);

    try {
      const res = await fetch('/api/auth/login-phone', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({ phone: normalized, code }),
      });

      const data = await res.json();

      if (!res.ok || !data?.success) {
        setError(data?.error || t('loginFailed'));
        return;
      }

      useAuthStore.getState().setUser(data.user);
      doRedirect(data.user?.role);
    } catch {
      setError(t('loginRetry'));
    } finally {
      setLoading(false);
    }
  };

  const doRedirect = (role?: string) => {
    const params = new URLSearchParams(window.location.search);
    const callbackUrl = normalizeCallbackUrl(params.get('callbackUrl'));
    const invalidAdminCallbacks = ['/adminlogin', '/en/adminlogin'];

    if (callbackUrl && !invalidAdminCallbacks.includes(callbackUrl)) {
      router.push(callbackUrl);
      return;
    }

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
  };

  return (
    <div className="min-h-screen flex flex-col">
      <Header />

      <main className="flex-1 flex items-center justify-center bg-gray-50 py-12 px-4">
        <Card className="w-full max-w-md" padding="lg">
          <div className="text-center mb-8">
            <div className="inline-flex items-center justify-center w-12 h-12 bg-primary/10 rounded-xl mb-4">
              <FlaskConical className="h-6 w-6 text-primary" />
            </div>

            <h1 className="text-2xl font-bold text-gray-900">{t('login')}</h1>

            <p className="text-sm text-gray-500 mt-1">
              {tCommon('siteName')} - {tCommon('siteDesc')}
            </p>
          </div>

          {/* Method tabs */}
          <div className="flex rounded-lg bg-gray-100 p-1 mb-6">
            <button
              type="button"
              onClick={() => { setMethod('code'); setError(''); }}
              className={`flex-1 flex items-center justify-center gap-2 rounded-md py-2 text-sm font-medium transition-colors ${
                method === 'code' ? 'bg-white text-gray-900 shadow-sm' : 'text-gray-500 hover:text-gray-700'
              }`}
            >
              <MessageSquare className="h-4 w-4" />
              {t('phoneLogin')}
            </button>
            <button
              type="button"
              onClick={() => { setMethod('password'); setError(''); }}
              className={`flex-1 flex items-center justify-center gap-2 rounded-md py-2 text-sm font-medium transition-colors ${
                method === 'password' ? 'bg-white text-gray-900 shadow-sm' : 'text-gray-500 hover:text-gray-700'
              }`}
            >
              <Lock className="h-4 w-4" />
              {t('passwordLogin')}
            </button>
          </div>

          {error && (
            <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-lg text-sm text-red-600">
              {error}
            </div>
          )}

          {/* Shared phone input */}
          <div className="mb-4">
            <Input
              id="phone"
              type="tel"
              label={t('phoneNumber')}
              placeholder={t('enterPhone')}
              value={phone}
              onChange={(e) => setPhone(e.target.value)}
              required
            />
          </div>

          {method === 'password' ? (
            <form onSubmit={handlePasswordLogin} className="space-y-4">
              <div className="relative">
                <Input
                  id="password"
                  type={showPassword ? 'text' : 'password'}
                  label={t('password')}
                  placeholder="••••••••"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  autoComplete="current-password"
                  required
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 top-[38px] text-gray-400 hover:text-gray-600"
                >
                  {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                </button>
              </div>

              <div className="flex items-center justify-end text-sm">
                <Link href="/auth/forgot-password" className="text-primary hover:opacity-80">
                  {t('forgotPassword')}
                </Link>
              </div>

              <Button type="submit" fullWidth loading={loading} size="lg">
                {t('login')}
              </Button>
            </form>
          ) : (
            <form onSubmit={handlePhoneCodeLogin} className="space-y-4">
              <div className="flex gap-2">
                <div className="flex-1">
                  <Input
                    id="code"
                    type="text"
                    label={t('verificationCode')}
                    placeholder={t('enterCode')}
                    value={code}
                    onChange={(e) => setCode(e.target.value.replace(/\D/g, '').slice(0, 6))}
                    maxLength={6}
                    required
                  />
                </div>
                <div className="pt-6">
                  <Button
                    type="button"
                    variant="outline"
                    onClick={sendOTP}
                    loading={loading && countdown === 0}
                    disabled={countdown > 0}
                  >
                    {countdown > 0 ? t('seconds', { count: countdown }) : t('getCode')}
                  </Button>
                </div>
              </div>

              <Button type="submit" fullWidth loading={loading} size="lg">
                {t('login')}
              </Button>
            </form>
          )}

          <div className="mt-6 text-center text-sm text-gray-500">
            {t('noAccount')}{' '}
            <Link href="/auth/register" className="text-primary hover:opacity-80 font-medium">
              {t('register')}
            </Link>
          </div>
        </Card>
      </main>

      <Footer />
    </div>
  );
}
