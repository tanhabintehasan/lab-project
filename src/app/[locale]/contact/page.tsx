'use client';

import { useEffect, useState } from 'react';
import { useTranslations } from 'next-intl';
import { Header } from '@/components/layout/header';
import { Footer } from '@/components/layout/footer';
import { Card } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Select } from '@/components/ui/select';
import { Button } from '@/components/ui/button';
import { Phone, Mail, MapPin, Clock, CheckCircle2, Send, MessageSquare, ShieldCheck } from 'lucide-react';

interface CMSPage {
  id: string;
  slug: string;
  titleZh?: string;
  titleEn?: string;
  contentZh?: string;
  contentEn?: string;
  sections?: Array<{
    id: string;
    sectionKey: string;
    name?: string;
    titleZh?: string;
    subtitleZh?: string;
    descriptionZh?: string;
    items?: Array<{
      id: string;
      titleZh?: string;
      subtitleZh?: string;
      descriptionZh?: string;
      icon?: string;
      value?: string;
    }>;
  }>;
}

function getSection(page: CMSPage | null, key: string) {
  return page?.sections?.find((s) => s.sectionKey === key);
}

export default function ContactPage() {
  const t = useTranslations('contact');
  const [loading, setLoading] = useState(false);
  const [sent, setSent] = useState(false);
  const [form, setForm] = useState({ name: '', email: '', phone: '', subject: '', message: '' });
  const [cmsPage, setCmsPage] = useState<CMSPage | null>(null);

  useEffect(() => {
    let mounted = true;
    fetch('/api/cms/page/contact', { cache: 'no-store' })
      .then((r) => r.json())
      .then((data) => {
        if (mounted && data?.success) {
          setCmsPage(data.data);
        }
      })
      .catch(() => {});
    return () => {
      mounted = false;
    };
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    try {
      await fetch('/api/contact', {
        credentials: 'include',
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(form),
      });
      setSent(true);
    } catch { /* ignore */ }
    setLoading(false);
  };

  const heroTitle = cmsPage?.titleZh || t('contact');
  const heroSubtitle = cmsPage?.contentZh || t('heroSubtitle');

  const contactSection = getSection(cmsPage, 'contact_info');
  const contactItems = contactSection?.items?.length
    ? contactSection.items
    : [
        { id: 'c1', titleZh: t('contactPhone'), subtitleZh: t('contactPhoneSub'), descriptionZh: '400-888-8888', icon: 'phone' },
        { id: 'c2', titleZh: t('contactEmail'), subtitleZh: t('contactEmailSub'), descriptionZh: 'contact@labtest.com', icon: 'mail' },
        { id: 'c3', titleZh: t('contactAddress'), subtitleZh: t('contactAddressSub'), descriptionZh: '北京市朝阳区科技园区', icon: 'map' },
        { id: 'c4', titleZh: t('contactHours'), subtitleZh: t('contactHoursSub'), descriptionZh: '周一至周五 9:00 - 18:00', icon: 'clock' },
      ];

  const renderContactIcon = (icon?: string) => {
    switch (icon) {
      case 'phone':
        return <Phone className="h-6 w-6 text-white" />;
      case 'mail':
        return <Mail className="h-6 w-6 text-white" />;
      case 'map':
        return <MapPin className="h-6 w-6 text-white" />;
      case 'clock':
        return <Clock className="h-6 w-6 text-white" />;
      default:
        return <Phone className="h-6 w-6 text-white" />;
    }
  };

  const renderContactBg = (icon?: string) => {
    switch (icon) {
      case 'phone':
        return 'bg-gradient-to-br from-blue-600 to-blue-700';
      case 'mail':
        return 'bg-gradient-to-br from-emerald-500 to-emerald-600';
      case 'map':
        return 'bg-gradient-to-br from-orange-500 to-orange-600';
      case 'clock':
        return 'bg-gradient-to-br from-purple-500 to-purple-600';
      default:
        return 'bg-gradient-to-br from-blue-600 to-blue-700';
    }
  };

  return (
    <div className="min-h-screen bg-gray-50">
      <Header />

      {/* Hero */}
      <section className="relative overflow-hidden bg-gradient-to-br from-slate-900 via-slate-800 to-indigo-950 text-white">
        <div className="absolute inset-0 opacity-20">
          <div className="absolute -top-24 -right-24 h-96 w-96 rounded-full bg-blue-500 blur-3xl" />
          <div className="absolute -bottom-24 -left-24 h-96 w-96 rounded-full bg-indigo-500 blur-3xl" />
        </div>
        <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16 text-center">
          <div className="inline-flex items-center gap-2 rounded-full bg-white/10 px-4 py-1.5 text-sm font-medium text-blue-200 backdrop-blur mb-6">
            <MessageSquare className="h-4 w-4" />
            我们随时为您提供帮助
          </div>
          <h1 className="text-4xl md:text-5xl font-bold mb-4">{heroTitle}</h1>
          <p className="text-lg text-slate-300 max-w-2xl mx-auto">{heroSubtitle}</p>
        </div>
      </section>

      {/* Contact Info Cards */}
      <section className="relative -mt-10 z-10">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-4">
            {contactItems.map((item) => (
              <Card key={item.id} padding="md" className="border-0 shadow-lg">
                <div className="flex items-start gap-4">
                  <div className={`inline-flex h-12 w-12 shrink-0 items-center justify-center rounded-xl ${renderContactBg(item.icon)} shadow-md`}>
                    {renderContactIcon(item.icon)}
                  </div>
                  <div>
                    <h3 className="font-semibold text-gray-900">{item.titleZh}</h3>
                    <p className="text-gray-700 mt-1 font-medium">{item.descriptionZh}</p>
                    <p className="text-xs text-gray-400 mt-0.5">{item.subtitleZh}</p>
                  </div>
                </div>
              </Card>
            ))}
          </div>
        </div>
      </section>

      <section className="py-16">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid lg:grid-cols-5 gap-10">
            {/* Form */}
            <div className="lg:col-span-3">
              <Card padding="lg" className="border-0 shadow-xl">
                {sent ? (
                  <div className="text-center py-16">
                    <div className="mx-auto mb-6 flex h-20 w-20 items-center justify-center rounded-full bg-green-50">
                      <CheckCircle2 className="h-10 w-10 text-green-500" />
                    </div>
                    <h2 className="text-2xl font-bold text-gray-900 mb-2">{t('successTitle')}</h2>
                    <p className="text-gray-500">{t('successDesc')}</p>
                    <Button
                      className="mt-6"
                      variant="outline"
                      onClick={() => {
                        setSent(false);
                        setForm({ name: '', email: '', phone: '', subject: '', message: '' });
                      }}
                    >
                      再次发送
                    </Button>
                  </div>
                ) : (
                  <form onSubmit={handleSubmit} className="space-y-5">
                    <div className="flex items-center gap-3 mb-2">
                      <div className="h-8 w-1 rounded-full bg-gradient-to-b from-blue-600 to-indigo-600" />
                      <h2 className="text-xl font-bold text-gray-900">{t('sendMessage')}</h2>
                    </div>
                    <div className="grid sm:grid-cols-2 gap-4">
                      <Input label={t('name')} required value={form.name} onChange={e => setForm(p => ({ ...p, name: e.target.value }))} />
                      <Input label={t('email')} type="email" required value={form.email} onChange={e => setForm(p => ({ ...p, email: e.target.value }))} />
                    </div>
                    <div className="grid sm:grid-cols-2 gap-4">
                      <Input label={t('phone')} value={form.phone} onChange={e => setForm(p => ({ ...p, phone: e.target.value }))} />
                      <Select label={t('subject')} options={[
                        { value: 'general', label: t('subjectGeneral') },
                        { value: 'testing', label: t('subjectTesting') },
                        { value: 'pricing', label: t('subjectPricing') },
                        { value: 'cooperation', label: t('subjectCooperation') },
                        { value: 'complaint', label: t('subjectComplaint') },
                      ]} placeholder={t('placeholderSubject')} value={form.subject} onChange={e => setForm(p => ({ ...p, subject: e.target.value }))} />
                    </div>
                    <Textarea label={t('message')} required rows={6} value={form.message} onChange={e => setForm(p => ({ ...p, message: e.target.value }))} />
                    <div className="flex items-center gap-2 text-xs text-gray-400">
                      <ShieldCheck className="h-4 w-4" />
                      <span>您的信息将被加密处理，仅用于客服回复。</span>
                    </div>
                    <Button type="submit" loading={loading} size="lg" className="w-full sm:w-auto">
                      <Send className="h-4 w-4 mr-2" />
                      {t('submit')}
                    </Button>
                  </form>
                )}
              </Card>
            </div>

            {/* Right sidebar */}
            <div className="lg:col-span-2 space-y-6">
              {/* Quick FAQ */}
              <Card padding="lg" className="border-0 shadow-lg bg-gradient-to-br from-slate-800 to-slate-900 text-white">
                <h3 className="text-lg font-bold mb-4">常见问题</h3>
                <div className="space-y-4">
                  {[
                    { q: '检测报告多久出具？', a: '常规项目3-5个工作日，加急可24小时出报告。' },
                    { q: '是否支持上门取样？', a: '支持，覆盖全国主要城市，专员上门取样。' },
                    { q: '如何查询订单进度？', a: '登录后在"我的订单"中可实时查看检测进度。' },
                  ].map((faq, i) => (
                    <div key={i} className="border-b border-white/10 pb-3 last:border-0">
                      <p className="font-medium text-sm text-blue-200">{faq.q}</p>
                      <p className="text-sm text-slate-300 mt-1">{faq.a}</p>
                    </div>
                  ))}
                </div>
              </Card>

              {/* Map Placeholder */}
              <Card padding="none" className="border-0 shadow-lg overflow-hidden">
                <div className="bg-gradient-to-br from-blue-50 to-indigo-50 h-56 flex flex-col items-center justify-center gap-3">
                  <MapPin className="h-10 w-10 text-blue-400" />
                  <p className="text-gray-500 text-sm">{t('mapPlaceholder')}</p>
                </div>
              </Card>
            </div>
          </div>
        </div>
      </section>
      <Footer />
    </div>
  );
}
