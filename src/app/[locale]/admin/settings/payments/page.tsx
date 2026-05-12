'use client';

import { useState, useEffect } from 'react';
import { Plus, Edit2, Trash2, CheckCircle, XCircle, TestTube } from 'lucide-react';
import { AdminLayout } from '@/components/layout/admin-layout';
import { RouteGuard } from '@/components/guards/RouteGuard';

interface PaymentProvider {
  id: string;
  name: string;
  type: string;
  mode: string;
  isEnabled: boolean;
  isDefault: boolean;
  apiKeyMasked?: string;
  apiSecretMasked?: string;
  privateKeyMasked?: string;
  lastTestedAt?: string;
  lastTestResult?: string;
}

interface FormData {
  name: string;
  type: 'WECHAT_PAY' | 'ALIPAY' | 'UNION_PAY';
  appId: string;
  merchantId: string;
  apiKey: string;
  apiSecret: string;
  privateKey: string;
  publicKey: string;
  certSerialNo: string;
  notifyUrl: string;
  mode: 'SANDBOX' | 'LIVE';
  isEnabled: boolean;
  isDefault: boolean;
}

export default function PaymentProvidersPage() {
  const [providers, setProviders] = useState<PaymentProvider[]>([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [testingId, setTestingId] = useState<string | null>(null);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  const [formData, setFormData] = useState<FormData>({
    name: '',
    type: 'WECHAT_PAY',
    appId: '',
    merchantId: '',
    apiKey: '',
    apiSecret: '',
    privateKey: '',
    publicKey: '',
    certSerialNo: '',
    notifyUrl: '',
    mode: 'SANDBOX',
    isEnabled: false,
    isDefault: false
  });

  useEffect(() => {
    fetchProviders();
  }, []);

  const fetchProviders = async () => {
    try {
      setLoading(true);
      const response = await fetch('/api/admin/payment-providers');
      const data = await response.json();
      
      if (data.success) {
        setProviders(data.data);
      } else {
        setError(data.error || 'Failed to fetch providers');
      }
    } catch (err) {
      setError('Failed to fetch providers');
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setSuccess('');

    try {
      const url = editingId
        ? `/api/admin/payment-providers/${editingId}`
        : '/api/admin/payment-providers';
      
      const method = editingId ? 'PUT' : 'POST';

      const response = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formData)
      });

      const data = await response.json();

      if (data.success) {
        setSuccess(data.message || 'Provider saved successfully');
        setShowForm(false);
        setEditingId(null);
        resetForm();
        fetchProviders();
      } else {
        setError(data.error || 'Failed to save provider');
      }
    } catch (err) {
      setError('Failed to save provider');
    }
  };

  const handleEdit = async (id: string) => {
    try {
      const response = await fetch(`/api/admin/payment-providers/${id}`);
      const data = await response.json();
      
      if (data.success) {
        const provider = data.data;
        setFormData({
          name: provider.name,
          type: provider.type,
          appId: provider.appId || '',
          merchantId: provider.merchantId || '',
          apiKey: '', // Don't pre-fill secrets
          apiSecret: '',
          privateKey: '',
          publicKey: provider.publicKey || '',
          certSerialNo: provider.certSerialNo || '',
          notifyUrl: provider.notifyUrl || '',
          mode: provider.mode,
          isEnabled: provider.isEnabled,
          isDefault: provider.isDefault
        });
        setEditingId(id);
        setShowForm(true);
      }
    } catch (err) {
      setError('Failed to load provider');
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm('Are you sure you want to delete this provider?')) return;

    try {
      const response = await fetch(`/api/admin/payment-providers/${id}`, {
        method: 'DELETE'
      });

      const data = await response.json();

      if (data.success) {
        setSuccess('Provider deleted successfully');
        fetchProviders();
      } else {
        setError(data.error || 'Failed to delete provider');
      }
    } catch (err) {
      setError('Failed to delete provider');
    }
  };

  const handleTest = async (id: string) => {
    setTestingId(id);
    setError('');
    setSuccess('');

    try {
      const response = await fetch(`/api/admin/payment-providers/${id}/test`, {
        method: 'POST'
      });

      const data = await response.json();

      if (data.success) {
        setSuccess(data.message || 'Connection test passed');
        fetchProviders();
      } else {
        setError(data.message || 'Connection test failed');
      }
    } catch (err) {
      setError('Connection test failed');
    } finally {
      setTestingId(null);
    }
  };

  const resetForm = () => {
    setFormData({
      name: '',
      type: 'WECHAT_PAY',
      appId: '',
      merchantId: '',
      apiKey: '',
      apiSecret: '',
      privateKey: '',
      publicKey: '',
      certSerialNo: '',
      notifyUrl: '',
      mode: 'SANDBOX',
      isEnabled: false,
      isDefault: false
    });
  };

  const getProviderTypeLabel = (type: string) => {
    const labels: Record<string, string> = {
      'WECHAT_PAY': '微信支付',
      'ALIPAY': '支付宝',
      'UNION_PAY': '银联支付'
    };
    return labels[type] || type;
  };

  if (loading) {
    return (
      <RouteGuard allowedRoles={['SUPER_ADMIN']}>
        <AdminLayout>
          <div className="flex items-center justify-center min-h-[400px]">
            <div className="text-lg">Loading...</div>
          </div>
        </AdminLayout>
      </RouteGuard>
    );
  }

  return (
    <RouteGuard allowedRoles={['SUPER_ADMIN']}>
      <AdminLayout>
        <div className="space-y-6">
          <div className="flex justify-between items-center">
            <div>
              <h1 className="text-2xl font-bold text-gray-900">支付方式管理</h1>
              <p className="text-gray-600 mt-1 text-sm">管理支付提供商配置</p>
            </div>
            <button
              onClick={() => {
                resetForm();
                setEditingId(null);
                setShowForm(true);
              }}
              className="flex items-center gap-2 bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700"
            >
              <Plus size={20} />
              添加支付方式
            </button>
          </div>

          {error && (
            <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg mb-4">
              {error}
            </div>
          )}

          {success && (
            <div className="bg-green-50 border border-green-200 text-green-700 px-4 py-3 rounded-lg mb-4">
              {success}
            </div>
          )}

          {showForm && (
            <div className="bg-white rounded-lg shadow-md p-6 mb-6">
              <h2 className="text-xl font-semibold mb-4">
                {editingId ? 'Edit Provider' : 'Add New Provider'}
              </h2>
              <form onSubmit={handleSubmit} className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium mb-1">Provider Name *</label>
                    <input
                      type="text"
                      value={formData.name}
                      onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                      className="w-full border rounded-lg px-3 py-2"
                      required
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium mb-1">Type *</label>
                    <select
                      value={formData.type}
                      onChange={(e) => setFormData({ ...formData, type: e.target.value as any })}
                      className="w-full border rounded-lg px-3 py-2"
                      required
                    >
                      <option value="WECHAT_PAY">WeChat Pay</option>
                      <option value="ALIPAY">Alipay</option>
                      <option value="UNION_PAY">UnionPay</option>
                    </select>
                  </div>

                  <div>
                    <label className="block text-sm font-medium mb-1">Mode *</label>
                    <select
                      value={formData.mode}
                      onChange={(e) => setFormData({ ...formData, mode: e.target.value as any })}
                      className="w-full border rounded-lg px-3 py-2"
                      required
                    >
                      <option value="SANDBOX">Sandbox</option>
                      <option value="LIVE">Live</option>
                    </select>
                  </div>

                  <div>
                    <label className="block text-sm font-medium mb-1">App ID</label>
                    <input
                      type="text"
                      value={formData.appId}
                      onChange={(e) => setFormData({ ...formData, appId: e.target.value })}
                      className="w-full border rounded-lg px-3 py-2"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium mb-1">Merchant ID</label>
                    <input
                      type="text"
                      value={formData.merchantId}
                      onChange={(e) => setFormData({ ...formData, merchantId: e.target.value })}
                      className="w-full border rounded-lg px-3 py-2"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium mb-1">Notify URL</label>
                    <input
                      type="url"
                      value={formData.notifyUrl}
                      onChange={(e) => setFormData({ ...formData, notifyUrl: e.target.value })}
                      className="w-full border rounded-lg px-3 py-2"
                      placeholder="https://yourdomain.com/api/webhooks/..."
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium mb-1">
                    API Key {editingId && '(leave empty to keep unchanged)'}
                  </label>
                  <input
                    type="password"
                    value={formData.apiKey}
                    onChange={(e) => setFormData({ ...formData, apiKey: e.target.value })}
                    className="w-full border rounded-lg px-3 py-2"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium mb-1">
                    API Secret {editingId && '(leave empty to keep unchanged)'}
                  </label>
                  <input
                    type="password"
                    value={formData.apiSecret}
                    onChange={(e) => setFormData({ ...formData, apiSecret: e.target.value })}
                    className="w-full border rounded-lg px-3 py-2"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium mb-1">
                    Private Key (RSA) {editingId && '(leave empty to keep unchanged)'}
                  </label>
                  <textarea
                    value={formData.privateKey}
                    onChange={(e) => setFormData({ ...formData, privateKey: e.target.value })}
                    className="w-full border rounded-lg px-3 py-2"
                    rows={4}
                    placeholder="-----BEGIN PRIVATE KEY-----..."
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium mb-1">Public Key (Platform Certificate)</label>
                  <textarea
                    value={formData.publicKey}
                    onChange={(e) => setFormData({ ...formData, publicKey: e.target.value })}
                    className="w-full border rounded-lg px-3 py-2"
                    rows={4}
                    placeholder="-----BEGIN CERTIFICATE-----..."
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium mb-1">Certificate Serial Number</label>
                  <input
                    type="text"
                    value={formData.certSerialNo}
                    onChange={(e) => setFormData({ ...formData, certSerialNo: e.target.value })}
                    className="w-full border rounded-lg px-3 py-2"
                  />
                </div>

                <div className="flex items-center gap-6">
                  <label className="flex items-center gap-2">
                    <input
                      type="checkbox"
                      checked={formData.isEnabled}
                      onChange={(e) => setFormData({ ...formData, isEnabled: e.target.checked })}
                      className="w-4 h-4"
                    />
                    <span className="text-sm font-medium">Enabled</span>
                  </label>

                  <label className="flex items-center gap-2">
                    <input
                      type="checkbox"
                      checked={formData.isDefault}
                      onChange={(e) => setFormData({ ...formData, isDefault: e.target.checked })}
                      className="w-4 h-4"
                    />
                    <span className="text-sm font-medium">Set as Default</span>
                  </label>
                </div>

                <div className="flex gap-2 pt-4">
                  <button
                    type="submit"
                    className="bg-blue-600 text-white px-6 py-2 rounded-lg hover:bg-blue-700"
                  >
                    {editingId ? 'Update' : 'Create'} Provider
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      setShowForm(false);
                      setEditingId(null);
                      resetForm();
                    }}
                    className="bg-gray-200 text-gray-700 px-6 py-2 rounded-lg hover:bg-gray-300"
                  >
                    Cancel
                  </button>
                </div>
              </form>
            </div>
          )}

          <div className="bg-white rounded-lg shadow-md overflow-hidden">
            <table className="w-full">
              <thead className="bg-gray-50 border-b">
                <tr>
                  <th className="text-left px-6 py-3 text-sm font-semibold">Name</th>
                  <th className="text-left px-6 py-3 text-sm font-semibold">Type</th>
                  <th className="text-left px-6 py-3 text-sm font-semibold">Mode</th>
                  <th className="text-left px-6 py-3 text-sm font-semibold">Status</th>
                  <th className="text-left px-6 py-3 text-sm font-semibold">Default</th>
                  <th className="text-left px-6 py-3 text-sm font-semibold">Last Test</th>
                  <th className="text-right px-6 py-3 text-sm font-semibold">Actions</th>
                </tr>
              </thead>
              <tbody>
                {providers.length === 0 ? (
                  <tr>
                    <td colSpan={7} className="px-6 py-8 text-center text-gray-500">
                      No payment providers configured yet. Click &quot;Add Provider&quot; to create one.
                    </td>
                  </tr>
                ) : (
                  providers.map((provider) => (
                    <tr key={provider.id} className="border-b hover:bg-gray-50">
                      <td className="px-6 py-4">
                        <div className="font-medium">{provider.name}</div>
                        {provider.apiKeyMasked && (
                          <div className="text-xs text-gray-500 mt-1">Key: {provider.apiKeyMasked}</div>
                        )}
                      </td>
                      <td className="px-6 py-4">{getProviderTypeLabel(provider.type)}</td>
                      <td className="px-6 py-4">
                        <span className={`px-2 py-1 rounded text-xs ${
                          provider.mode === 'LIVE' ? 'bg-green-100 text-green-700' : 'bg-yellow-100 text-yellow-700'
                        }`}>
                          {provider.mode}
                        </span>
                      </td>
                      <td className="px-6 py-4">
                        {provider.isEnabled ? (
                          <CheckCircle size={20} className="text-green-600" />
                        ) : (
                          <XCircle size={20} className="text-gray-400" />
                        )}
                      </td>
                      <td className="px-6 py-4">
                        {provider.isDefault && (
                          <span className="bg-blue-100 text-blue-700 px-2 py-1 rounded text-xs">Default</span>
                        )}
                      </td>
                      <td className="px-6 py-4 text-sm">
                        {provider.lastTestedAt ? (
                          <div>
                            <div className="text-xs text-gray-500">
                              {new Date(provider.lastTestedAt).toLocaleDateString()}
                            </div>
                            <div className="text-xs">{provider.lastTestResult}</div>
                          </div>
                        ) : (
                          <span className="text-gray-400">Not tested</span>
                        )}
                      </td>
                      <td className="px-6 py-4">
                        <div className="flex justify-end gap-2">
                          <button
                            onClick={() => handleTest(provider.id)}
                            disabled={testingId === provider.id}
                            className="p-2 text-purple-600 hover:bg-purple-50 rounded"
                            title="Test Connection"
                          >
                            <TestTube size={18} />
                          </button>
                          <button
                            onClick={() => handleEdit(provider.id)}
                            className="p-2 text-blue-600 hover:bg-blue-50 rounded"
                            title="Edit"
                          >
                            <Edit2 size={18} />
                          </button>
                          <button
                            onClick={() => handleDelete(provider.id)}
                            className="p-2 text-red-600 hover:bg-red-50 rounded"
                            title="Delete"
                          >
                            <Trash2 size={18} />
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>
      </AdminLayout>
    </RouteGuard>
  );
}
