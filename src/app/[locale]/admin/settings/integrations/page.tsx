'use client';

import { useState, useEffect } from 'react';
import { Plus, Edit2, Trash2, CheckCircle, XCircle, TestTube } from 'lucide-react';

interface Integration {
  id: string;
  name: string;
  type: string;
  provider: string;
  mode: string;
  isEnabled: boolean;
  isDefault: boolean;
  apiKeyMasked?: string;
  accessKeyMasked?: string;
  endpoint?: string;
  region?: string;
  lastTestedAt?: string;
  lastTestResult?: string;
}

interface FormData {
  name: string;
  type: 'SMS' | 'EMAIL' | 'STORAGE' | 'OAUTH' | 'CAPTCHA';
  provider: string;
  apiKey: string;
  apiSecret: string;
  accessKey: string;
  accessSecret: string;
  endpoint: string;
  region: string;
  bucket: string;
  mode: 'SANDBOX' | 'LIVE';
  isEnabled: boolean;
  isDefault: boolean;
}

export default function IntegrationsPage() {
  const [integrations, setIntegrations] = useState<Integration[]>([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [testingId, setTestingId] = useState<string | null>(null);
  const [filterType, setFilterType] = useState<string>('');
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  const [formData, setFormData] = useState<FormData>({
    name: '',
    type: 'SMS',
    provider: '',
    apiKey: '',
    apiSecret: '',
    accessKey: '',
    accessSecret: '',
    endpoint: '',
    region: '',
    bucket: '',
    mode: 'SANDBOX',
    isEnabled: false,
    isDefault: false
  });

  useEffect(() => {
    fetchIntegrations();
  }, [filterType]);

  const fetchIntegrations = async () => {
    try {
      setLoading(true);
      const url = filterType
        ? `/api/admin/integrations?type=${filterType}`
        : '/api/admin/integrations';
      
      const response = await fetch(url);
      const data = await response.json();
      
      if (data.success) {
        setIntegrations(data.data);
      } else {
        setError(data.error || 'Failed to fetch integrations');
      }
    } catch (err) {
      setError('Failed to fetch integrations');
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
        ? `/api/admin/integrations/${editingId}`
        : '/api/admin/integrations';
      
      const method = editingId ? 'PUT' : 'POST';

      const response = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formData)
      });

      const data = await response.json();

      if (data.success) {
        setSuccess(data.message || 'Integration saved successfully');
        setShowForm(false);
        setEditingId(null);
        resetForm();
        fetchIntegrations();
      } else {
        setError(data.error || 'Failed to save integration');
      }
    } catch (err) {
      setError('Failed to save integration');
    }
  };

  const handleEdit = async (id: string) => {
    try {
      const response = await fetch(`/api/admin/integrations/${id}`);
      const data = await response.json();
      
      if (data.success) {
        const integration = data.data;
        setFormData({
          name: integration.name,
          type: integration.type,
          provider: integration.provider,
          apiKey: '', // Don't pre-fill secrets
          apiSecret: '',
          accessKey: '',
          accessSecret: '',
          endpoint: integration.endpoint || '',
          region: integration.region || '',
          bucket: integration.bucket || '',
          mode: integration.mode,
          isEnabled: integration.isEnabled,
          isDefault: integration.isDefault
        });
        setEditingId(id);
        setShowForm(true);
      }
    } catch (err) {
      setError('Failed to load integration');
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm('Are you sure you want to delete this integration?')) return;

    try {
      const response = await fetch(`/api/admin/integrations/${id}`, {
        method: 'DELETE'
      });

      const data = await response.json();

      if (data.success) {
        setSuccess('Integration deleted successfully');
        fetchIntegrations();
      } else {
        setError(data.error || 'Failed to delete integration');
      }
    } catch (err) {
      setError('Failed to delete integration');
    }
  };

  const handleTest = async (id: string) => {
    setTestingId(id);
    setError('');
    setSuccess('');

    try {
      const response = await fetch(`/api/admin/integrations/${id}/test`, {
        method: 'POST'
      });

      const data = await response.json();

      if (data.success) {
        setSuccess(data.message || 'Connection test passed');
        fetchIntegrations();
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
      type: 'SMS',
      provider: '',
      apiKey: '',
      apiSecret: '',
      accessKey: '',
      accessSecret: '',
      endpoint: '',
      region: '',
      bucket: '',
      mode: 'SANDBOX',
      isEnabled: false,
      isDefault: false
    });
  };

  const getTypeLabel = (type: string) => {
    const labels: Record<string, string> = {
      'SMS': 'SMS',
      'EMAIL': 'Email',
      'STORAGE': 'Storage',
      'OAUTH': 'OAuth',
      'CAPTCHA': 'Captcha'
    };
    return labels[type] || type;
  };

  const getProviderFields = () => {
    switch (formData.type) {
      case 'SMS':
        return (
          <>
            <div>
              <label className="block text-sm font-medium mb-1">API Key *</label>
              <input
                type="password"
                value={formData.apiKey}
                onChange={(e) => setFormData({ ...formData, apiKey: e.target.value })}
                className="w-full border rounded-lg px-3 py-2"
                required
              />
            </div>
            <div>
              <label className="block text-sm font-medium mb-1">API Secret *</label>
              <input
                type="password"
                value={formData.apiSecret}
                onChange={(e) => setFormData({ ...formData, apiSecret: e.target.value })}
                className="w-full border rounded-lg px-3 py-2"
                required
              />
            </div>
          </>
        );
      
      case 'EMAIL':
        return (
          <>
            <div>
              <label className="block text-sm font-medium mb-1">API Key *</label>
              <input
                type="password"
                value={formData.apiKey}
                onChange={(e) => setFormData({ ...formData, apiKey: e.target.value })}
                className="w-full border rounded-lg px-3 py-2"
                required
              />
            </div>
          </>
        );
      
      case 'STORAGE':
        return (
          <>
            <div>
              <label className="block text-sm font-medium mb-1">Access Key *</label>
              <input
                type="password"
                value={formData.accessKey}
                onChange={(e) => setFormData({ ...formData, accessKey: e.target.value })}
                className="w-full border rounded-lg px-3 py-2"
                required
              />
            </div>
            <div>
              <label className="block text-sm font-medium mb-1">Access Secret *</label>
              <input
                type="password"
                value={formData.accessSecret}
                onChange={(e) => setFormData({ ...formData, accessSecret: e.target.value })}
                className="w-full border rounded-lg px-3 py-2"
                required
              />
            </div>
            <div>
              <label className="block text-sm font-medium mb-1">Endpoint</label>
              <input
                type="text"
                value={formData.endpoint}
                onChange={(e) => setFormData({ ...formData, endpoint: e.target.value })}
                className="w-full border rounded-lg px-3 py-2"
                placeholder="https://oss-cn-hangzhou.aliyuncs.com"
              />
            </div>
            <div>
              <label className="block text-sm font-medium mb-1">Region</label>
              <input
                type="text"
                value={formData.region}
                onChange={(e) => setFormData({ ...formData, region: e.target.value })}
                className="w-full border rounded-lg px-3 py-2"
                placeholder="cn-hangzhou"
              />
            </div>
            <div>
              <label className="block text-sm font-medium mb-1">Bucket</label>
              <input
                type="text"
                value={formData.bucket}
                onChange={(e) => setFormData({ ...formData, bucket: e.target.value })}
                className="w-full border rounded-lg px-3 py-2"
              />
            </div>
          </>
        );
      
      default:
        return null;
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-lg">Loading...</div>
      </div>
    );
  }

  return (
    <div className="container mx-auto px-4 py-8 max-w-6xl">
      <div className="flex justify-between items-center mb-6">
        <div>
          <h1 className="text-3xl font-bold">Integration Settings</h1>
          <p className="text-gray-600 mt-1">Manage SMS, Email, Storage and other integrations</p>
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
          Add Integration
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

      {/* Filter */}
      <div className="mb-4">
        <select
          value={filterType}
          onChange={(e) => setFilterType(e.target.value)}
          className="border rounded-lg px-4 py-2"
        >
          <option value="">All Types</option>
          <option value="SMS">SMS</option>
          <option value="EMAIL">Email</option>
          <option value="STORAGE">Storage</option>
          <option value="OAUTH">OAuth</option>
          <option value="CAPTCHA">Captcha</option>
        </select>
      </div>

      {showForm && (
        <div className="bg-white rounded-lg shadow-md p-6 mb-6">
          <h2 className="text-xl font-semibold mb-4">
            {editingId ? 'Edit Integration' : 'Add New Integration'}
          </h2>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium mb-1">Integration Name *</label>
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
                  <option value="SMS">SMS</option>
                  <option value="EMAIL">Email</option>
                  <option value="STORAGE">Storage</option>
                  <option value="OAUTH">OAuth</option>
                  <option value="CAPTCHA">Captcha</option>
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium mb-1">Provider *</label>
                <input
                  type="text"
                  value={formData.provider}
                  onChange={(e) => setFormData({ ...formData, provider: e.target.value })}
                  className="w-full border rounded-lg px-3 py-2"
                  placeholder="e.g., aliyun_sms, sendgrid, aliyun_oss"
                  required
                />
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
            </div>

            {getProviderFields()}

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
                {editingId ? 'Update' : 'Create'} Integration
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
              <th className="text-left px-6 py-3 text-sm font-semibold">Provider</th>
              <th className="text-left px-6 py-3 text-sm font-semibold">Mode</th>
              <th className="text-left px-6 py-3 text-sm font-semibold">Status</th>
              <th className="text-left px-6 py-3 text-sm font-semibold">Default</th>
              <th className="text-right px-6 py-3 text-sm font-semibold">Actions</th>
            </tr>
          </thead>
          <tbody>
            {integrations.length === 0 ? (
              <tr>
                <td colSpan={7} className="px-6 py-8 text-center text-gray-500">
                  No integrations configured yet. Click &quot;Add Integration&quot; to create one.
                </td>
              </tr>
            ) : (
              integrations.map((integration) => (
                <tr key={integration.id} className="border-b hover:bg-gray-50">
                  <td className="px-6 py-4">
                    <div className="font-medium">{integration.name}</div>
                    {integration.apiKeyMasked && (
                      <div className="text-xs text-gray-500 mt-1">Key: {integration.apiKeyMasked}</div>
                    )}
                  </td>
                  <td className="px-6 py-4">{getTypeLabel(integration.type)}</td>
                  <td className="px-6 py-4">{integration.provider}</td>
                  <td className="px-6 py-4">
                    <span className={`px-2 py-1 rounded text-xs ${
                      integration.mode === 'LIVE' ? 'bg-green-100 text-green-700' : 'bg-yellow-100 text-yellow-700'
                    }`}>
                      {integration.mode}
                    </span>
                  </td>
                  <td className="px-6 py-4">
                    {integration.isEnabled ? (
                      <CheckCircle size={20} className="text-green-600" />
                    ) : (
                      <XCircle size={20} className="text-gray-400" />
                    )}
                  </td>
                  <td className="px-6 py-4">
                    {integration.isDefault && (
                      <span className="bg-blue-100 text-blue-700 px-2 py-1 rounded text-xs">Default</span>
                    )}
                  </td>
                  <td className="px-6 py-4">
                    <div className="flex justify-end gap-2">
                      <button
                        onClick={() => handleTest(integration.id)}
                        disabled={testingId === integration.id}
                        className="p-2 text-purple-600 hover:bg-purple-50 rounded"
                        title="Test Connection"
                      >
                        <TestTube size={18} />
                      </button>
                      <button
                        onClick={() => handleEdit(integration.id)}
                        className="p-2 text-blue-600 hover:bg-blue-50 rounded"
                        title="Edit"
                      >
                        <Edit2 size={18} />
                      </button>
                      <button
                        onClick={() => handleDelete(integration.id)}
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
  );
}
