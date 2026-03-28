'use client';

import { useState } from 'react';
import { useTranslations } from 'next-intl';
import { Header } from '@/components/layout/header';
import { Footer } from '@/components/layout/footer';
import { Card } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Select } from '@/components/ui/select';
import { Button } from '@/components/ui/button';
import { Phone, Mail, MapPin, Clock, CheckCircle2 } from 'lucide-react';

export default function ContactPage() {
  const t = useTranslations('about');
  const [loading, setLoading] = useState(false);
  const [sent, setSent] = useState(false);
  const [form, setForm] = useState({ name: '', email: '', phone: '', subject: '', message: '' });

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

  return (
    <div className="min-h-screen">
      <Header />
      <section className="bg-gradient-to-br from-blue-600 to-indigo-800 text-white py-16">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <h1 className="text-4xl font-bold mb-4">{t('contact')}</h1>
          <p className="text-blue-100 text-lg">我们随时为您提供帮助</p>
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
                    <h2 className="text-2xl font-bold text-gray-900 mb-2">提交成功</h2>
                    <p className="text-gray-500">我们会尽快与您联系</p>
                  </div>
                ) : (
                  <form onSubmit={handleSubmit} className="space-y-4">
                    <h2 className="text-xl font-bold text-gray-900 mb-4">发送消息</h2>
                    <div className="grid sm:grid-cols-2 gap-4">
                      <Input label="姓名" required value={form.name} onChange={e => setForm(p => ({ ...p, name: e.target.value }))} />
                      <Input label="邮箱" type="email" required value={form.email} onChange={e => setForm(p => ({ ...p, email: e.target.value }))} />
                    </div>
                    <div className="grid sm:grid-cols-2 gap-4">
                      <Input label="电话" value={form.phone} onChange={e => setForm(p => ({ ...p, phone: e.target.value }))} />
                      <Select label="主题" options={[
                        { value: 'general', label: '一般咨询' },
                        { value: 'testing', label: '检测服务' },
                        { value: 'pricing', label: '价格咨询' },
                        { value: 'cooperation', label: '合作洽谈' },
                        { value: 'complaint', label: '投诉建议' },
                      ]} placeholder="请选择" value={form.subject} onChange={e => setForm(p => ({ ...p, subject: e.target.value }))} />
                    </div>
                    <Textarea label="消息内容" required rows={6} value={form.message} onChange={e => setForm(p => ({ ...p, message: e.target.value }))} />
                    <Button type="submit" loading={loading} size="lg">提交</Button>
                  </form>
                )}
              </Card>
            </div>

            {/* Contact Info */}
            <div className="space-y-6">
              <Card padding="md">
                <div className="flex items-start gap-4">
                  <div className="p-2.5 bg-blue-100 rounded-lg"><Phone className="h-5 w-5 text-blue-600" /></div>
                  <div>
                    <h3 className="font-semibold text-gray-900">电话咨询</h3>
                    <p className="text-gray-600 mt-1">400-888-8888</p>
                    <p className="text-sm text-gray-400">周一至周五 9:00-18:00</p>
                  </div>
                </div>
              </Card>
              <Card padding="md">
                <div className="flex items-start gap-4">
                  <div className="p-2.5 bg-green-100 rounded-lg"><Mail className="h-5 w-5 text-green-600" /></div>
                  <div>
                    <h3 className="font-semibold text-gray-900">邮件联系</h3>
                    <p className="text-gray-600 mt-1">contact@labtest.com</p>
                    <p className="text-sm text-gray-400">24小时内回复</p>
                  </div>
                </div>
              </Card>
              <Card padding="md">
                <div className="flex items-start gap-4">
                  <div className="p-2.5 bg-orange-100 rounded-lg"><MapPin className="h-5 w-5 text-orange-600" /></div>
                  <div>
                    <h3 className="font-semibold text-gray-900">公司地址</h3>
                    <p className="text-gray-600 mt-1">北京市朝阳区科技园区</p>
                    <p className="text-sm text-gray-400">欢迎来访</p>
                  </div>
                </div>
              </Card>
              <Card padding="md">
                <div className="flex items-start gap-4">
                  <div className="p-2.5 bg-purple-100 rounded-lg"><Clock className="h-5 w-5 text-purple-600" /></div>
                  <div>
                    <h3 className="font-semibold text-gray-900">工作时间</h3>
                    <p className="text-gray-600 mt-1">周一至周五 9:00 - 18:00</p>
                    <p className="text-sm text-gray-400">法定节假日除外</p>
                  </div>
                </div>
              </Card>

              {/* Map Placeholder */}
              <div className="bg-gray-100 rounded-xl h-48 flex items-center justify-center">
                <p className="text-gray-400">地图加载区域</p>
              </div>
            </div>
          </div>
        </div>
      </section>
      <Footer />
    </div>
  );
}
