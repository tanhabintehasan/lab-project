'use client';

import { useState, useEffect } from 'react';
import { AdminLayout } from '@/components/layout/admin-layout';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import {
  Search, Filter, Download, CheckCircle, XCircle, Clock,
  DollarSign, TrendingUp, TrendingDown, RefreshCw
} from 'lucide-react';

export default function TransactionsPage() {
  const [transactions, setTransactions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [pagination, setPagination] = useState({ page: 1, pageSize: 20, totalPages: 1 });
  const [summary, setSummary] = useState({ totalAmount: 0, totalRefundAmount: 0, totalTransactions: 0 });
  const [statusCounts, setStatusCounts] = useState<Record<string, number>>({});
  
  // Filters
  const [filters, setFilters] = useState({
    status: '',
    search: '',
    dateFrom: '',
    dateTo: '',
    minAmount: '',
    maxAmount: '',
  });
  
  const [showMarkPaidModal, setShowMarkPaidModal] = useState(false);
  const [selectedPayment, setSelectedPayment] = useState<any>(null);
  const [markPaidNotes, setMarkPaidNotes] = useState('');

  useEffect(() => {
    fetchTransactions();
  }, [pagination.page, filters]);

  const fetchTransactions = async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams({
        page: pagination.page.toString(),
        pageSize: pagination.pageSize.toString(),
        ...(filters.status && { status: filters.status }),
        ...(filters.search && { search: filters.search }),
        ...(filters.dateFrom && { dateFrom: filters.dateFrom }),
        ...(filters.dateTo && { dateTo: filters.dateTo }),
        ...(filters.minAmount && { minAmount: filters.minAmount }),
        ...(filters.maxAmount && { maxAmount: filters.maxAmount }),
      });

      const res = await fetch(`/api/admin/transactions?${params}`);
      const data = await res.json();

      if (data.success) {
        setTransactions(data.data.payments);
        setPagination(data.data.pagination);
        setSummary(data.data.summary);
        setStatusCounts(data.data.statusCounts);
      }
    } catch (error) {
      console.error('Failed to fetch transactions:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleMarkPaid = async () => {
    if (!selectedPayment) return;

    try {
      const res = await fetch(`/api/admin/transactions/${selectedPayment.id}/mark-paid`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ notes: markPaidNotes }),
      });

      const data = await res.json();

      if (data.success) {
        alert('支付已确认');
        setShowMarkPaidModal(false);
        setMarkPaidNotes('');
        setSelectedPayment(null);
        fetchTransactions();
      } else {
        alert(data.error || '确认失败');
      }
    } catch (error) {
      alert('确认失败');
    }
  };

  const exportToCSV = () => {
    const csv = [
      ['订单号', '金额', '状态', '支付方式', '用户', '创建时间'].join(','),
      ...transactions.map((t: any) => [
        t.order.orderNo,
        t.amount,
        t.status,
        t.provider?.name || '-',
        t.order.user.name,
        new Date(t.createdAt).toLocaleDateString(),
      ].join(','))
    ].join('\n');

    const blob = new Blob([csv], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `transactions-${new Date().toISOString()}.csv`;
    a.click();
  };

  const getStatusBadge = (status: string) => {
    const variants: Record<string, any> = {
      success: { variant: 'success', label: '成功', icon: CheckCircle },
      pending: { variant: 'warning', label: '待处理', icon: Clock },
      processing: { variant: 'default', label: '处理中', icon: RefreshCw },
      failed: { variant: 'danger', label: '失败', icon: XCircle },
      refunded: { variant: 'default', label: '已退款', icon: TrendingDown },
    };
    const config = variants[status] || { variant: 'default', label: status, icon: Clock };
    const Icon = config.icon;

    return (
      <Badge variant={config.variant} className="flex items-center gap-1">
        <Icon className="h-3 w-3" />
        {config.label}
      </Badge>
    );
  };

  return (
    <AdminLayout>
      <div className="space-y-6">
        {/* Header */}
        <div className="flex justify-between items-center">
          <div>
            <h1 className="text-2xl font-bold text-gray-900">交易管理</h1>
            <p className="text-gray-600 mt-1 text-sm">查看和管理所有交易记录</p>
          </div>
          <Button onClick={exportToCSV} variant="outline" size="sm">
            <Download className="h-4 w-4 mr-1" />
            导出CSV
          </Button>
        </div>

        {/* Summary Cards */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="bg-white p-4 rounded-lg border shadow-sm">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">总交易额</p>
                <p className="text-2xl font-bold text-gray-900">
                  ¥{Number(summary.totalAmount).toLocaleString()}
                </p>
              </div>
              <TrendingUp className="h-8 w-8 text-green-500" />
            </div>
          </div>

          <div className="bg-white p-4 rounded-lg border shadow-sm">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">退款金额</p>
                <p className="text-2xl font-bold text-gray-900">
                  ¥{Number(summary.totalRefundAmount).toLocaleString()}
                </p>
              </div>
              <TrendingDown className="h-8 w-8 text-red-500" />
            </div>
          </div>

          <div className="bg-white p-4 rounded-lg border shadow-sm">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">交易笔数</p>
                <p className="text-2xl font-bold text-gray-900">
                  {summary.totalTransactions}
                </p>
              </div>
              <DollarSign className="h-8 w-8 text-blue-500" />
            </div>
          </div>
        </div>

        {/* Status Filter Chips */}
        <div className="flex gap-2 flex-wrap">
          <Button
            variant={filters.status === '' ? 'primary' : 'outline'}
            size="sm"
            onClick={() => setFilters({ ...filters, status: '' })}
          >
            全部 ({Object.values(statusCounts).reduce((a, b) => a + b, 0)})
          </Button>
          {Object.entries(statusCounts).map(([status, count]) => (
            <Button
              key={status}
              variant={filters.status === status ? 'primary' : 'outline'}
              size="sm"
              onClick={() => setFilters({ ...filters, status })}
            >
              {status === 'success' && '成功'}
              {status === 'pending' && '待处理'}
              {status === 'processing' && '处理中'}
              {status === 'failed' && '失败'}
              {status === 'refunded' && '已退款'}
              ({count})
            </Button>
          ))}
        </div>

        {/* Filters */}
        <div className="bg-white p-4 rounded-lg border">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">搜索</label>
              <input
                type="text"
                placeholder="订单号或交易ID"
                value={filters.search}
                onChange={(e) => setFilters({ ...filters, search: e.target.value })}
                className="w-full px-3 py-2 border rounded-lg text-sm"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">开始日期</label>
              <input
                type="date"
                value={filters.dateFrom}
                onChange={(e) => setFilters({ ...filters, dateFrom: e.target.value })}
                className="w-full px-3 py-2 border rounded-lg text-sm"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">结束日期</label>
              <input
                type="date"
                value={filters.dateTo}
                onChange={(e) => setFilters({ ...filters, dateTo: e.target.value })}
                className="w-full px-3 py-2 border rounded-lg text-sm"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">金额范围</label>
              <div className="flex gap-2">
                <input
                  type="number"
                  placeholder="最小"
                  value={filters.minAmount}
                  onChange={(e) => setFilters({ ...filters, minAmount: e.target.value })}
                  className="w-full px-3 py-2 border rounded-lg text-sm"
                />
                <input
                  type="number"
                  placeholder="最大"
                  value={filters.maxAmount}
                  onChange={(e) => setFilters({ ...filters, maxAmount: e.target.value })}
                  className="w-full px-3 py-2 border rounded-lg text-sm"
                />
              </div>
            </div>
          </div>
        </div>

        {/* Transactions Table */}
        <div className="bg-white rounded-lg border overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-gray-50 border-b">
                <tr>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500">订单号</th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500">金额</th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500">状态</th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500">支付方式</th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500">用户</th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500">创建时间</th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500">操作</th>
                </tr>
              </thead>
              <tbody className="divide-y">
                {loading ? (
                  <tr>
                    <td colSpan={7} className="px-4 py-8 text-center text-gray-500">
                      加载中...
                    </td>
                  </tr>
                ) : transactions.length === 0 ? (
                  <tr>
                    <td colSpan={7} className="px-4 py-8 text-center text-gray-500">
                      暂无交易记录
                    </td>
                  </tr>
                ) : (
                  transactions.map((txn: any) => (
                    <tr key={txn.id} className="hover:bg-gray-50">
                      <td className="px-4 py-3 text-sm font-medium text-gray-900">
                        {txn.order.orderNo}
                      </td>
                      <td className="px-4 py-3 text-sm text-gray-900">
                        ¥{Number(txn.amount).toLocaleString()}
                      </td>
                      <td className="px-4 py-3">{getStatusBadge(txn.status)}</td>
                      <td className="px-4 py-3 text-sm text-gray-600">
                        {txn.provider?.name || '-'}
                      </td>
                      <td className="px-4 py-3 text-sm text-gray-600">
                        {txn.order.user.name}
                      </td>
                      <td className="px-4 py-3 text-sm text-gray-600">
                        {new Date(txn.createdAt).toLocaleString('zh-CN')}
                      </td>
                      <td className="px-4 py-3 text-sm">
                        {txn.status === 'pending' && 
                         txn.provider?.type &&
                         ['MANUAL_QR', 'BANK_TRANSFER'].includes(txn.provider.type) && (
                          <Button
                            size="sm"
                            onClick={() => {
                              setSelectedPayment(txn);
                              setShowMarkPaidModal(true);
                            }}
                          >
                            确认支付
                          </Button>
                        )}
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>

          {/* Pagination */}
          {pagination.totalPages > 1 && (
            <div className="px-4 py-3 border-t flex items-center justify-between">
              <div className="text-sm text-gray-600">
                第 {pagination.page} 页，共 {pagination.totalPages} 页
              </div>
              <div className="flex gap-2">
                <Button
                  variant="outline"
                  size="sm"
                  disabled={pagination.page === 1}
                  onClick={() => setPagination({ ...pagination, page: pagination.page - 1 })}
                >
                  上一页
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  disabled={pagination.page === pagination.totalPages}
                  onClick={() => setPagination({ ...pagination, page: pagination.page + 1 })}
                >
                  下一页
                </Button>
              </div>
            </div>
          )}
        </div>

        {/* Mark as Paid Modal */}
        {showMarkPaidModal && (
          <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
            <div className="bg-white rounded-lg p-6 max-w-md w-full mx-4">
              <h3 className="text-lg font-bold mb-4">确认支付</h3>
              <p className="text-sm text-gray-600 mb-4">
                订单号: {selectedPayment?.order.orderNo}<br/>
                金额: ¥{selectedPayment?.amount}
              </p>
              <div className="mb-4">
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  备注（可选）
                </label>
                <textarea
                  value={markPaidNotes}
                  onChange={(e) => setMarkPaidNotes(e.target.value)}
                  className="w-full px-3 py-2 border rounded-lg text-sm"
                  rows={3}
                  placeholder="添加备注信息..."
                />
              </div>
              <div className="flex gap-2 justify-end">
                <Button
                  variant="outline"
                  onClick={() => {
                    setShowMarkPaidModal(false);
                    setMarkPaidNotes('');
                    setSelectedPayment(null);
                  }}
                >
                  取消
                </Button>
                <Button onClick={handleMarkPaid}>
                  确认
                </Button>
              </div>
            </div>
          </div>
        )}
      </div>
    </AdminLayout>
  );
}
