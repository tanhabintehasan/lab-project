'use client';

import { useState, useEffect } from 'react';
import { useRouter } from '@/i18n/routing';
import { Header } from '@/components/layout/header';
import { Footer } from '@/components/layout/footer';
import { Card } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Building2, CheckCircle2, AlertTriangle, Loader2 } from 'lucide-react';

export default function AcceptInvitePage() {
  const router = useRouter();
  const [token, setToken] = useState('');
  const [loading, setLoading] = useState(true);
  const [invitation, setInvitation] = useState<any>(null);
  const [error, setError] = useState('');
  const [password, setPassword] = useState('');
  const [name, setName] = useState('');
  const [accepting, setAccepting] = useState(false);
  const [success, setSuccess] = useState(false);

  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const t = params.get('token');
    if (t) {
      setToken(t);
      fetchInvitation(t);
    } else {
      setError('邀请链接无效');
      setLoading(false);
    }
  }, []);

  const fetchInvitation = async (t: string) => {
    try {
      const res = await fetch(`/api/enterprise/invites/view/${t}`, { credentials: 'include' });
      const data = await res.json();
      if (data.success) {
        setInvitation(data.data);
      } else {
        setError(data.error || '邀请不存在或已过期');
      }
    } catch {
      setError('网络错误');
    }
    setLoading(false);
  };

  const handleAccept = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    
    // Validate password if provided
    if (password && password.length < 8) {
      setError('密码至少8位');
      return;
    }

    setAccepting(true);
    try {
      const res = await fetch(`/api/enterprise/invites/accept/${token}`, {
        method: 'POST',
        credentials: 'include',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ password, name }),
      });
      const data = await res.json();
      if (data.success) {
        setSuccess(true);
        setTimeout(() => router.push('/enterprise/workspace'), 2000);
      } else {
        setError(data.error || '接受邀请失败');
      }
    } catch {
      setError('网络错误');
    }
    setAccepting(false);
  };

  return (
    <div className="min-h-screen flex flex-col">
      <Header />
      <main className="flex-1 flex items-center justify-center bg-gray-50 py-12 px-4">
        <Card className="w-full max-w-md" padding="lg">
          {loading ? (
            <div className="text-center py-8">
              <Loader2 className="h-8 w-8 animate-spin mx-auto mb-4 text-blue-600" />
              <p className="text-gray-600">加载中...</p>
            </div>
          ) : error ? (
            <div className="text-center space-y-4">
              <div className="inline-flex items-center justify-center w-12 h-12 bg-red-100 rounded-xl mb-4">
                <AlertTriangle className="h-6 w-6 text-red-600" />
              </div>
              <h1 className="text-2xl font-bold text-gray-900">邀请无效</h1>
              <p className="text-red-600">{error}</p>
              <Button onClick={() => router.push('/auth/login')} fullWidth>返回登录</Button>
            </div>
          ) : success ? (
            <div className="text-center space-y-4">
              <div className="inline-flex items-center justify-center w-12 h-12 bg-green-100 rounded-xl mb-4">
                <CheckCircle2 className="h-6 w-6 text-green-600" />
              </div>
              <h1 className="text-2xl font-bold text-gray-900">欢迎加入！</h1>
              <p className="text-gray-600">正在跳转到企业工作台...</p>
            </div>
          ) : (
            <div className="space-y-6">
              <div className="text-center">
                <div className="inline-flex items-center justify-center w-12 h-12 bg-blue-100 rounded-xl mb-4">
                  <Building2 className="h-6 w-6 text-blue-600" />
                </div>
                <h1 className="text-2xl font-bold text-gray-900">企业邀请</h1>
                <p className="text-gray-600 mt-2">
                  <strong>{invitation?.inviterName}</strong> 邀请您加入
                </p>
                <p className="text-lg font-semibold text-blue-600 mt-1">{invitation?.companyName}</p>
                <p className="text-sm text-gray-500 mt-2">角色：{invitation?.role}</p>
              </div>

              <form onSubmit={handleAccept} className="space-y-4">
                {error && (
                  <div className="p-3 bg-red-50 border border-red-200 rounded-lg text-sm text-red-600">
                    {error}
                  </div>
                )}
                
                <Input
                  label="您的姓名"
                  placeholder="请输入姓名"
                  value={name}
                  onChange={e => setName(e.target.value)}
                />
                
                <Input
                  type="password"
                  label="设置密码"
                  placeholder="至少8位密码"
                  value={password}
                  onChange={e => setPassword(e.target.value)}
                />
                <p className="text-xs text-gray-500">
                  如果您已有账户，可以不填写密码
                </p>

                <Button type="submit" fullWidth size="lg" loading={accepting}>
                  接受邀请并加入
                </Button>
              </form>

              <div className="text-center">
                <p className="text-xs text-gray-500">
                  点击“接受邀请”表示您同意加入该企业
                </p>
              </div>
            </div>
          )}
        </Card>
      </main>
      <Footer />
    </div>
  );
}
