'use client';

import { useState, useEffect, useCallback } from 'react';
import { useRouter } from '@/i18n/routing';
import { AdminLayout } from '@/components/layout/admin-layout';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { MediaPicker } from '@/components/admin/media-picker';
import {
  ArrowLeft,
  Save,
  Plus,
  Trash2,
  GripVertical,
  Image as ImageIcon,
  LayoutTemplate,
  Palette,
  Eye,
  ChevronUp,
  ChevronDown,
  Loader2,
} from 'lucide-react';

/* ─── Types ─── */

interface CMSItem {
  id: string;
  titleZh?: string | null;
  subtitleZh?: string | null;
  descriptionZh?: string | null;
  imageUrl?: string | null;
  linkUrl?: string | null;
  linkLabelZh?: string | null;
  value?: string | null;
  sortOrder?: number;
  isEnabled: boolean;
}

interface CMSSection {
  id: string;
  sectionKey: string;
  name?: string | null;
  titleZh?: string | null;
  subtitleZh?: string | null;
  badgeZh?: string | null;
  descriptionZh?: string | null;
  imageUrl?: string | null;
  layoutType?: string | null;
  styleVariant?: string | null;
  isEnabled: boolean;
  isPublished: boolean;
  sortOrder?: number;
  items?: CMSItem[];
}

interface CMSPageDetail {
  id: string;
  slug: string;
  type: string;
  titleZh: string;
  isPublished: boolean;
  sortOrder: number;
  sections?: CMSSection[];
}

/* ─── Color Presets ─── */

const COLOR_PRESETS = [
  { key: 'blue', label: '科技蓝', bg: 'bg-blue-600', hex: '#0066B3' },
  { key: 'emerald', label: '实验绿', bg: 'bg-emerald-600', hex: '#059669' },
  { key: 'amber', label: '能源橙', bg: 'bg-amber-600', hex: '#D97706' },
  { key: 'purple', label: '创新紫', bg: 'bg-purple-600', hex: '#7C3AED' },
  { key: 'rose', label: '生物红', bg: 'bg-rose-600', hex: '#E11D48' },
  { key: 'cyan', label: '环境青', bg: 'bg-cyan-600', hex: '#0891B2' },
  { key: 'slate', label: '商务灰', bg: 'bg-slate-600', hex: '#475569' },
];

function getColorPreset(key?: string | null) {
  return COLOR_PRESETS.find((c) => c.key === key) || COLOR_PRESETS[0];
}

function genId(prefix: string) {
  return `${prefix}-${Date.now()}-${Math.floor(Math.random() * 1000000)}`;
}

/* ─── Component ─── */

