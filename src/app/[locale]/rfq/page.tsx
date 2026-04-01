'use client';

import { useState } from 'react';
import { useTranslations } from 'next-intl';
import { useRouter } from '@/i18n/routing';
import { Card } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Button } from '@/components/ui/button';
import { ArrowLeft, CheckCircle2 } from 'lucide-react';

export default function RFQNewPage() {
  const t = useTranslations('rfq');
  const router = useRouter();

  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);
  const [error, setError] = useState('');
  const [requestNo, setRequestNo] = useState('');

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

    contactName: '',
    contactPhone: '',
    contactEmail: '',
    companyName: '',
    wechat: '',

    sampleName: '',
    sampleCondition: '',
    testPurpose: '',
    expectedOutput: 'REPORT',
    urgency: 'NORMAL',
  });

  const update = (k: string, v: string) => setForm((p) => ({ ...p, [k]: v }));

  const handleBack = () => {
    if (typeof window !== 'undefined' && window.history.length > 1) {
      router.back();
    } else {
      router.push('/');
    }
  };

  const resetForm = () => {
    setForm({
      title: '',
      materialDesc: '',
      productType: '',
      testingTarget: '',
      standardReq: '',
      quantity: '',
      deadline: '',
      budget: '',
      notes: '',

      contactName: '',
      contactPhone: '',
      contactEmail: '',
      companyName: '',
      wechat: '',

      sampleName: '',
      sampleCondition: '',
      testPurpose: '',
      expectedOutput: 'REPORT',
      urgency: 'NORMAL',
    });
    setRequestNo('');
    setError('');
    setSuccess(false);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!form.title.trim()) {
      setError('请输入需求标题');
      return;
    }

    if (!form.contactName.trim()) {
      setError('请输入联系人');
      return;
    }

    if (!form.contactPhone.trim() && !form.contactEmail.trim()) {
      setError('请至少填写联系电话或联系邮箱');
      return;
    }

    setLoading(true);
    setError('');

    try {
      const extraRequirements = [
        form.notes?.trim(),
        form.companyName?.trim() ? `公司名称：${form.companyName.trim()}` : '',
        form.wechat?.trim() ? `微信号：${form.wechat.trim()}` : '',
        form.budget?.trim() ? `预算范围：${form.budget.trim()}` : '',
      ]
        .filter(Boolean)
        .join('\n');

      const res = await fetch('/api/rfq', {
        credentials: 'include',
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          requestType: 'CUSTOM_TESTING',
          title: form.title,
          material: form.materialDesc,
          category: form.productType,
          industry: form.testingTarget,
          quantity: form.quantity,
          requirements: extraRequirements,
          deadline: form.deadline ? new Date(form.deadline).toISOString() : undefined,

          contactName: form.contactName,
          contactPhone: form.contactPhone,
          contactEmail: form.contactEmail,

          sampleName: form.sampleName,
          sampleCondition: form.sampleCondition,
          testPurpose: form.testPurpose,
          testingStandard: form.standardReq,
          expectedOutput: form.expectedOutput,
          urgency: form.urgency,
        }),
      });

      const data = await res.json();

      if (res.status === 401) {
        router.push('/auth/login?redirect=/rfq/new');
        return;
      }

      if (!res.ok || !data?.success) {
        throw new Error(data?.error || '提交失败');
      }

      setRequestNo(data?.data?.requestNo || '');
      setSuccess(true);
    } catch (err) {
      setError(err instanceof Error ? err.message : '提交失败');
    } finally {
      setLoading(false);
    }
  };

  if (success) {
    return (
      <div className="mx-auto max-w-2xl px-4 py-16 text-center">
        <div className="mb-4 inline-flex h-16 w-16 items-center justify-center rounded-full bg-green-100">
          <CheckCircle2 className="h-8 w-8 text-green-600" />
        </div>

        <h1 className="mb-2 text-2xl font-bold text-gray-900">感谢您的提交</h1>
        <p className="mb-2 text-gray-600">您的定制测试需求已成功提交，管理员后台已收到。</p>
        <p className="mb-6 text-gray-600">我们会尽快通过您填写的联系方式与您联系。</p>

        {requestNo ? (
          <p className="mb-8 text-sm text-gray-500">需求编号：{requestNo}</p>
        ) : null}

        <div className="flex justify-center gap-3">
          <Button onClick={() => router.push('/')}>返回首页</Button>
          <Button variant="outline" onClick={resetForm}>
            再提交一条
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-4xl px-4 py-10">
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

      <h1 className="mb-6 text-2xl font-bold text-gray-900">定制测试需求</h1>

      {error ? (
        <div className="mb-4 rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-600">
          {error}
        </div>
      ) : null}

      <form onSubmit={handleSubmit} className="space-y-6">
        <Card padding="lg">
          <h2 className="mb-4 text-lg font-semibold text-gray-900">联系人信息</h2>
          <div className="grid gap-4 sm:grid-cols-2">
            <Input
              label="联系人"
              required
              value={form.contactName}
              onChange={(e) => update('contactName', e.target.value)}
            />
            <Input
              label="联系电话"
              value={form.contactPhone}
              onChange={(e) => update('contactPhone', e.target.value)}
            />
            <Input
              label="联系邮箱"
              type="email"
              value={form.contactEmail}
              onChange={(e) => update('contactEmail', e.target.value)}
            />
            <Input
              label="公司名称"
              value={form.companyName}
              onChange={(e) => update('companyName', e.target.value)}
            />
            <Input
              label="微信号"
              value={form.wechat}
              onChange={(e) => update('wechat', e.target.value)}
            />
          </div>
        </Card>

        <Card padding="lg">
          <h2 className="mb-4 text-lg font-semibold text-gray-900">需求信息</h2>
          <div className="space-y-4">
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

            <div className="grid gap-4 sm:grid-cols-2">
              <Input
                label="样品名称"
                value={form.sampleName}
                onChange={(e) => update('sampleName', e.target.value)}
              />
              <Input
                label="样品状态"
                value={form.sampleCondition}
                onChange={(e) => update('sampleCondition', e.target.value)}
              />
            </div>

            <Input
              label="测试目的"
              value={form.testPurpose}
              onChange={(e) => update('testPurpose', e.target.value)}
            />

            <div className="grid gap-4 sm:grid-cols-2">
              <div>
                <label className="mb-2 block text-sm font-medium text-gray-700">期望输出</label>
                <select
                  value={form.expectedOutput}
                  onChange={(e) => update('expectedOutput', e.target.value)}
                  className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm"
                >
                  <option value="REPORT">仅报告</option>
                  <option value="REPORT_CERTIFICATE">报告 + 证书</option>
                </select>
              </div>

              <div>
                <label className="mb-2 block text-sm font-medium text-gray-700">紧急程度</label>
                <select
                  value={form.urgency}
                  onChange={(e) => update('urgency', e.target.value)}
                  className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm"
                >
                  <option value="NORMAL">普通</option>
                  <option value="URGENT">加急</option>
                  <option value="VERY_URGENT">特急</option>
                </select>
              </div>
            </div>

            <Textarea
              label={t('form.notes')}
              rows={6}
              value={form.notes}
              onChange={(e) => update('notes', e.target.value)}
            />
          </div>
        </Card>

        <div className="flex gap-3 pt-2">
          <Button type="button" variant="outline" size="lg" onClick={handleBack}>
            返回
          </Button>
          <Button type="submit" loading={loading} size="lg">
            提交定制测试
          </Button>
        </div>
      </form>
    </div>
  );
}