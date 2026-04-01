'use client';

import { ChangeEvent, useCallback, useEffect, useMemo, useState } from 'react';
import { AdminLayout } from '@/components/layout/admin-layout';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { SearchInput } from '@/components/ui/search-input';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { Pagination } from '@/components/ui/pagination';
import { TableSkeleton } from '@/components/ui/skeleton';
import { EmptyState } from '@/components/ui/empty-state';
import { formatDate } from '@/lib/utils';
import {
  Award,
  Download,
  Eye,
  FilePlus2,
  Inbox,
  Loader2,
  RefreshCw,
  ShieldCheck,
} from 'lucide-react';

type CertificateItem = {
  id: string;
  title: string;
  fileUrl: string;
  createdAt: string;
  issuedAt?: string;
  expiresAt?: string | null;
  status: string;
  certificateNo: string;
  uploadedBy?: string;
  order: {
    id: string;
    orderNo: string;
    status?: string;
    user?: {
      name?: string | null;
      email?: string | null;
    } | null;
  };
};

type ApiResponse = {
  success: boolean;
  data: CertificateItem[];
  totalPages: number;
  total: number;
};

export default function AdminCertificatesPage() {
  const [items, setItems] = useState<CertificateItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [uploading, setUploading] = useState(false);

  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [search, setSearch] = useState('');
  const [message, setMessage] = useState<string | null>(null);

  const [form, setForm] = useState({
    orderNo: '',
    title: '',
    expiresAt: '',
    fileUrl: '',
  });

  const fetchCertificates = useCallback(() => {
    setLoading(true);

    const params = new URLSearchParams({
      page: String(page),
      pageSize: '10',
      scope: 'admin',
    });

    if (search) params.set('q', search);

    fetch(`/api/certificates?${params.toString()}`, {
      credentials: 'include',
    })
      .then(async (res) => {
        const data: ApiResponse | { error?: string } = await res.json();
        if (!res.ok) throw new Error('error' in data ? data.error : '获取证书失败');
        return data as ApiResponse;
      })
      .then((data) => {
        setItems(data.data || []);
        setTotalPages(data.totalPages || 1);
      })
      .catch((error: Error) => {
        setMessage(error.message || '获取证书失败');
      })
      .finally(() => setLoading(false));
  }, [page, search]);

  useEffect(() => {
    fetchCertificates();
  }, [fetchCertificates]);

  const stats = useMemo(() => {
    const total = items.length;
    const issued = items.filter((item) => item.status === 'ISSUED').length;
    const expiringSoon = items.filter((item) => {
      if (!item.expiresAt) return false;
      const diff = new Date(item.expiresAt).getTime() - Date.now();
      return diff > 0 && diff <= 1000 * 60 * 60 * 24 * 30;
    }).length;

    return { total, issued, expiringSoon };
  }, [items]);

  const handleFileUpload = async (event: ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    try {
      setUploading(true);
      setMessage(null);

      const formData = new FormData();
      formData.append('file', file);
      formData.append('folder', 'certificates');

      const res = await fetch('/api/uploads', {
        method: 'POST',
        body: formData,
        credentials: 'include',
      });

      const data = await res.json();

      if (!res.ok || !data?.success) {
        throw new Error(data?.error || '文件上传失败');
      }

      setForm((prev) => ({
        ...prev,
        fileUrl: data.data.file.url,
        title: prev.title || file.name.replace(/\.[^/.]+$/, ''),
      }));

      setMessage('证书文件上传成功');
    } catch (error) {
      setMessage(error instanceof Error ? error.message : '文件上传失败');
    } finally {
      setUploading(false);
      event.target.value = '';
    }
  };

  const handleCreateCertificate = async () => {
    if (!form.orderNo || !form.title || !form.fileUrl) {
      setMessage('请填写订单编号、证书标题并上传证书文件');
      return;
    }

    try {
      setSubmitting(true);
      setMessage(null);

      const res = await fetch('/api/certificates', {
        method: 'POST',
        credentials: 'include',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          orderNo: form.orderNo.trim(),
          title: form.title.trim(),
          fileUrl: form.fileUrl.trim(),
          expiresAt: form.expiresAt || undefined,
        }),
      });

      const data = await res.json();

      if (!res.ok || !data?.success) {
        throw new Error(data?.error || '签发证书失败');
      }

      setForm({
        orderNo: '',
        title: '',
        expiresAt: '',
        fileUrl: '',
      });

      setMessage('证书签发成功');
      setPage(1);
      fetchCertificates();
    } catch (error) {
      setMessage(error instanceof Error ? error.message : '签发证书失败');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <AdminLayout>
      <div className="space-y-6">
        <div className="flex flex-col gap-2">
          <h1 className="text-2xl font-bold text-gray-900">证书管理</h1>
          <p className="text-sm text-gray-500">
            上传并签发订单证书，用户可在个人中心下载查看。
          </p>
        </div>

        {message ? (
          <div className="rounded-lg border border-blue-200 bg-blue-50 px-4 py-3 text-sm text-blue-700">
            {message}
          </div>
        ) : null}

        <div className="grid gap-4 md:grid-cols-3">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-base">
                <Award className="h-4 w-4 text-blue-600" />
                当前页证书数
              </CardTitle>
              <CardDescription>当前列表页已加载的证书数量</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-gray-900">{stats.total}</div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-base">
                <ShieldCheck className="h-4 w-4 text-green-600" />
                已签发
              </CardTitle>
              <CardDescription>状态为已签发的证书数量</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-gray-900">{stats.issued}</div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-base">
                <RefreshCw className="h-4 w-4 text-amber-600" />
                30天内到期
              </CardTitle>
              <CardDescription>便于提前安排复检或续签</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-gray-900">{stats.expiringSoon}</div>
            </CardContent>
          </Card>
        </div>

        <Card>
          <CardHeader>
            <CardTitle>签发新证书</CardTitle>
            <CardDescription>
              先上传证书 PDF，再绑定订单编号并完成签发。
            </CardDescription>
          </CardHeader>
          <CardContent className="grid gap-4 md:grid-cols-2">
            <div>
              <label className="mb-1.5 block text-sm font-medium text-gray-700">订单编号</label>
              <input
                value={form.orderNo}
                onChange={(e) => setForm((prev) => ({ ...prev, orderNo: e.target.value }))}
                placeholder="例如：DLH202603310001"
                className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>

            <div>
              <label className="mb-1.5 block text-sm font-medium text-gray-700">证书标题</label>
              <input
                value={form.title}
                onChange={(e) => setForm((prev) => ({ ...prev, title: e.target.value }))}
                placeholder="例如：材料检测合格证书"
                className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>

            <div>
              <label className="mb-1.5 block text-sm font-medium text-gray-700">有效期截止（可选）</label>
              <input
                type="datetime-local"
                value={form.expiresAt}
                onChange={(e) => setForm((prev) => ({ ...prev, expiresAt: e.target.value }))}
                className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>

            <div>
              <label className="mb-1.5 block text-sm font-medium text-gray-700">上传证书文件</label>
              <div className="flex flex-wrap items-center gap-3">
                <label className="inline-flex cursor-pointer items-center rounded-lg border border-gray-300 px-3 py-2 text-sm text-gray-700 hover:bg-gray-50">
                  {uploading ? (
                    <>
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      上传中...
                    </>
                  ) : (
                    <>
                      <FilePlus2 className="mr-2 h-4 w-4" />
                      选择 PDF 文件
                    </>
                  )}
                  <input
                    type="file"
                    className="hidden"
                    accept="application/pdf"
                    onChange={handleFileUpload}
                    disabled={uploading}
                  />
                </label>

                {form.fileUrl ? (
                  <span className="truncate text-xs text-green-600">
                    已上传，可签发
                  </span>
                ) : (
                  <span className="text-xs text-gray-500">暂未上传文件</span>
                )}
              </div>
            </div>

            <div className="md:col-span-2">
              <label className="mb-1.5 block text-sm font-medium text-gray-700">文件地址</label>
              <input
                value={form.fileUrl}
                onChange={(e) => setForm((prev) => ({ ...prev, fileUrl: e.target.value }))}
                placeholder="上传后会自动填充，也可以手动粘贴"
                className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>

            <div className="md:col-span-2 flex justify-end">
              <Button
                onClick={handleCreateCertificate}
                loading={submitting}
                disabled={submitting || uploading}
              >
                签发证书
              </Button>
            </div>
          </CardContent>
        </Card>

        <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
          <SearchInput
            placeholder="搜索证书标题 / 编号 / 订单号"
            onSearch={(value) => {
              setSearch(value);
              setPage(1);
            }}
            className="max-w-md"
          />

          <Button variant="outline" onClick={fetchCertificates}>
            <RefreshCw className="h-4 w-4" />
            刷新
          </Button>
        </div>

        {loading ? (
          <TableSkeleton />
        ) : items.length === 0 ? (
          <EmptyState
            icon={Inbox}
            title="暂无证书"
            description="上传并签发第一张证书后，这里会显示完整列表。"
          />
        ) : (
          <Card padding="none">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>证书编号</TableHead>
                  <TableHead>标题</TableHead>
                  <TableHead>订单</TableHead>
                  <TableHead>客户</TableHead>
                  <TableHead>状态</TableHead>
                  <TableHead>签发时间</TableHead>
                  <TableHead>到期时间</TableHead>
                  <TableHead>操作</TableHead>
                </TableRow>
              </TableHeader>

              <TableBody>
                {items.map((item) => (
                  <TableRow key={item.id}>
                    <TableCell className="font-mono text-xs">{item.certificateNo}</TableCell>
                    <TableCell className="font-medium">{item.title}</TableCell>
                    <TableCell>{item.order.orderNo}</TableCell>
                    <TableCell className="text-sm text-gray-600">
                      {item.order.user?.name || item.order.user?.email || '-'}
                    </TableCell>
                    <TableCell>
                      <Badge variant="success">{item.status}</Badge>
                    </TableCell>
                    <TableCell className="text-sm text-gray-500">
                      {item.issuedAt ? formatDate(item.issuedAt) : '-'}
                    </TableCell>
                    <TableCell className="text-sm text-gray-500">
                      {item.expiresAt ? formatDate(item.expiresAt) : '长期有效'}
                    </TableCell>
                    <TableCell>
                      <div className="flex gap-1">
                        <Button
                          size="sm"
                          variant="ghost"
                          onClick={() => window.open(item.fileUrl, '_blank', 'noopener,noreferrer')}
                        >
                          <Eye className="h-4 w-4" />
                        </Button>
                        <Button
                          size="sm"
                          variant="ghost"
                          onClick={() => window.open(item.fileUrl, '_blank', 'noopener,noreferrer')}
                        >
                          <Download className="h-4 w-4" />
                        </Button>
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </Card>
        )}

        <Pagination currentPage={page} totalPages={totalPages} onPageChange={setPage} />
      </div>
    </AdminLayout>
  );
}