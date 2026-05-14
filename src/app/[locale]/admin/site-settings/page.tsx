'use client';

import { useState, useEffect, useCallback, useRef } from 'react';
import { AdminLayout } from '@/components/layout/admin-layout';
import { useSiteSettings } from '@/components/providers/SiteSettingsProvider';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Skeleton } from '@/components/ui/skeleton';
import { MediaPicker } from '@/components/admin/media-picker';
import {
  Globe, Mail, Phone, MapPin, Image, FileText, Save, Upload, X, FlaskConical,
  Palette, ShieldAlert, Eye, EyeOff, KeyRound,
} from 'lucide-react';

interface SiteSettingData {
  id?: string;
  siteName?: string;
  siteNameEn?: string;
  logoUrl?: string;
  logoUploadUrl?: string;
  faviconUrl?: string;
  brandColor?: string;
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
  footerCopyrightZh?: string;
  footerCopyrightEn?: string;
  footerContactPhone?: string;
  footerContactEmail?: string;
  footerContactAddress?: string;
  footerIcp?: string;
  footerSocialLinks?: Record<string, string>;
  seoTitleZh?: string;
  seoTitleEn?: string;
  seoDescriptionZh?: string;
  seoDescriptionEn?: string;
  seoKeywordsZh?: string;
  seoKeywordsEn?: string;
}

interface AppConfigItem {
  key: string;
  value: string;
  category?: string;
  description?: string;
}

const APP_CONFIG_CATEGORIES: Record<string, string> = {
  maps: '地图服务',
  email: '邮件服务',
  sms: '短信服务',
  storage: '存储服务',
  payment: '支付服务',
  general: '通用配置',
};

