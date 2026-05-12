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
import { Phone, Mail, MapPin, Clock, CheckCircle2 } from 'lucide-react';

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
        { id: 'c3', titleZh: t('contactAddress'), subtitleZh: t('contactAddressSub'), descriptionZh: 'Beijing Chaoyang Science Park', icon: 'map' },
        { id: 'c4', titleZh: t('contactHours'), subtitleZh: t('contactHoursSub'), descriptionZh: 'Mon-Fri 9:00 - 18:00', icon: 'clock' },
      ];

  const renderContactIcon = (icon?: string) => {
    switch (icon) {
      case 'phone':
        return <Phone className="h-5 w-5 text-blue-600" />;
      case 'mail':
        return <Mail className="h-5 w-5 text-green-600" />;
      case 'map':
        return <MapPin className="h-5 w-5 text-orange-600" />;
      case 'clock':
        return <Clock className="h-5 w-5 text-purple-600" />;
      default:
        return <Phone className="h-5 w-5 text-blue-600" />;
    }
  };

  const renderContactBg = (icon?: string) => {
    switch (icon) {
      case 'phone':
        return 'bg-blue-100';
      case 'mail':
        return 'bg-green-100';
      case 'map':
        return 'bg-orange-100';
      case 'clock':
        return 'bg-purple-100';
      default:
        return 'bg-blue-100';
    }
  };

  return (
    <div className="min-h-screen">
      <Header />
      <section className="bg-gradient-to-br from-blue-600 to-indigo-800 text-white py-16">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <h1 className="text-4xl font-bold mb-4">{heroTitle}</h1>
          <p className="text-blue-100 text-lg">{heroSubtitle}</p>
        </div>
      </section>

      <section className="py-16">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid lg:grid-cols-3 gap-8">
            {/* Form */}
            <div className="lg:col-span-2">
              <Card padding="lg">
                {sent ? (
                  <div className="text-center py-12">
                    <CheckCircle2 className="h-16 w-16 text-green-500 mx-auto mb-4" />
                    <h2 className="text-2xl font-bold text-gray-900 mb-2">{t('successTitle')}</h2>
                    <p className="text-gray-500">{t('successDesc')}</p>
                  </div>
                ) : (
                  <form onSubmit={handleSubmit} className="space-y-4">
                    <h2 className="text-xl font-bold text-gray-900 mb-4">{t('sendMessage')}</h2>
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
                    <Button type="submit" loading={loading} size="lg">{t('submit')}</Button>
                  </form>
                )}
              </Card>
            </div>

            {/* Contact Info */}
            <div className="space-y-6">
              {contactItems.map((item) => (
                <Card key={item.id} padding="md">
                  <div className="flex items-start gap-4">
                    <div className={`p-2.5 rounded-lg ${renderContactBg(item.icon)}`}>
                      {renderContactIcon(item.icon)}
                    </div>
                    <div>
                      <h3 className="font-semibold text-gray-900">{item.titleZh}</h3>
                      <p className="text-gray-600 mt-1">{item.descriptionZh}</p>
                      <p className="text-sm text-gray-400">{item.subtitleZh}</p>
                    </div>
                  </div>
                </Card>
              ))}

              {/* Map Placeholder */}
              <div className="bg-gray-100 rounded-xl h-48 flex items-center justify-center">
                <p className="text-gray-400">{t('mapPlaceholder')}</p>
              </div>
            </div>
          </div>
        </div>
      </section>
      <Footer />
    </div>
  );
}
