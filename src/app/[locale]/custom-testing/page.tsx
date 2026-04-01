'use client';

import { useState } from 'react';
import { useRouter } from '@/i18n/routing';
import { Card } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Button } from '@/components/ui/button';
import { FileUpload } from '@/components/ui/file-upload';
import { CheckCircle2, ArrowLeft } from 'lucide-react';

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
      <div className="mx-auto max-w-2xl px-4 py-12 text-center">
        <div className="mb-4 inline-flex h-16 w-16 items-center justify-center rounded-full bg-green-100">
          <CheckCircle2 className="h-8 w-8 text-green-600" />
        </div>
        <h1 className="mb-2 text-2xl font-bold text-gray-900">定制测试需求已提交</h1>
        <p className="mb-6 text-gray-600">
          后台已收到您的定制测试申请，我们将尽快审核并为您安排报价或测试方案。
        </p>
        <Button onClick={() => router.push('/rfq?requestType=CUSTOM_TESTING')}>
          查看我的申请
        </Button>
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-5xl px-4 py-10">
      <div className="mx-auto max-w-3xl space-y-6">
        <div className="mb-2">
          <button
            type="button"
            onClick={handleBack}
            className="flex items-center gap-2 text-sm text-gray-600 transition-colors hover:text-blue-600"
          >
            <ArrowLeft className="h-4 w-4" />
            返回
          </button>
        </div>

        <div>
          <h1 className="text-3xl font-bold text-gray-900">定制测试需求</h1>
          <p className="mt-2 text-gray-600">
            填写您的特殊检测需求，提交后将进入后台管理，由管理员审核并安排报价。
          </p>
        </div>

        {error ? (
          <div className="rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-600">
            {error}
          </div>
        ) : null}

        <form onSubmit={handleSubmit} className="space-y-6">
          <Card>
            <h2 className="mb-4 text-lg font-semibold text-gray-900">基本信息</h2>
            <div className="grid gap-4 sm:grid-cols-2">
              <Input
                label="项目名称"
                required
                value={form.title}
                onChange={(e) => setForm((p) => ({ ...p, title: e.target.value }))}
                placeholder="例如：高温合金疲劳寿命定制测试"
              />
              <Input
                label="服务分类"
                required
                value={form.category}
                onChange={(e) => setForm((p) => ({ ...p, category: e.target.value }))}
                placeholder="例如：定制材料测试"
              />
              <Input
                label="材料类型"
                value={form.material}
                onChange={(e) => setForm((p) => ({ ...p, material: e.target.value }))}
                placeholder="例如：钛合金"
              />
              <Input
                label="应用行业"
                value={form.industry}
                onChange={(e) => setForm((p) => ({ ...p, industry: e.target.value }))}
                placeholder="例如：航空航天"
              />
              <Input
                label="样品名称"
                value={form.sampleName}
                onChange={(e) => setForm((p) => ({ ...p, sampleName: e.target.value }))}
                placeholder="例如：试样 A / 粉末样品 / 薄膜样品"
              />
              <Input
                label="样品数量"
                required
                value={form.quantity}
                onChange={(e) => setForm((p) => ({ ...p, quantity: e.target.value }))}
                placeholder="例如：5件"
              />
              <Input
                label="测试标准（如已知）"
                value={form.testingStandard}
                onChange={(e) => setForm((p) => ({ ...p, testingStandard: e.target.value }))}
                placeholder="例如：ASTM / ISO / GB"
              />
              <Input
                label="期望交付日期"
                type="date"
                value={form.deadline}
                onChange={(e) => setForm((p) => ({ ...p, deadline: e.target.value }))}
              />
            </div>
          </Card>

          <Card>
            <h2 className="mb-4 text-lg font-semibold text-gray-900">测试需求</h2>

            <div className="mb-4 grid gap-4 sm:grid-cols-2">
              <Input
                label="测试目的"
                value={form.testPurpose}
                onChange={(e) => setForm((p) => ({ ...p, testPurpose: e.target.value }))}
                placeholder="例如：论文实验 / 产品验证 / 企业送检"
              />
              <Input
                label="样品状态"
                value={form.sampleCondition}
                onChange={(e) => setForm((p) => ({ ...p, sampleCondition: e.target.value }))}
                placeholder="例如：块状 / 粉末 / 液体 / 薄膜"
              />
            </div>

            <div className="mb-4 grid gap-4 sm:grid-cols-2">
              <div>
                <label className="mb-2 block text-sm font-medium text-gray-700">期望输出</label>
                <select
                  value={form.expectedOutput}
                  onChange={(e) => setForm((p) => ({ ...p, expectedOutput: e.target.value }))}
                  className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm outline-none focus:border-blue-500"
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
                  className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm outline-none focus:border-blue-500"
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
          </Card>

          <Card>
            <h2 className="mb-4 text-lg font-semibold text-gray-900">附件资料</h2>
            <p className="mb-4 text-sm text-gray-600">
              您可以上传技术图纸、标准文件、参考资料、样品图片等。
            </p>

            <FileUpload
              accept=".pdf,.doc,.docx,.xls,.xlsx,.jpg,.jpeg,.png"
              maxSize={50 * 1024 * 1024}
              multiple
              folder="rfq"
              onUploadComplete={handleUploadComplete}
            />

            {files.length > 0 ? (
              <div className="mt-4">
                <p className="mb-2 text-sm font-medium text-gray-700">
                  已上传 {files.length} 个文件
                </p>
                <div className="space-y-1">
                  {files.map((file, idx) => (
                    <div key={idx} className="flex items-center gap-2 text-sm text-gray-600">
                      <CheckCircle2 className="h-4 w-4 text-green-600" />
                      {file.name}
                    </div>
                  ))}
                </div>
              </div>
            ) : null}
          </Card>

          <Card>
            <h2 className="mb-4 text-lg font-semibold text-gray-900">联系方式</h2>
            <div className="grid gap-4 sm:grid-cols-2">
              <Input
                label="联系人"
                required
                value={form.contactName}
                onChange={(e) => setForm((p) => ({ ...p, contactName: e.target.value }))}
              />
              <Input
                label="联系电话"
                required
                type="tel"
                value={form.contactPhone}
                onChange={(e) => setForm((p) => ({ ...p, contactPhone: e.target.value }))}
              />
              <Input
                label="联系邮箱"
                required
                type="email"
                value={form.contactEmail}
                onChange={(e) => setForm((p) => ({ ...p, contactEmail: e.target.value }))}
                className="sm:col-span-2"
              />
            </div>
          </Card>

          <div className="flex justify-end gap-3">
            <Button type="button" variant="outline" onClick={handleBack}>
              返回
            </Button>
            <Button type="submit" loading={loading}>
              提交定制测试
            </Button>
          </div>
        </form>
      </div>
    </div>
  );
}