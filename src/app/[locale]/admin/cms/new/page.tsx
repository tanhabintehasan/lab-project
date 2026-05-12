'use client';

import { useState } from 'react';
import { useRouter } from '@/i18n/routing';
import { AdminLayout } from '@/components/layout/admin-layout';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { ArrowLeft, Save } from 'lucide-react';

export default function AdminCMSNewPage() {
  const router = useRouter();
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState('');
  const [data, setData] = useState({
    slug: '',
    type: 'page',
    titleZh: '',
    contentZh: '',
    excerpt: '',
    coverImage: '',
    isPublished: false,
    sortOrder: 0,
  });

  const handleSave = async () => {
    if (!data.titleZh.trim()) {
      setMessage('请输入标题');
      return;
    }
    setSaving(true);
    setMessage('');
    try {
      const res = await fetch('/api/admin/cms', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data),
      });
      const json = await res.json();
      if (json?.success) {
        router.push('/admin/cms');
      } else {
        setMessage(json?.error || '创建失败');
      }
    } catch (e) {
      setMessage('创建失败');
    } finally {
      setSaving(false);
    }
  };

  return (
    <AdminLayout>
      <div className="mx-auto max-w-4xl space-y-6">
        <div className="flex items-center gap-3">
          <Button variant="outline" size="sm" onClick={() => router.push('/admin/cms')}>
            <ArrowLeft className="mr-2 h-4 w-4" />
            返回
          </Button>
          <h1 className="text-2xl font-bold text-gray-900">新建内容</h1>
        </div>

        {message && (
          <div className={`rounded-lg px-4 py-3 text-sm ${message.includes('成功') ? 'bg-green-50 text-green-700' : 'bg-red-50 text-red-700'}`}>
            {message}
          </div>
        )}

        <Card padding="lg" className="space-y-5">
          <div className="grid gap-5 md:grid-cols-2">
            <div>
              <label className="mb-1.5 block text-sm font-medium text-gray-700">标题 *</label>
              <Input value={data.titleZh} onChange={(e) => setData({ ...data, titleZh: e.target.value })} />
            </div>
            <div>
              <label className="mb-1.5 block text-sm font-medium text-gray-700">Slug</label>
              <Input value={data.slug} onChange={(e) => setData({ ...data, slug: e.target.value })} placeholder="自动生成" />
            </div>
            <div>
              <label className="mb-1.5 block text-sm font-medium text-gray-700">类型</label>
              <select
                value={data.type}
                onChange={(e) => setData({ ...data, type: e.target.value })}
                className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
              >
                <option value="page">页面 (page)</option>
                <option value="homepage">首页 (homepage)</option>
                <option value="article">文章 (article)</option>
                <option value="faq">FAQ</option>
                <option value="news">新闻 (news)</option>
                <option value="banner">横幅 (banner)</option>
              </select>
            </div>
            <div>
              <label className="mb-1.5 block text-sm font-medium text-gray-700">排序</label>
              <Input type="number" value={data.sortOrder} onChange={(e) => setData({ ...data, sortOrder: Number(e.target.value) })} />
            </div>
            <div>
              <label className="mb-1.5 block text-sm font-medium text-gray-700">封面图片 URL</label>
              <Input value={data.coverImage} onChange={(e) => setData({ ...data, coverImage: e.target.value })} placeholder="/images/cover.jpg" />
            </div>
          </div>

          <div className="flex items-center gap-3">
            <label className="flex items-center gap-2 text-sm text-gray-700">
              <input
                type="checkbox"
                checked={data.isPublished}
                onChange={(e) => setData({ ...data, isPublished: e.target.checked })}
                className="h-4 w-4 rounded border-gray-300 text-blue-600 focus:ring-blue-500"
              />
              发布
            </label>
          </div>

          <div>
            <label className="mb-1.5 block text-sm font-medium text-gray-700">摘要</label>
            <textarea
              value={data.excerpt}
              onChange={(e) => setData({ ...data, excerpt: e.target.value })}
              className="min-h-[60px] w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
            />
          </div>

          <div>
            <label className="mb-1.5 block text-sm font-medium text-gray-700">正文</label>
            <textarea
              value={data.contentZh}
              onChange={(e) => setData({ ...data, contentZh: e.target.value })}
              className="min-h-[200px] w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
            />
          </div>
        </Card>

        <div className="flex justify-end pb-8">
          <Button onClick={handleSave} loading={saving} size="lg">
            <Save className="mr-2 h-4 w-4" />
            创建内容
          </Button>
        </div>
      </div>
    </AdminLayout>
  );
}
