'use client';

import { useState } from 'react';
import { Header } from '@/components/layout/header';
import { Footer } from '@/components/layout/footer';
import { Card } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Shield, CheckCircle2, XCircle } from 'lucide-react';
import { formatDate } from '@/lib/utils';

export default function ReportsVerifyPage() {
  const [reportNo, setReportNo] = useState('');
  const [result, setResult] = useState<Record<string, unknown> | null>(null);
  const [notFound, setNotFound] = useState(false);
  const [loading, setLoading] = useState(false);

  const handleVerify = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!reportNo.trim()) return;

    setLoading(true);
    setResult(null);
    setNotFound(false);

    try {
      const res = await fetch(
        `/api/reports/verify?reportNo=${encodeURIComponent(reportNo)}`,
        { credentials: 'include' }
      );
      const data = await res.json();

      if (data.success) setResult(data.data);
      else setNotFound(true);
    } catch {
      setNotFound(true);
    }

    setLoading(false);
  };

  // ✅ FIX: extract typed values safely
  const reportNoValue = result?.reportNo as string | undefined;
  const title = result?.title as string | undefined;
  const status = result?.status as string | undefined;
  const issuedAt = result?.issuedAt as string | undefined;

  return (
    <div className="min-h-screen">
      <Header />

      <section className="bg-gradient-to-br from-blue-600 to-indigo-800 text-white py-16">
        <div className="max-w-xl mx-auto px-4 text-center">
          <Shield className="h-12 w-12 mx-auto mb-4" />
          <h1 className="text-3xl font-bold mb-2">报告真伪验证</h1>
          <p className="text-blue-100">输入报告编号，验证检测报告的真实性</p>
        </div>
      </section>

      <section className="max-w-xl mx-auto px-4 py-12">
        <Card padding="lg">
          <form onSubmit={handleVerify} className="flex gap-3">
            <Input
              placeholder="输入报告编号，如 RPT2026XXXXX"
              value={reportNo}
              onChange={e => setReportNo(e.target.value)}
              className="flex-1"
            />
            <Button type="submit" loading={loading}>
              验证
            </Button>
          </form>

          {result ? (
            <div className="mt-6 p-4 bg-green-50 border border-green-200 rounded-lg">
              <div className="flex items-center gap-2 mb-3">
                <CheckCircle2 className="h-5 w-5 text-green-600" />
                <span className="font-semibold text-green-800">报告验证通过</span>
              </div>

              <div className="space-y-2 text-sm">
                <p>
                  <span className="text-gray-500">报告编号:</span>{' '}
                  <span className="font-mono">{reportNoValue}</span>
                </p>

                <p>
                  <span className="text-gray-500">报告标题:</span> {title}
                </p>

                <p>
                  <span className="text-gray-500">状态:</span>{' '}
                  <Badge variant="success">{status}</Badge>
                </p>

                {issuedAt ? (
                  <p>
                    <span className="text-gray-500">出具日期:</span>{' '}
                    {formatDate(issuedAt)}
                  </p>
                ) : null}
              </div>
            </div>
          ) : null}

          {notFound ? (
            <div className="mt-6 p-4 bg-red-50 border border-red-200 rounded-lg flex items-center gap-2">
              <XCircle className="h-5 w-5 text-red-600" />
              <span className="text-red-800">
                未找到该编号的报告，请检查编号是否正确
              </span>
            </div>
          ) : null}
        </Card>
      </section>

      <Footer />
    </div>
  );
}