'use client';

import { useState } from 'react';
import { useRouter } from '@/i18n/routing';
import { Header } from '@/components/layout/header';
import { Footer } from '@/components/layout/footer';
import { Card } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Button } from '@/components/ui/button';
import { FileUpload } from '@/components/ui/file-upload';
import { CheckCircle2, ArrowLeft, FlaskConical, Beaker, FileText, User, Mail, Phone, Ruler, Scale, Send, Calendar, Tag } from 'lucide-react';

type UploadedFile = {
  url: string;
  name: string;
};

export default function CustomTestingPage() {
  const router = useRouter();

  const [form, setForm] = useState({
    requestType: 'CUSTOM_TESTING',
    title: '',
    category: '',
    material: '',
    industry: '',
    quantity: '',
    sampleName: '',
    sampleCondition: '',
    testPurpose: '',
    testingStandard: '',
    expectedOutput: 'REPORT',
    urgency: 'NORMAL',
    requirements: '',
    deadline: '',
    contactName: '',
    contactPhone: '',
    contactEmail: '',
  });

  const [files, setFiles] = useState<UploadedFile[]>([]);
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);
  const [error, setError] = useState('');

  const handleBack = () => {
    if (typeof window !== 'undefined' && window.history.length > 1) {
      router.back();
    } else {
      router.push('/');
    }
  };

  const handleUploadComplete = (uploadedFiles: UploadedFile[]) => {
    setFiles((prev) => [...prev, ...uploadedFiles]);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError('');

    try {
      const res = await fetch('/api/rfq', {
        method: 'POST',
        credentials: 'include',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          ...form,
          attachments: files.map((f) => ({
            url: f.url,
            fileName: f.name,
          })),
        }),
      });

      const data = await res.json();

      if (res.status === 401) {
        router.push('/auth/login?redirect=/custom-testing');
        return;
      }

      if (!res.ok || !data?.success) {
        throw new Error(data?.error || '提交定制测试失败');
      }

      setSuccess(true);
      setTimeout(() => {
        router.push('/rfq?requestType=CUSTOM_TESTING');
      }, 1800);
    } catch (err) {
      setError(err instanceof Error ? err.message : '提交定制测试失败');
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
              <h1 className="mb-2 text-2xl font-bold text-gray-900">定制测试需求已提交</h1>
              <p className="mb-6 text-gray-600">
                后台已收到您的定制测试申请，我们将尽快审核并为您安排报价或测试方案。
              </p>
              <Button onClick={() => router.push('/rfq?requestType=CUSTOM_TESTING')}>
                查看我的申请
              </Button>
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
                    <FileText className="h-5 w-5 text-primary" />
                  </div>
                  <div>
                    <h2 className="text-lg font-semibold text-gray-900">基本信息</h2>
                    <p className="text-xs text-gray-500">项目与样品的基础信息</p>
                  </div>
                </div>
                <div className="grid gap-4 sm:grid-cols-2">
                  <div className="relative sm:col-span-2">
                    <FlaskConical className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400" />
                    <Input
                      label="项目名称"
                      required
                      value={form.title}
                      onChange={(e) => setForm((p) => ({ ...p, title: e.target.value }))}
                      placeholder="例如：高温合金疲劳寿命定制测试"
                      className="pl-10"
                    />
                  </div>
                  <div className="relative">
                    <Tag className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400" />
                    <Input
                      label="服务分类"
                      required
                      value={form.category}
                      onChange={(e) => setForm((p) => ({ ...p, category: e.target.value }))}
                      placeholder="例如：定制材料测试"
                      className="pl-10"
                    />
                  </div>
                  <div className="relative">
                    <Beaker className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400" />
                    <Input
                      label="材料类型"
                      value={form.material}
                      onChange={(e) => setForm((p) => ({ ...p, material: e.target.value }))}
                      placeholder="例如：钛合金"
                      className="pl-10"
                    />
                  </div>
                  <div className="relative">
                    <Tag className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400" />
                    <Input
                      label="应用行业"
                      value={form.industry}
                      onChange={(e) => setForm((p) => ({ ...p, industry: e.target.value }))}
                      placeholder="例如：航空航天"
                      className="pl-10"
                    />
                  </div>
                  <div className="relative">
                    <FlaskConical className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400" />
                    <Input
                      label="样品名称"
                      value={form.sampleName}
                      onChange={(e) => setForm((p) => ({ ...p, sampleName: e.target.value }))}
                      placeholder="例如：试样 A / 粉末样品"
                      className="pl-10"
                    />
                  </div>
                  <div className="relative">
                    <Scale className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400" />
                    <Input
                      label="样品数量"
                      required
                      value={form.quantity}
                      onChange={(e) => setForm((p) => ({ ...p, quantity: e.target.value }))}
                      placeholder="例如：5件"
                      className="pl-10"
                    />
                  </div>
                  <div className="relative">
                    <Ruler className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400" />
                    <Input
                      label="测试标准（如已知）"
                      value={form.testingStandard}
                      onChange={(e) => setForm((p) => ({ ...p, testingStandard: e.target.value }))}
                      placeholder="例如：ASTM / ISO / GB"
                      className="pl-10"
                    />
                  </div>
                  <div className="relative">
                    <Calendar className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400" />
                    <Input
                      label="期望交付日期"
                      type="date"
                      value={form.deadline}
                      onChange={(e) => setForm((p) => ({ ...p, deadline: e.target.value }))}
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
                    <h2 className="text-lg font-semibold text-gray-900">测试需求</h2>
                    <p className="text-xs text-gray-500">详细描述有助于快速报价</p>
                  </div>
                </div>
                <div className="space-y-4">
                  <div className="grid gap-4 sm:grid-cols-2">
                    <Input
                      label="测试目的"
                      value={form.testPurpose}
                      onChange={(e) => setForm((p) => ({ ...p, testPurpose: e.target.value }))}
                      placeholder="例如：论文实验 / 产品验证"
                    />
                    <Input
                      label="样品状态"
                      value={form.sampleCondition}
                      onChange={(e) => setForm((p) => ({ ...p, sampleCondition: e.target.value }))}
                      placeholder="例如：块状 / 粉末 / 液体 / 薄膜"
                    />
                  </div>

                  <div className="grid gap-4 sm:grid-cols-2">
                    <div>
                      <label className="mb-2 block text-sm font-medium text-gray-700">期望输出</label>
                      <select
                        value={form.expectedOutput}
                        onChange={(e) => setForm((p) => ({ ...p, expectedOutput: e.target.value }))}
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
                        onChange={(e) => setForm((p) => ({ ...p, urgency: e.target.value }))}
                        className="w-full rounded-xl border border-gray-200 px-4 py-3 text-sm focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary"
                      >
                        <option value="NORMAL">普通</option>
                        <option value="URGENT">加急</option>
                        <option value="VERY_URGENT">特急</option>
                      </select>
                    </div>
                  </div>

                  <Textarea
                    label="详细要求说明"
                    required
                    rows={6}
                    value={form.requirements}
                    onChange={(e) => setForm((p) => ({ ...p, requirements: e.target.value }))}
                    placeholder="请详细描述您的定制测试需求，包括测试项目、测试条件、数据要求、是否需要报告或证书等。"
                  />
                </div>
              </Card>
            </div>

            {/* Right column */}
            <div className="space-y-6">
              <Card padding="lg" className="rounded-3xl">
                <div className="mb-5 flex items-center gap-3 border-b border-gray-100 pb-4">
                  <div className="rounded-xl bg-primary/10 p-2">
                    <User className="h-5 w-5 text-primary" />
                  </div>
                  <div>
                    <h2 className="text-lg font-semibold text-gray-900">联系方式</h2>
                    <p className="text-xs text-gray-500">以便我们与您沟通方案</p>
                  </div>
                </div>
                <div className="space-y-4">
                  <div className="relative">
                    <User className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400" />
                    <Input
                      label="联系人"
                      required
                      value={form.contactName}
                      onChange={(e) => setForm((p) => ({ ...p, contactName: e.target.value }))}
                      className="pl-10"
                    />
                  </div>
                  <div className="relative">
                    <Phone className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400" />
                    <Input
                      label="联系电话"
                      required
                      type="tel"
                      value={form.contactPhone}
                      onChange={(e) => setForm((p) => ({ ...p, contactPhone: e.target.value }))}
                      className="pl-10"
                    />
                  </div>
                  <div className="relative">
                    <Mail className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400" />
                    <Input
                      label="联系邮箱"
                      required
                      type="email"
                      value={form.contactEmail}
                      onChange={(e) => setForm((p) => ({ ...p, contactEmail: e.target.value }))}
                      className="pl-10"
                    />
                  </div>
                </div>
              </Card>

              <Card padding="lg" className="rounded-3xl">
                <div className="mb-5 flex items-center gap-3 border-b border-gray-100 pb-4">
                  <div className="rounded-xl bg-primary/10 p-2">
                    <FileText className="h-5 w-5 text-primary" />
                  </div>
                  <div>
                    <h2 className="text-lg font-semibold text-gray-900">附件资料</h2>
                    <p className="text-xs text-gray-500">上传图纸、标准文件、样品图片等</p>
                  </div>
                </div>
                <FileUpload
                  accept=".pdf,.doc,.docx,.xls,.xlsx,.jpg,.jpeg,.png"
                  maxSize={50 * 1024 * 1024}
                  multiple
                  folder="rfq"
                  onUploadComplete={handleUploadComplete}
                />
                {files.length > 0 ? (
                  <div className="mt-4 rounded-xl border border-gray-100 bg-slate-50 p-3">
                    <p className="mb-2 text-sm font-medium text-gray-700">
                      已上传 {files.length} 个文件
                    </p>
                    <div className="space-y-1">
                      {files.map((file) => (
                        <div key={file.name} className="flex items-center gap-2 text-sm text-gray-600">
                          <CheckCircle2 className="h-4 w-4 text-emerald-600" />
                          {file.name}
                        </div>
                      ))}
                    </div>
                  </div>
                ) : null}
              </Card>

              <Card padding="lg" className="rounded-3xl bg-gradient-to-b from-white to-slate-50/50">
                <h3 className="mb-4 text-base font-semibold text-gray-900">提交前确认</h3>
                <ul className="mb-6 space-y-2 text-sm text-gray-600">
                  <li className="flex items-center gap-2">
                    <CheckCircle2 className={`h-4 w-4 ${form.title.trim() ? 'text-emerald-600' : 'text-gray-300'}`} />
                    已填写项目名称
                  </li>
                  <li className="flex items-center gap-2">
                    <CheckCircle2 className={`h-4 w-4 ${form.category.trim() ? 'text-emerald-600' : 'text-gray-300'}`} />
                    已填写服务分类
                  </li>
                  <li className="flex items-center gap-2">
                    <CheckCircle2 className={`h-4 w-4 ${form.contactName.trim() ? 'text-emerald-600' : 'text-gray-300'}`} />
                    已填写联系人
                  </li>
                  <li className="flex items-center gap-2">
                    <CheckCircle2 className={`h-4 w-4 ${form.contactPhone.trim() && form.contactEmail.trim() ? 'text-emerald-600' : 'text-gray-300'}`} />
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
