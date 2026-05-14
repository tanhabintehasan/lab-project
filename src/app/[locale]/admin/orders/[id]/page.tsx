'use client';

import { useEffect, useState, useCallback, useMemo } from 'react';
import { useParams } from 'next/navigation';
import { AdminLayout } from '@/components/layout/admin-layout';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Select } from '@/components/ui/select';
import { Modal } from '@/components/ui/modal';
import { Timeline } from '@/components/ui/timeline';
import { Table, TableHeader, TableBody, TableRow, TableHead, TableCell } from '@/components/ui/table';
import { formatCurrency, formatDate, formatDateTime } from '@/lib/utils';
import { useAuthStore } from '@/store/auth-store';
import {
  ArrowLeft, Package, User, FlaskConical, FileText,
  RefreshCw, MapPin, CreditCard, Truck, CheckCircle2,
  AlertTriangle
} from 'lucide-react';
import { Link } from '@/i18n/routing';


interface OrderDetail {
  id: string;
  orderNo: string;
  status: string;
  paymentStatus: string;
  totalAmount: number;
  currency: string;
  notes: string | null;
  createdAt: string;
  updatedAt: string;
  assignedLabId: string | null;
  user: { id: string; name: string | null; email: string } | null;
  lab: { id: string; nameZh: string | null; slug: string } | null;
  address: { name: string; phone: string; province: string; city: string; district: string; street: string } | null;
  items: Array<{
    id: string;
    quantity: number;
    unitPrice: number;
    subtotal: number;
    service: { nameZh: string; slug: string };
  }>;
  timeline: Array<{
    id: string;
    status: string;
    title: string;
    description: string | null;
    operator: string | null;
    createdAt: string;
  }>;
  samples: Array<{
    id: string;
    sampleNo: string;
    name: string;
    status: string;
  }>;
  payments: Array<{
    id: string;
    method: string;
    amount: number;
    status: string;
    paidAt: string | null;
  }>;
}

interface LabOption {
  id: string;
  nameZh: string | null;
}

const statusLabels: Record<string, string> = {
  PENDING_PAYMENT: '待支付',
  PAID: '已支付',
  SAMPLE_PENDING: '待寄样',
  SAMPLE_SHIPPED: '已寄样',
  SAMPLE_RECEIVED: '已收样',
  SAMPLE_INSPECTED: '已检验',
  TESTING_IN_PROGRESS: '检测中',
  TESTING_COMPLETE: '检测完成',
  REPORT_GENERATING: '报告生成中',
  REPORT_APPROVED: '报告就绪',
  REPORT_DELIVERED: '报告已送达',
  COMPLETED: '已完成',
  CANCELLED: '已取消',
  REFUNDING: '退款中',
  REFUNDED: '已退款',
};

const statusBadgeVariant = (status: string): 'default' | 'success' | 'warning' | 'danger' | 'info' | 'outline' => {
  const map: Record<string, 'default' | 'success' | 'warning' | 'danger' | 'info' | 'outline'> = {
    PENDING_PAYMENT: 'warning',
    PAID: 'info',
    SAMPLE_PENDING: 'default',
    SAMPLE_SHIPPED: 'default',
    SAMPLE_RECEIVED: 'info',
    SAMPLE_INSPECTED: 'info',
    TESTING_IN_PROGRESS: 'info',
    TESTING_COMPLETE: 'success',
    REPORT_GENERATING: 'info',
    REPORT_APPROVED: 'success',
    REPORT_DELIVERED: 'success',
    COMPLETED: 'success',
    CANCELLED: 'danger',
    REFUNDING: 'warning',
    REFUNDED: 'outline',
  };
  return map[status] || 'default';
};