export default function HomepageCMSManager() {
  const router = useRouter();
  const [data, setData] = useState<CMSPageDetail | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState('');
  const [mediaPickerTarget, setMediaPickerTarget] = useState<{
    sectionId: string;
    itemId?: string;
    field: 'imageUrl' | 'sectionImage';
  } | null>(null);

  /* Fetch homepage CMS data */
  const fetchData = useCallback(async () => {
    setLoading(true);
    try {
      const res = await fetch('/api/admin/cms/homepage', { credentials: 'include' });
      const json = await res.json();
      if (json?.success && json.data) {
        setData(json.data);
      } else {
        setMessage(json?.error || '加载失败');
      }
    } catch (e) {
      console.error(e);
      setMessage('网络错误');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  /* Helpers: get or create sections */
  const getOrCreateSection = useCallback(
    (sectionKey: string, defaults: Partial<CMSSection>): CMSSection => {
      const existing = data?.sections?.find((s) => s.sectionKey === sectionKey);
      if (existing) return existing;
      return {
        id: genId('sec'),
        sectionKey,
        isEnabled: true,
        isPublished: true,
        sortOrder: 0,
        items: [],
        ...defaults,
      };
    },
    [data]
  );

  const heroSection = getOrCreateSection('hero', {
    name: 'Hero / 主横幅',
    titleZh: '度量衡科研平台',
    subtitleZh: '立足科学前沿，服务中国创新',
    badgeZh: '国家科研与检测协同服务入口',
    styleVariant: 'blue',
  });

  const bannerSection = getOrCreateSection('banners', {
    name: '轮播横幅',
    titleZh: '精选 banner',
    styleVariant: 'blue',
  });

  const labsSection = getOrCreateSection('labs', {
    name: '合作实验室',
    titleZh: '前沿实验室',
    subtitleZh: '领先的科研检测实验室网络',
    styleVariant: 'emerald',
  });

  /* Update section */
  const updateSection = (sectionId: string, updates: Partial<CMSSection>) => {
    setData((prev) => {
      if (!prev) return prev;
      const hasSection = prev.sections?.some((s) => s.id === sectionId);
      const sections = hasSection
        ? prev.sections!.map((s) => (s.id === sectionId ? { ...s, ...updates } : s))
        : [...(prev.sections || []), { ...getOrCreateSection('unknown', {}), id: sectionId, ...updates }];
      return { ...prev, sections };
    });
  };

  /* Update item */
  const updateItem = (sectionId: string, itemId: string, updates: Partial<CMSItem>) => {
    setData((prev) => {
      if (!prev) return prev;
      return {
        ...prev,
        sections: prev.sections?.map((s) =>
          s.id === sectionId
            ? {
                ...s,
                items: s.items?.map((i) => (i.id === itemId ? { ...i, ...updates } : i)),
              }
            : s
        ),
      };
    });
  };

  /* Add / remove items */
  const addItem = (sectionId: string, defaults?: Partial<CMSItem>) => {
    setData((prev) => {
      if (!prev) return prev;
      return {
        ...prev,
        sections: prev.sections?.map((s) => {
          if (s.id !== sectionId) return s;
          const newItem: CMSItem = {
            id: genId('item'),
            titleZh: '新条目',
            isEnabled: true,
            sortOrder: (s.items?.length || 0) * 10,
            ...defaults,
          };
          return { ...s, items: [...(s.items || []), newItem] };
        }),
      };
    });
  };

  const removeItem = (sectionId: string, itemId: string) => {
    setData((prev) => {
      if (!prev) return prev;
      return {
        ...prev,
        sections: prev.sections?.map((s) =>
          s.id === sectionId ? { ...s, items: s.items?.filter((i) => i.id !== itemId) } : s
        ),
      };
    });
  };

  const moveItem = (sectionId: string, itemId: string, direction: -1 | 1) => {
    setData((prev) => {
      if (!prev) return prev;
      return {
        ...prev,
        sections: prev.sections?.map((s) => {
          if (s.id !== sectionId || !s.items) return s;
          const idx = s.items.findIndex((i) => i.id === itemId);
          if (idx < 0) return s;
          const newIdx = idx + direction;
          if (newIdx < 0 || newIdx >= s.items.length) return s;
          const newItems = [...s.items];
          [newItems[idx], newItems[newIdx]] = [newItems[newIdx], newItems[idx]];
          return { ...s, items: newItems };
        }),
      };
    });
  };

  /* Media picker handling */
  const openMediaPicker = (sectionId: string, field: 'imageUrl' | 'sectionImage', itemId?: string) => {
    setMediaPickerTarget({ sectionId, itemId, field });
  };

  const handleMediaSelect = (url: string) => {
    if (!mediaPickerTarget) return;
    const { sectionId, itemId, field } = mediaPickerTarget;
    if (field === 'sectionImage') {
      updateSection(sectionId, { imageUrl: url });
    } else if (itemId) {
      updateItem(sectionId, itemId, { imageUrl: url });
    }
    setMediaPickerTarget(null);
  };

  /* Save */
  const handleSave = async () => {
    if (!data) return;
    setSaving(true);
    setMessage('');
    try {
      const payload = {
        slug: data.slug,
        type: data.type,
        titleZh: data.titleZh,
        isPublished: data.isPublished,
        sortOrder: data.sortOrder,
        sections: (data.sections || []).map((s) => ({
          id: s.id,
          sectionKey: s.sectionKey,
          name: s.name,
          titleZh: s.titleZh,
          subtitleZh: s.subtitleZh,
          badgeZh: s.badgeZh,
          descriptionZh: s.descriptionZh,
          imageUrl: s.imageUrl,
          layoutType: s.layoutType,
          styleVariant: s.styleVariant,
          isEnabled: s.isEnabled,
          isPublished: s.isPublished,
          sortOrder: s.sortOrder,
          items: (s.items || []).map((i) => ({
            id: i.id,
            titleZh: i.titleZh,
            subtitleZh: i.subtitleZh,
            descriptionZh: i.descriptionZh,
            imageUrl: i.imageUrl,
            linkUrl: i.linkUrl,
            linkLabelZh: i.linkLabelZh,
            value: i.value,
            sortOrder: i.sortOrder,
            isEnabled: i.isEnabled,
          })),
        })),
      };

      const res = await fetch(`/api/admin/cms/${data.id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
        credentials: 'include',
      });
      const json = await res.json();
      if (json?.success) {
        setMessage('保存成功');
      } else {
        setMessage(json?.error || '保存失败');
      }
    } catch {
      setMessage('保存失败');
    } finally {
      setSaving(false);
    }
  };

  /* ─── Render helpers ─── */

  const SectionCard = ({
    title,
    icon: Icon,
    children,
    colorPreset,
  }: {
    title: string;
    icon: React.ComponentType<{ className?: string }>;
    children: React.ReactNode;
    colorPreset?: string | null;
  }) => {
    const preset = getColorPreset(colorPreset);
    return (
      <Card padding="lg" className="space-y-5">
        <div className="flex items-center gap-3 border-b border-gray-100 pb-4">
          <div className={`flex h-9 w-9 items-center justify-center rounded-lg ${preset.bg} text-white`}>
            <Icon className="h-5 w-5" />
          </div>
          <div>
            <h2 className="text-lg font-semibold text-gray-900">{title}</h2>
            <p className="text-xs text-gray-500">当前主题: {preset.label}</p>
          </div>
        </div>
        {children}
      </Card>
    );
  };

  const ImageField = ({
    label,
    url,
    onSelect,
    className = '',
  }: {
    label: string;
    url?: string | null | undefined;
    onSelect: () => void;
    className?: string;
  }) => (
    <div className={className}>
      <label className="mb-1.5 block text-sm font-medium text-gray-700">{label}</label>
      <div className="flex items-center gap-3">
        <button
          type="button"
          onClick={onSelect}
          className="relative flex h-24 w-32 items-center justify-center overflow-hidden rounded-lg border-2 border-dashed border-gray-300 bg-gray-50 hover:border-blue-400 hover:bg-blue-50/50 transition-colors"
        >
          {url ? (
            <img src={url} alt="" className="h-full w-full object-cover" />
          ) : (
            <div className="flex flex-col items-center text-gray-400">
              <ImageIcon className="h-6 w-6 mb-1" />
              <span className="text-[10px]">选择图片</span>
            </div>
          )}
        </button>
        <div className="flex-1 min-w-0">
          <Input
            value={url || ''}
            onChange={() => {}}
            placeholder="点击左侧选择图片"
            className="text-xs"
            readOnly
          />
          {url && (
            <button
              type="button"
              onClick={onSelect}
              className="mt-1.5 text-xs text-blue-600 hover:text-blue-700"
            >
              更换图片
            </button>
          )}
        </div>
      </div>
    </div>
  );

  if (loading) {
    return (
      <AdminLayout>
        <div className="mx-auto max-w-5xl space-y-6">
          <div className="flex items-center gap-3">
            <Button variant="outline" size="sm" onClick={() => router.push('/admin/cms')}>
              <ArrowLeft className="mr-2 h-4 w-4" />
              返回
            </Button>
            <h1 className="text-2xl font-bold text-gray-900">首页内容管理</h1>
          </div>
          <div className="flex items-center justify-center py-20">
            <Loader2 className="h-8 w-8 animate-spin text-blue-600" />
          </div>
        </div>
      </AdminLayout>
    );
  }

  if (!data) {
    return (
      <AdminLayout>
        <div className="mx-auto max-w-5xl">
          <div className="flex items-center gap-3 mb-6">
            <Button variant="outline" size="sm" onClick={() => router.push('/admin/cms')}>
              <ArrowLeft className="mr-2 h-4 w-4" />
              返回
            </Button>
            <h1 className="text-2xl font-bold text-gray-900">首页内容管理</h1>
          </div>
          <div className="rounded-lg bg-red-50 px-4 py-3 text-sm text-red-700">
            {message || '无法加载首页数据'}
          </div>
        </div>
      </AdminLayout>
    );
  }

  return (
    <AdminLayout>
      <div className="mx-auto max-w-5xl space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <Button variant="outline" size="sm" onClick={() => router.push('/admin/cms')}>
              <ArrowLeft className="mr-2 h-4 w-4" />
              返回
            </Button>
            <h1 className="text-2xl font-bold text-gray-900">首页内容管理</h1>
            <span className="inline-flex items-center rounded-full bg-blue-50 px-2.5 py-0.5 text-xs font-medium text-blue-700">
              <LayoutTemplate className="mr-1 h-3 w-3" />
              首页
            </span>
          </div>
          <div className="flex items-center gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={() => window.open('/', '_blank')}
            >
              <Eye className="mr-2 h-4 w-4" />
              预览首页
            </Button>
            <Button onClick={handleSave} loading={saving} size="lg">
              <Save className="mr-2 h-4 w-4" />
              保存更改
            </Button>
          </div>
        </div>

        {message && (
          <div
            className={`rounded-lg px-4 py-3 text-sm ${
              message.includes('成功')
                ? 'bg-green-50 text-green-700'
                : 'bg-red-50 text-red-700'
            }`}
          >
            {message}
          </div>
        )}

        {/* ─── Hero Section ─── */}
        <SectionCard title="Hero 主横幅" icon={LayoutTemplate} colorPreset={heroSection.styleVariant}>
          <div className="grid gap-5 md:grid-cols-2">
            <div>
              <label className="mb-1.5 block text-sm font-medium text-gray-700">徽章文字</label>
              <Input
                value={heroSection.badgeZh || ''}
                onChange={(e) => updateSection(heroSection.id, { badgeZh: e.target.value })}
                placeholder="国家科研与检测协同服务入口"
              />
            </div>
            <div>
              <label className="mb-1.5 block text-sm font-medium text-gray-700">主标题</label>
              <Input
                value={heroSection.titleZh || ''}
                onChange={(e) => updateSection(heroSection.id, { titleZh: e.target.value })}
                placeholder="度量衡科研平台"
              />
            </div>
            <div className="md:col-span-2">
              <label className="mb-1.5 block text-sm font-medium text-gray-700">副标题</label>
              <Input
                value={heroSection.subtitleZh || ''}
                onChange={(e) => updateSection(heroSection.id, { subtitleZh: e.target.value })}
                placeholder="立足科学前沿，服务中国创新"
              />
            </div>
          </div>

          {/* Color preset */}
          <div>
            <label className="mb-2 block text-sm font-medium text-gray-700">
              <Palette className="inline h-4 w-4 mr-1 -mt-0.5" />
              主题色
            </label>
            <div className="flex flex-wrap gap-2">
              {COLOR_PRESETS.map((preset) => (
                <button
                  key={preset.key}
                  onClick={() => updateSection(heroSection.id, { styleVariant: preset.key })}
                  className={`flex items-center gap-2 rounded-lg border px-3 py-2 text-sm transition-all ${
                    heroSection.styleVariant === preset.key
                      ? 'border-blue-500 bg-blue-50 ring-1 ring-blue-500'
                      : 'border-gray-200 hover:border-gray-300'
                  }`}
                >
                  <span className={`inline-block h-4 w-4 rounded-full ${preset.bg}`} />
                  {preset.label}
                </button>
              ))}
            </div>
          </div>

          {/* Hero slides */}
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <h3 className="text-sm font-semibold text-gray-900">轮播背景图</h3>
              <Button
                variant="outline"
                size="sm"
                onClick={() =>
                  addItem(heroSection.id, { titleZh: '轮播图', subtitleZh: '' })
                }
              >
                <Plus className="mr-1 h-3.5 w-3.5" />
                添加背景图
              </Button>
            </div>

            {(heroSection.items || []).length === 0 && (
              <div className="rounded-lg border border-dashed border-gray-300 p-6 text-center text-sm text-gray-500">
                暂无轮播图，点击上方按钮添加
              </div>
            )}

            <div className="space-y-3">
              {(heroSection.items || []).map((item, idx) => (
                <div
                  key={item.id}
                  className="flex items-start gap-3 rounded-lg border border-gray-200 bg-gray-50/50 p-3"
                >
                  <div className="flex flex-col gap-1 pt-1">
                    <button
                      type="button"
                      disabled={idx === 0}
                      onClick={() => moveItem(heroSection.id, item.id, -1)}
                      className="text-gray-400 hover:text-gray-600 disabled:opacity-30"
                    >
                      <ChevronUp className="h-4 w-4" />
                    </button>
                    <button
                      type="button"
                      disabled={idx === (heroSection.items?.length || 0) - 1}
                      onClick={() => moveItem(heroSection.id, item.id, 1)}
                      className="text-gray-400 hover:text-gray-600 disabled:opacity-30"
                    >
                      <ChevronDown className="h-4 w-4" />
                    </button>
                  </div>

                  <div className="flex-1 grid gap-3 sm:grid-cols-2">
                    <ImageField
                      label="背景图片"
                      url={item.imageUrl}
                      onSelect={() => openMediaPicker(heroSection.id, 'imageUrl', item.id)}
                    />
                    <div className="space-y-2">
                      <div>
                        <label className="mb-1 block text-xs font-medium text-gray-600">标题</label>
                        <Input
                          className="text-sm"
                          value={item.titleZh || ''}
                          onChange={(e) =>
                            updateItem(heroSection.id, item.id, { titleZh: e.target.value })
                          }
                          placeholder="轮播标题"
                        />
                      </div>
                      <div>
                        <label className="mb-1 block text-xs font-medium text-gray-600">副标题</label>
                        <Input
                          className="text-sm"
                          value={item.subtitleZh || ''}
                          onChange={(e) =>
                            updateItem(heroSection.id, item.id, { subtitleZh: e.target.value })
                          }
                          placeholder="轮播副标题"
                        />
                      </div>
                    </div>
                  </div>

                  <div className="flex items-center gap-2 pt-1">
                    <label className="flex items-center gap-1.5 text-xs text-gray-600">
                      <input
                        type="checkbox"
                        checked={item.isEnabled}
                        onChange={(e) =>
                          updateItem(heroSection.id, item.id, { isEnabled: e.target.checked })
                        }
                        className="h-3.5 w-3.5 rounded border-gray-300"
                      />
                      启用
                    </label>
                    <button
                      type="button"
                      onClick={() => removeItem(heroSection.id, item.id)}
                      className="text-red-400 hover:text-red-600"
                    >
                      <Trash2 className="h-4 w-4" />
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </SectionCard>

        {/* ─── Banners Section ─── */}
        <SectionCard title="Banner 横幅" icon={ImageIcon} colorPreset={bannerSection.styleVariant}>
          <div className="grid gap-5 md:grid-cols-2">
            <div>
              <label className="mb-1.5 block text-sm font-medium text-gray-700">区块标题</label>
              <Input
                value={bannerSection.titleZh || ''}
                onChange={(e) => updateSection(bannerSection.id, { titleZh: e.target.value })}
                placeholder="精选 banner"
              />
            </div>
            <div>
              <label className="mb-1.5 block text-sm font-medium text-gray-700">副标题</label>
              <Input
                value={bannerSection.subtitleZh || ''}
                onChange={(e) => updateSection(bannerSection.id, { subtitleZh: e.target.value })}
                placeholder="Banner 副标题"
              />
            </div>
          </div>

          {/* Color preset */}
          <div>
            <label className="mb-2 block text-sm font-medium text-gray-700">
              <Palette className="inline h-4 w-4 mr-1 -mt-0.5" />
              主题色
            </label>
            <div className="flex flex-wrap gap-2">
              {COLOR_PRESETS.map((preset) => (
                <button
                  key={preset.key}
                  onClick={() => updateSection(bannerSection.id, { styleVariant: preset.key })}
                  className={`flex items-center gap-2 rounded-lg border px-3 py-2 text-sm transition-all ${
                    bannerSection.styleVariant === preset.key
                      ? 'border-blue-500 bg-blue-50 ring-1 ring-blue-500'
                      : 'border-gray-200 hover:border-gray-300'
                  }`}
                >
                  <span className={`inline-block h-4 w-4 rounded-full ${preset.bg}`} />
                  {preset.label}
                </button>
              ))}
            </div>
          </div>

          {/* Banner items */}
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <h3 className="text-sm font-semibold text-gray-900">Banner 列表</h3>
              <Button
                variant="outline"
                size="sm"
                onClick={() =>
                  addItem(bannerSection.id, { titleZh: '新 Banner', linkUrl: '/' })
                }
              >
                <Plus className="mr-1 h-3.5 w-3.5" />
                添加 Banner
              </Button>
            </div>

            {(bannerSection.items || []).length === 0 && (
              <div className="rounded-lg border border-dashed border-gray-300 p-6 text-center text-sm text-gray-500">
                暂无 Banner，点击上方按钮添加
              </div>
            )}

            <div className="grid gap-3 sm:grid-cols-2">
              {(bannerSection.items || []).map((item, idx) => (
                <div
                  key={item.id}
                  className="rounded-lg border border-gray-200 bg-white p-4 space-y-3"
                >
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-medium text-gray-500">#{idx + 1}</span>
                    <div className="flex items-center gap-2">
                      <label className="flex items-center gap-1.5 text-xs text-gray-600">
                        <input
                          type="checkbox"
                          checked={item.isEnabled}
                          onChange={(e) =>
                            updateItem(bannerSection.id, item.id, { isEnabled: e.target.checked })
                          }
                          className="h-3.5 w-3.5 rounded border-gray-300"
                        />
                        启用
                      </label>
                      <button
                        type="button"
                        onClick={() => removeItem(bannerSection.id, item.id)}
                        className="text-red-400 hover:text-red-600"
                      >
                        <Trash2 className="h-4 w-4" />
                      </button>
                    </div>
                  </div>

                  <ImageField
                    label="Banner 图片"
                    url={item.imageUrl}
                    onSelect={() => openMediaPicker(bannerSection.id, 'imageUrl', item.id)}
                  />

                  <div>
                    <label className="mb-1 block text-xs font-medium text-gray-600">标题</label>
                    <Input
                      className="text-sm"
                      value={item.titleZh || ''}
                      onChange={(e) =>
                        updateItem(bannerSection.id, item.id, { titleZh: e.target.value })
                      }
                      placeholder="Banner 标题"
                    />
                  </div>
                  <div>
                    <label className="mb-1 block text-xs font-medium text-gray-600">链接</label>
                    <Input
                      className="text-sm"
                      value={item.linkUrl || ''}
                      onChange={(e) =>
                        updateItem(bannerSection.id, item.id, { linkUrl: e.target.value })
                      }
                      placeholder="/services 或 https://..."
                    />
                  </div>
                </div>
              ))}
            </div>
          </div>
        </SectionCard>

        {/* ─── Featured Labs Section ─── */}
        <SectionCard title="Featured Labs 合作实验室" icon={Eye} colorPreset={labsSection.styleVariant}>
          <div className="grid gap-5 md:grid-cols-2">
            <div>
              <label className="mb-1.5 block text-sm font-medium text-gray-700">区块标题</label>
              <Input
                value={labsSection.titleZh || ''}
                onChange={(e) => updateSection(labsSection.id, { titleZh: e.target.value })}
                placeholder="前沿实验室"
              />
            </div>
            <div>
              <label className="mb-1.5 block text-sm font-medium text-gray-700">副标题</label>
              <Input
                value={labsSection.subtitleZh || ''}
                onChange={(e) => updateSection(labsSection.id, { subtitleZh: e.target.value })}
                placeholder="领先的科研检测实验室网络"
              />
            </div>
          </div>

          {/* Color preset */}
          <div>
            <label className="mb-2 block text-sm font-medium text-gray-700">
              <Palette className="inline h-4 w-4 mr-1 -mt-0.5" />
              主题色
            </label>
            <div className="flex flex-wrap gap-2">
              {COLOR_PRESETS.map((preset) => (
                <button
                  key={preset.key}
                  onClick={() => updateSection(labsSection.id, { styleVariant: preset.key })}
                  className={`flex items-center gap-2 rounded-lg border px-3 py-2 text-sm transition-all ${
                    labsSection.styleVariant === preset.key
                      ? 'border-blue-500 bg-blue-50 ring-1 ring-blue-500'
                      : 'border-gray-200 hover:border-gray-300'
                  }`}
                >
                  <span className={`inline-block h-4 w-4 rounded-full ${preset.bg}`} />
                  {preset.label}
                </button>
              ))}
            </div>
          </div>

          {/* Lab cards */}
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <h3 className="text-sm font-semibold text-gray-900">实验室卡片</h3>
              <Button
                variant="outline"
                size="sm"
                onClick={() =>
                  addItem(labsSection.id, {
                    titleZh: '新实验室',
                    subtitleZh: '城市',
                    descriptionZh: '专业领域描述',
                    linkUrl: '/labs/',
                  })
                }
              >
                <Plus className="mr-1 h-3.5 w-3.5" />
                添加实验室
              </Button>
            </div>

            {(labsSection.items || []).length === 0 && (
              <div className="rounded-lg border border-dashed border-gray-300 p-6 text-center text-sm text-gray-500">
                暂无实验室卡片，点击上方按钮添加
              </div>
            )}

            <div className="grid gap-3 sm:grid-cols-2">
              {(labsSection.items || []).map((item, idx) => (
                <div
                  key={item.id}
                  className="rounded-lg border border-gray-200 bg-white p-4 space-y-3"
                >
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-medium text-gray-500">#{idx + 1}</span>
                    <div className="flex items-center gap-2">
                      <label className="flex items-center gap-1.5 text-xs text-gray-600">
                        <input
                          type="checkbox"
                          checked={item.isEnabled}
                          onChange={(e) =>
                            updateItem(labsSection.id, item.id, { isEnabled: e.target.checked })
                          }
                          className="h-3.5 w-3.5 rounded border-gray-300"
                        />
                        启用
                      </label>
                      <button
                        type="button"
                        onClick={() => removeItem(labsSection.id, item.id)}
                        className="text-red-400 hover:text-red-600"
                      >
                        <Trash2 className="h-4 w-4" />
                      </button>
                    </div>
                  </div>

                  <ImageField
                    label="实验室图片"
                    url={item.imageUrl}
                    onSelect={() => openMediaPicker(labsSection.id, 'imageUrl', item.id)}
                  />

                  <div>
                    <label className="mb-1 block text-xs font-medium text-gray-600">名称</label>
                    <Input
                      className="text-sm"
                      value={item.titleZh || ''}
                      onChange={(e) =>
                        updateItem(labsSection.id, item.id, { titleZh: e.target.value })
                      }
                      placeholder="实验室名称"
                    />
                  </div>
                  <div className="grid grid-cols-2 gap-2">
                    <div>
                      <label className="mb-1 block text-xs font-medium text-gray-600">城市</label>
                      <Input
                        className="text-sm"
                        value={item.subtitleZh || ''}
                        onChange={(e) =>
                          updateItem(labsSection.id, item.id, { subtitleZh: e.target.value })
                        }
                        placeholder="城市"
                      />
                    </div>
                    <div>
                      <label className="mb-1 block text-xs font-medium text-gray-600">链接</label>
                      <Input
                        className="text-sm"
                        value={item.linkUrl || ''}
                        onChange={(e) =>
                          updateItem(labsSection.id, item.id, { linkUrl: e.target.value })
                        }
                        placeholder="/labs/slug"
                      />
                    </div>
                  </div>
                  <div>
                    <label className="mb-1 block text-xs font-medium text-gray-600">专业领域</label>
                    <textarea
                      className="min-h-[60px] w-full rounded-lg border border-gray-300 px-2 py-1.5 text-xs focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
                      value={item.descriptionZh || ''}
                      onChange={(e) =>
                        updateItem(labsSection.id, item.id, { descriptionZh: e.target.value })
                      }
                      placeholder="描述实验室的专业领域"
                    />
                  </div>
                </div>
              ))}
            </div>
          </div>
        </SectionCard>

        {/* Save */}
        <div className="flex justify-end pb-8">
          <Button onClick={handleSave} loading={saving} size="lg">
            <Save className="mr-2 h-4 w-4" />
            保存更改
          </Button>
        </div>
      </div>

      {/* Media Picker Modal */}
      <MediaPicker
        isOpen={!!mediaPickerTarget}
        onClose={() => setMediaPickerTarget(null)}
        onSelect={handleMediaSelect}
        folder="cms"
      />
    </AdminLayout>
  );
}
