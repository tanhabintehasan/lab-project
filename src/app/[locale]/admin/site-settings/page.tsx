'use client';

import { useState, useEffect, useCallback, useRef } from 'react';
import { AdminLayout } from '@/components/layout/admin-layout';
import { useSiteSettings } from '@/components/providers/SiteSettingsProvider';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Skeleton } from '@/components/ui/skeleton';
import { Globe, Mail, Phone, MapPin, Image, FileText, Save, Upload, X, FlaskConical, Palette } from 'lucide-react';

interface SiteSettingData {
  id?: string;
  siteName?: string;
  siteNameEn?: string;
  logoUrl?: string;
  logoUploadUrl?: string;
  brandColor?: string;
  faviconUrl?: string;
  supportEmail?: string;
  supportPhone?: string;
  whatsapp?: string;
  wechat?: string;
  addressZh?: string;
  addressEn?: string;
  facebookUrl?: string;
  linkedinUrl?: string;
  youtubeUrl?: string;
  footerTextZh?: string;
  footerTextEn?: string;
  seoTitleZh?: string;
  seoTitleEn?: string;
  seoDescriptionZh?: string;
  seoDescriptionEn?: string;
}

export default function AdminSiteSettingsPage() {
  const [data, setData] = useState<SiteSettingData>({});
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [message, setMessage] = useState('');
  const [fetchError, setFetchError] = useState('');
  const fileInputRef = useRef<HTMLInputElement>(null);
  const { refresh: refreshSiteSettings } = useSiteSettings();

  const fetchData = useCallback(async () => {
    setLoading(true);
    setFetchError('');
    try {
      const res = await fetch('/api/admin/site-settings');
      const json = await res.json();
      if (json?.success && json.data) {
        setData(json.data);
      } else {
        setFetchError(json?.error || '加载设置失败，请刷新重试');
      }
    } catch (e) {
      setFetchError('网络错误，无法加载设置');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  const handleChange = (field: keyof SiteSettingData, value: string) => {
    setData((prev) => ({ ...prev, [field]: value }));
  };

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    if (!file.type.startsWith('image/')) {
      setMessage('请上传图片文件');
      return;
    }
    setUploading(true);
    setMessage('');
    try {
      const formData = new FormData();
      formData.append('file', file);
      formData.append('folder', 'settings');
      formData.append('entityType', 'settings');
      const res = await fetch('/api/uploads', {
        method: 'POST',
        credentials: 'include',
        body: formData,
      });
      const json = await res.json();
      if (json?.success && json.data?.file?.url) {
        const updated = { ...data, logoUploadUrl: json.data.file.url };
        setData(updated);
        setMessage('Logo 上传成功，正在自动保存…');
        // Auto-save logo upload so it persists to DB and updates frontend immediately
        const saveRes = await fetch('/api/admin/site-settings', {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(updated),
        });
        const saveJson = await saveRes.json();
        if (saveJson?.success) {
          setMessage('Logo 已上传并保存');
          await refreshSiteSettings();
        } else {
          setMessage(saveJson?.error || 'Logo 上传成功但保存失败');
        }
      } else {
        setMessage(json?.error || '上传失败');
      }
    } catch (err) {
      setMessage('上传失败');
    } finally {
      setUploading(false);
      if (fileInputRef.current) fileInputRef.current.value = '';
    }
  };

  const clearUploadedLogo = () => {
    setData((prev) => ({ ...prev, logoUploadUrl: undefined }));
  };

  const handleSave = async () => {
    setSaving(true);
    setMessage('');
    try {
      const res = await fetch('/api/admin/site-settings', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data),
      });
      const json = await res.json();
      if (json?.success) {
        setMessage('保存成功');
        await refreshSiteSettings();
      } else {
        setMessage(json?.error || '保存失败');
      }
    } catch (e) {
      setMessage('保存失败');
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <AdminLayout>
        <div className="space-y-6 max-w-5xl">
          <h1 className="text-2xl font-bold text-gray-900">网站设置</h1>
          <Skeleton className="h-96 w-full" />
        </div>
      </AdminLayout>
    );
  }

  const activeLogo = data.logoUploadUrl || data.logoUrl;
  const logoSource = data.logoUploadUrl ? 'uploaded' : data.logoUrl ? 'manual' : 'fallback';

  const Section = ({ title, icon: Icon, children }: { title: string; icon: any; children: React.ReactNode }) => (
    <Card padding="lg" className="mb-6">
      <div className="mb-4 flex items-center gap-2 border-b border-gray-100 pb-3">
        <Icon className="h-5 w-5 text-blue-600" />
        <h2 className="text-lg font-semibold text-gray-900">{title}</h2>
      </div>
      <div className="grid gap-5 md:grid-cols-2">{children}</div>
    </Card>
  );

  const Field = ({ label, value, onChange, placeholder, type = 'text' }: { label: string; value?: string; onChange: (v: string) => void; placeholder?: string; type?: string }) => (
    <div>
      <label className="mb-1.5 block text-sm font-medium text-gray-700">{label}</label>
      {type === 'textarea' ? (
        <textarea
          value={value || ''}
          onChange={(e) => onChange(e.target.value)}
          placeholder={placeholder}
          className="min-h-[80px] w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
        />
      ) : (
        <Input value={value || ''} onChange={(e) => onChange(e.target.value)} placeholder={placeholder} className="w-full" />
      )}
    </div>
  );

  return (
    <AdminLayout>
      <div className="mx-auto max-w-5xl space-y-6">
        <div className="flex items-center justify-between">
          <h1 className="text-2xl font-bold text-gray-900">网站设置</h1>
          <Button onClick={handleSave} loading={saving}>
            <Save className="mr-2 h-4 w-4" />
            保存设置
          </Button>
        </div>

        {fetchError && (
          <div className="rounded-lg px-4 py-3 text-sm bg-red-50 text-red-700">
            {fetchError}
          </div>
        )}

        {message && (
          <div className={`rounded-lg px-4 py-3 text-sm ${message.includes('成功') ? 'bg-green-50 text-green-700' : 'bg-red-50 text-red-700'}`}>
            {message}
          </div>
        )}

        {/* Brand Identity */}
        <Section title="品牌信息" icon={Image}>
          <Field label="网站名称" value={data.siteName} onChange={(v) => handleChange('siteName', v)} placeholder="度量衡科研平台" />
          <div>
            <label className="mb-1.5 block text-sm font-medium text-gray-700">品牌主色</label>
            <div className="flex items-center gap-3">
              <Input
                value={data.brandColor || ''}
                onChange={(e) => handleChange('brandColor', e.target.value)}
                placeholder="#0066B3"
                className="w-full"
              />
              <span
                className="inline-block h-9 w-9 shrink-0 rounded-lg border border-gray-200 shadow-sm"
                style={{ backgroundColor: data.brandColor || '#0066B3' }}
                title="品牌色预览"
              />
            </div>
          </div>
          <Field label="Favicon URL" value={data.faviconUrl} onChange={(v) => handleChange('faviconUrl', v)} placeholder="/favicon.ico" />
        </Section>

        {/* Logo Management */}
        <Card padding="lg" className="mb-6">
          <div className="mb-4 flex items-center gap-2 border-b border-gray-100 pb-3">
            <Palette className="h-5 w-5 text-blue-600" />
            <h2 className="text-lg font-semibold text-gray-900">Logo 管理</h2>
          </div>

          <div className="grid gap-6 md:grid-cols-2">
            {/* Active Preview */}
            <div className="rounded-xl border border-gray-200 bg-gray-50 p-5">
              <div className="mb-3 flex items-center justify-between">
                <span className="text-sm font-medium text-gray-700">当前生效 Logo</span>
                <span
                  className={`rounded-full px-2.5 py-0.5 text-xs font-medium ${
                    logoSource === 'uploaded'
                      ? 'bg-blue-50 text-blue-700'
                      : logoSource === 'manual'
                        ? 'bg-amber-50 text-amber-700'
                        : 'bg-gray-100 text-gray-600'
                  }`}
                >
                  {logoSource === 'uploaded' ? '上传的 Logo' : logoSource === 'manual' ? '手动 URL' : '默认图标'}
                </span>
              </div>
              <div className="flex h-24 items-center justify-center rounded-lg bg-white">
                {activeLogo ? (
                  <img src={activeLogo} alt="Logo preview" className="h-16 w-auto object-contain" />
                ) : (
                  <div className="flex items-center gap-2 text-gray-500">
                    <FlaskConical className="h-10 w-10" />
                    <span className="text-lg font-bold">{data.siteName || '度量衡科研平台'}</span>
                  </div>
                )}
              </div>
              <p className="mt-3 text-xs text-gray-500">
                优先级：上传的 Logo &gt; 手动 URL &gt; 默认图标
              </p>
            </div>

            {/* Controls */}
            <div className="space-y-5">
              {/* Upload */}
              <div>
                <label className="mb-1.5 block text-sm font-medium text-gray-700">上传 Logo</label>
                <div className="flex items-center gap-3">
                  <input ref={fileInputRef} type="file" accept="image/*" className="hidden" onChange={handleFileChange} />
                  <Button type="button" variant="outline" onClick={() => fileInputRef.current?.click()} loading={uploading}>
                    <Upload className="mr-2 h-4 w-4" />
                    选择图片上传
                  </Button>
                  {data.logoUploadUrl && (
                    <Button type="button" variant="ghost" size="sm" onClick={clearUploadedLogo} className="text-red-600 hover:text-red-700">
                      <X className="mr-1 h-4 w-4" />
                      清除上传
                    </Button>
                  )}
                </div>
                {data.logoUploadUrl && (
                  <div className="mt-3 rounded-lg border border-blue-100 bg-blue-50 p-3">
                    <p className="mb-2 text-xs font-medium text-blue-700">已上传图片预览</p>
                    <img src={data.logoUploadUrl} alt="Uploaded logo" className="h-10 w-auto object-contain" />
                  </div>
                )}
              </div>

              {/* Manual URL */}
              <div>
                <label className="mb-1.5 block text-sm font-medium text-gray-700">Logo 手动 URL</label>
                <Input
                  value={data.logoUrl || ''}
                  onChange={(e) => handleChange('logoUrl', e.target.value)}
                  placeholder="/logo.png 或 https://example.com/logo.png"
                  className="w-full"
                />
                {data.logoUrl && !data.logoUploadUrl && (
                  <div className="mt-3 rounded-lg border border-amber-100 bg-amber-50 p-3">
                    <p className="mb-2 text-xs font-medium text-amber-700">手动 URL 预览</p>
                    <img src={data.logoUrl} alt="Manual logo" className="h-10 w-auto object-contain" />
                  </div>
                )}
              </div>
            </div>
          </div>
        </Card>

        <Section title="联系方式" icon={Phone}>
          <Field label="客服邮箱" value={data.supportEmail} onChange={(v) => handleChange('supportEmail', v)} placeholder="support@labtest.com" />
          <Field label="客服电话" value={data.supportPhone} onChange={(v) => handleChange('supportPhone', v)} placeholder="400-123-4567" />
          <Field label="WhatsApp" value={data.whatsapp} onChange={(v) => handleChange('whatsapp', v)} />
          <Field label="微信公众号/ID" value={data.wechat} onChange={(v) => handleChange('wechat', v)} />
        </Section>

        <Section title="地址" icon={MapPin}>
          <div className="md:col-span-2">
            <Field label="地址" value={data.addressZh} onChange={(v) => handleChange('addressZh', v)} placeholder="中国上海市浦东新区张江高科技园区" type="textarea" />
          </div>
        </Section>

        <Section title="社交媒体" icon={Globe}>
          <Field label="Facebook URL" value={data.facebookUrl} onChange={(v) => handleChange('facebookUrl', v)} />
          <Field label="LinkedIn URL" value={data.linkedinUrl} onChange={(v) => handleChange('linkedinUrl', v)} />
          <Field label="YouTube URL" value={data.youtubeUrl} onChange={(v) => handleChange('youtubeUrl', v)} />
        </Section>

        <Section title="页脚文本" icon={FileText}>
          <div className="md:col-span-2">
            <Field label="页脚文本" value={data.footerTextZh} onChange={(v) => handleChange('footerTextZh', v)} placeholder="页脚介绍文字" type="textarea" />
          </div>
        </Section>

        <Section title="SEO / 元数据" icon={FileText}>
          <Field label="SEO 标题" value={data.seoTitleZh} onChange={(v) => handleChange('seoTitleZh', v)} placeholder="度量衡科研平台 | 专业科研检测服务" />
          <div className="md:col-span-2">
            <Field label="SEO 描述" value={data.seoDescriptionZh} onChange={(v) => handleChange('seoDescriptionZh', v)} placeholder="SEO描述文字" type="textarea" />
          </div>
        </Section>

        <div className="flex justify-end pb-8">
          <Button onClick={handleSave} loading={saving} size="lg">
            <Save className="mr-2 h-4 w-4" />
            保存设置
          </Button>
        </div>
      </div>
    </AdminLayout>
  );
}
