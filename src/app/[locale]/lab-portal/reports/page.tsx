'use client';
import { useState } from 'react';
import { LabPortalLayout } from '@/components/layout/lab-portal-layout';
import { Card } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Button } from '@/components/ui/button';
import { FileUpload } from '@/components/ui/file-upload';
import { useAuthStore } from '@/store/auth-store';
import { FileText, CheckCircle2 } from 'lucide-react';

export default function LabPortalReportsPage() {
  // Auth via HttpOnly cookie
  const [form, setForm] = useState({ orderId: '', title: '', summaryZh: '', fileUrl: '' });
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);
  const [uploadError, setUploadError] = useState('');

  const handleUploadComplete = (files: Array<{ url: string }>) => {
    if (files.length > 0) {
      setForm(p => ({ ...p, fileUrl: files[0].url }));
      setUploadError('');
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.fileUrl) {
      setUploadError('请先上传报告文件');
      return;
    }
    setLoading(true);
    const res = await fetch('/api/lab/reports', {
      credentials: 'include',
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(form),
    });
    const d = await res.json();
    if (d.success) { setSuccess(true); setForm({ orderId: '', title: '', summaryZh: '', fileUrl: '' }); }
    setLoading(false);
  };

  return (
    <LabPortalLayout>
      <div className="space-y-6">
        <h1 className="text-2xl font-bold text-gray-900">上传报告</h1>
        <Card padding="lg" className="max-w-2xl">
          {success && (
            <div className="mb-4 p-3 bg-green-50 border border-green-200 rounded-lg flex items-center gap-2 text-green-700">
              <CheckCircle2 className="h-4 w-4" />报告已提交
            </div>
          )}
          <form onSubmit={handleSubmit} className="space-y-4">
            <Input label="订单ID" required value={form.orderId} onChange={e => setForm(p => ({ ...p, orderId: e.target.value }))} />
            <Input label="报告标题" required value={form.title} onChange={e => setForm(p => ({ ...p, title: e.target.value }))} />
            <Textarea label="报告摘要" value={form.summaryZh} onChange={e => setForm(p => ({ ...p, summaryZh: e.target.value }))} />
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">上传报告文件</label>
              <FileUpload
                accept=".pdf,.doc,.docx"
                maxSize={50 * 1024 * 1024}
                folder="reports"
                onUploadComplete={handleUploadComplete}
                onUploadError={setUploadError}
              />
              {uploadError && <p className="text-sm text-red-600 mt-1">{uploadError}</p>}
              {form.fileUrl && <p className="text-sm text-green-600 mt-1">✓ 文件已上传</p>}
            </div>
            <Button type="submit" loading={loading} disabled={!form.fileUrl}>提交报告</Button>
          </form>
        </Card>
      </div>
    </LabPortalLayout>
  );
}
