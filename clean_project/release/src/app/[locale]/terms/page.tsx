'use client';
import { Header } from '@/components/layout/header';
import { Footer } from '@/components/layout/footer';

const sections = [
  { title: '服务条款', content: '欢迎使用精测实验平台。使用本平台服务即表示您同意以下条款。请仔细阅读。' },
  { title: '用户注册', content: '用户需提供真实、准确的注册信息。每个用户只能注册一个账号。用户应妥善保管账号密码，因用户原因导致的安全问题由用户自行承担。' },
  { title: '服务使用', content: '用户应合法使用平台服务，不得利用平台进行任何违法活动。平台有权对违规账号采取限制或封禁措施。' },
  { title: '订单与支付', content: '用户下单后应按时支付费用。订单确认后如需取消，需在检测开始前申请。已开始检测的订单取消需扣除已发生的费用。' },
  { title: '知识产权', content: '平台上的所有内容（包括但不限于文字、图片、商标、软件）均受知识产权法律保护。未经授权不得复制或传播。' },
  { title: '免责声明', content: '平台尽力确保服务的准确性和可靠性，但不对因不可抗力、第三方原因导致的服务中断或数据损失承担责任。检测报告仅代表送检样品的检测结果。' },
  { title: '争议解决', content: '因本协议引起的争议，双方应友好协商解决。协商不成的，任何一方均可向平台所在地有管辖权的人民法院提起诉讼。' },
];

export default function TermsPage() {
  return (
    <div className="min-h-screen">
      <Header />
      <div className="max-w-3xl mx-auto px-4 py-16">
        <h1 className="text-3xl font-bold text-gray-900 mb-2">服务条款</h1>
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
