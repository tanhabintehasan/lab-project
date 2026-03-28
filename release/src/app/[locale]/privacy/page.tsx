'use client';
import { Header } from '@/components/layout/header';
import { Footer } from '@/components/layout/footer';

const sections = [
  { title: '隐私政策', content: '精测实验（以下简称"我们"）重视用户隐私保护。本政策说明我们如何收集、使用和保护您的个人信息。' },
  { title: '信息收集', content: '我们收集您在注册、下单、使用服务过程中主动提供的信息，包括姓名、邮箱、手机号、公司信息等。同时会自动收集设备信息、浏览记录等技术数据。' },
  { title: '信息使用', content: '您的信息用于提供和改进服务、处理订单、发送通知、客户支持等。未经您同意，不会将信息用于无关目的。' },
  { title: '信息存储', content: '您的数据存储在安全的服务器上，采用加密传输和存储技术。我们定期进行安全审计，确保数据安全。' },
  { title: '信息共享', content: '我们不会出售您的个人信息。仅在以下情况分享：合作实验室（处理订单所需）、法律要求、用户同意。' },
  { title: '用户权利', content: '您有权访问、更正、删除您的个人信息。可通过账户设置或联系客服行使这些权利。' },
  { title: 'Cookie使用', content: '我们使用Cookie和类似技术来提升用户体验、分析访问数据。您可以通过浏览器设置管理Cookie偏好。' },
];

export default function PrivacyPage() {
  return (
    <div className="min-h-screen">
      <Header />
      <div className="max-w-3xl mx-auto px-4 py-16">
        <h1 className="text-3xl font-bold text-gray-900 mb-2">隐私政策</h1>
        <p className="text-sm text-gray-400 mb-8">最后更新: 2026年1月1日</p>
        <div className="space-y-8">
          {sections.map((s, i) => (
            <section key={i}>
              <h2 className="text-xl font-semibold text-gray-900 mb-3">{`${i + 1}. ${s.title}`}</h2>
              <p className="text-gray-600 leading-relaxed">{s.content}</p>
            </section>
          ))}
        </div>
      </div>
      <Footer />
    </div>
  );
}
