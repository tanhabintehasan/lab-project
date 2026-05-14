'use client';

import { useState, useRef, useEffect, useCallback } from 'react';
import { useSearchParams } from 'next/navigation';
import { LabPortalLayout } from '@/components/layout/lab-portal-layout';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { QRCode } from '@/components/ui/qr-code';
import { formatDateTime } from '@/lib/utils';
import { Search, Package, CheckCircle2, AlertCircle, ScanLine, ArrowLeft } from 'lucide-react';
import { Link } from '@/i18n/routing';

interface SampleDetail {
  id: string;
  sampleNo: string;
  name: string;
  description: string | null;
  materialType: string | null;
  quantity: string | null;
  status: string;
  trackingNo: string | null;
  courier: string | null;
  shippedAt: string | null;
  receivedAt: string | null;
  receivedBy: string | null;
  notes: string | null;
  order: { orderNo: string; userId: string };
  timeline: Array<{
    id: string;
    status: string;
    title: string;
    description: string | null;
    operator: string | null;
    createdAt: string;
  }>;
}

const statusLabels: Record<string, string> = {
  PENDING_SUBMISSION: 'Pending Submission',
  SHIPPED: 'Shipped',
  RECEIVED: 'Received',
  INSPECTING: 'Inspecting',
  INSPECTION_PASSED: 'Inspection Passed',
  INSPECTION_FAILED: 'Inspection Failed',
  TESTING: 'Testing',
  TESTING_COMPLETE: 'Testing Complete',
  STORED: 'Stored',
  RETURNED: 'Returned',
};

const statusVariant = (status: string) => {
  const map: Record<string, 'default' | 'success' | 'warning' | 'danger' | 'info' | 'outline'> = {
    PENDING_SUBMISSION: 'warning',
    SHIPPED: 'info',
    RECEIVED: 'success',
    INSPECTING: 'info',
    INSPECTION_PASSED: 'success',
    INSPECTION_FAILED: 'danger',
    TESTING: 'info',
    TESTING_COMPLETE: 'success',
    STORED: 'default',
    RETURNED: 'outline',
  };
  return map[status] || 'default';
};

