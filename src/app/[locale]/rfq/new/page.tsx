'use client';

import { useState } from 'react';
import { useTranslations } from 'next-intl';
import { useRouter } from '@/i18n/routing';
import { Card } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Button } from '@/components/ui/button';
import { ArrowLeft } from 'lucide-react';

export default function RFQNewPage() {
  const t = useTranslations('rfq');
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [form, setForm] = useState({
    title: '',
    materialDesc: '',
    productType: '',
    testingTarget: '',
    standardReq: '',
    quantity: '',
    deadline: '',
    budget: '',
    notes: '',
  });

  const update = (k: string, v: string) => setForm((p) => ({ ...p, [k]: v }));

  const handleBack = () => {
    if (typeof window !== 'undefined' && window.history.length > 1) {
      router.back();
    } else {
      router.push('/rfq');
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.title) return;

    setLoading(true);

    try {
      const res = await fetch('/api/rfq', {
        credentials: 'include',
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          title: form.title,
          material: form.materialDesc,
          category: form.productType,
          industry: form.testingTarget,
          quantity: form.quantity,
          requirements: form.notes,
          deadline: form.deadline ? new Date(form.deadline).toISOString() : undefined,
        }),
      });

      const data = await res.json();

      if (res.status === 401) {
        router.push('/auth/login?redirect=/rfq/new');
        return;
      }

      if (data.success) router.push('/rfq');
    } catch {
      // ignore
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="mx-auto max-w-3xl px-4 py-10">
      <div className="mb-4">
        <button
          type="button"
          onClick={handleBack}
          className="flex items-center gap-2 text-sm text-gray-600 transition-colors hover:text-blue-600"
        >
          <ArrowLeft className="h-4 w-4" />
          返回
        </button>
      </div>

      <h1 className="mb-6 text-2xl font-bold text-gray-900">{t('createNew')}</h1>

      <Card padding="lg">
        <form onSubmit={handleSubmit} className="space-y-4">
          <Input
            label={t('form.title')}
            required
            value={form.title}
            onChange={(e) => update('title', e.target.value)}
          />

          <Textarea
            label={t('form.material')}
            value={form.materialDesc}
            onChange={(e) => update('materialDesc', e.target.value)}
          />

          <div className="grid gap-4 sm:grid-cols-2">
            <Input
              label={t('form.productType')}
              value={form.productType}
              onChange={(e) => update('productType', e.target.value)}
            />
            <Input
              label={t('form.standard')}
              value={form.standardReq}
              onChange={(e) => update('standardReq', e.target.value)}
            />
          </div>

          <Textarea
            label={t('form.testingTarget')}
            value={form.testingTarget}
            onChange={(e) => update('testingTarget', e.target.value)}
          />

          <div className="grid gap-4 sm:grid-cols-3">
            <Input
              label={t('form.quantity')}
              value={form.quantity}
              onChange={(e) => update('quantity', e.target.value)}
            />
            <Input
              label={t('form.deadline')}
              type="date"
              value={form.deadline}
              onChange={(e) => update('deadline', e.target.value)}
            />
            <Input
              label={t('form.budget')}
              value={form.budget}
              onChange={(e) => update('budget', e.target.value)}
            />
          </div>

          <Textarea
            label={t('form.notes')}
            value={form.notes}
            onChange={(e) => update('notes', e.target.value)}
          />

          <div className="flex gap-3 pt-4">
            <Button type="button" variant="outline" size="lg" onClick={handleBack}>
              返回
            </Button>
            <Button type="submit" loading={loading} size="lg">
              {t('form.submit')}
            </Button>
          </div>
        </form>
      </Card>
    </div>
  );
}