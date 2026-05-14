'use client';
import { useState } from 'react';
import { LabPortalLayout } from '@/components/layout/lab-portal-layout';
import { Card } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Button } from '@/components/ui/button';
import { FileUpload } from '@/components/ui/file-upload';
import { useAuthStore } from '@/store/auth-store';
import { FileText, CheckCircle2, Info } from 'lucide-react';

export default function LabPortalReportsPage() {
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
      setUploadError('Please upload a report file first');
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
        <h1 className="text-2xl font-bold text-gray-900">Upload Report</h1>
        <Card padding="lg" className="max-w-2xl">
          {success && (
            <div className="mb-4 p-3 bg-green-50 border border-green-200 rounded-lg flex items-center gap-2 text-green-700">
              <CheckCircle2 className="h-4 w-4" />Report submitted for admin review.
            </div>
          )}
          <div className="mb-4 p-3 bg-blue-50 border border-blue-200 rounded-lg flex items-start gap-2 text-blue-700">
            <Info className="h-4 w-4 shrink-0 mt-0.5" />
            <p className="text-sm">
              Uploaded reports are sent to <strong>Under Review</strong> status.
              An admin must approve the report before it becomes visible to the customer.
              The admin will add a digital signature and encrypt the PDF.
            </p>
          </div>
          <form onSubmit={handleSubmit} className="space-y-4">
            <Input label="Order ID" required value={form.orderId} onChange={e => setForm(p => ({ ...p, orderId: e.target.value }))} />
            <Input label="Report Title" required value={form.title} onChange={e => setForm(p => ({ ...p, title: e.target.value }))} />
            <Textarea label="Report Summary" value={form.summaryZh} onChange={e => setForm(p => ({ ...p, summaryZh: e.target.value }))} />
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Upload Report File (PDF)</label>
              <FileUpload
                accept=".pdf"
                maxSize={50 * 1024 * 1024}
                folder="reports"
                onUploadComplete={handleUploadComplete}
                onUploadError={setUploadError}
              />
              {uploadError && <p className="text-sm text-red-600 mt-1">{uploadError}</p>}
              {form.fileUrl && <p className="text-sm text-green-600 mt-1">✓ File uploaded</p>}
            </div>
            <Button type="submit" loading={loading} disabled={!form.fileUrl}>Submit for Review</Button>
          </form>
        </Card>
      </div>
    </LabPortalLayout>
  );
}
