'use client';

import { useState } from 'react';
import { useTranslations } from 'next-intl';
import { DashboardLayout } from '@/components/layout/dashboard-layout';
import { Card } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Select } from '@/components/ui/select';
import { Button } from '@/components/ui/button';
import { useAuthStore } from '@/store/auth-store';
import { useRouter } from '@/i18n/routing';
import { Lock, Globe, Bell, AlertTriangle } from 'lucide-react';

export default function SettingsPage() {
  const { logout } = useAuthStore();
  const router = useRouter();
  const [pwForm, setPwForm] = useState({ oldPassword: '', newPassword: '', confirm: '' });
  const [pwError, setPwError] = useState('');
  const [pwSuccess, setPwSuccess] = useState(false);
  const [pwLoading, setPwLoading] = useState(false);

  const changePassword = async () => {
    setPwError(''); setPwSuccess(false);
    if (pwForm.newPassword.length < 8) { setPwError('新密码至少8位'); return; }
    if (pwForm.newPassword !== pwForm.confirm) { setPwError('两次密码不一致'); return; }
    setPwLoading(true);
    const res = await fetch('/api/settings/password', {
      credentials: 'include',
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ oldPassword: pwForm.oldPassword, newPassword: pwForm.newPassword }),
    });
    const d = await res.json();
    if (d.success) { setPwSuccess(true); setPwForm({ oldPassword: '', newPassword: '', confirm: '' }); }
    else setPwError(d.error || '修改失败');
    setPwLoading(false);
  };

  const handleLogout = async () => {
    await fetch('/api/auth/logout', { method: 'POST', credentials: 'include' });
    logout();
    router.push('/');
  };

  return (
    <DashboardLayout>
      <div className="max-w-2xl space-y-6">
        <h1 className="text-2xl font-bold text-gray-900">账户设置</h1>

        <Card padding="lg">
          <h2 className="text-lg font-semibold text-gray-900 flex items-center gap-2 mb-4"><Lock className="h-5 w-5" />修改密码</h2>
          {pwSuccess && <div className="mb-4 p-3 bg-green-50 border border-green-200 rounded-lg text-sm text-green-700">密码修改成功</div>}
          {pwError && <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-lg text-sm text-red-600">{pwError}</div>}
          <div className="space-y-3">
            <Input label="当前密码" type="password" value={pwForm.oldPassword} onChange={e => setPwForm(p => ({ ...p, oldPassword: e.target.value }))} />
            <Input label="新密码" type="password" value={pwForm.newPassword} onChange={e => setPwForm(p => ({ ...p, newPassword: e.target.value }))} hint="至少8位" />
            <Input label="确认新密码" type="password" value={pwForm.confirm} onChange={e => setPwForm(p => ({ ...p, confirm: e.target.value }))} />
            <Button onClick={changePassword} loading={pwLoading}>修改密码</Button>
          </div>
        </Card>

        <Card padding="lg">
          <h2 className="text-lg font-semibold text-gray-900 flex items-center gap-2 mb-4"><Globe className="h-5 w-5" />语言偏好</h2>
          <Select
            label="界面语言"
            options={[{ value: 'zh-CN', label: '简体中文' }, { value: 'en', label: 'English' }]}
            defaultValue="zh-CN"
            onChange={async (e) => {
              await fetch('/api/settings/preferences', {
                credentials: 'include',
                method: 'PUT',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ locale: e.target.value }),
              });
            }}
          />
        </Card>

        <Card padding="lg">
          <h2 className="text-lg font-semibold text-gray-900 flex items-center gap-2 mb-4"><Bell className="h-5 w-5" />通知设置</h2>
          <div className="space-y-3">
            {['订单更新通知', '报告就绪通知', '促销活动通知'].map(label => (
              <label key={label} className="flex items-center justify-between p-3 border border-gray-200 rounded-lg">
                <span className="text-sm text-gray-700">{label}</span>
                <input type="checkbox" defaultChecked className="rounded border-gray-300" />
              </label>
            ))}
          </div>
        </Card>

        <Card padding="lg" className="border-red-200">
          <h2 className="text-lg font-semibold text-red-600 flex items-center gap-2 mb-4"><AlertTriangle className="h-5 w-5" />危险操作</h2>
          <p className="text-sm text-gray-500 mb-4">退出登录将清除本地登录状态。删除账户操作不可逆，请谨慎操作。</p>
          <div className="flex gap-3">
            <Button variant="outline" onClick={handleLogout}>退出登录</Button>
            <Button variant="danger" disabled>删除账户</Button>
          </div>
        </Card>
      </div>
    </DashboardLayout>
  );
}
