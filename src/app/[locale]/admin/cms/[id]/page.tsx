'use client';

import { useState, useEffect, useCallback } from 'react';
import { useParams } from 'next/navigation';
import { useRouter } from '@/i18n/routing';
import { AdminLayout } from '@/components/layout/admin-layout';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Skeleton } from '@/components/ui/skeleton';
import { ArrowLeft, Save, CheckCircle2, XCircle, ChevronDown, ChevronUp, LayoutTemplate, Plus, Trash2, Image as ImageIcon } from 'lucide-react';
import { MediaPicker } from '@/components/admin/media-picker';

interface CMSItemPoint {
  id: string;
  textZh?: string;
  textEn?: string;
  sortOrder?: number;
  isEnabled: boolean;
}

interface CMSItem {
  id: string;
  titleZh?: string;
  titleEn?: string;
  subtitleZh?: string;
  subtitleEn?: string;
  descriptionZh?: string;
  descriptionEn?: string;
  imageUrl?: string;
  linkUrl?: string;
  linkLabelZh?: string;
  icon?: string;
  badgeZh?: string;
  value?: string;
  sortOrder?: number;
  isEnabled: boolean;
  points?: CMSItemPoint[];
}

interface CMSSection {
  id: string;
  sectionKey: string;
  name?: string;
  titleZh?: string;
  titleEn?: string;
  subtitleZh?: string;
  subtitleEn?: string;
  descriptionZh?: string;
  descriptionEn?: string;
  badgeZh?: string;
  imageUrl?: string;
  layoutType?: string;
  styleVariant?: string;
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
  titleEn?: string;
  contentZh?: string;
  contentEn?: string;
  excerpt?: string;
  coverImage?: string;
  isPublished: boolean;
  sortOrder: number;
  sections?: CMSSection[];
}

const sectionKeyLabels: Record<string, string> = {
  'hero': 'Hero / 主横幅',
  'service_categories': '服务分类',
  'stats_banner': '数据统计',
  'advantages': '平台优势',
  'why_choose_us': '为什么选择我们',
  'labs': '合作实验室',
  'partners': '合作伙伴',
  'sample_showcase': '样品展示',
  'equipment_showcase': '设备展示',
  'features': '服务项目',
  'cta': '行动号召',
  'about_intro': '公司介绍',
  'about_mission': '使命愿景',
  'about_stats': '关于页统计',
  'about_team': '团队介绍',
  'about_certifications': '资质认证',
  'about_cta': '行动号召',
  'contact_info': '联系信息',
};

function getSectionLabel(sec: CMSSection) {
  return sectionKeyLabels[sec.sectionKey] || sec.name || sec.titleZh || sec.sectionKey;
}

function genId(prefix: string) {
  return `${prefix}-${Date.now()}-${Math.floor(Math.random() * 1000000)}`;
}

