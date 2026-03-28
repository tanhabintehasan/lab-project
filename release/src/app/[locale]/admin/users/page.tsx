'use client';
import { useState, useEffect, useCallback } from 'react';
import { AdminLayout } from '@/components/layout/admin-layout';
import { RouteGuard } from '@/components/guards/RouteGuard';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { SearchInput } from '@/components/ui/search-input';
import { Select } from '@/components/ui/select';
import { Table, TableHeader, TableBody, TableRow, TableHead, TableCell } from '@/components/ui/table';
import { Pagination } from '@/components/ui/pagination';
import { TableSkeleton } from '@/components/ui/skeleton';
import { useAuthStore } from '@/store/auth-store';
import { formatDate } from '@/lib/utils';

const roleVariant: Record<string, 'default'|'info'|'success'|'warning'|'danger'> = {
  CUSTOMER:'default', SUPER_ADMIN:'danger', FINANCE_ADMIN:'warning', LAB_PARTNER:'success', ENTERPRISE_MEMBER:'info',
};

export default function AdminUsersPage() {
  // Auth via HttpOnly cookie
  const [users, setUsers] = useState<Array<Record<string, unknown>>>([]);
  const [loading, setLoading] = useState(true);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [search, setSearch] = useState('');
  const [roleFilter, setRoleFilter] = useState('');

  const fetchData = useCallback(() => {
    setLoading(true);
    const p = new URLSearchParams({ page: String(page), pageSize: '15' });
    if (search) p.set('q', search);
    if (roleFilter) p.set('role', roleFilter);
    fetch(`/api/admin/users?${p}`, { })
      .then(r => r.json())
      .then(d => { setUsers(d.data || []); setTotalPages(d.totalPages || 1); })
      .finally(() => setLoading(false));
  }, [page, search, roleFilter]);

  useEffect(() => { fetchData(); }, [fetchData]);

  const updateUser = async (id: string, data: Record<string, string>) => {
    await fetch(`/api/admin/users/${id}`, {
      credentials: 'include',
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data),
    });
    fetchData();
  };

  return (
    <RouteGuard allowedRoles={['SUPER_ADMIN']}>
      <AdminLayout>
        <div className="space-y-6">
          <h1 className="text-2xl font-bold text-gray-900">用户管理</h1>
          <div className="flex flex-wrap gap-3">
            <SearchInput placeholder="搜索用户..." onSearch={v => { setSearch(v); setPage(1); }} className="w-64" />
            <Select options={[
              { value: '', label: '全部角色' }, { value: 'CUSTOMER', label: '客户' },
              { value: 'LAB_PARTNER', label: '实验室' }, { value: 'SUPER_ADMIN', label: '管理员' },
            ]} value={roleFilter} onChange={e => { setRoleFilter(e.target.value); setPage(1); }} />
          </div>
          {loading ? <TableSkeleton /> : (
            <Card padding="none">
              <Table>
                <TableHeader><TableRow>
                  <TableHead>姓名</TableHead><TableHead>邮箱</TableHead><TableHead>角色</TableHead>
                  <TableHead>状态</TableHead><TableHead>注册时间</TableHead><TableHead>操作</TableHead>
                </TableRow></TableHeader>
                <TableBody>
                  {users.map(u => (
                    <TableRow key={u.id as string}>
                      <TableCell className="font-medium">{u.name as string}</TableCell>
                      <TableCell className="text-sm">{u.email as string}</TableCell>
                      <TableCell><Badge variant={roleVariant[(u.role as string)] || 'default'}>{u.role as string}</Badge></TableCell>
                      <TableCell><Badge variant={u.status === 'ACTIVE' ? 'success' : 'danger'}>{u.status as string}</Badge></TableCell>
                      <TableCell className="text-sm text-gray-500">{formatDate(u.createdAt as string)}</TableCell>
                      <TableCell>
                        <Button size="sm" variant="ghost" onClick={() =>
                          updateUser(u.id as string, { status: u.status === 'ACTIVE' ? 'SUSPENDED' : 'ACTIVE' })
                        }>{u.status === 'ACTIVE' ? '禁用' : '启用'}</Button>
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
    </RouteGuard>
  );
}
