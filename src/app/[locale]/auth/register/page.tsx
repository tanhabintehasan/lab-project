'use client';

import { useState } from 'react';
import { useTranslations } from 'next-intl';
import { Link, useRouter } from '@/i18n/routing';
import { Header } from '@/components/layout/header';
import { Footer } from '@/components/layout/footer';
import { Card } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { useAuthStore } from '@/store/auth-store';
import { SUPPORTED_COUNTRIES, normalizePhone } from '@/lib/phone-utils';

type Step = 'phone' | 'verify' | 'profile';

export default function RegisterPage() {
  const t = useTranslations('auth');
  const router = useRouter();
  const { setUser } = useAuthStore();
  const [step, setStep] = useState<Step>('phone');
  const [countryCode, setCountryCode] = useState('+86');
  const [phone, setPhone] = useState('');
  const [code, setCode] = useState('');
  const [name, setName] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [companyName, setCompanyName] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState('');
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [loading, setLoading] = useState(false);
  const [countdown, setCountdown] = useState(0);

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
    const normalized = normalizePhone(phone, countryCode);
    if (!normalized) {
      setError(t('invalidPhone'));
      return;
    }
    setLoading(true);
    try {
      const res = await fetch('/api/auth/send-otp', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ phone: normalized, type: 'verify' }),
      });
      const data = await res.json();
      if (!res.ok || !data.success) {
        setError(data.error || t('sendCodeFailed'));
        return;
      }
      setStep('verify');
      startCountdown();
    } catch {
      setError(t('sendCodeRetry'));
    } finally {
      setLoading(false);
    }
  };

  const verifyCode = async () => {
    setError('');
    if (code.length !== 6) {
      setError(t('invalidCode'));
      return;
    }
    setStep('profile');
  };

  const validateProfile = () => {
    const errs: Record<string, string> = {};
    if (!name.trim()) errs.name = t('nameRequired');
    if (password && password.length < 8) errs.password = t('passwordMinLength');
    if (password && password !== confirmPassword) errs.confirmPassword = t('passwordMismatch');
    setErrors(errs);
    return Object.keys(errs).length === 0;
  };

  const handleSubmit = async () => {
    setError('');
    if (!validateProfile()) return;
    setLoading(true);
    try {
      const res = await fetch('/api/auth/register-phone', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({
          phone: normalizePhone(phone, countryCode),
          code,
          name: name.trim(),
          password: password || undefined,
          companyName: companyName.trim() || undefined,
        }),
      });
      const data = await res.json();
      if (!res.ok || !data.success) {
        setError(data.error || t('registerFailed'));
        return;
      }
      setUser(data.user);
      router.push('/dashboard');
    } catch {
      setError(t('registerRetry'));
    } finally {
      setLoading(false);
    }
  };

  const renderPhoneStep = () => (
    <div className="space-y-4">
      <div>
        <label className="mb-1.5 block text-sm font-medium text-gray-700">{t('phoneNumber')}</label>
        <div className="flex gap-2">
          <select
            value={countryCode}
            onChange={(e) => setCountryCode(e.target.value)}
            className="px-3 py-2 border border-gray-300 rounded-lg text-sm bg-white focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
            aria-label="Country code"
          >
            {SUPPORTED_COUNTRIES.map((c) => (
              <option key={c.code} value={c.code}>
                {c.flag} {c.code}
              </option>
            ))}
          </select>
          <Input
            id="phone"
            type="tel"
            value={phone}
            onChange={(e) => setPhone(e.target.value)}
            placeholder={t('enterPhone')}
            className="flex-1"
          />
        </div>
      </div>
      <Button type="button" fullWidth loading={loading} size="lg" onClick={sendOTP}>
        → {t('getCode')}
      </Button>
      <div className="text-center text-sm text-gray-500">
        {t('hasAccount')}{' '}
        <Link href="/auth/login" className="text-blue-600 hover:text-blue-700 font-medium">
          {t('login')}
        </Link>
      </div>
    </div>
  );

  const renderVerifyStep = () => (
    <div className="space-y-4">
      <div className="text-center">
        <p className="text-sm text-gray-600">{t('codeSentTo')} <strong>{phone}</strong></p>
      </div>
      <div>
        <label className="mb-1.5 block text-sm font-medium text-gray-700">{t('verificationCode')}</label>
        <Input
          id="code"
          type="text"
          value={code}
          onChange={(e) => setCode(e.target.value.replace(/\D/g, '').slice(0, 6))}
          placeholder={t('enterVerificationCodePlaceholder')}
          maxLength={6}
        />
      </div>
      <div className="flex gap-2">
        <Button type="button" variant="outline" onClick={() => setStep('phone')}>
          ← {t('prevStep')}
        </Button>
        <Button type="button" className="flex-1" loading={loading} size="lg" onClick={verifyCode}>
          {t('nextStep')}
        </Button>
      </div>
      <div className="text-center">
        {countdown > 0 ? (
          <span className="text-sm text-gray-400">{t('resendInSeconds', { count: countdown })}</span>
        ) : (
          <button type="button" onClick={sendOTP} className="text-sm text-blue-600 hover:text-blue-700">
            {t('resendCode')}
          </button>
        )}
      </div>
    </div>
  );

  const renderProfileStep = () => (
    <div className="space-y-4">
      <Input id="name" label={t('name')} value={name} onChange={(e) => setName(e.target.value)} error={errors.name} required />
      <div className="relative">
        <Input
          id="password"
          type={showPassword ? 'text' : 'password'}
          label={t('optionalPassword')}
          placeholder={t('optionalPasswordHint')}
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          error={errors.password}
        />
        <button type="button" onClick={() => setShowPassword(!showPassword)} className="absolute right-3 top-[38px] text-xs text-gray-400 hover:text-gray-600">
          {showPassword ? '隐藏' : '显示'}
        </button>
      </div>
      {password && (
        <Input id="confirmPassword" type="password" label={t('confirmPassword')} value={confirmPassword} onChange={(e) => setConfirmPassword(e.target.value)} error={errors.confirmPassword} />
      )}
      <Input id="companyName" label={t('enterpriseName')} value={companyName} onChange={(e) => setCompanyName(e.target.value)} hint={t('companyHint')} />
      <div className="flex gap-2">
        <Button type="button" variant="outline" onClick={() => setStep('verify')}>
          ← {t('prevStep')}
        </Button>
        <Button type="button" className="flex-1" loading={loading} size="lg" onClick={handleSubmit}>
          ✓ {t('completeRegister')}
        </Button>
      </div>
    </div>
  );

  const stepTitles: Record<Step, string> = {
    phone: t('registerPhone'),
    verify: t('enterVerificationCode'),
    profile: t('completeProfile'),
  };

  return (
    <div className="min-h-screen flex flex-col">
      <Header />
      <main className="flex-1 flex items-center justify-center bg-gray-50 py-12 px-4">
        <Card className="w-full max-w-md" padding="lg">
          <div className="text-center mb-8">
            <div className="inline-flex items-center justify-center w-12 h-12 bg-blue-100 rounded-xl mb-4 text-blue-600 text-xl font-bold">
              注
            </div>
            <h1 className="text-2xl font-bold text-gray-900">{stepTitles[step]}</h1>
            <div className="mt-3 flex justify-center gap-2">
              {(['phone', 'verify', 'profile'] as Step[]).map((s, idx) => (
                <div
                  key={s}
                  className={`h-2 w-8 rounded-full ${
                    step === s ? 'bg-blue-500' : idx < ['phone', 'verify', 'profile'].indexOf(step) ? 'bg-blue-200' : 'bg-gray-200'
                  }`}
                />
              ))}
            </div>
          </div>

          {error && <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-lg text-sm text-red-600">{error}</div>}

          {step === 'phone' && renderPhoneStep()}
          {step === 'verify' && renderVerifyStep()}
          {step === 'profile' && renderProfileStep()}
        </Card>
      </main>
      <Footer />
    </div>
  );
}
