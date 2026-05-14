'use client';

import { useState, useEffect, useCallback, useMemo, useRef } from 'react';
import { AdminLayout } from '@/components/layout/admin-layout';
import { RouteGuard } from '@/components/guards/RouteGuard';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Modal } from '@/components/ui/modal';
import {
  Search,
  Save,
  Download,
  Plus,
  AlertTriangle,
  Check,
  X,
  FileJson,
  RotateCcw,
  Languages,
  Hash,
  Eye,
} from 'lucide-react';
import { cn } from '@/lib/utils';

interface TranslationData {
  locales: string[];
  allKeys: string[];
  values: Record<string, Record<string, string | null>>;
  missingKeys: Record<string, string[]>;
  namespaces: string[];
  stats: {
    totalKeys: number;
    missingCount: number;
    keysPerLocale: Record<string, number>;
  };
}

interface EditedValues {
  [key: string]: {
    [locale: string]: string;
  };
}

export default function TranslationEditorPage() {
  const [data, setData] = useState<TranslationData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Filters & view state
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedNamespace, setSelectedNamespace] = useState<string>('all');
  const [showMissingOnly, setShowMissingOnly] = useState(false);

  // Editing state
  const [editedValues, setEditedValues] = useState<EditedValues>({});
  const [activeEdit, setActiveEdit] = useState<{ key: string; locale: string } | null>(null);
  const [saving, setSaving] = useState(false);
  const [saveError, setSaveError] = useState<string | null>(null);
  const [saveSuccess, setSaveSuccess] = useState(false);

  // Add key modal
  const [addModalOpen, setAddModalOpen] = useState(false);
  const [newKeyPath, setNewKeyPath] = useState('');
  const [newKeyValues, setNewKeyValues] = useState<Record<string, string>>({});
  const [addError, setAddError] = useState<string | null>(null);

  // Export modal
  const [exportModalOpen, setExportModalOpen] = useState(false);

  const searchInputRef = useRef<HTMLInputElement>(null);

  // ─── Fetch data ──────────────────────────────────────────────

  const fetchData = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await fetch('/api/admin/translations/json', { credentials: 'include' });
      const json = await res.json();
      if (json.success && json.data) {
        setData(json.data);

      } else {
        setError(json.error || '加载失败');
      }
    } catch (err: any) {
      setError(err.message || '网络错误');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  // ─── Derived state ───────────────────────────────────────────

  const filteredKeys = useMemo(() => {
    if (!data) return [];
    let keys = data.allKeys;

    // Namespace filter
    if (selectedNamespace !== 'all') {
      keys = keys.filter(k => k.startsWith(selectedNamespace + '.'));
    }

    // Missing-only filter
    if (showMissingOnly) {
      keys = keys.filter(k => {
        return data.locales.some(locale => data.values[k]?.[locale] === null);
      });
    }

    // Search filter
    const q = searchQuery.trim().toLowerCase();
    if (q) {
      keys = keys.filter(k => {
        if (k.toLowerCase().includes(q)) return true;
        return data.locales.some(locale => {
          const val = data.values[k]?.[locale];
          return val && val.toLowerCase().includes(q);
        });
      });
    }

    return keys;
  }, [data, selectedNamespace, showMissingOnly, searchQuery]);

  const hasChanges = useMemo(() => {
    return Object.keys(editedValues).length > 0;
  }, [editedValues]);

  const changedCount = useMemo(() => {
    let count = 0;
    for (const keyData of Object.values(editedValues)) {
      count += Object.keys(keyData).length;
    }
    return count;
  }, [editedValues]);

  // ─── Handlers ────────────────────────────────────────────────

  const handleCellEdit = useCallback((key: string, locale: string, value: string) => {
    setEditedValues(prev => {
      const next = { ...prev };
      if (!next[key]) next[key] = {};
      next[key] = { ...next[key], [locale]: value };
      return next;
    });
  }, []);

  const handleCellBlur = useCallback((key: string, locale: string, value: string) => {
    const original = data?.values[key]?.[locale] || '';
    if (value === original) {
      // No change — remove from edited values
      setEditedValues(prev => {
        const next = { ...prev };
        if (next[key]) {
          const keyCopy = { ...next[key] };
          delete keyCopy[locale];
          if (Object.keys(keyCopy).length === 0) {
            delete next[key];
          } else {
            next[key] = keyCopy;
          }
        }
        return next;
      });
    }
    setActiveEdit(null);
  }, [data]);

  const handleSave = useCallback(async () => {
    if (!data || !hasChanges) return;
    setSaving(true);
    setSaveError(null);
    setSaveSuccess(false);

    try {
      // Group edits by locale for batch API
      const batches = data.locales.map(locale => ({
        locale,
        updates: Object.fromEntries(
          Object.entries(editedValues)
            .filter(([, vals]) => locale in vals)
            .map(([key, vals]) => [key, vals[locale]])
        ),
      })).filter(b => Object.keys(b.updates).length > 0);

      const res = await fetch('/api/admin/translations/json', {
        method: 'POST',
        credentials: 'include',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ batches }),
      });

      const json = await res.json();
      if (json.success) {
        setEditedValues({});
        setSaveSuccess(true);
        setData(json.data);
        setTimeout(() => setSaveSuccess(false), 3000);
      } else {
        setSaveError(json.error || '保存失败');
      }
    } catch (err: any) {
      setSaveError(err.message || '保存失败');
    } finally {
      setSaving(false);
    }
  }, [data, editedValues, hasChanges]);

  const handleDiscard = useCallback(() => {
    setEditedValues({});
    setActiveEdit(null);
    setSaveError(null);
  }, []);

  const handleAddKey = useCallback(async () => {
    if (!data) return;
    setAddError(null);

    const keyPattern = /^[a-zA-Z0-9_-]+(\.[a-zA-Z0-9_-]+)*$/;
    if (!keyPattern.test(newKeyPath)) {
      setAddError('键格式无效，只能包含字母、数字、下划线、连字符和点号');
      return;
    }
    if (data.allKeys.includes(newKeyPath)) {
      setAddError('该键已存在');
      return;
    }

    const updates: Record<string, string> = {};
    for (const [locale, val] of Object.entries(newKeyValues)) {
      if (val.trim()) updates[locale] = val.trim();
    }
    if (Object.keys(updates).length === 0) {
      setAddError('至少填写一个语言的翻译值');
      return;
    }

    setSaving(true);
    try {
      const res = await fetch('/api/admin/translations/json', {
        method: 'POST',
        credentials: 'include',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          batches: data.locales.map(locale => ({
            locale,
            updates: updates[locale] ? { [newKeyPath]: updates[locale] } : {},
          })).filter(b => Object.keys(b.updates).length > 0),
        }),
      });

      const json = await res.json();
      if (json.success) {
        setAddModalOpen(false);
        setNewKeyPath('');
        setNewKeyValues({});
        setData(json.data);
      } else {
        setAddError(json.error || '添加失败');
      }
    } catch (err: any) {
      setAddError(err.message || '添加失败');
    } finally {
      setSaving(false);
    }
  }, [data, newKeyPath, newKeyValues]);

  const handleExport = useCallback((locale: string) => {
    if (!data) return;
    const localeData: Record<string, string> = {};
    for (const key of data.allKeys) {
      const val = data.values[key]?.[locale];
      if (val !== null && val !== undefined) {
        localeData[key] = val;
      }
    }
    // Reconstruct nested JSON
    const nested = unflattenForExport(localeData);
    const blob = new Blob([JSON.stringify(nested, null, 2) + '\n'], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `${locale}.json`;
    a.click();
    URL.revokeObjectURL(url);
  }, [data]);

  const isKeyMissingInAnyLocale = useCallback((key: string) => {
    if (!data) return false;
    return data.locales.some(locale => data.values[key]?.[locale] === null);
  }, [data]);

  // ─── Render helpers ──────────────────────────────────────────

  if (loading) {
    return (
      <RouteGuard allowedRoles={['SUPER_ADMIN']}>
        <AdminLayout>
          <div className="flex items-center justify-center h-96">
            <div className="text-gray-500">加载翻译编辑器...</div>
          </div>
        </AdminLayout>
      </RouteGuard>
    );
  }

  if (error || !data) {
    return (
      <RouteGuard allowedRoles={['SUPER_ADMIN']}>
        <AdminLayout>
          <div className="flex flex-col items-center justify-center h-96 gap-4">
            <AlertTriangle className="h-10 w-10 text-red-500" />
            <div className="text-red-600">{error || '加载失败'}</div>
            <Button onClick={fetchData} variant="outline">
              <RotateCcw className="h-4 w-4 mr-2" /> 重试
            </Button>
          </div>
        </AdminLayout>
      </RouteGuard>
    );
  }

  return (
    <RouteGuard allowedRoles={['SUPER_ADMIN']}>
      <AdminLayout>
        <div className="space-y-4">
          {/* Header */}
          <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">
            <div>
              <h1 className="text-2xl font-bold text-gray-900">翻译编辑器 (JSON)</h1>
              <p className="text-sm text-gray-500 mt-1">
                直接编辑 next-intl JSON 翻译文件 · 共 {data.stats.totalKeys} 个键 · {data.locales.length} 个语言
              </p>
            </div>
            <div className="flex flex-wrap items-center gap-2">
              {hasChanges && (
                <Badge variant="warning" size="md">
                  <Eye className="h-3 w-3 mr-1" />
                  {changedCount} 处修改未保存
                </Badge>
              )}
              {data.stats.missingCount > 0 && (
                <Badge variant="danger" size="md">
                  <AlertTriangle className="h-3 w-3 mr-1" />
                  {data.stats.missingCount} 个缺失键
                </Badge>
              )}
              <Button
                variant="outline"
                size="sm"
                onClick={() => setExportModalOpen(true)}
              >
                <Download className="h-4 w-4 mr-1" /> 导出
              </Button>
              <Button
                size="sm"
                onClick={() => setAddModalOpen(true)}
              >
                <Plus className="h-4 w-4 mr-1" /> 新增键
              </Button>
              {hasChanges && (
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={handleDiscard}
                >
                  <X className="h-4 w-4 mr-1" /> 放弃
                </Button>
              )}
              <Button
                size="sm"
                onClick={handleSave}
                loading={saving}
                disabled={!hasChanges}
                variant={hasChanges ? 'primary' : 'secondary'}
              >
                <Save className="h-4 w-4 mr-1" /> 保存修改
              </Button>
            </div>
          </div>

          {/* Alerts */}
          {saveError && (
            <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg text-sm">
              {saveError}
            </div>
          )}
          {saveSuccess && (
            <div className="bg-green-50 border border-green-200 text-green-700 px-4 py-3 rounded-lg text-sm flex items-center gap-2">
              <Check className="h-4 w-4" /> 保存成功
            </div>
          )}

          {/* Toolbar */}
          <Card padding="sm">
            <div className="flex flex-wrap items-center gap-3">
              <div className="flex-1 min-w-[240px]">
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
                  <input
                    ref={searchInputRef}
                    type="text"
                    placeholder="搜索键名或翻译内容..."
                    value={searchQuery}
                    onChange={e => setSearchQuery(e.target.value)}
                    className="w-full pl-9 pr-4 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  />
                </div>
              </div>
              <select
                className="px-3 py-2 border border-gray-300 rounded-lg text-sm bg-white focus:outline-none focus:ring-2 focus:ring-blue-500"
                value={selectedNamespace}
                onChange={e => setSelectedNamespace(e.target.value)}
              >
                <option value="all">所有命名空间</option>
                {data.namespaces.map(ns => (
                  <option key={ns} value={ns}>{ns}</option>
                ))}
              </select>
              <Button
                variant={showMissingOnly ? 'primary' : 'outline'}
                size="sm"
                onClick={() => setShowMissingOnly(v => !v)}
              >
                <AlertTriangle className="h-4 w-4 mr-1" />
                {showMissingOnly ? '显示全部' : '仅显示缺失'}
              </Button>
            </div>
          </Card>

          {/* Main content: Namespace tree + Table */}
          <div className="flex gap-4">
            {/* Sidebar: namespaces */}
            <div className="hidden xl:block w-56 flex-shrink-0">
              <Card padding="sm" className="sticky top-4">
                <h3 className="text-sm font-semibold text-gray-700 mb-3 flex items-center gap-2">
                  <Hash className="h-4 w-4" /> 命名空间
                </h3>
                <div className="space-y-1 max-h-[calc(100vh-240px)] overflow-y-auto">
                  <button
                    onClick={() => setSelectedNamespace('all')}
                    className={cn(
                      'w-full text-left px-3 py-2 rounded-lg text-sm transition-colors flex items-center justify-between',
                      selectedNamespace === 'all'
                        ? 'bg-primary text-white'
                        : 'text-gray-700 hover:bg-gray-100'
                    )}
                  >
                    <span>全部</span>
                    <span className={cn('text-xs', selectedNamespace === 'all' ? 'text-white/80' : 'text-gray-400')}>
                      {data.stats.totalKeys}
                    </span>
                  </button>
                  {data.namespaces.map(ns => {
                    const count = data.allKeys.filter(k => k.startsWith(ns + '.')).length;
                    const missingInNs = data.allKeys.filter(k =>
                      k.startsWith(ns + '.') && isKeyMissingInAnyLocale(k)
                    ).length;
                    return (
                      <button
                        key={ns}
                        onClick={() => setSelectedNamespace(ns)}
                        className={cn(
                          'w-full text-left px-3 py-2 rounded-lg text-sm transition-colors flex items-center justify-between',
                          selectedNamespace === ns
                            ? 'bg-primary text-white'
                            : 'text-gray-700 hover:bg-gray-100'
                        )}
                      >
                        <span className="truncate">{ns}</span>
                        <span className={cn('text-xs shrink-0 ml-2', selectedNamespace === ns ? 'text-white/80' : 'text-gray-400')}>
                          {count}{missingInNs > 0 && ` (${missingInNs}缺)`}
                        </span>
                      </button>
                    );
                  })}
                </div>
              </Card>
            </div>

            {/* Translation table */}
            <div className="flex-1 min-w-0">
              <Card padding="none" className="overflow-hidden">
                <div className="overflow-x-auto">
                  <table className="w-full text-sm">
                    <thead className="bg-gray-50 sticky top-0 z-10">
                      <tr>
                        <th className="text-left px-4 py-3 font-semibold text-gray-700 w-64">翻译键</th>
                        {data.locales.map(locale => (
                          <th key={locale} className="text-left px-4 py-3 font-semibold text-gray-700 min-w-[200px]">
                            <div className="flex items-center gap-2">
                              <Languages className="h-4 w-4 text-gray-400" />
                              {locale}
                              <span className="text-xs text-gray-400 font-normal">
                                ({data.stats.keysPerLocale[locale] || 0})
                              </span>
                            </div>
                          </th>
                        ))}
                        <th className="text-center px-4 py-3 font-semibold text-gray-700 w-20">状态</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-100">
                      {filteredKeys.length === 0 ? (
                        <tr>
                          <td colSpan={data.locales.length + 2} className="px-4 py-12 text-center text-gray-500">
                            {showMissingOnly ? '没有缺失的键' : '未找到匹配的翻译键'}
                          </td>
                        </tr>
                      ) : (
                        filteredKeys.map(key => {
                          const isMissing = isKeyMissingInAnyLocale(key);
                          return (
                            <tr
                              key={key}
                              className={cn(
                                'hover:bg-gray-50 transition-colors',
                                isMissing && 'bg-red-50/40'
                              )}
                            >
                              <td className="px-4 py-2 align-top">
                                <div className="font-mono text-xs text-gray-600 break-all" title={key}>
                                  {key}
                                </div>
                              </td>
                              {data.locales.map(locale => {
                                const originalValue = data.values[key]?.[locale] || '';
                                const editedValue = editedValues[key]?.[locale];
                                const displayValue = editedValue !== undefined ? editedValue : originalValue;
                                const isNull = data.values[key]?.[locale] === null;
                                const isEditing = activeEdit?.key === key && activeEdit?.locale === locale;

                                return (
                                  <td key={locale} className="px-4 py-2 align-top">
                                    {isEditing ? (
                                      <textarea
                                        autoFocus
                                        rows={Math.min(4, Math.max(1, (displayValue || '').split('\n').length))}
                                        className={cn(
                                          'w-full min-w-[160px] px-2 py-1.5 border rounded text-xs font-normal resize-y',
                                          'focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500',
                                          editedValue !== undefined && editedValue !== originalValue
                                            ? 'border-amber-400 bg-amber-50'
                                            : 'border-gray-300'
                                        )}
                                        defaultValue={displayValue}
                                        onChange={e => handleCellEdit(key, locale, e.target.value)}
                                        onBlur={e => handleCellBlur(key, locale, e.target.value)}
                                        onKeyDown={e => {
                                          if (e.key === 'Enter' && !e.shiftKey) {
                                            e.preventDefault();
                                            handleCellBlur(key, locale, (e.target as HTMLTextAreaElement).value);
                                          }
                                        }}
                                      />
                                    ) : (
                                      <button
                                        onClick={() => setActiveEdit({ key, locale })}
                                        className={cn(
                                          'w-full text-left px-2 py-1.5 rounded text-xs min-h-[28px] break-words',
                                          'hover:bg-blue-50 hover:border-blue-200 border border-transparent transition-colors',
                                          isNull && 'text-red-400 italic border-red-200 bg-red-50/50',
                                          editedValue !== undefined && editedValue !== originalValue
                                            ? 'bg-amber-50 border-amber-300 text-amber-900'
                                            : 'text-gray-800'
                                        )}
                                        title={isNull ? '点击添加翻译' : '点击编辑'}
                                      >
                                        {isNull ? '— 缺失 —' : (displayValue || '(空)')}
                                      </button>
                                    )}
                                  </td>
                                );
                              })}
                              <td className="px-4 py-2 align-top text-center">
                                {isMissing ? (
                                  <span title="存在缺失的语言"><AlertTriangle className="h-4 w-4 text-red-500 mx-auto" /></span>
                                ) : (
                                  <span title="完整"><Check className="h-4 w-4 text-green-500 mx-auto" /></span>
                                )}
                              </td>
                            </tr>
                          );
                        })
                      )}
                    </tbody>
                  </table>
                </div>
                <div className="px-4 py-3 border-t border-gray-200 text-xs text-gray-500 flex items-center justify-between">
                  <span>
                    显示 {filteredKeys.length} / {data.allKeys.length} 个键
                  </span>
                  {selectedNamespace !== 'all' && (
                    <button
                      onClick={() => setSelectedNamespace('all')}
                      className="text-blue-600 hover:underline"
                    >
                      清除筛选
                    </button>
                  )}
                </div>
              </Card>
            </div>
          </div>
        </div>

        {/* Add Key Modal */}
        <Modal
          isOpen={addModalOpen}
          onClose={() => { setAddModalOpen(false); setAddError(null); }}
          title="新增翻译键"
          size="lg"
        >
          <div className="space-y-4">
            <Input
              label="键名 (dot-notation)"
              placeholder="例如：common.newFeature"
              value={newKeyPath}
              onChange={e => setNewKeyPath(e.target.value)}
              required
            />
            {data.locales.map(locale => (
              <div key={locale}>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  {locale} 翻译
                </label>
                <textarea
                  rows={2}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 resize-y"
                  placeholder={`输入 ${locale} 的翻译...`}
                  value={newKeyValues[locale] || ''}
                  onChange={e => setNewKeyValues(prev => ({ ...prev, [locale]: e.target.value }))}
                />
              </div>
            ))}
            {addError && (
              <div className="text-sm text-red-600 bg-red-50 px-3 py-2 rounded-lg">{addError}</div>
            )}
            <div className="flex gap-3 justify-end pt-2">
              <Button
                variant="outline"
                onClick={() => { setAddModalOpen(false); setAddError(null); }}
              >
                取消
              </Button>
              <Button onClick={handleAddKey} loading={saving}>
                添加
              </Button>
            </div>
          </div>
        </Modal>

        {/* Export Modal */}
        <Modal
          isOpen={exportModalOpen}
          onClose={() => setExportModalOpen(false)}
          title="导出翻译文件"
          size="md"
        >
          <div className="space-y-3">
            <p className="text-sm text-gray-500">
              下载当前各语言的完整 JSON 文件。导出的文件将自动重建嵌套结构。
            </p>
            {data.locales.map(locale => (
              <div key={locale} className="flex items-center justify-between py-2 border-b border-gray-100 last:border-0">
                <div className="flex items-center gap-2">
                  <FileJson className="h-5 w-5 text-blue-500" />
                  <span className="text-sm font-medium">{locale}.json</span>
                  <span className="text-xs text-gray-400">
                    ({data.stats.keysPerLocale[locale] || 0} 个键)
                  </span>
                </div>
                <Button variant="outline" size="sm" onClick={() => handleExport(locale)}>
                  <Download className="h-4 w-4 mr-1" /> 下载
                </Button>
              </div>
            ))}
            <div className="flex justify-end pt-2">
              <Button variant="outline" onClick={() => setExportModalOpen(false)}>
                关闭
              </Button>
            </div>
          </div>
        </Modal>
      </AdminLayout>
    </RouteGuard>
  );
}

// ─── Helpers ───────────────────────────────────────────────────

function unflattenForExport(flat: Record<string, string>): unknown {
  const result: Record<string, unknown> = {};
  for (const [key, value] of Object.entries(flat)) {
    const parts = key.split('.');
    let current: any = result;
    for (let i = 0; i < parts.length - 1; i++) {
      const part = parts[i];
      if (!(part in current) || typeof current[part] !== 'object' || current[part] === null) {
        current[part] = {};
      }
      current = current[part];
    }
    current[parts[parts.length - 1]] = value;
  }
  return result;
}
