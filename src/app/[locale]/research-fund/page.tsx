'use client';

import { useState } from 'react';
import { useTranslations } from 'next-intl';
import { Header } from '@/components/layout/header';
import { Footer } from '@/components/layout/footer';
import { Link } from '@/i18n/routing';
import { Button } from '@/components/ui/button';
import { Modal } from '@/components/ui/modal';
import { Input } from '@/components/ui/input';
import { Wallet, FlaskConical, ArrowUpCircle, Loader2, CheckCircle2 } from 'lucide-react';

export default function ResearchFundPage() {
  const t = useTranslations('researchFund');
  const [modalOpen, setModalOpen] = useState(false);
  const [amount, setAmount] = useState('');
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState('');
  const [error, setError] = useState('');

  const handleRecharge = async () => {
    const num = parseFloat(amount);
    if (!num || num <= 0) {
      setError(t('invalidAmount'));
      return;
    }
    try {
      setLoading(true);
      setError('');
      setSuccess('');
      const res = await fetch('/api/wallet/recharge', {
        method: 'POST',
        credentials: 'include',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ amount: num }),
      });
      const data = await res.json().catch(() => null);
      if (!res.ok || !data?.success) {
        setError(data?.error || t('rechargeFailed'));
        return;
      }
      setSuccess(t('rechargeSuccess', { amount: num.toFixed(2) }));
      setAmount('');
    } catch {
      setError(t('rechargeFailed'));
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex flex-col bg-white">
      <Header />

      <main className="flex-1 flex items-center justify-center px-4 py-12 bg-gradient-to-br from-slate-50 to-blue-50">
        <div className="w-full max-w-xl overflow-hidden rounded-3xl bg-white text-gray-900 shadow-2xl ring-1 ring-black/5">
          <div className="bg-gradient-to-r from-blue-500 via-blue-600 to-indigo-500 px-6 py-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-blue-100">{t('specialFundModule')}</p>
                <h3 className="text-2xl font-bold text-white">{t('title')}</h3>
              </div>
              <div className="rounded-2xl bg-white/20 p-3">
                <Wallet className="h-7 w-7 text-white" />
              </div>
            </div>
          </div>

          <div className="px-6 py-6">
            <p className="text-sm leading-6 text-gray-600">
              {t('description')}
            </p>

            <div className="mt-5 grid grid-cols-2 gap-3">
              <div className="rounded-2xl bg-blue-50 p-4">
                <p className="text-xs text-gray-500">{t('targetUsers')}</p>
                <p className="mt-1 font-semibold text-gray-900">{t('targetUsersValue')}</p>
              </div>
              <div className="rounded-2xl bg-indigo-50 p-4">
                <p className="text-xs text-gray-500">{t('settlementMode')}</p>
                <p className="mt-1 font-semibold text-gray-900">{t('settlementModeValue')}</p>
              </div>
            </div>

            <div className="mt-5 space-y-2 text-sm text-gray-700">
              <div>{t('feature1')}</div>
              <div>{t('feature2')}</div>
              <div>{t('feature3')}</div>
            </div>

            <div className="mt-6 flex gap-3">
              <Button
                onClick={() => {
                  setModalOpen(true);
                  setError('');
                  setSuccess('');
                  setAmount('');
                }}
                className="inline-flex items-center justify-center rounded-xl bg-blue-600 px-5 py-3 text-sm font-semibold text-white hover:bg-blue-700"
              >
                <ArrowUpCircle className="h-4 w-4 mr-2" />
                {t('recharge')}
              </Button>
              <Link
                href="/help"
                className="inline-flex items-center justify-center rounded-xl border border-gray-200 px-5 py-3 text-sm font-semibold text-gray-700 hover:bg-gray-50"
              >
                {t('learnMore')}
              </Link>
            </div>
          </div>
        </div>
      </main>

      <Footer />

      <Modal
        isOpen={modalOpen}
        onClose={() => setModalOpen(false)}
        title={t('rechargeModalTitle')}
        size="md"
      >
        <div className="space-y-4">
          {success && (
            <div className="rounded-lg border border-green-200 bg-green-50 px-4 py-3 text-sm text-green-700 flex items-center gap-2">
              <CheckCircle2 className="h-4 w-4" />
              {success}
            </div>
          )}
          {error && (
            <div className="rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
              {error}
            </div>
          )}

          <div>
            <label className="mb-1 block text-sm font-medium text-gray-700">{t('rechargeAmount')}</label>
            <div className="grid grid-cols-3 gap-2 mb-3">
              {['1000', '5000', '10000', '20000', '50000', '100000'].map((preset) => (
                <button
                  key={preset}
                  type="button"
                  onClick={() => {
                    setAmount(preset);
                    setError('');
                  }}
                  className={`rounded-lg border px-3 py-2 text-sm font-medium transition-colors ${
                    amount === preset
                      ? 'border-blue-600 bg-blue-50 text-blue-700'
                      : 'border-gray-200 text-gray-700 hover:bg-gray-50'
                  }`}
                >
                  ¥{Number(preset).toLocaleString()}
                </button>
              ))}
            </div>
            <Input
              type="number"
              min={1}
              placeholder={t('customAmount')}
              value={amount}
              onChange={(e) => {
                setAmount(e.target.value);
                setError('');
              }}
            />
          </div>

          <div className="flex gap-3 pt-2">
            <Button onClick={handleRecharge} loading={loading} className="bg-blue-600 hover:bg-blue-700">
              {t('confirmRecharge')}
            </Button>
            <Button variant="outline" onClick={() => setModalOpen(false)}>
              {t('cancel')}
            </Button>
          </div>
        </div>
      </Modal>
    </div>
  );
}
