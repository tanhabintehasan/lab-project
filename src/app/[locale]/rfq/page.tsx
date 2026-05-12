'use client';

import { useState } from 'react';
import { useTranslations } from 'next-intl';
import { useRouter } from '@/i18n/routing';
import { Header } from '@/components/layout/header';
import { Footer } from '@/components/layout/footer';
import { Card } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Button } from '@/components/ui/button';
import { ArrowLeft, CheckCircle2, FileText, Beaker, User, Mail, Phone, Building2, Hash, Ruler, Scale, Thermometer, FlaskConical, Send } from 'lucide-react';

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
      <div className="min-h-screen flex flex-col bg-slate-50">
        <Header />
        <main className="flex-1 flex items-center justify-center px-4 py-12">
          <Card className="w-full max-w-xl" padding="lg">
            <div className="text-center">
              <div className="mx-auto mb-6 inline-flex h-20 w-20 items-center justify-center rounded-full bg-emerald-100">
                <CheckCircle2 className="h-10 w-10 text-emerald-600" />
              </div>
              <h1 className="mb-2 text-2xl font-bold text-gray-900">感谢您的提交</h1>
              <p className="mb-2 text-gray-600">您的定制测试需求已成功提交，管理员后台已收到。</p>
              <p className="mb-6 text-gray-600">我们会尽快通过您填写的联系方式与您联系。</p>
              {requestNo ? <p className="mb-8 text-sm text-gray-500">需求编号：{requestNo}</p> : null}
              <div className="flex justify-center gap-3">
                <Button onClick={() => router.push('/')}>返回首页</Button>
                <Button variant="outline" onClick={resetForm}>再提交一条</Button>
              </div>
            </div>
          </Card>
        </main>
        <Footer />
      </div>
    );
  }

  return (
    <div className="min-h-screen flex flex-col bg-slate-50">
      <Header />

      {/* Hero */}
      <div className="relative overflow-hidden bg-gradient-to-br from-slate-900 via-blue-900 to-indigo-800 text-white">
        <div className="mx-auto max-w-6xl px-4 py-10">
          <button
            type="button"
            onClick={handleBack}
            className="mb-4 inline-flex items-center gap-2 text-sm text-blue-100 hover:text-white"
          >
            <ArrowLeft className="h-4 w-4" />
            返回
          </button>
          <h1 className="text-3xl font-bold lg:text-4xl">定制测试需求</h1>
          <p className="mt-2 max-w-2xl text-blue-100">
            填写您的特殊检测需求，提交后将进入后台管理，由管理员审核并安排报价。
          </p>

          <div className="mt-6 flex flex-wrap items-center gap-4 text-sm">
            <div className="flex items-center gap-2 rounded-full bg-white/10 px-4 py-2">
              <span className="flex h-5 w-5 items-center justify-center rounded-full bg-white/20 text-xs font-semibold">1</span>
              <span>填写需求</span>
            </div>
            <div className="hidden h-px w-8 bg-white/20 sm:block" />
            <div className="flex items-center gap-2 rounded-full bg-white/10 px-4 py-2">
              <span className="flex h-5 w-5 items-center justify-center rounded-full bg-white/20 text-xs font-semibold">2</span>
              <span>平台审核</span>
            </div>
            <div className="hidden h-px w-8 bg-white/20 sm:block" />
            <div className="flex items-center gap-2 rounded-full bg-white/10 px-4 py-2">
              <span className="flex h-5 w-5 items-center justify-center rounded-full bg-white/20 text-xs font-semibold">3</span>
              <span>获取报价</span>
            </div>
          </div>
        </div>
      </div>

      <main className="flex-1 px-4 py-8">
        <div className="mx-auto max-w-6xl">
          {error ? (
            <div className="mb-6 rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-600">
              {error}
            </div>
          ) : null}

          <form onSubmit={handleSubmit} className="grid gap-6 lg:grid-cols-[1.2fr_0.8fr]">
            {/* Left column */}
            <div className="space-y-6">
              <Card padding="lg" className="rounded-3xl">
                <div className="mb-5 flex items-center gap-3 border-b border-gray-100 pb-4">
                  <div className="rounded-xl bg-primary/10 p-2">
                    <User className="h-5 w-5 text-primary" />
                  </div>
                  <div>
                    <h2 className="text-lg font-semibold text-gray-900">联系人信息</h2>
                    <p className="text-xs text-gray-500">以便我们及时与您沟通报价方案</p>
                  </div>
                </div>
                <div className="grid gap-4 sm:grid-cols-2">
                  <div className="relative">
                    <User className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400" />
                    <Input
                      label="联系人"
                      required
                      value={form.contactName}
                      onChange={(e) => update('contactName', e.target.value)}
                      className="pl-10"
                    />
                  </div>
                  <div className="relative">
                    <Phone className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400" />
                    <Input
                      label="联系电话"
                      value={form.contactPhone}
                      onChange={(e) => update('contactPhone', e.target.value)}
                      className="pl-10"
                    />
                  </div>
                  <div className="relative">
                    <Mail className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400" />
                    <Input
                      label="联系邮箱"
                      type="email"
                      value={form.contactEmail}
                      onChange={(e) => update('contactEmail', e.target.value)}
                      className="pl-10"
                    />
                  </div>
                  <div className="relative">
                    <Building2 className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400" />
                    <Input
                      label="公司名称"
                      value={form.companyName}
                      onChange={(e) => update('companyName', e.target.value)}
                      className="pl-10"
                    />
                  </div>
                  <div className="relative sm:col-span-2">
                    <Hash className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400" />
                    <Input
                      label="微信号"
                      value={form.wechat}
                      onChange={(e) => update('wechat', e.target.value)}
                      className="pl-10"
                    />
                  </div>
                </div>
              </Card>

              <Card padding="lg" className="rounded-3xl">
                <div className="mb-5 flex items-center gap-3 border-b border-gray-100 pb-4">
                  <div className="rounded-xl bg-primary/10 p-2">
                    <Beaker className="h-5 w-5 text-primary" />
                  </div>
                  <div>
                    <h2 className="text-lg font-semibold text-gray-900">样品信息</h2>
                    <p className="text-xs text-gray-500">请尽量准确描述，有助于快速报价</p>
                  </div>
                </div>
                <div className="grid gap-4 sm:grid-cols-2">
                  <div className="relative">
                    <FlaskConical className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400" />
                    <Input
                      label="样品名称"
                      value={form.sampleName}
                      onChange={(e) => update('sampleName', e.target.value)}
                      className="pl-10"
                      placeholder="例如：铝合金试样"
                    />
                  </div>
                  <div className="relative">
                    <Scale className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400" />
                    <Input
                      label="样品数量"
                      value={form.quantity}
                      onChange={(e) => update('quantity', e.target.value)}
                      className="pl-10"
                      placeholder="例如：5件"
                    />
                  </div>
                  <div className="relative">
                    <Ruler className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400" />
                    <Input
                      label="样品规格 / 特性"
                      value={form.sampleCondition}
                      onChange={(e) => update('sampleCondition', e.target.value)}
                      className="pl-10"
                      placeholder="如尺寸、材质、批次等"
                    />
                  </div>
                  <div className="relative">
                    <Thermometer className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400" />
                    <Input
                      label="样品状态"
                      value={form.sampleCondition}
                      onChange={(e) => update('sampleCondition', e.target.value)}
                      className="pl-10"
                      placeholder="例如：块状 / 粉末 / 液体"
                    />
                  </div>
                  <div className="sm:col-span-2">
                    <Input
                      label="测试目的"
                      value={form.testPurpose}
                      onChange={(e) => update('testPurpose', e.target.value)}
                      placeholder="例如：论文实验 / 产品验证 / 企业送检"
                    />
                  </div>
                </div>
              </Card>
            </div>

            {/* Right column */}
            <div className="space-y-6">
              <Card padding="lg" className="rounded-3xl">
                <div className="mb-5 flex items-center gap-3 border-b border-gray-100 pb-4">
                  <div className="rounded-xl bg-primary/10 p-2">
                    <FileText className="h-5 w-5 text-primary" />
                  </div>
                  <div>
                    <h2 className="text-lg font-semibold text-gray-900">需求信息</h2>
                    <p className="text-xs text-gray-500">标有 <span className="text-red-500">*</span> 的为必填项</p>
                  </div>
                </div>
                <div className="space-y-4">
                  <Input
                    label={t('form.title')}
                    required
                    value={form.title}
                    onChange={(e) => update('title', e.target.value)}
                    placeholder="例如：高温合金疲劳寿命定制测试"
                  />

                  <div className="grid gap-4 sm:grid-cols-2">
                    <Input
                      label={t('form.productType')}
                      value={form.productType}
                      onChange={(e) => update('productType', e.target.value)}
                      placeholder="例如：定制材料测试"
                    />
                    <Input
                      label={t('form.standard')}
                      value={form.standardReq}
                      onChange={(e) => update('standardReq', e.target.value)}
                      placeholder="例如：ASTM / ISO / GB"
                    />
                  </div>

                  <Textarea
                    label={t('form.material')}
                    value={form.materialDesc}
                    onChange={(e) => update('materialDesc', e.target.value)}
                    placeholder="请描述材料类型、牌号或主要成分"
                  />

                  <Textarea
                    label={t('form.testingTarget')}
                    value={form.testingTarget}
                    onChange={(e) => update('testingTarget', e.target.value)}
                    placeholder="请描述检测目标、关注指标或需要解决的问题"
                  />

                  <div className="grid gap-4 sm:grid-cols-2">
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
                      placeholder="例如：5000-10000"
                    />
                  </div>

                  <div className="grid gap-4 sm:grid-cols-2">
                    <div>
                      <label className="mb-2 block text-sm font-medium text-gray-700">期望输出</label>
                      <select
                        value={form.expectedOutput}
                        onChange={(e) => update('expectedOutput', e.target.value)}
                        className="w-full rounded-xl border border-gray-200 px-4 py-3 text-sm focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary"
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
                        className="w-full rounded-xl border border-gray-200 px-4 py-3 text-sm focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary"
                      >
                        <option value="NORMAL">普通</option>
                        <option value="URGENT">加急</option>
                        <option value="VERY_URGENT">特急</option>
                      </select>
                    </div>
                  </div>

                  <Textarea
                    label={t('form.notes')}
                    rows={5}
                    value={form.notes}
                    onChange={(e) => update('notes', e.target.value)}
                    placeholder="其他补充说明、特殊要求等"
                  />
                </div>
              </Card>

              <Card padding="lg" className="rounded-3xl bg-gradient-to-b from-white to-slate-50/50">
                <h3 className="mb-4 text-base font-semibold text-gray-900">提交前确认</h3>
                <ul className="mb-6 space-y-2 text-sm text-gray-600">
                  <li className="flex items-center gap-2">
                    <CheckCircle2 className={`h-4 w-4 ${form.title.trim() ? 'text-emerald-600' : 'text-gray-300'}`} />
                    已填写需求标题
                  </li>
                  <li className="flex items-center gap-2">
                    <CheckCircle2 className={`h-4 w-4 ${form.contactName.trim() ? 'text-emerald-600' : 'text-gray-300'}`} />
                    已填写联系人
                  </li>
                  <li className="flex items-center gap-2">
                    <CheckCircle2 className={`h-4 w-4 ${form.contactPhone.trim() || form.contactEmail.trim() ? 'text-emerald-600' : 'text-gray-300'}`} />
                    已填写联系方式
                  </li>
                </ul>
                <div className="space-y-3">
                  <Button type="submit" fullWidth size="lg" loading={loading}>
                    <Send className="mr-2 h-4 w-4" />
                    提交定制测试
                  </Button>
                  <Button type="button" variant="outline" fullWidth size="lg" onClick={handleBack}>
                    返回
                  </Button>
                </div>
              </Card>
            </div>
          </form>
        </div>
      </main>

      <Footer />
    </div>
  );
}