export default function AdminSiteSettingsPage() {
  const [data, setData] = useState<SiteSettingData>({});
  const [appConfig, setAppConfig] = useState<Record<string, string>>({});
  const [appConfigMeta, setAppConfigMeta] = useState<AppConfigItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [savingAppConfig, setSavingAppConfig] = useState(false);
  const [message, setMessage] = useState('');
  const [fetchError, setFetchError] = useState('');
  const [uploading, setUploading] = useState(false);
  const [showSensitive, setShowSensitive] = useState<Record<string, boolean>>({});
  const [mediaPickerField, setMediaPickerField] = useState<'logo' | 'favicon' | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const { refresh: refreshSiteSettings } = useSiteSettings();

  const fetchData = useCallback(async () => {
    setLoading(true);
    setFetchError('');
    try {
      const [settingsRes, configRes] = await Promise.all([
        fetch('/api/admin/site-settings', { credentials: 'include' }),
        fetch('/api/admin/app-config', { credentials: 'include' }),
      ]);
      const settingsJson = await settingsRes.json();
      const configJson = await configRes.json();

      if (settingsJson?.success && settingsJson.data) {
        setData(settingsJson.data as SiteSettingData);
      } else {
        setFetchError(settingsJson?.error || '加载设置失败');
      }

      if (configJson?.success && configJson.data) {
        setAppConfig(configJson.data as Record<string, string>);
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

  const handleSocialLinkChange = (platform: string, value: string) => {
    setData((prev) => ({
      ...prev,
      footerSocialLinks: { ...(prev.footerSocialLinks || {}), [platform]: value },
    }));
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
      const res = await fetch('/api/admin/upload', {
        method: 'POST',
        credentials: 'include',
        body: formData,
      });
      const json = await res.json();
      if (json?.success && json.data?.url) {
        const updated = { ...data, logoUploadUrl: json.data.url };
        setData(updated);
        setMessage('Logo 上传成功，正在自动保存…');
        const saveRes = await fetch('/api/admin/site-settings', {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(updated),
          credentials: 'include',
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
    } catch {
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
        credentials: 'include',
      });
      const json = await res.json();
      if (json?.success) {
        setMessage('保存成功');
        await refreshSiteSettings();
      } else {
        setMessage(json?.error || '保存失败');
      }
    } catch {
      setMessage('保存失败');
    } finally {
      setSaving(false);
    }
  };

  const handleSaveAppConfig = async (key: string, value: string) => {
    setSavingAppConfig(true);
    try {
      const res = await fetch('/api/admin/app-config', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ key, value }),
        credentials: 'include',
      });
      const json = await res.json();
      if (json?.success) {
        setAppConfig((prev) => ({ ...prev, [key]: value }));
        setMessage(`配置 ${key} 已保存`);
      } else {
        setMessage(json?.error || '保存失败');
      }
    } catch {
      setMessage('保存失败');
    } finally {
      setSavingAppConfig(false);
    }
  };

  const handleMediaSelect = (url: string) => {
    if (mediaPickerField === 'logo') {
      setData((prev) => ({ ...prev, logoUrl: url }));
    } else if (mediaPickerField === 'favicon') {
      setData((prev) => ({ ...prev, faviconUrl: url }));
    }
    setMediaPickerField(null);
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

  const ImageField = ({ label, url, onSelect }: { label: string; url?: string | null; onSelect: () => void }) => (
    <div>
      <label className="mb-1.5 block text-sm font-medium text-gray-700">{label}</label>
      <div className="flex items-center gap-3">
        <button
          type="button"
          onClick={onSelect}
          className="relative flex h-20 w-20 items-center justify-center overflow-hidden rounded-lg border border-dashed border-gray-300 bg-gray-50 hover:border-blue-400"
        >
          {url ? (
            <img src={url} alt="" className="h-full w-full object-cover" />
          ) : (
            <Image className="h-6 w-6 text-gray-400" />
          )}
        </button>
        <div className="flex-1 min-w-0">
          <Input value={url || ''} onChange={() => {}} placeholder="点击左侧选择图片" className="text-xs" readOnly />
          {url && (
            <button type="button" onClick={onSelect} className="mt-1 text-xs text-blue-600 hover:text-blue-700">更换图片</button>
          )}
        </div>
      </div>
    </div>
  );

  // Group app configs by category
  const groupedConfigs = Object.entries(appConfig).reduce((acc, [key, value]) => {
    const meta = appConfigMeta.find((m) => m.key === key);
    const category = meta?.category || 'general';
    if (!acc[category]) acc[category] = [];
    acc[category].push({ key, value, description: meta?.description });
    return acc;
  }, {} as Record<string, Array<{ key: string; value: string; description?: string }>>);

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
          <div className="rounded-lg px-4 py-3 text-sm bg-red-50 text-red-700">{fetchError}</div>
        )}

        {message && (
          <div className={`rounded-lg px-4 py-3 text-sm ${message.includes('成功') || message.includes('已保存') ? 'bg-green-50 text-green-700' : 'bg-red-50 text-red-700'}`}>
            {message}
          </div>
        )}

        {/* ─── Brand Identity ─── */}
        <Section title="品牌信息" icon={Image}>
          <Field label="网站名称" value={data.siteName} onChange={(v) => handleChange('siteName', v)} placeholder="度量衡科研平台" />
          <Field label="网站名称 (EN)" value={data.siteNameEn} onChange={(v) => handleChange('siteNameEn', v)} placeholder="Metrology Platform" />
          <div>
            <label className="mb-1.5 block text-sm font-medium text-gray-700">品牌主色</label>
            <div className="flex items-center gap-3">
              <Input value={data.brandColor || ''} onChange={(e) => handleChange('brandColor', e.target.value)} placeholder="#0066B3" className="w-full" />
              <span className="inline-block h-9 w-9 shrink-0 rounded-lg border border-gray-200 shadow-sm" style={{ backgroundColor: data.brandColor || '#0066B3' }} title="品牌色预览" />
            </div>
          </div>
          <ImageField label="Logo" url={data.logoUrl} onSelect={() => setMediaPickerField('logo')} />
          <ImageField label="Favicon" url={data.faviconUrl} onSelect={() => setMediaPickerField('favicon')} />
        </Section>

        {/* ─── Logo Upload Card ─── */}
        <Card padding="lg" className="mb-6">
          <div className="mb-4 flex items-center gap-2 border-b border-gray-100 pb-3">
            <Palette className="h-5 w-5 text-blue-600" />
            <h2 className="text-lg font-semibold text-gray-900">Logo 上传</h2>
          </div>
          <div className="grid gap-6 md:grid-cols-2">
            <div className="rounded-xl border border-gray-200 bg-gray-50 p-5">
              <div className="mb-3 flex items-center justify-between">
                <span className="text-sm font-medium text-gray-700">当前生效 Logo</span>
                <span className={`rounded-full px-2.5 py-0.5 text-xs font-medium ${logoSource === 'uploaded' ? 'bg-blue-50 text-blue-700' : logoSource === 'manual' ? 'bg-amber-50 text-amber-700' : 'bg-gray-100 text-gray-600'}`}>
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
              <p className="mt-3 text-xs text-gray-500">优先级：上传的 Logo &gt; 手动 URL &gt; 默认图标</p>
            </div>
            <div className="space-y-5">
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
            </div>
          </div>
        </Card>

        {/* ─── SEO Meta Tags ─── */}
        <Section title="SEO / 元数据" icon={FileText}>
          <Field label="SEO 标题 (中文)" value={data.seoTitleZh} onChange={(v) => handleChange('seoTitleZh', v)} placeholder="度量衡科研平台 | 专业科研检测服务" />
          <Field label="SEO 标题 (EN)" value={data.seoTitleEn} onChange={(v) => handleChange('seoTitleEn', v)} placeholder="Metrology Platform | Research Testing Services" />
          <div className="md:col-span-2">
            <Field label="SEO 描述 (中文)" value={data.seoDescriptionZh} onChange={(v) => handleChange('seoDescriptionZh', v)} placeholder="一站式检测服务平台..." type="textarea" />
          </div>
          <div className="md:col-span-2">
            <Field label="SEO 描述 (EN)" value={data.seoDescriptionEn} onChange={(v) => handleChange('seoDescriptionEn', v)} placeholder="One-stop testing service platform..." type="textarea" />
          </div>
          <Field label="SEO 关键词 (中文)" value={data.seoKeywordsZh} onChange={(v) => handleChange('seoKeywordsZh', v)} placeholder="检测, 科研, 实验室, 材料测试" />
          <Field label="SEO 关键词 (EN)" value={data.seoKeywordsEn} onChange={(v) => handleChange('seoKeywordsEn', v)} placeholder="testing, research, laboratory, materials" />
        </Section>

        {/* ─── Footer Contact Info ─── */}
        <Section title="页脚联系信息" icon={Phone}>
          <Field label="页脚电话" value={data.footerContactPhone} onChange={(v) => handleChange('footerContactPhone', v)} placeholder="400-123-4567" />
          <Field label="页脚邮箱" value={data.footerContactEmail} onChange={(v) => handleChange('footerContactEmail', v)} placeholder="support@labtest.com" />
          <div className="md:col-span-2">
            <Field label="页脚地址" value={data.footerContactAddress} onChange={(v) => handleChange('footerContactAddress', v)} placeholder="中国上海市浦东新区张江高科技园区" type="textarea" />
          </div>
          <Field label="页脚版权 (中文)" value={data.footerCopyrightZh} onChange={(v) => handleChange('footerCopyrightZh', v)} placeholder="© 2026 度量衡科研平台 版权所有" />
          <Field label="页脚版权 (EN)" value={data.footerCopyrightEn} onChange={(v) => handleChange('footerCopyrightEn', v)} placeholder="© 2026 Metrology Platform. All rights reserved." />
          <Field label="ICP 备案号" value={data.footerIcp} onChange={(v) => handleChange('footerIcp', v)} placeholder="沪ICP备XXXXXXXX号" />
        </Section>

        {/* ─── Footer Social Links ─── */}
        <Section title="页脚社交媒体" icon={Globe}>
          <Field label="Facebook URL" value={data.facebookUrl} onChange={(v) => handleChange('facebookUrl', v)} />
          <Field label="LinkedIn URL" value={data.linkedinUrl} onChange={(v) => handleChange('linkedinUrl', v)} />
          <Field label="YouTube URL" value={data.youtubeUrl} onChange={(v) => handleChange('youtubeUrl', v)} />
          <Field label="微信公众号/ID" value={data.wechat} onChange={(v) => handleChange('wechat', v)} />
          <Field label="WhatsApp" value={data.whatsapp} onChange={(v) => handleChange('whatsapp', v)} />
        </Section>

        {/* ─── Contact Info (legacy) ─── */}
        <Section title="联系方式 (全局)" icon={Mail}>
          <Field label="客服邮箱" value={data.supportEmail} onChange={(v) => handleChange('supportEmail', v)} placeholder="support@labtest.com" />
          <Field label="客服电话" value={data.supportPhone} onChange={(v) => handleChange('supportPhone', v)} placeholder="400-123-4567" />
        </Section>

        {/* ─── Address ─── */}
        <Section title="地址" icon={MapPin}>
          <div className="md:col-span-2">
            <Field label="地址 (中文)" value={data.addressZh} onChange={(v) => handleChange('addressZh', v)} placeholder="中国上海市浦东新区张江高科技园区" type="textarea" />
          </div>
        </Section>

        {/* ─── Footer Text ─── */}
        <Section title="页脚文本" icon={FileText}>
          <div className="md:col-span-2">
            <Field label="页脚介绍 (中文)" value={data.footerTextZh} onChange={(v) => handleChange('footerTextZh', v)} placeholder="页脚介绍文字" type="textarea" />
          </div>
          <div className="md:col-span-2">
            <Field label="页脚介绍 (EN)" value={data.footerTextEn} onChange={(v) => handleChange('footerTextEn', v)} placeholder="Footer description" type="textarea" />
          </div>
        </Section>

        {/* ─── Sensitive App Config ─── */}
        <Card padding="lg" className="mb-6 border-amber-200">
          <div className="mb-4 flex items-center gap-2 border-b border-amber-100 pb-3">
            <ShieldAlert className="h-5 w-5 text-amber-600" />
            <h2 className="text-lg font-semibold text-gray-900">敏感配置 (API 密钥 / 服务凭证)</h2>
            <span className="ml-auto rounded-full bg-amber-50 px-2.5 py-0.5 text-xs font-medium text-amber-700">
              管理员可见 · 不暴露给前端
            </span>
          </div>

          <div className="space-y-4">
            {Object.keys(appConfig).length === 0 ? (
              <div className="text-sm text-gray-500">暂无敏感配置。请在数据库中初始化 AppConfig 表。</div>
            ) : (
              Object.entries(appConfig).map(([key, value]) => (
                <div key={key} className="flex items-center gap-3">
                  <div className="w-48 shrink-0">
                    <label className="block text-xs font-medium text-gray-600">{key}</label>
                  </div>
                  <div className="relative flex-1">
                    <Input
                      type={showSensitive[key] ? 'text' : 'password'}
                      value={value}
                      onChange={(e) => setAppConfig((prev) => ({ ...prev, [key]: e.target.value }))}
                      className="pr-10 text-sm font-mono"
                    />
                    <button
                      type="button"
                      onClick={() => setShowSensitive((prev) => ({ ...prev, [key]: !prev[key] }))}
                      className="absolute right-2 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
                    >
                      {showSensitive[key] ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                    </button>
                  </div>
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() => handleSaveAppConfig(key, appConfig[key] || '')}
                    loading={savingAppConfig}
                  >
                    <KeyRound className="mr-1 h-3.5 w-3.5" />
                    保存
                  </Button>
                </div>
              ))
            )}
          </div>
        </Card>

        <div className="flex justify-end pb-8">
          <Button onClick={handleSave} loading={saving} size="lg">
            <Save className="mr-2 h-4 w-4" />
            保存设置
          </Button>
        </div>
      </div>

      <MediaPicker
        isOpen={!!mediaPickerField}
        onClose={() => setMediaPickerField(null)}
        onSelect={handleMediaSelect}
        folder="settings"
      />
    </AdminLayout>
  );
}