export default function AdminOrderDetailPage() {
  const params = useParams();
  const orderId = params.id as string;
  const { user } = useAuthStore();
  const isSuperAdmin = user?.role === 'SUPER_ADMIN';

  const [order, setOrder] = useState<OrderDetail | null>(null);
  const [loading, setLoading] = useState(true);
  const [labs, setLabs] = useState<LabOption[]>([]);

  // Force status modal
  const [statusModalOpen, setStatusModalOpen] = useState(false);
  const [newStatus, setNewStatus] = useState('');
  const [statusNote, setStatusNote] = useState('');
  const [updatingStatus, setUpdatingStatus] = useState(false);

  // Lab assignment
  const [selectedLab, setSelectedLab] = useState('');
  const [assigningLab, setAssigningLab] = useState(false);

  const fetchOrder = useCallback(async () => {
    try {
      const res = await fetch(`/api/orders/${orderId}`, { cache: 'no-store' });
      const data = await res.json();
      if (data?.success && data.data) {
        setOrder(data.data);
        if (data.data.assignedLabId) {
          setSelectedLab(data.data.assignedLabId);
        }
      }
    } catch (e) {
      console.error('Fetch order error:', e);
    } finally {
      setLoading(false);
    }
  }, [orderId]);

  const fetchLabs = useCallback(async () => {
    try {
      const res = await fetch('/api/labs?pageSize=100&status=ACTIVE', { cache: 'no-store' });
      const data = await res.json();
      if (data?.success && Array.isArray(data.data)) {
        setLabs(data.data.map((l: any) => ({ id: l.id, nameZh: l.nameZh })));
      }
    } catch (e) {
      console.error('Fetch labs error:', e);
    }
  }, []);

  useEffect(() => {
    fetchOrder();
    fetchLabs();
  }, [fetchOrder, fetchLabs]);

  const allowedStatuses = useMemo(() => {
    if (!order) return [];
    // Admin force update can select any status except current
    return Object.keys(statusLabels).filter((s) => s !== order.status);
  }, [order?.status]);

  const handleUpdateStatus = async () => {
    if (!newStatus || !order) return;
    setUpdatingStatus(true);
    try {
      const res = await fetch(`/api/orders/${orderId}/status`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status: newStatus, note: statusNote, force: true }),
      });
      const data = await res.json();
      if (data?.success) {
        setStatusModalOpen(false);
        setNewStatus('');
        setStatusNote('');
        await fetchOrder();
      } else {
        alert(data?.error || '更新失败');
      }
    } catch (e) {
      alert('更新失败');
    } finally {
      setUpdatingStatus(false);
    }
  };

  const handleAssignLab = async () => {
    if (!selectedLab || !order) return;
    setAssigningLab(true);
    try {
      const res = await fetch(`/api/orders/${orderId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ assignedLabId: selectedLab }),
      });
      const data = await res.json();
      if (data?.success) {
        await fetchOrder();
      } else {
        alert(data?.error || '分配失败');
      }
    } catch (e) {
      alert('分配失败');
    } finally {
      setAssigningLab(false);
    }
  };

  const timelineItems = useMemo(() => {
    if (!order?.timeline) return [];
    return order.timeline.map((t, idx) => ({
      id: t.id,
      title: t.title,
      description: t.description || undefined,
      time: formatDateTime(t.createdAt),
      operator: t.operator || undefined,
      status: (idx === 0 ? 'current' : 'completed') as 'completed' | 'current' | 'pending' | 'error',
    }));
  }, [order?.timeline]);

  if (loading) {
    return (
      <AdminLayout>
        <div className="p-6">
          <div className="h-8 w-48 bg-gray-200 rounded animate-pulse mb-6" />
          <div className="grid gap-6 md:grid-cols-3">
            <div className="h-40 bg-gray-200 rounded-xl animate-pulse" />
            <div className="h-40 bg-gray-200 rounded-xl animate-pulse" />
            <div className="h-40 bg-gray-200 rounded-xl animate-pulse" />
          </div>
        </div>
      </AdminLayout>
    );
  }

  if (!order) {
    return (
      <AdminLayout>
        <div className="p-6 text-center text-gray-500">订单不存在或无权访问</div>
      </AdminLayout>
    );
  }

  return (
    <AdminLayout>
      <div className="space-y-6 p-6">
        {/* Header */}
        <div className="flex items-center gap-4">
          <Link href="/admin/orders">
            <Button variant="outline" size="sm"><ArrowLeft className="h-4 w-4" />返回</Button>
          </Link>
          <div className="flex-1">
            <h1 className="text-2xl font-bold text-gray-900">订单详情</h1>
            <p className="text-sm text-gray-500">{order.orderNo}</p>
          </div>
          <Badge variant={statusBadgeVariant(order.status)} size="md">
            {statusLabels[order.status] || order.status}
          </Badge>
          {isSuperAdmin && (
            <Button size="sm" onClick={() => setStatusModalOpen(true)}>
              <RefreshCw className="h-4 w-4 mr-1" />强制更新状态
            </Button>
          )}
        </div>

        {/* Info cards */}
        <div className="grid gap-6 md:grid-cols-3">
          {/* Customer */}
          <Card padding="lg">
            <div className="flex items-center gap-2 mb-4">
              <User className="h-5 w-5 text-blue-600" />
              <h3 className="font-semibold text-gray-900">客户信息</h3>
            </div>
            <div className="space-y-2 text-sm">
              <p><span className="text-gray-500">姓名：</span>{order.user?.name || '-'}</p>
              <p><span className="text-gray-500">邮箱：</span>{order.user?.email || '-'}</p>
              <p><span className="text-gray-500">订单金额：</span><span className="font-medium">{formatCurrency(Number(order.totalAmount))}</span></p>
              <p><span className="text-gray-500">创建时间：</span>{formatDateTime(order.createdAt)}</p>
            </div>
          </Card>

          {/* Lab Assignment */}
          <Card padding="lg">
            <div className="flex items-center gap-2 mb-4">
              <FlaskConical className="h-5 w-5 text-emerald-600" />
              <h3 className="font-semibold text-gray-900">实验室分配</h3>
            </div>
            <div className="space-y-3">
              <p className="text-sm">
                <span className="text-gray-500">当前实验室：</span>
                {order.lab?.nameZh ? (
                  <span className="font-medium">{order.lab.nameZh}</span>
                ) : (
                  <span className="text-orange-600">未分配</span>
                )}
              </p>
              <div className="flex gap-2">
                <Select
                  className="flex-1"
                  placeholder="选择实验室"
                  options={labs.map((l) => ({ value: l.id, label: l.nameZh || l.id }))}
                  value={selectedLab}
                  onChange={(e) => setSelectedLab(e.target.value)}
                />
                <Button size="sm" onClick={handleAssignLab} loading={assigningLab} disabled={!selectedLab || selectedLab === order.assignedLabId}>
                  分配
                </Button>
              </div>
            </div>
          </Card>

          {/* Address / Shipping */}
          <Card padding="lg">
            <div className="flex items-center gap-2 mb-4">
              <MapPin className="h-5 w-5 text-amber-600" />
              <h3 className="font-semibold text-gray-900">收货地址</h3>
            </div>
            <div className="space-y-2 text-sm">
              {order.address ? (
                <>
                  <p><span className="text-gray-500">联系人：</span>{order.address.name} {order.address.phone}</p>
                  <p><span className="text-gray-500">地址：</span>{order.address.province}{order.address.city}{order.address.district}{order.address.street}</p>
                </>
              ) : (
                <p className="text-gray-400">无地址信息</p>
              )}
            </div>
          </Card>
        </div>

        {/* Order Items */}
        <Card padding="lg">
          <div className="flex items-center gap-2 mb-4">
            <Package className="h-5 w-5 text-purple-600" />
            <h3 className="font-semibold text-gray-900">订单项目</h3>
          </div>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>服务</TableHead>
                <TableHead>数量</TableHead>
                <TableHead>单价</TableHead>
                <TableHead>小计</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {order.items.map((item) => (
                <TableRow key={item.id}>
                  <TableCell>{item.service.nameZh}</TableCell>
                  <TableCell>{item.quantity}</TableCell>
                  <TableCell>{formatCurrency(Number(item.unitPrice))}</TableCell>
                  <TableCell className="font-medium">{formatCurrency(Number(item.subtotal))}</TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </Card>

        {/* Samples */}
        {order.samples.length > 0 && (
          <Card padding="lg">
            <div className="flex items-center gap-2 mb-4">
              <Truck className="h-5 w-5 text-cyan-600" />
              <h3 className="font-semibold text-gray-900">样品信息</h3>
            </div>
            <div className="space-y-3">
              {order.samples.map((s) => (
                <div key={s.id} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                  <div>
                    <p className="text-sm font-medium">{s.name}</p>
                    <p className="text-xs text-gray-500">样品编号：{s.sampleNo}</p>
                  </div>
                  <Badge variant="outline" size="sm">{s.status}</Badge>
                </div>
              ))}
            </div>
          </Card>
        )}

        {/* Payments */}
        {order.payments.length > 0 && (
          <Card padding="lg">
            <div className="flex items-center gap-2 mb-4">
              <CreditCard className="h-5 w-5 text-rose-600" />
              <h3 className="font-semibold text-gray-900">支付记录</h3>
            </div>
            <div className="space-y-3">
              {order.payments.map((p) => (
                <div key={p.id} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                  <div>
                    <p className="text-sm font-medium">{p.method}</p>
                    <p className="text-xs text-gray-500">{p.paidAt ? formatDateTime(p.paidAt) : '未支付'}</p>
                  </div>
                  <div className="text-right">
                    <p className="text-sm font-medium">{formatCurrency(Number(p.amount))}</p>
                    <Badge variant={p.status === 'success' ? 'success' : 'warning'} size="sm">
                      {p.status}
                    </Badge>
                  </div>
                </div>
              ))}
            </div>
          </Card>
        )}

        {/* Timeline */}
        <Card padding="lg">
          <div className="flex items-center gap-2 mb-4">
            <CheckCircle2 className="h-5 w-5 text-blue-600" />
            <h3 className="font-semibold text-gray-900">订单进度</h3>
          </div>
          <Timeline items={timelineItems} />
        </Card>
      </div>

      {/* Force Status Update Modal */}
      <Modal
        isOpen={statusModalOpen}
        onClose={() => setStatusModalOpen(false)}
        title="强制更新订单状态"
        loading={updatingStatus}
      >
        <div className="space-y-4">
          <div className="p-3 bg-yellow-50 border border-yellow-200 rounded-lg flex gap-2">
            <AlertTriangle className="h-5 w-5 text-yellow-600 shrink-0" />
            <p className="text-sm text-yellow-800">
              当前状态：<strong>{statusLabels[order.status] || order.status}</strong>
              <br />
              强制更新将跳过正常流程，请谨慎操作。管理员可覆盖任意状态。
            </p>
          </div>

          <Select
            label="新状态"
            placeholder="选择新状态"
            options={allowedStatuses.map((s) => ({ value: s, label: statusLabels[s] || s }))}
            value={newStatus}
            onChange={(e) => setNewStatus(e.target.value)}
          />

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">备注（可选）</label>
            <textarea
              className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
              rows={3}
              value={statusNote}
              onChange={(e) => setStatusNote(e.target.value)}
              placeholder="填写状态变更原因..."
            />
          </div>

          <div className="flex justify-end gap-3">
            <Button variant="outline" onClick={() => setStatusModalOpen(false)} disabled={updatingStatus}>
              取消
            </Button>
            <Button onClick={handleUpdateStatus} loading={updatingStatus} disabled={!newStatus}>
              确认更新
            </Button>
          </div>
        </div>
      </Modal>
    </AdminLayout>
  );
}
