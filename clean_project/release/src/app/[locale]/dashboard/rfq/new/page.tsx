'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { DashboardLayout } from '@/components/layout/dashboard-layout';
import { Card } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Button } from '@/components/ui/button';
import { FileUpload } from '@/components/ui/file-upload';
import { CheckCircle2 } from 'lucide-react';

export default function NewRFQPage() {
  const router = useRouter();
  const [form, setForm] = useState({
    title: '',
    category: '',
    material: '',
    industry: '',
    quantity: '',
    requirements: '',
    deadline: '',
    contactName: '',
    contactPhone: '',
    contactEmail: '',
  });
  const [files, setFiles] = useState<Array<{ url: string; name: string }>>([]);
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);

  const handleUploadComplete = (uploadedFiles: Array<{ url: string; name: string }>) => {
    setFiles(prev => [...prev, ...uploadedFiles]);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      const res = await fetch('/api/rfq', {
        method: 'POST',
        credentials: 'include',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          ...form,
          attachments: files.map(f => ({ url: f.url, fileName: f.name })),
        }),
      });

      const data = await res.json();
      if (data.success) {
        setSuccess(true);
        setTimeout(() => router.push('/dashboard/quotations'), 2000);
      }
    } catch (error) {
      console.error('RFQ submit error:', error);
    }
    setLoading(false);
  };

  if (success) {
    return (
      <DashboardLayout>
        <div className="max-w-2xl mx-auto py-12 text-center">
          <div className="inline-flex items-center justify-center w-16 h-16 bg-green-100 rounded-full mb-4">
            <CheckCircle2 className="h-8 w-8 text-green-600" />
          </div>
          <h1 className="text-2xl font-bold text-gray-900 mb-2">询价请求已提交</h1>
          <p className="text-gray-600 mb-6">我们将尽快为您提供报价方案</p>
          <Button onClick={() => router.push('/dashboard/quotations')}>
            查看我的询价
          </Button>
        </div>
      </DashboardLayout>
    );
  }

  return (
    <DashboardLayout>
      <div className="space-y-6">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">新建询价请求</h1>
          <p className="text-gray-600 mt-1">填写您的检测需求，我们将为您提供专业报价</p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-6">
          <Card>
            <h2 className="text-lg font-semibold text-gray-900 mb-4">基本信息</h2>
            <div className="grid sm:grid-cols-2 gap-4">
              <Input
                label="项目名称"
                required
                value={form.title}
                onChange={e => setForm(p => ({ ...p, title: e.target.value }))}
                placeholder="例如：金属材料拉伸试验"
              />
              <Input
                label="服务分类"
                required
                value={form.category}
                onChange={e => setForm(p => ({ ...p, category: e.target.value }))}
                placeholder="例如：力学性能测试"
              />
              <Input
                label="材料类型"
                value={form.material}
                onChange={e => setForm(p => ({ ...p, material: e.target.value }))}
                placeholder="例如：不锈钢"
              />
              <Input
                label="应用行业"
                value={form.industry}
                onChange={e => setForm(p => ({ ...p, industry: e.target.value }))}
                placeholder="例如：汽车工业"
              />
              <Input
                label="样品数量"
                required
                value={form.quantity}
                onChange={e => setForm(p => ({ ...p, quantity: e.target.value }))}
                placeholder="例如：3件"
              />
              <Input
                label="期望交付日期"
                type="date"
                value={form.deadline}
                onChange={e => setForm(p => ({ ...p, deadline: e.target.value }))}
              />
            </div>
          </Card>

          <Card>
            <h2 className="text-lg font-semibold text-gray-900 mb-4">详细要求</h2>
            <Textarea
              label="检测要求说明"
              required
              rows={6}
              value={form.requirements}
              onChange={e => setForm(p => ({ ...p, requirements: e.target.value }))}
              placeholder="请详细描述您的检测需求，包括：&#10;1. 具体检测项目和标准&#10;2. 特殊要求（如精度、测试条件等）&#10;3. 其他需要说明的事项"
            />
          </Card>

          <Card>
            <h2 className="text-lg font-semibold text-gray-900 mb-4">附件资料</h2>
            <p className="text-sm text-gray-600 mb-4">
              您可以上传相关的技术图纸、标准文件、参考资料等
            </p>
            <FileUpload
              accept=".pdf,.doc,.docx,.xls,.xlsx,.jpg,.jpeg,.png"
              maxSize={50 * 1024 * 1024}
              multiple
              folder="rfq"
              onUploadComplete={handleUploadComplete}
            />
            {files.length > 0 && (
              <div className="mt-4">
                <p className="text-sm font-medium text-gray-700 mb-2">已上传 {files.length} 个文件</p>
                <div className="space-y-1">
                  {files.map((file, idx) => (
                    <div key={idx} className="text-sm text-gray-600 flex items-center gap-2">
                      <CheckCircle2 className="h-4 w-4 text-green-600" />
                      {file.name}
                    </div>
                  ))}
                </div>
              </div>
            )}
          </Card>

          <Card>
            <h2 className="text-lg font-semibold text-gray-900 mb-4">联系方式</h2>
            <div className="grid sm:grid-cols-2 gap-4">
              <Input
                label="联系人"
                required
                value={form.contactName}
                onChange={e => setForm(p => ({ ...p, contactName: e.target.value }))}
              />
              <Input
                label="联系电话"
                required
                type="tel"
                value={form.contactPhone}
                onChange={e => setForm(p => ({ ...p, contactPhone: e.target.value }))}
              />
              <Input
                label="联系邮箱"
                required
                type="email"
                value={form.contactEmail}
                onChange={e => setForm(p => ({ ...p, contactEmail: e.target.value }))}
                className="sm:col-span-2"
              />
            </div>
          </Card>

          <div className="flex gap-3 justify-end">
            <Button type="button" variant="outline" onClick={() => router.back()}>
              取消
            </Button>
            <Button type="submit" loading={loading}>
              提交询价
            </Button>
          </div>
        </form>
      </div>
    </DashboardLayout>
  );
}
