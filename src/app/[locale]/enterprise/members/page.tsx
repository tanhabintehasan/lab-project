'use client';
import { useState, useEffect } from 'react';
import { EnterpriseLayout } from '@/components/layout/enterprise-layout';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Modal } from '@/components/ui/modal';
import { Badge } from '@/components/ui/badge';
import { Table, TableHeader, TableBody, TableRow, TableHead, TableCell } from '@/components/ui/table';
import { Pagination } from '@/components/ui/pagination';
import { EmptyState } from '@/components/ui/empty-state';
import { TableSkeleton } from '@/components/ui/skeleton';
import { useAuthStore } from '@/store/auth-store';
import { Plus, Mail, UserX, RefreshCw, Clock } from 'lucide-react';
import { formatDate } from '@/lib/utils';

interface Member {
  id: string;
  name: string;
  email: string;
  role: string;
  status?: string;
  joinedAt: string;
}

interface Invitation {
  id: string;
  email: string;
  role: string;
  status: string;
  expiresAt: string;
  createdAt: string;
}

export default function EnterpriseMembersPage() {
  const { user } = useAuthStore();
  const [members, setMembers] = useState<Member[]>([]);
  const [invitations, setInvitations] = useState<Invitation[]>([]);
  const [loading, setLoading] = useState(true);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [activeTab, setActiveTab] = useState<'members' | 'invitations'>('members');
  const [inviteModal, setInviteModal] = useState(false);
  const [inviteForm, setInviteForm] = useState({ email: '', name: '', role: 'member' });
  const [sending, setSending] = useState(false);

  useEffect(() => {
    fetchData();
  }, [page, activeTab]);

  const fetchData = async () => {
    setLoading(true);
    try {
      if (activeTab === 'members') {
        const res = await fetch(`/api/enterprise/members?page=${page}`, { credentials: 'include' });
        const data = await res.json();
        if (data.success && data.data) {
          setMembers(data.data.data || []);
          setTotalPages(data.data.totalPages || 1);
        }
      } else {
        const res = await fetch(`/api/enterprise/invites?page=${page}`, { credentials: 'include' });
        const data = await res.json();
        if (data.success && data.data) {
          setInvitations(data.data.data || []);
          setTotalPages(data.data.totalPages || 1);
        }
      }
    } catch (error) {
      console.error('Fetch error:', error);
    }
    setLoading(false);
  };

  const handleSendInvite = async () => {
    if (!inviteForm.email) return;
    setSending(true);
    try {
      const res = await fetch('/api/enterprise/invites', {
        method: 'POST',
        credentials: 'include',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(inviteForm),
      });
      const data = await res.json();
      if (data.success) {
        setInviteModal(false);
        setInviteForm({ email: '', name: '', role: 'member' });
        if (activeTab === 'invitations') fetchData();
      }
    } catch (error) {
      console.error('Invite error:', error);
    }
    setSending(false);
  };

  const handleRevokeInvite = async (id: string) => {
    if (!confirm('确定要撤销此邀请吗？')) return;
    try {
      await fetch(`/api/enterprise/invites/${id}/revoke`, {
        method: 'POST',
        credentials: 'include',
      });
      fetchData();
    } catch (error) {
      console.error('Revoke error:', error);
    }
  };

  return (
    <EnterpriseLayout>
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <h1 className="text-2xl font-bold text-gray-900">成员管理</h1>
          <div className="flex gap-2">
            <Button variant="outline" size="sm" onClick={fetchData}>
              <RefreshCw className="h-4 w-4" /> 刷新
            </Button>
            <Button size="sm" onClick={() => setInviteModal(true)}>
              <Plus className="h-4 w-4" /> 邀请成员
            </Button>
          </div>
        </div>

        <Card padding="none">
          <div className="border-b border-gray-200">
            <nav className="flex -mb-px">
              <button
                onClick={() => { setActiveTab('members'); setPage(1); }}
                className={`px-6 py-3 text-sm font-medium border-b-2 ${
                  activeTab === 'members'
                    ? 'border-blue-600 text-blue-600'
                    : 'border-transparent text-gray-500 hover:text-gray-700'
                }`}
              >
                成员列表
              </button>
              <button
                onClick={() => { setActiveTab('invitations'); setPage(1); }}
                className={`px-6 py-3 text-sm font-medium border-b-2 ${
                  activeTab === 'invitations'
                    ? 'border-blue-600 text-blue-600'
                    : 'border-transparent text-gray-500 hover:text-gray-700'
                }`}
              >
                待处理邀请
              </button>
            </nav>
          </div>

          {loading ? (
            <TableSkeleton />
          ) : activeTab === 'members' ? (
            members.length === 0 ? (
              <EmptyState icon={UserX} title="暂无成员" />
            ) : (
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>姓名</TableHead>
                    <TableHead>邮箱</TableHead>
                    <TableHead>角色</TableHead>
                    <TableHead>加入时间</TableHead>
                    <TableHead>操作</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {members.map(member => (
                    <TableRow key={member.id}>
                      <TableCell className="font-medium">{member.name}</TableCell>
                      <TableCell>{member.email}</TableCell>
                      <TableCell>
                        <Badge variant={member.role === 'owner' ? 'success' : member.role === 'admin' ? 'info' : 'default'}>
                          {member.role}
                        </Badge>
                      </TableCell>
                      <TableCell className="text-gray-500">{formatDate(member.joinedAt)}</TableCell>
                      <TableCell>
                        {member.role !== 'owner' && (
                          <Button size="sm" variant="outline">管理</Button>
                        )}
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            )
          ) : (
            invitations.length === 0 ? (
              <EmptyState icon={Mail} title="暂无待处理邀请" />
            ) : (
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>邮箱</TableHead>
                    <TableHead>角色</TableHead>
                    <TableHead>状态</TableHead>
                    <TableHead>过期时间</TableHead>
                    <TableHead>操作</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {invitations.map(inv => (
                    <TableRow key={inv.id}>
                      <TableCell className="font-medium">{inv.email}</TableCell>
                      <TableCell>
                        <Badge variant="default">{inv.role}</Badge>
                      </TableCell>
                      <TableCell>
                        <Badge variant="warning">
                          <Clock className="h-3 w-3 mr-1" /> 待接受
                        </Badge>
                      </TableCell>
                      <TableCell className="text-gray-500">{formatDate(inv.expiresAt)}</TableCell>
                      <TableCell>
                        <Button size="sm" variant="outline" onClick={() => handleRevokeInvite(inv.id)}>
                          撤销
                        </Button>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            )
          )}
        </Card>

        <Pagination currentPage={page} totalPages={totalPages} onPageChange={setPage} />
      </div>

      <Modal isOpen={inviteModal} onClose={() => setInviteModal(false)} title="邀请成员">
        <div className="space-y-4">
          <Input
            label="邮箱"
            type="email"
            placeholder="member@example.com"
            value={inviteForm.email}
            onChange={e => setInviteForm(p => ({ ...p, email: e.target.value }))}
            required
          />
          <Input
            label="姓名 (可选)"
            placeholder="张三"
            value={inviteForm.name}
            onChange={e => setInviteForm(p => ({ ...p, name: e.target.value }))}
          />
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">角色</label>
            <select
              className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm bg-white focus:outline-none focus:ring-2 focus:ring-blue-500"
              value={inviteForm.role}
              onChange={e => setInviteForm(p => ({ ...p, role: e.target.value }))}
            >
              <option value="member">成员</option>
              <option value="admin">管理员</option>
            </select>
          </div>
          <div className="flex gap-3 justify-end pt-4">
            <Button variant="outline" onClick={() => setInviteModal(false)}>取消</Button>
            <Button onClick={handleSendInvite} loading={sending} disabled={!inviteForm.email}>
              发送邀请
            </Button>
          </div>
        </div>
      </Modal>
    </EnterpriseLayout>
  );
}
