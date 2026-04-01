'use client';
import { useState, useEffect } from 'react';
import { AdminLayout } from '@/components/layout/admin-layout';
import { RouteGuard } from '@/components/guards/RouteGuard';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { SearchInput } from '@/components/ui/search-input';
import { Table, TableHeader, TableBody, TableRow, TableHead, TableCell } from '@/components/ui/table';
import { Pagination } from '@/components/ui/pagination';
import { EmptyState } from '@/components/ui/empty-state';
import { TableSkeleton } from '@/components/ui/skeleton';
import { Modal } from '@/components/ui/modal';
import { Globe, Search, Download, Upload, Save, Edit2, Check, X } from 'lucide-react';

interface Translation {
  id: string;
  key: string;
  locale: string;
  value: string;
  category: string | null;
}

export default function AdminTranslationsPage() {
  const [translations, setTranslations] = useState<Translation[]>([]);
  const [loading, setLoading] = useState(true);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [searchQuery, setSearchQuery] = useState('');
  const [locale, setLocale] = useState('zh-CN');
  const [category, setCategory] = useState('all');
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editValue, setEditValue] = useState('');
  const [saving, setSaving] = useState(false);
  const [addModal, setAddModal] = useState(false);
  const [newKey, setNewKey] = useState({ key: '', valueZh: '', valueEn: '', category: '' });

  useEffect(() => {
    fetchData();
  }, [page, locale, category, searchQuery]);

  const fetchData = async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams({
        page: page.toString(),
        locale,
        ...(category !== 'all' && { category }),
        ...(searchQuery && { query: searchQuery }),
      });
      const res = await fetch(`/api/admin/translations?${params}`, { credentials: 'include' });
      const data = await res.json();
      if (data.data) {
        setTranslations(data.data);
        setTotalPages(data.totalPages || 1);
      }
    } catch (error) {
      console.error('Fetch error:', error);
    }
    setLoading(false);
  };

  const handleEdit = (translation: Translation) => {
    setEditingId(translation.id);
    setEditValue(translation.value);
  };

  const handleSave = async (id: string) => {
    setSaving(true);
    try {
      const res = await fetch(`/api/admin/translations/${id}`, {
        method: 'PATCH',
        credentials: 'include',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ value: editValue }),
      });
      if (res.ok) {
        setEditingId(null);
        fetchData();
      }
    } catch (error) {
      console.error('Save error:', error);
    }
    setSaving(false);
  };

  const handleAddKey = async () => {
    if (!newKey.key || !newKey.valueZh) return;
    setSaving(true);
    try {
      const res = await fetch('/api/admin/translations', {
        method: 'POST',
        credentials: 'include',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          key: newKey.key,
          translations: {
            'zh-CN': newKey.valueZh,
            'en': newKey.valueEn || newKey.valueZh,
          },
          category: newKey.category || null,
        }),
      });
      if (res.ok) {
        setAddModal(false);
        setNewKey({ key: '', valueZh: '', valueEn: '', category: '' });
        fetchData();
      }
    } catch (error) {
      console.error('Add error:', error);
    }
    setSaving(false);
  };

  return (
    <RouteGuard allowedRoles={['SUPER_ADMIN']}>
      <AdminLayout>
        <div className="space-y-6">
          <div className="flex items-center justify-between">
            <h1 className="text-2xl font-bold text-gray-900">翻译管理</h1>
            <div className="flex gap-2">
              <Button variant="outline" size="sm">
                <Download className="h-4 w-4" /> 导出
              </Button>
              <Button variant="outline" size="sm">
                <Upload className="h-4 w-4" /> 导入
              </Button>
              <Button size="sm" onClick={() => setAddModal(true)}>
                + 添加翻译
              </Button>
            </div>
          </div>

        <Card padding="none">
          <div className="p-4 border-b border-gray-200 space-y-3">
            <div className="flex flex-wrap gap-3">
              <div className="flex-1 min-w-[200px]">
                <SearchInput
                  placeholder="搜索翻译键或值..."
                  onSearch={setSearchQuery}
                />
              </div>
              <select
                className="px-3 py-2 border border-gray-300 rounded-lg text-sm bg-white focus:outline-none focus:ring-2 focus:ring-blue-500"
                value={locale}
                onChange={e => setLocale(e.target.value)}
              >
                <option value="zh-CN">中文 (zh-CN)</option>
                <option value="en">English (en)</option>
              </select>
              <select
                className="px-3 py-2 border border-gray-300 rounded-lg text-sm bg-white focus:outline-none focus:ring-2 focus:ring-blue-500"
                value={category}
                onChange={e => setCategory(e.target.value)}
              >
                <option value="all">所有分类</option>
                <option value="common">通用</option>
                <option value="auth">认证</option>
                <option value="dashboard">仪表板</option>
                <option value="order">订单</option>
                <option value="service">服务</option>
              </select>
            </div>
          </div>

          {loading ? (
            <TableSkeleton />
          ) : translations.length === 0 ? (
            <EmptyState icon={Globe} title="未找到翻译" description="尝试调整搜索条件" />
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>翻译键</TableHead>
                  <TableHead>语言</TableHead>
                  <TableHead>翻译值</TableHead>
                  <TableHead>分类</TableHead>
                  <TableHead>操作</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {translations.map(trans => (
                  <TableRow key={trans.id}>
                    <TableCell className="font-mono text-sm">{trans.key}</TableCell>
                    <TableCell>
                      <span className="text-sm text-gray-600">{trans.locale}</span>
                    </TableCell>
                    <TableCell>
                      {editingId === trans.id ? (
                        <Input
                          value={editValue}
                          onChange={e => setEditValue(e.target.value)}
                          className="max-w-md"
                        />
                      ) : (
                        <span className="text-sm">{trans.value}</span>
                      )}
                    </TableCell>
                    <TableCell>
                      <span className="text-xs text-gray-500">{trans.category || '-'}</span>
                    </TableCell>
                    <TableCell>
                      {editingId === trans.id ? (
                        <div className="flex gap-2">
                          <Button size="sm" onClick={() => handleSave(trans.id)} loading={saving}>
                            <Check className="h-4 w-4" />
                          </Button>
                          <Button size="sm" variant="outline" onClick={() => setEditingId(null)}>
                            <X className="h-4 w-4" />
                          </Button>
                        </div>
                      ) : (
                        <Button size="sm" variant="outline" onClick={() => handleEdit(trans)}>
                          <Edit2 className="h-4 w-4" /> 编辑
                        </Button>
                      )}
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </Card>

        <Pagination currentPage={page} totalPages={totalPages} onPageChange={setPage} />
      </div>

      <Modal isOpen={addModal} onClose={() => setAddModal(false)} title="添加翻译">
        <div className="space-y-4">
          <Input
            label="翻译键"
            placeholder="e.g. dashboard.title"
            value={newKey.key}
            onChange={e => setNewKey(p => ({ ...p, key: e.target.value }))}
            required
          />
          <Input
            label="中文翻译"
            value={newKey.valueZh}
            onChange={e => setNewKey(p => ({ ...p, valueZh: e.target.value }))}
            required
          />
          <Input
            label="英文翻译"
            value={newKey.valueEn}
            onChange={e => setNewKey(p => ({ ...p, valueEn: e.target.value }))}
          />
          <Input
            label="分类"
            placeholder="e.g. dashboard"
            value={newKey.category}
            onChange={e => setNewKey(p => ({ ...p, category: e.target.value }))}
          />
          <div className="flex gap-3 justify-end pt-4">
            <Button variant="outline" onClick={() => setAddModal(false)}>取消</Button>
            <Button onClick={handleAddKey} loading={saving} disabled={!newKey.key || !newKey.valueZh}>
              添加
            </Button>
          </div>
        </div>
      </Modal>
      </AdminLayout>
    </RouteGuard>
  );
}
