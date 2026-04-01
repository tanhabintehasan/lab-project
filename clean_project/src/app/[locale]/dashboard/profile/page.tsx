'use client';

import { useState, useEffect } from 'react';
import { DashboardLayout } from '@/components/layout/dashboard-layout';
import { Card } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Modal } from '@/components/ui/modal';
import { useAuthStore } from '@/store/auth-store';
import { User, MapPin, FileText, Plus, Trash2 } from 'lucide-react';

export default function ProfilePage() {
  const { updateUser } = useAuthStore();
  const [profile, setProfile] = useState<Record<string, unknown> | null>(null);
  const [form, setForm] = useState({ name: '', phone: '' });
  const [saving, setSaving] = useState(false);
  const [addrModal, setAddrModal] = useState(false);
  const [addrForm, setAddrForm] = useState({
    label: '',
    name: '',
    phone: '',
    province: '',
    city: '',
    district: '',
    street: '',
  });

  useEffect(() => {
    fetch('/api/profile', {
      credentials: 'include',
    })
      .then(r => r.json())
      .then(d => {
        if (d.success) {
          setProfile(d.data);
          setForm({
            name: (d.data.name as string) || '',
            phone: (d.data.phone as string) || '',
          });
        }
      });
  }, []);

  const saveProfile = async () => {
    setSaving(true);
    try {
      const res = await fetch('/api/profile', {
        method: 'PUT',
        credentials: 'include',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(form),
      });

      const d = await res.json();

      if (d.success) {
        setProfile(d.data);
        setForm({
          name: (d.data.name as string) || '',
          phone: (d.data.phone as string) || '',
        });

        // updateUser currently does not accept `phone`
        updateUser({ name: d.data.name });
      }
    } finally {
      setSaving(false);
    }
  };

  const addAddress = async () => {
    await fetch('/api/addresses', {
      method: 'POST',
      credentials: 'include',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(addrForm),
    });

    setAddrModal(false);

    const r = await fetch('/api/profile', {
      credentials: 'include',
    });
    const d = await r.json();
    if (d.success) setProfile(d.data);
  };

  const deleteAddress = async (id: string) => {
    await fetch(`/api/addresses/${id}`, {
      method: 'DELETE',
      credentials: 'include',
    });

    const r = await fetch('/api/profile', {
      credentials: 'include',
    });
    const d = await r.json();
    if (d.success) setProfile(d.data);
  };

  const addresses = (profile?.addresses as Array<Record<string, unknown>>) || [];
  const invoiceProfiles = (profile?.invoiceProfiles as Array<Record<string, unknown>>) || [];

  return (
    <DashboardLayout>
      <div className="max-w-2xl space-y-6">
        <h1 className="text-2xl font-bold text-gray-900">个人资料</h1>

        <Card padding="lg">
          <div className="flex items-center gap-3 mb-6">
            <div className="w-16 h-16 bg-blue-100 rounded-full flex items-center justify-center">
              <User className="h-8 w-8 text-blue-600" />
            </div>
            <div>
              <p className="font-semibold text-gray-900">{profile?.name as string}</p>
              <p className="text-sm text-gray-500">{profile?.email as string}</p>
            </div>
          </div>

          <div className="space-y-4">
            <Input
              label="姓名"
              value={form.name}
              onChange={e => setForm(p => ({ ...p, name: e.target.value }))}
            />
            <Input
              label="手机号"
              value={form.phone}
              onChange={e => setForm(p => ({ ...p, phone: e.target.value }))}
            />
            <Button onClick={saveProfile} loading={saving}>
              保存修改
            </Button>
          </div>
        </Card>

        <Card padding="lg">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-lg font-semibold text-gray-900 flex items-center gap-2">
              <MapPin className="h-5 w-5" />
              收货地址
            </h2>
            <Button size="sm" variant="outline" onClick={() => setAddrModal(true)}>
              <Plus className="h-4 w-4" />
              添加
            </Button>
          </div>

          {addresses.length === 0 ? (
            <p className="text-gray-500 text-sm">暂无地址</p>
          ) : (
            <div className="space-y-3">
              {addresses.map(a => (
                <div
                  key={a.id as string}
                  className="flex items-start justify-between p-3 border border-gray-200 rounded-lg"
                >
                  <div>
                    <p className="font-medium text-gray-900">
                      {a.name as string} {a.phone as string}
                    </p>
                    <p className="text-sm text-gray-500">
                      {a.province as string} {a.city as string} {a.district as string}{' '}
                      {a.street as string}
                    </p>
                  </div>
                  <button
                    onClick={() => deleteAddress(a.id as string)}
                    className="text-gray-400 hover:text-red-500"
                  >
                    <Trash2 className="h-4 w-4" />
                  </button>
                </div>
              ))}
            </div>
          )}
        </Card>

        <Card padding="lg">
          <h2 className="text-lg font-semibold text-gray-900 flex items-center gap-2 mb-4">
            <FileText className="h-5 w-5" />
            发票信息
          </h2>

          {invoiceProfiles.length === 0 ? (
            <p className="text-gray-500 text-sm">暂无发票信息</p>
          ) : (
            <div className="space-y-3">
              {invoiceProfiles.map(ip => (
                <div key={ip.id as string} className="p-3 border border-gray-200 rounded-lg">
                  <p className="font-medium text-gray-900">{ip.companyName as string}</p>
                  <p className="text-sm text-gray-500">税号: {ip.taxNumber as string}</p>
                </div>
              ))}
            </div>
          )}
        </Card>
      </div>

      <Modal isOpen={addrModal} onClose={() => setAddrModal(false)} title="添加地址">
        <div className="space-y-3">
          <Input
            label="标签"
            placeholder="如：办公室"
            value={addrForm.label}
            onChange={e => setAddrForm(p => ({ ...p, label: e.target.value }))}
          />
          <div className="grid grid-cols-2 gap-3">
            <Input
              label="收件人"
              required
              value={addrForm.name}
              onChange={e => setAddrForm(p => ({ ...p, name: e.target.value }))}
            />
            <Input
              label="电话"
              required
              value={addrForm.phone}
              onChange={e => setAddrForm(p => ({ ...p, phone: e.target.value }))}
            />
          </div>
          <div className="grid grid-cols-3 gap-3">
            <Input
              label="省"
              required
              value={addrForm.province}
              onChange={e => setAddrForm(p => ({ ...p, province: e.target.value }))}
            />
            <Input
              label="市"
              required
              value={addrForm.city}
              onChange={e => setAddrForm(p => ({ ...p, city: e.target.value }))}
            />
            <Input
              label="区"
              required
              value={addrForm.district}
              onChange={e => setAddrForm(p => ({ ...p, district: e.target.value }))}
            />
          </div>
          <Input
            label="详细地址"
            required
            value={addrForm.street}
            onChange={e => setAddrForm(p => ({ ...p, street: e.target.value }))}
          />
          <div className="flex gap-3 pt-2">
            <Button onClick={addAddress}>保存</Button>
            <Button variant="outline" onClick={() => setAddrModal(false)}>
              取消
            </Button>
          </div>
        </div>
      </Modal>
    </DashboardLayout>
  );
}