export default function AdminCMSEditPage() {
  const router = useRouter();
  const params = useParams();
  const id = params.id as string;

  const [data, setData] = useState<CMSPageDetail | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState('');
  const [expandedSections, setExpandedSections] = useState<Record<string, boolean>>({});
  const [mediaPickerTarget, setMediaPickerTarget] = useState<{
    sectionId: string;
    itemId?: string;
    field: 'sectionImage' | 'itemImage';
  } | null>(null);

  const fetchData = useCallback(async () => {
    setLoading(true);
    try {
      const res = await fetch(`/api/admin/cms/${id}`);
      const json = await res.json();
      if (json?.success && json.data) {
        setData(json.data);
        const initialExpanded: Record<string, boolean> = {};
        (json.data.sections || []).forEach((s: CMSSection) => {
          initialExpanded[s.id] = false;
        });
        setExpandedSections(initialExpanded);
      }
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  }, [id]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  const handleChange = <K extends keyof CMSPageDetail>(field: K, value: CMSPageDetail[K]) => {
    setData((prev) => (prev ? { ...prev, [field]: value } : prev));
  };

  const toggleSection = (sectionId: string) => {
    setExpandedSections((prev) => ({ ...prev, [sectionId]: !prev[sectionId] }));
  };

  const updateSection = (sectionId: string, updates: Partial<CMSSection>) => {
    setData((prev) => {
      if (!prev) return prev;
      return {
        ...prev,
        sections: prev.sections?.map((s) => (s.id === sectionId ? { ...s, ...updates } : s)),
      };
    });
  };

  const addSection = () => {
    setData((prev) => {
      if (!prev) return prev;
      const newSection: CMSSection = {
        id: genId('sec'),
        sectionKey: 'custom',
        name: '新区块',
        titleZh: '新区块标题',
        isEnabled: true,
        isPublished: false,
        sortOrder: (prev.sections?.length || 0) * 10,
        items: [],
      };
      return { ...prev, sections: [...(prev.sections || []), newSection] };
    });
  };

  const removeSection = (sectionId: string) => {
    setData((prev) => {
      if (!prev) return prev;
      return { ...prev, sections: prev.sections?.filter((s) => s.id !== sectionId) };
    });
  };

  const updateItem = (sectionId: string, itemId: string, updates: Partial<CMSItem>) => {
    setData((prev) => {
      if (!prev) return prev;
      return {
        ...prev,
        sections: prev.sections?.map((s) =>
          s.id === sectionId
            ? { ...s, items: s.items?.map((i) => (i.id === itemId ? { ...i, ...updates } : i)) }
            : s
        ),
      };
    });
  };

  const addItem = (sectionId: string) => {
    setData((prev) => {
      if (!prev) return prev;
      return {
        ...prev,
        sections: prev.sections?.map((s) => {
          if (s.id !== sectionId) return s;
          const newItem: CMSItem = {
            id: genId('item'),
            titleZh: '新子项',
            isEnabled: true,
            sortOrder: (s.items?.length || 0) * 10,
            points: [],
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

  const updatePoint = (sectionId: string, itemId: string, pointId: string, updates: Partial<CMSItemPoint>) => {
    setData((prev) => {
      if (!prev) return prev;
      return {
        ...prev,
        sections: prev.sections?.map((s) =>
          s.id === sectionId
            ? {
                ...s,
                items: s.items?.map((i) =>
                  i.id === itemId
                    ? { ...i, points: i.points?.map((p) => (p.id === pointId ? { ...p, ...updates } : p)) }
                    : i
                ),
              }
            : s
        ),
      };
    });
  };

  const addPoint = (sectionId: string, itemId: string) => {
    setData((prev) => {
      if (!prev) return prev;
      return {
        ...prev,
        sections: prev.sections?.map((s) =>
          s.id === sectionId
            ? {
                ...s,
                items: s.items?.map((i) => {
                  if (i.id !== itemId) return i;
                  const newPoint: CMSItemPoint = {
                    id: genId('pt'),
                    textZh: '新要点',
                    isEnabled: true,
                    sortOrder: (i.points?.length || 0) * 10,
                  };
                  return { ...i, points: [...(i.points || []), newPoint] };
                }),
              }
            : s
        ),
      };
    });
  };

  const openMediaPicker = (sectionId: string, field: 'sectionImage' | 'itemImage', itemId?: string) => {
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

  const removePoint = (sectionId: string, itemId: string, pointId: string) => {
    setData((prev) => {
      if (!prev) return prev;
      return {
        ...prev,
        sections: prev.sections?.map((s) =>
          s.id === sectionId
            ? {
                ...s,
                items: s.items?.map((i) =>
                  i.id === itemId ? { ...i, points: i.points?.filter((p) => p.id !== pointId) } : i
                ),
              }
            : s
        ),
      };
    });
  };

  const handleSave = async () => {
    if (!data) return;
    setSaving(true);
    setMessage('');
    try {
      const payload: any = {
        slug: data.slug,
        type: data.type,
        titleZh: data.titleZh,
        titleEn: undefined,
        contentZh: data.contentZh,
        contentEn: undefined,
        excerpt: data.excerpt,
        coverImage: data.coverImage,
        isPublished: data.isPublished,
        sortOrder: data.sortOrder,
      };

      if (data.sections) {
        payload.sections = data.sections.map((s) => ({
          id: s.id,
          sectionKey: s.sectionKey,
          name: s.name,
          titleZh: s.titleZh,
          titleEn: undefined,
          subtitleZh: s.subtitleZh,
          subtitleEn: undefined,
          descriptionZh: s.descriptionZh,
          descriptionEn: undefined,
          badgeZh: s.badgeZh,
          imageUrl: s.imageUrl,
          layoutType: s.layoutType,
          styleVariant: s.styleVariant,
          isEnabled: s.isEnabled,
          isPublished: s.isPublished,
          sortOrder: s.sortOrder,
          items: s.items?.map((i) => ({
            id: i.id,
            titleZh: i.titleZh,
            titleEn: undefined,
            subtitleZh: i.subtitleZh,
            subtitleEn: undefined,
            descriptionZh: i.descriptionZh,
            descriptionEn: undefined,
            imageUrl: i.imageUrl,
            linkUrl: i.linkUrl,
            linkLabelZh: i.linkLabelZh,
            icon: i.icon,
            badgeZh: i.badgeZh,
            value: i.value,
            sortOrder: i.sortOrder,
            isEnabled: i.isEnabled,
            points: i.points?.map((p) => ({
              id: p.id,
              textZh: p.textZh,
              textEn: undefined,
              sortOrder: p.sortOrder,
              isEnabled: p.isEnabled,
            })),
          })),
        }));
      }

      const res = await fetch(`/api/admin/cms/${id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });
      const json = await res.json();
      if (json?.success) {
        setData(json.data);
        setMessage('保存成功');
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
        <div className="max-w-5xl space-y-6">
          <Skeleton className="h-8 w-40" />
          <Skeleton className="h-96 w-full" />
        </div>
      </AdminLayout>
    );
  }

  if (!data) {
    return (
      <AdminLayout>
        <div className="text-gray-600">内容不存在或加载失败</div>
      </AdminLayout>
    );
  }

  const isHomepage = data.slug === 'homepage' || data.type === 'homepage';

  return (
    <AdminLayout>
      <div className="mx-auto max-w-5xl space-y-6">
        <div className="flex items-center gap-3">
          <Button variant="outline" size="sm" onClick={() => router.push('/admin/cms')}>
            <ArrowLeft className="mr-2 h-4 w-4" />
            返回
          </Button>
          <h1 className="text-2xl font-bold text-gray-900">编辑内容</h1>
          {isHomepage && (
            <span className="inline-flex items-center rounded-full bg-blue-50 px-2.5 py-0.5 text-xs font-medium text-blue-700">
              <LayoutTemplate className="mr-1 h-3 w-3" />
              首页
            </span>
          )}
        </div>

        {message && (
          <div className={`rounded-lg px-4 py-3 text-sm ${message.includes('成功') ? 'bg-green-50 text-green-700' : 'bg-red-50 text-red-700'}`}>
            {message}
          </div>
        )}

        {/* Common fields */}
        <Card padding="lg" className="space-y-5">
          <div className="grid gap-5 md:grid-cols-2">
            <div>
              <label className="mb-1.5 block text-sm font-medium text-gray-700">标题 (中文)</label>
              <Input value={data.titleZh} onChange={(e) => handleChange('titleZh', e.target.value)} />
            </div>

            <div>
              <label className="mb-1.5 block text-sm font-medium text-gray-700">Slug</label>
              <Input value={data.slug} onChange={(e) => handleChange('slug', e.target.value)} />
            </div>
            <div>
              <label className="mb-1.5 block text-sm font-medium text-gray-700">类型</label>
              <select
                value={data.type}
                onChange={(e) => handleChange('type', e.target.value)}
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
              <Input type="number" value={data.sortOrder} onChange={(e) => handleChange('sortOrder', Number(e.target.value))} />
            </div>
            <div>
              <label className="mb-1.5 block text-sm font-medium text-gray-700">封面图片 URL</label>
              <Input value={data.coverImage || ''} onChange={(e) => handleChange('coverImage', e.target.value)} placeholder="/images/cover.jpg" />
            </div>
          </div>

          <div className="flex items-center gap-3">
            <label className="flex items-center gap-2 text-sm text-gray-700">
              <input
                type="checkbox"
                checked={data.isPublished}
                onChange={(e) => handleChange('isPublished', e.target.checked)}
                className="h-4 w-4 rounded border-gray-300 text-blue-600 focus:ring-blue-500"
              />
              发布
            </label>
          </div>

          <div>
            <label className="mb-1.5 block text-sm font-medium text-gray-700">摘要</label>
            <textarea
              value={data.excerpt || ''}
              onChange={(e) => handleChange('excerpt', e.target.value)}
              className="min-h-[60px] w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
            />
          </div>

          <div>
            <label className="mb-1.5 block text-sm font-medium text-gray-700">正文 (中文)</label>
            <textarea
              value={data.contentZh || ''}
              onChange={(e) => handleChange('contentZh', e.target.value)}
              className="min-h-[200px] w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
            />
          </div>


        </Card>

        {/* Sections */}
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <h2 className="text-lg font-semibold text-gray-900">页面区块</h2>
            <div className="flex items-center gap-3">
              <span className="text-xs text-gray-500">共 {data.sections?.length || 0} 个区块</span>
              <Button variant="outline" size="sm" onClick={addSection}>
                <Plus className="mr-1 h-4 w-4" />
                添加区块
              </Button>
            </div>
          </div>

          {(data.sections || []).map((sec) => {
            const expanded = !!expandedSections[sec.id];
            return (
              <Card key={sec.id} padding="lg" className="space-y-4">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div
                      className="flex h-8 w-8 cursor-pointer items-center justify-center rounded-lg border border-gray-200 hover:bg-gray-50"
                      onClick={() => toggleSection(sec.id)}
                    >
                      {expanded ? <ChevronUp className="h-4 w-4 text-gray-500" /> : <ChevronDown className="h-4 w-4 text-gray-500" />}
                    </div>
                    <div>
                      <div className="font-medium text-gray-900">{getSectionLabel(sec)}</div>
                      <div className="text-xs text-gray-500">Key: {sec.sectionKey} | 子项: {sec.items?.length || 0}</div>
                    </div>
                  </div>
                  <div className="flex items-center gap-3 text-sm">
                    <label className="flex items-center gap-2 text-gray-700">
                      <input
                        type="checkbox"
                        checked={sec.isEnabled}
                        onChange={(e) => updateSection(sec.id, { isEnabled: e.target.checked })}
                        className="h-4 w-4 rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                      />
                      启用
                    </label>
                    <label className="flex items-center gap-2 text-gray-700">
                      <input
                        type="checkbox"
                        checked={sec.isPublished}
                        onChange={(e) => updateSection(sec.id, { isPublished: e.target.checked })}
                        className="h-4 w-4 rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                      />
                      发布
                    </label>
                    {sec.isPublished ? <CheckCircle2 className="h-4 w-4 text-green-600" /> : <XCircle className="h-4 w-4 text-gray-400" />}
                    <Button variant="ghost" size="sm" className="text-red-600 hover:text-red-700" onClick={() => removeSection(sec.id)}>
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>
                </div>

                {expanded ? (
                  <div key={`panel-${sec.id}`} className="space-y-4 border-t border-gray-100 pt-4">
                    <div className="grid gap-4 md:grid-cols-2">
                      <div>
                        <label className="mb-1 block text-xs font-medium text-gray-700">区块标识 (sectionKey)</label>
                        <Input value={sec.sectionKey} onChange={(e) => updateSection(sec.id, { sectionKey: e.target.value })} />
                      </div>
                      <div>
                        <label className="mb-1 block text-xs font-medium text-gray-700">名称 (内部用)</label>
                        <Input value={sec.name || ''} onChange={(e) => updateSection(sec.id, { name: e.target.value })} />
                      </div>
                      <div>
                        <label className="mb-1 block text-xs font-medium text-gray-700">区块标题 (中文)</label>
                        <Input value={sec.titleZh || ''} onChange={(e) => updateSection(sec.id, { titleZh: e.target.value })} />
                      </div>

                      <div>
                        <label className="mb-1 block text-xs font-medium text-gray-700">副标题 (中文)</label>
                        <Input value={sec.subtitleZh || ''} onChange={(e) => updateSection(sec.id, { subtitleZh: e.target.value })} />
                      </div>

                      <div>
                        <label className="mb-1 block text-xs font-medium text-gray-700">布局类型</label>
                        <Input value={sec.layoutType || ''} onChange={(e) => updateSection(sec.id, { layoutType: e.target.value })} placeholder="grid / banner / cards" />
                      </div>
                      <div>
                        <label className="mb-1 block text-xs font-medium text-gray-700">样式变体</label>
                        <Input value={sec.styleVariant || ''} onChange={(e) => updateSection(sec.id, { styleVariant: e.target.value })} placeholder="light / dark / primary" />
                      </div>
                      <div className="md:col-span-2">
                        <label className="mb-1 block text-xs font-medium text-gray-700">描述 (中文)</label>
                        <textarea
                          value={sec.descriptionZh || ''}
                          onChange={(e) => updateSection(sec.id, { descriptionZh: e.target.value })}
                          className="min-h-[60px] w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
                        />
                      </div>
                      <div>
                        <label className="mb-1 block text-xs font-medium text-gray-700">图片</label>
                        <div className="flex items-center gap-2">
                          <button
                            type="button"
                            onClick={() => openMediaPicker(sec.id, 'sectionImage')}
                            className="relative flex h-16 w-24 items-center justify-center overflow-hidden rounded border border-dashed border-gray-300 bg-gray-50 hover:border-blue-400 hover:bg-blue-50/50"
                          >
                            {sec.imageUrl ? (
                              <img src={sec.imageUrl} alt="" className="h-full w-full object-cover" />
                            ) : (
                              <ImageIcon className="h-5 w-5 text-gray-400" />
                            )}
                          </button>
                          <Input
                            className="flex-1 text-xs"
                            value={sec.imageUrl || ''}
                            onChange={(e) => updateSection(sec.id, { imageUrl: e.target.value })}
                            placeholder="点击左侧选择图片或输入 URL"
                          />
                        </div>
                      </div>
                      <div>
                        <label className="mb-1 block text-xs font-medium text-gray-700">排序</label>
                        <Input type="number" value={sec.sortOrder ?? 0} onChange={(e) => updateSection(sec.id, { sortOrder: Number(e.target.value) })} />
                      </div>
                    </div>

                    <div className="space-y-3">
                      <div className="flex items-center justify-between">
                        <div className="text-xs font-medium text-gray-700">子项</div>
                        <Button variant="outline" size="sm" onClick={() => addItem(sec.id)}>
                          <Plus className="mr-1 h-3 w-3" />
                          添加子项
                        </Button>
                      </div>
                      <div className="space-y-3">
                        {(sec.items || []).map((item) => (
                          <div key={item.id} className="rounded-lg border border-gray-200 p-3">
                            <div className="grid gap-3 md:grid-cols-12">
                              <div className="md:col-span-3">
                                <label className="mb-1 block text-[10px] font-medium text-gray-500">标题</label>
                                <Input
                                  className="text-sm"
                                  value={item.titleZh || ''}
                                  onChange={(e) => updateItem(sec.id, item.id, { titleZh: e.target.value })}
                                />
                              </div>
                              <div className="md:col-span-2">
                                <label className="mb-1 block text-[10px] font-medium text-gray-500">副标题 / 数值</label>
                                <Input
                                  className="text-sm"
                                  value={item.subtitleZh || item.value || ''}
                                  onChange={(e) => updateItem(sec.id, item.id, { subtitleZh: e.target.value })}
                                />
                              </div>
                              <div className="md:col-span-2">
                                <label className="mb-1 block text-[10px] font-medium text-gray-500">链接 / Icon</label>
                                <Input
                                  className="text-sm"
                                  value={item.linkUrl || item.icon || ''}
                                  onChange={(e) => updateItem(sec.id, item.id, { linkUrl: e.target.value })}
                                  placeholder="链接或图标名"
                                />
                              </div>
                              <div className="md:col-span-2">
                                <label className="mb-1 block text-[10px] font-medium text-gray-500">图片</label>
                                <div className="flex items-center gap-2">
                                  <button
                                    type="button"
                                    onClick={() => openMediaPicker(sec.id, 'itemImage', item.id)}
                                    className="relative flex h-12 w-16 items-center justify-center overflow-hidden rounded border border-dashed border-gray-300 bg-gray-50 hover:border-blue-400"
                                  >
                                    {item.imageUrl ? (
                                      <img src={item.imageUrl} alt="" className="h-full w-full object-cover" />
                                    ) : (
                                      <ImageIcon className="h-4 w-4 text-gray-400" />
                                    )}
                                  </button>
                                  <Input
                                    className="flex-1 text-sm"
                                    value={item.imageUrl || ''}
                                    onChange={(e) => updateItem(sec.id, item.id, { imageUrl: e.target.value })}
                                    placeholder="点击左侧选择图片或输入 URL"
                                  />
                                </div>
                              </div>
                              <div className="md:col-span-1">
                                <label className="mb-1 block text-[10px] font-medium text-gray-500">排序</label>
                                <Input
                                  className="text-sm"
                                  type="number"
                                  value={item.sortOrder ?? 0}
                                  onChange={(e) => updateItem(sec.id, item.id, { sortOrder: Number(e.target.value) })}
                                />
                              </div>
                              <div className="md:col-span-1 flex items-end gap-2">
                                <label className="flex items-center gap-1.5 text-xs text-gray-700">
                                  <input
                                    type="checkbox"
                                    checked={item.isEnabled}
                                    onChange={(e) => updateItem(sec.id, item.id, { isEnabled: e.target.checked })}
                                    className="h-4 w-4 rounded border-gray-300 text-blue-600"
                                  />
                                  启用
                                </label>
                                <Button variant="ghost" size="sm" className="px-1 text-red-600" onClick={() => removeItem(sec.id, item.id)}>
                                  <Trash2 className="h-3.5 w-3.5" />
                                </Button>
                              </div>
                            </div>
                            <div className="mt-2">
                              <label className="mb-1 block text-[10px] font-medium text-gray-500">描述</label>
                              <textarea
                                value={item.descriptionZh || ''}
                                onChange={(e) => updateItem(sec.id, item.id, { descriptionZh: e.target.value })}
                                className="min-h-[40px] w-full rounded border border-gray-300 px-2 py-1.5 text-xs focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
                              />
                            </div>

                            {/* Points */}
                            <div className="mt-3 space-y-2 rounded-md bg-gray-50 p-2">
                              <div className="flex items-center justify-between">
                                <div className="text-[10px] font-medium text-gray-600">要点 /  bullet points</div>
                                <Button variant="ghost" size="sm" className="h-6 px-2 text-xs" onClick={() => addPoint(sec.id, item.id)}>
                                  <Plus className="mr-1 h-3 w-3" />
                                  添加要点
                                </Button>
                              </div>
                              <div className="space-y-2">
                                {(item.points || []).map((pt) => (
                                  <div key={pt.id} className="flex items-center gap-2">
                                    <input
                                      type="checkbox"
                                      checked={pt.isEnabled}
                                      onChange={(e) => updatePoint(sec.id, item.id, pt.id, { isEnabled: e.target.checked })}
                                      className="h-4 w-4 rounded border-gray-300 text-blue-600"
                                    />
                                    <Input
                                      className="h-7 text-xs"
                                      value={pt.textZh || ''}
                                      onChange={(e) => updatePoint(sec.id, item.id, pt.id, { textZh: e.target.value })}
                                      placeholder="要点内容"
                                    />
                                    {/* English point text removed - Chinese only */}
                                    <Input
                                      className="h-7 w-16 text-xs"
                                      type="number"
                                      value={pt.sortOrder ?? 0}
                                      onChange={(e) => updatePoint(sec.id, item.id, pt.id, { sortOrder: Number(e.target.value) })}
                                    />
                                    <Button variant="ghost" size="sm" className="h-7 w-7 px-0 text-red-600" onClick={() => removePoint(sec.id, item.id, pt.id)}>
                                      <Trash2 className="h-3.5 w-3.5" />
                                    </Button>
                                  </div>
                                ))}
                                {(item.points || []).length === 0 && (
                                  <div className="text-[10px] text-gray-400">暂无要点</div>
                                )}
                              </div>
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  </div>
                ) : null}
              </Card>
            );
          })}
        </div>

        <div className="flex justify-end pb-8">
          <Button onClick={handleSave} loading={saving} size="lg">
            <Save className="mr-2 h-4 w-4" />
            保存内容
          </Button>
        </div>
      </div>

      <MediaPicker
        isOpen={!!mediaPickerTarget}
        onClose={() => setMediaPickerTarget(null)}
        onSelect={handleMediaSelect}
        folder="cms"
      />
    </AdminLayout>
  );
}
