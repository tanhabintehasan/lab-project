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

export default function RegisterPage() {
  const t = useTranslations('auth');
  const router = useRouter();
  const [form, setForm] = useState({ name: '', email: '', password: '', confirmPassword: '', phone: '', companyName: '' });
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState('');
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [loading, setLoading] = useState(false);

  const updateField = (field: string, value: string) => {
    setForm(prev => ({ ...prev, [field]: value }));
    setErrors(prev => ({ ...prev, [field]: '' }));
  };

  const validate = () => {
    const errs: Record<string, string> = {};
    if (!form.name.trim()) errs.name = '请输入姓名';
    if (!form.email || !form.email.includes('@')) errs.email = '请输入有效邮箱';
    if (form.password.length < 8) errs.password = '密码至少8位';
    if (form.password !== form.confirmPassword) errs.confirmPassword = '两次密码不一致';
    setErrors(errs);
    return Object.keys(errs).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    if (!validate()) return;
    setLoading(true);
    try {
      const res = await fetch('/api/auth/register', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'same-origin',
        body: JSON.stringify({
          name: form.name,
          email: form.email,
          password: form.password,
          phone: form.phone || undefined,
          companyName: form.companyName || undefined,
        }),
      });
      const data = await res.json();
      if (!res.ok || !data.success) {
        setError(data.error || t('accountExists'));
        return;
      }
      useAuthStore.getState().setUser(data.data.user);
      router.push('/dashboard');
    } catch {
      setError('注册失败，请稍后重试');
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
            <h1 className="text-2xl font-bold text-gray-900">{t('register')}</h1>
          </div>
          <form onSubmit={handleSubmit} className="space-y-4">
            {error && <div className="p-3 bg-red-50 border border-red-200 rounded-lg text-sm text-red-600">{error}</div>}
            <Input id="name" label={t('name')} value={form.name} onChange={e => updateField('name', e.target.value)} error={errors.name} required />
            <Input id="email" type="email" label={t('email')} placeholder="your@email.com" value={form.email} onChange={e => updateField('email', e.target.value)} error={errors.email} required />
            <div className="relative">
              <Input id="password" type={showPassword ? 'text' : 'password'} label={t('password')} placeholder="至少8位" value={form.password} onChange={e => updateField('password', e.target.value)} error={errors.password} required />
              <button type="button" onClick={() => setShowPassword(!showPassword)} className="absolute right-3 top-[38px] text-gray-400 hover:text-gray-600">
                {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
              </button>
            </div>
            <Input id="confirmPassword" type="password" label={t('confirmPassword')} value={form.confirmPassword} onChange={e => updateField('confirmPassword', e.target.value)} error={errors.confirmPassword} required />
            <Input id="phone" type="tel" label={t('phone')} value={form.phone} onChange={e => updateField('phone', e.target.value)} />
            <Input id="companyName" label={t('companyName')} value={form.companyName} onChange={e => updateField('companyName', e.target.value)} hint="选填，填写后自动创建企业账户" />
            <Button type="submit" fullWidth loading={loading} size="lg">{t('register')}</Button>
          </form>
          <div className="mt-6 text-center text-sm text-gray-500">
            已有账号？{' '}
            <Link href="/auth/login" className="text-blue-600 hover:text-blue-700 font-medium">
              {t('login')}
            </Link>
          </div>
        </Card>
      </main>
      <Footer />
    </div>
  );
}