export default function LabSampleScanPage() {
  const searchParams = useSearchParams();
  const initialCode = searchParams.get('code') || '';

  const [barcode, setBarcode] = useState(initialCode);
  const [loading, setLoading] = useState(false);
  const [sample, setSample] = useState<SampleDetail | null>(null);
  const [error, setError] = useState('');
  const [updating, setUpdating] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);

  const lookup = useCallback(async (code: string) => {
    if (!code.trim()) return;
    setLoading(true);
    setError('');
    setSample(null);
    try {
      const res = await fetch(`/api/samples?barcode=${encodeURIComponent(code.trim().toUpperCase())}`);
      const data = await res.json();
      if (data?.success && Array.isArray(data.data) && data.data.length > 0) {
        setSample(data.data[0] as SampleDetail);
      } else {
        setError('Sample not found. Please check the barcode and try again.');
      }
    } catch {
      setError('Network error. Please try again.');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    if (initialCode) {
      lookup(initialCode);
    }
  }, [initialCode, lookup]);

  useEffect(() => {
    // Auto-focus input on mount
    inputRef.current?.focus();
  }, []);

  const handleReceive = async () => {
    if (!sample) return;
    setUpdating(true);
    try {
      const res = await fetch(`/api/lab/samples/${sample.id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status: 'RECEIVED' }),
      });
      const data = await res.json();
      if (data?.success) {
        await lookup(sample.sampleNo);
      } else {
        setError(data?.error || 'Failed to update sample status');
      }
    } catch {
      setError('Network error during update');
    } finally {
      setUpdating(false);
    }
  };

  return (
    <LabPortalLayout>
      <div className="max-w-2xl mx-auto space-y-6">
        <div className="flex items-center gap-3">
          <Link href="/lab-portal/samples">
            <Button variant="outline" size="sm"><ArrowLeft className="h-4 w-4" />Back</Button>
          </Link>
          <h1 className="text-2xl font-bold text-gray-900">Sample Scan &amp; Receive</h1>
        </div>

        <Card padding="lg">
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Scan or type the 8-digit sample barcode
          </label>
          <div className="flex gap-2">
            <div className="relative flex-1">
              <ScanLine className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
              <input
                ref={inputRef}
                type="text"
                value={barcode}
                onChange={(e) => setBarcode(e.target.value.toUpperCase())}
                onKeyDown={(e) => e.key === 'Enter' && lookup(barcode)}
                placeholder="e.g. A3B7K9M2"
                maxLength={8}
                className="w-full pl-9 pr-3 py-2 border border-gray-300 rounded-lg text-sm font-mono tracking-widest uppercase focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>
            <Button onClick={() => lookup(barcode)} loading={loading} disabled={!barcode.trim()}>
              <Search className="h-4 w-4 mr-1" />Lookup
            </Button>
          </div>
          <p className="text-xs text-gray-500 mt-2">
            Barcode scanners act as keyboard input — just scan and press Enter.
          </p>
        </Card>

        {error && (
          <div className="p-4 bg-red-50 border border-red-200 rounded-lg flex items-start gap-3">
            <AlertCircle className="h-5 w-5 text-red-600 shrink-0 mt-0.5" />
            <p className="text-sm text-red-800">{error}</p>
          </div>
        )}

        {sample && (
          <Card padding="lg">
            <div className="flex items-start justify-between gap-4">
              <div className="flex-1">
                <div className="flex items-center gap-3 mb-2">
                  <Package className="h-5 w-5 text-blue-600" />
                  <h2 className="text-lg font-semibold text-gray-900">{sample.name}</h2>
                </div>
                <div className="grid grid-cols-2 gap-3 text-sm">
                  <p><span className="text-gray-500">Barcode:</span> <span className="font-mono font-medium">{sample.sampleNo}</span></p>
                  <p><span className="text-gray-500">Order:</span> {sample.order.orderNo}</p>
                  <p><span className="text-gray-500">Material:</span> {sample.materialType || '-'}</p>
                  <p><span className="text-gray-500">Quantity:</span> {sample.quantity || '-'}</p>
                  <p><span className="text-gray-500">Tracking:</span> {sample.trackingNo || '-'}</p>
                  <p><span className="text-gray-500">Courier:</span> {sample.courier || '-'}</p>
                  <p><span className="text-gray-500">Status:</span> <Badge variant={statusVariant(sample.status)}>{statusLabels[sample.status] || sample.status}</Badge></p>
                  {sample.receivedAt && (
                    <p><span className="text-gray-500">Received:</span> {formatDateTime(sample.receivedAt)}</p>
                  )}
                </div>
                {sample.description && (
                  <p className="text-sm text-gray-600 mt-3">{sample.description}</p>
                )}
              </div>
              <div className="shrink-0">
                <QRCode value={sample.sampleNo} size={128} />
                <p className="text-xs text-center text-gray-500 mt-1 font-mono">{sample.sampleNo}</p>
              </div>
            </div>

            {sample.status === 'SHIPPED' && (
              <div className="mt-6 pt-4 border-t border-gray-200">
                <Button
                  onClick={handleReceive}
                  loading={updating}
                  className="w-full sm:w-auto"
                >
                  <CheckCircle2 className="h-4 w-4 mr-1" />
                  Confirm Receive Sample
                </Button>
              </div>
            )}

            {sample.status === 'RECEIVED' && (
              <div className="mt-6 pt-4 border-t border-gray-200 flex items-center gap-2 text-green-700">
                <CheckCircle2 className="h-5 w-5" />
                <p className="text-sm font-medium">This sample has already been received.</p>
              </div>
            )}

            {sample.timeline.length > 0 && (
              <div className="mt-6 pt-4 border-t border-gray-200">
                <h3 className="text-sm font-semibold text-gray-900 mb-3">Timeline</h3>
                <div className="space-y-2">
                  {sample.timeline.map((t) => (
                    <div key={t.id} className="flex items-center justify-between text-sm">
                      <span className="text-gray-700">{t.title}</span>
                      <span className="text-gray-400 text-xs">{formatDateTime(t.createdAt)}</span>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </Card>
        )}
      </div>
    </LabPortalLayout>
  );
}
