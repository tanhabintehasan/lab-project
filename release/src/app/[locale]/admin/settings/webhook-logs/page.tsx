'use client';

import { useState, useEffect } from 'react';
import { AdminLayout } from '@/components/layout/admin-layout';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { CheckCircle, XCircle, RefreshCw, Eye } from 'lucide-react';
import { RouteGuard } from '@/components/guards/RouteGuard';

export default function WebhookLogsPage() {
  return (
    <RouteGuard allowedRoles={['SUPER_ADMIN']}>
      <WebhookLogsContent />
    </RouteGuard>
  );
}

function WebhookLogsContent() {
  const [logs, setLogs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [pagination, setPagination] = useState({ page: 1, pageSize: 20, totalPages: 1 });
  const [filters, setFilters] = useState({
    provider: '',
    isVerified: '',
    dateFrom: '',
    dateTo: '',
  });
  const [selectedLog, setSelectedLog] = useState<any>(null);
  const [showDetailModal, setShowDetailModal] = useState(false);

  useEffect(() => {
    fetchLogs();
  }, [pagination.page, filters]);

  const fetchLogs = async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams({
        page: pagination.page.toString(),
        pageSize: pagination.pageSize.toString(),
        ...(filters.provider && { provider: filters.provider }),
        ...(filters.isVerified !== '' && { isVerified: filters.isVerified }),
        ...(filters.dateFrom && { dateFrom: filters.dateFrom }),
        ...(filters.dateTo && { dateTo: filters.dateTo }),
      });

      const res = await fetch(`/api/admin/webhook-logs?${params}`);
      const data = await res.json();

      if (data.success) {
        setLogs(data.data.logs);
        setPagination(data.data.pagination);
      }
    } catch (error) {
      console.error('Failed to fetch webhook logs:', error);
    } finally {
      setLoading(false);
    }
  };

  const fetchLogDetails = async (id: string) => {
    try {
      const res = await fetch(`/api/admin/webhook-logs/${id}`);
      const data = await res.json();

      if (data.success) {
        setSelectedLog(data.data);
        setShowDetailModal(true);
      }
    } catch (error) {
      console.error('Failed to fetch log details:', error);
    }
  };

  const retryWebhook = async (id: string) => {
    if (!confirm('确定要重新处理此Webhook吗？')) return;

    try {
      const res = await fetch(`/api/admin/webhook-logs/${id}/retry`, {
        method: 'POST',
      });

      const data = await res.json();

      if (data.success) {
        alert('Webhook重新处理成功');
        fetchLogs();
      } else {
        alert(data.error || '重试失败');
      }
    } catch (error) {
      alert('重试失败');
    }
  };

  return (
    <AdminLayout>
      <div className="space-y-6">
        {/* Header */}
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Webhook日志</h1>
          <p className="text-gray-600 mt-1 text-sm">查看和管理支付webhook通知记录</p>
        </div>

        {/* Filters */}
        <div className="bg-white p-4 rounded-lg border">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">支付提供商</label>
              <select
                value={filters.provider}
                onChange={(e) => setFilters({ ...filters, provider: e.target.value })}
                className="w-full px-3 py-2 border rounded-lg text-sm"
              >
                <option value="">全部</option>
                <option value="WECHAT_PAY">微信支付</option>
                <option value="ALIPAY">支付宝</option>
                <option value="UNION_PAY">银联</option>
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">验证状态</label>
              <select
                value={filters.isVerified}
                onChange={(e) => setFilters({ ...filters, isVerified: e.target.value })}
                className="w-full px-3 py-2 border rounded-lg text-sm"
              >
                <option value="">全部</option>
                <option value="true">已验证</option>
                <option value="false">验证失败</option>
              </select>
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
          </div>
        </div>

        {/* Logs Table */}
        <div className="bg-white rounded-lg border overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-gray-50 border-b">
                <tr>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500">提供商</th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500">事件类型</th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500">状态</th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500">关联实体</th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500">错误信息</th>
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
                ) : logs.length === 0 ? (
                  <tr>
                    <td colSpan={7} className="px-4 py-8 text-center text-gray-500">
                      暂无日志记录
                    </td>
                  </tr>
                ) : (
                  logs.map((log: any) => (
                    <tr key={log.id} className="hover:bg-gray-50">
                      <td className="px-4 py-3 text-sm text-gray-900">{log.provider}</td>
                      <td className="px-4 py-3 text-sm text-gray-600">{log.eventType}</td>
                      <td className="px-4 py-3">
                        {log.isVerified ? (
                          <Badge variant="success" className="flex items-center gap-1 w-fit">
                            <CheckCircle className="h-3 w-3" />
                            已验证
                          </Badge>
                        ) : (
                          <Badge variant="danger" className="flex items-center gap-1 w-fit">
                            <XCircle className="h-3 w-3" />
                            失败
                          </Badge>
                        )}
                      </td>
                      <td className="px-4 py-3 text-sm text-gray-600">
                        {log.relatedEntity && log.relatedId
                          ? `${log.relatedEntity} #${log.relatedId.slice(0, 8)}`
                          : '-'}
                      </td>
                      <td className="px-4 py-3 text-sm text-red-600 max-w-xs truncate">
                        {log.errorMessage || '-'}
                      </td>
                      <td className="px-4 py-3 text-sm text-gray-600">
                        {new Date(log.createdAt).toLocaleString('zh-CN')}
                      </td>
                      <td className="px-4 py-3 text-sm">
                        <div className="flex gap-2">
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => fetchLogDetails(log.id)}
                          >
                            <Eye className="h-3 w-3" />
                          </Button>
                          {!log.isVerified && (
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() => retryWebhook(log.id)}
                            >
                              <RefreshCw className="h-3 w-3" />
                            </Button>
                          )}
                        </div>
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

        {/* Detail Modal */}
        {showDetailModal && selectedLog && (
          <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
            <div className="bg-white rounded-lg p-6 max-w-3xl w-full max-h-[80vh] overflow-y-auto">
              <h3 className="text-lg font-bold mb-4">Webhook详情</h3>
              
              <div className="space-y-4">
                <div className="grid grid-cols-2 gap-4 text-sm">
                  <div>
                    <span className="font-medium text-gray-700">提供商:</span>
                    <span className="ml-2 text-gray-900">{selectedLog.provider}</span>
                  </div>
                  <div>
                    <span className="font-medium text-gray-700">事件类型:</span>
                    <span className="ml-2 text-gray-900">{selectedLog.eventType}</span>
                  </div>
                  <div>
                    <span className="font-medium text-gray-700">验证状态:</span>
                    <span className="ml-2">
                      {selectedLog.isVerified ? (
                        <Badge variant="success">已验证</Badge>
                      ) : (
                        <Badge variant="danger">失败</Badge>
                      )}
                    </span>
                  </div>
                  <div>
                    <span className="font-medium text-gray-700">创建时间:</span>
                    <span className="ml-2 text-gray-900">
                      {new Date(selectedLog.createdAt).toLocaleString('zh-CN')}
                    </span>
                  </div>
                </div>

                {selectedLog.errorMessage && (
                  <div>
                    <p className="font-medium text-gray-700 mb-1">错误信息:</p>
                    <pre className="bg-red-50 p-3 rounded text-sm text-red-700 overflow-x-auto">
                      {selectedLog.errorMessage}
                    </pre>
                  </div>
                )}

                <div>
                  <p className="font-medium text-gray-700 mb-1">签名:</p>
                  <pre className="bg-gray-50 p-3 rounded text-xs text-gray-700 overflow-x-auto">
                    {selectedLog.signature || '无'}
                  </pre>
                </div>

                <div>
                  <p className="font-medium text-gray-700 mb-1">Payload:</p>
                  <pre className="bg-gray-50 p-3 rounded text-xs text-gray-700 overflow-x-auto max-h-60">
                    {JSON.stringify(JSON.parse(selectedLog.payload), null, 2)}
                  </pre>
                </div>
              </div>

              <div className="mt-6 flex justify-end">
                <Button onClick={() => setShowDetailModal(false)}>关闭</Button>
              </div>
            </div>
          </div>
        )}
      </div>
    </AdminLayout>
  );
}
