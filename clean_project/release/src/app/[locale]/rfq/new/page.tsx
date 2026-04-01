'use client';

import { useState } from 'react';
import { useTranslations } from 'next-intl';
import { useRouter } from '@/i18n/routing';
import { DashboardLayout } from '@/components/layout/dashboard-layout';
import { Card } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Button } from '@/components/ui/button';
import { useAuthStore } from '@/store/auth-store';

export default function RFQNewPage() {
  const t = useTranslations('rfq');
  const router = useRouter();
  // Auth via HttpOnly cookie
  const [loading, setLoading] = useState(false);
  const [form, setForm] = useState({
    title: '', materialDesc: '', productType: '', testingTarget: '',
    standardReq: '', quantity: '', deadline: '', budget: '', notes: '',
  });

  const update = (k: string, v: string) => setForm(p => ({ ...p, [k]: v }));

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.title) return;
    setLoading(true);
    try {
      const res = await fetch('/api/rfq', {
        credentials: 'include',
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ ...form, deadline: form.deadline ? new Date(form.deadline).toISOString() : undefined }),
      });
      const data = await res.json();
      if (data.success) router.push('/rfq');
    } catch { /* ignore */ }
    setLoading(false);
  };

  return (
    <DashboardLayout>
      <div className="max-w-2xl mx-auto">
        <h1 className="text-2xl font-bold text-gray-900 mb-6">{t('createNew')}</h1>
        <Card padding="lg">
          <form onSubmit={handleSubmit} className="space-y-4">
            <Input label={t('form.title')} required value={form.title} onChange={e => update('title', e.target.value)} />
            <Textarea label={t('form.material')} value={form.materialDesc} onChange={e => update('materialDesc', e.target.value)} />
            <div className="grid sm:grid-cols-2 gap-4">
              <Input label={t('form.productType')} value={form.productType} onChange={e => update('productType', e.target.value)} />
              <Input label={t('form.standard')} value={form.standardReq} onChange={e => update('standardReq', e.target.value)} />
            </div>
            <Textarea label={t('form.testingTarget')} value={form.testingTarget} onChange={e => update('testingTarget', e.target.value)} />
            <div className="grid sm:grid-cols-3 gap-4">
              <Input label={t('form.quantity')} value={form.quantity} onChange={e => update('quantity', e.target.value)} />
              <Input label={t('form.deadline')} type="date" value={form.deadline} onChange={e => update('deadline', e.target.value)} />
              <Input label={t('form.budget')} value={form.budget} onChange={e => update('budget', e.target.value)} />
            </div>
            <Textarea label={t('form.notes')} value={form.notes} onChange={e => update('notes', e.target.value)} />
            <div className="p-4 border-2 border-dashed border-gray-300 rounded-lg text-center text-sm text-gray-500">
              {t('form.attachments')} — 文件上传功能即将上线
            </div>
            <div className="flex gap-3 pt-4">
              <Button type="submit" loading={loading} size="lg">{t('form.submit')}</Button>
              <Button type="button" variant="outline" size="lg" onClick={() => router.push('/rfq')}>取消</Button>
            </div>
          </form>
        </Card>
      </div>
    </DashboardLayout>
  );
}
