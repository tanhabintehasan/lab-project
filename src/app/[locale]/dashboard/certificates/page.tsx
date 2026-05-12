'use client';

import { useCallback, useEffect, useMemo, useState } from 'react';
import { DashboardLayout } from '@/components/layout/dashboard-layout';
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
import { EmptyState } from '@/components/ui/empty-state';
import { TableSkeleton } from '@/components/ui/skeleton';
import { formatDate } from '@/lib/utils';
import { Award, Download, Eye, Inbox, ShieldCheck } from 'lucide-react';

type CertificateItem = {
  id: string;
  title: string;
  fileUrl: string;
  createdAt: string;
  issuedAt?: string;
  expiresAt?: string | null;
  status: string;
  certificateNo: string;
  order: {
    id: string;
    orderNo: string;
  };
};

type ApiResponse = {
  success: boolean;
  data: CertificateItem[];
  totalPages: number;
  total: number;
};

export default function DashboardCertificatesPage() {
  const [items, setItems] = useState<CertificateItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [search, setSearch] = useState('');

  const fetchCertificates = useCallback(() => {
    setLoading(true);

    const params = new URLSearchParams({
      page: String(page),
      pageSize: '10',
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
        console.error(error.message);
        setItems([]);
        setTotalPages(1);
      })
      .finally(() => setLoading(false));
  }, [page, search]);

  useEffect(() => {
    fetchCertificates();
  }, [fetchCertificates]);

  const stats = useMemo(() => {
    const total = items.length;
    const active = items.filter((item) => {
      if (!item.expiresAt) return true;
      return new Date(item.expiresAt).getTime() >= Date.now();
    }).length;

    return { total, active };
  }, [items]);

  return (
    <DashboardLayout>
      <div className="space-y-6">
        <div className="flex flex-col gap-2">
          <h1 className="text-2xl font-bold text-gray-900">我的证书</h1>
          <p className="text-sm text-gray-500">
            查看已签发的检测证书，支持在线预览和下载。
          </p>
        </div>

        <div className="grid gap-4 md:grid-cols-2">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-base">
                <Award className="h-4 w-4 text-blue-600" />
                证书总数
              </CardTitle>
              <CardDescription>当前账号下可查看的全部证书</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-gray-900">{stats.total}</div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-base">
                <ShieldCheck className="h-4 w-4 text-green-600" />
                当前有效
              </CardTitle>
              <CardDescription>未过期或长期有效的证书数量</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-gray-900">{stats.active}</div>
            </CardContent>
          </Card>
        </div>

        <SearchInput
          placeholder="搜索证书标题 / 编号 / 订单号"
          onSearch={(value) => {
            setSearch(value);
            setPage(1);
          }}
          className="max-w-md"
        />

        {loading ? (
          <TableSkeleton />
        ) : items.length === 0 ? (
          <EmptyState
            icon={Inbox}
            title="暂无证书"
            description="管理员签发证书后，这里会自动显示。"
          />
        ) : (
          <Card padding="none">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>证书编号</TableHead>
                  <TableHead>标题</TableHead>
                  <TableHead>订单编号</TableHead>
                  <TableHead>状态</TableHead>
                  <TableHead>签发时间</TableHead>
                  <TableHead>有效期</TableHead>
                  <TableHead>操作</TableHead>
                </TableRow>
              </TableHeader>

              <TableBody>
                {items.map((item) => (
                  <TableRow key={item.id}>
                    <TableCell className="font-mono text-xs">{item.certificateNo}</TableCell>
                    <TableCell className="font-medium">{item.title}</TableCell>
                    <TableCell>{item.order.orderNo}</TableCell>
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
    </DashboardLayout>
  );
}