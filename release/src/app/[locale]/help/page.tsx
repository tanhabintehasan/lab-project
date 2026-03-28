'use client';

import { useState } from 'react';
import { useTranslations } from 'next-intl';
import { Header } from '@/components/layout/header';
import { Footer } from '@/components/layout/footer';
import { Card } from '@/components/ui/card';
import { SearchInput } from '@/components/ui/search-input';
import { ChevronDown, ChevronRight, MessageSquare, Phone } from 'lucide-react';
import { Link } from '@/i18n/routing';

const faqSections = [
  { title: '平台使用', items: [
    { q: '如何注册账号？', a: '点击页面右上角"注册"按钮，填写邮箱、密码和基本信息即可完成注册。' },
    { q: '如何搜索检测服务？', a: '在首页搜索栏输入关键词（如材料类型、检测标准等），或通过服务分类页面浏览。' },
    { q: '支持哪些支付方式？', a: '支持钱包余额、微信支付、支付宝、银行转账和企业结算等多种方式。' },
    { q: '如何查看订单状态？', a: '登录后进入"控制台-我的订单"，可实时查看所有订单的状态。' },
    { q: '如何联系客服？', a: '可通过页面底部联系方式、帮助中心在线客服或拨打400-888-8888。' },
  ]},
  { title: '订单流程', items: [
    { q: '下单后多久开始检测？', a: '收到样品并通过验收后，实验室会在1-2个工作日内开始检测。' },
    { q: '可以取消订单吗？', a: '检测开始前可以申请取消，检测中的订单需联系客服处理。' },
    { q: '如何修改订单信息？', a: '订单确认前可以修改，确认后需联系客服协助修改。' },
    { q: '订单完成后如何获取报告？', a: '检测完成后报告将在"检测报告"页面可供下载和预览。' },
    { q: '加急服务如何申请？', a: '下单时选择加急选项或联系客服说明紧急需求，会有专人对接。' },
  ]},
  { title: '样品要求', items: [
    { q: '样品有什么要求？', a: '不同检测项目对样品尺寸、数量、状态有不同要求，详见具体服务页面的样品要求说明。' },
    { q: '如何寄送样品？', a: '下单后系统会提供寄样地址，建议使用顺丰或京东快递，并在包裹上标注订单号。' },
    { q: '样品检测后如何处理？', a: '默认保留30天，可选择退回或由实验室代为处置。' },
    { q: '样品损坏怎么办？', a: '实验室收样时会进行验收，如运输中损坏会及时通知您重新寄样。' },
    { q: '可以寄送多个样品吗？', a: '可以，不同样品请分别标注编号和对应的检测项目。' },
  ]},
  { title: '报告相关', items: [
    { q: '报告多久出具？', a: '根据检测项目不同，通常3-20个工作日，具体见服务页面说明。' },
    { q: '报告是否具有法律效力？', a: '由CMA/CNAS认可实验室出具的报告具有法律效力。' },
    { q: '如何验证报告真伪？', a: '可在"报告验证"页面输入报告编号进行验证。' },
    { q: '报告可以补开吗？', a: '可以，联系客服提供订单信息即可申请补开。' },
    { q: '报告支持哪些格式？', a: '默认提供PDF电子版，如需纸质版可在下单时选择。' },
  ]},
  { title: '支付发票', items: [
    { q: '如何充值钱包？', a: '进入"钱包中心"，点击"充值"按钮选择金额和支付方式即可。' },
    { q: '如何申请退款？', a: '订单取消后可在订单详情页申请退款，审核通过后原路退回。' },
    { q: '如何申请发票？', a: '在"钱包中心-发票管理"中填写开票信息并提交申请。' },
    { q: '支持增值税专用发票吗？', a: '支持，需提供完整的开票信息（公司名称、税号、银行信息等）。' },
    { q: '发票多久开具？', a: '申请后3-5个工作日内开具，电子发票实时发送。' },
  ]},
];

function FAQItem({ q, a }: { q: string; a: string }) {
  const [open, setOpen] = useState(false);
  return (
    <div className="border-b border-gray-100 last:border-0">
      <button onClick={() => setOpen(!open)} className="w-full flex items-center justify-between py-4 text-left">
        <span className="text-sm font-medium text-gray-900">{q}</span>
        {open ? <ChevronDown className="h-4 w-4 text-gray-400 flex-shrink-0" /> : <ChevronRight className="h-4 w-4 text-gray-400 flex-shrink-0" />}
      </button>
      {open && <p className="pb-4 text-sm text-gray-600 leading-relaxed">{a}</p>}
    </div>
  );
}

export default function HelpPage() {
  const t = useTranslations('help');
  const [search, setSearch] = useState('');

  const filtered = faqSections.map(section => ({
    ...section,
    items: section.items.filter(item =>
      !search || item.q.includes(search) || item.a.includes(search)
    ),
  })).filter(s => s.items.length > 0);

  return (
    <div className="min-h-screen">
      <Header />
      <section className="bg-gradient-to-br from-blue-600 to-indigo-800 text-white py-16">
        <div className="max-w-3xl mx-auto px-4 text-center">
          <h1 className="text-4xl font-bold mb-4">{t('title')}</h1>
          <p className="text-blue-100 mb-8">找到您需要的答案</p>
          <SearchInput placeholder="搜索常见问题..." onSearch={setSearch} size="lg" className="max-w-xl mx-auto" />
        </div>
      </section>

      <section className="py-16">
        <div className="max-w-3xl mx-auto px-4 space-y-8">
          {filtered.map(section => (
            <Card key={section.title} padding="md">
              <h2 className="text-lg font-bold text-gray-900 mb-4">{section.title}</h2>
              {section.items.map(item => <FAQItem key={item.q} {...item} />)}
            </Card>
          ))}
          {filtered.length === 0 && (
            <div className="text-center py-12 text-gray-500">未找到相关问题</div>
          )}
        </div>
      </section>

      {/* Support CTA */}
      <section className="py-12 bg-gray-50">
        <div className="max-w-3xl mx-auto px-4 text-center">
          <h2 className="text-2xl font-bold text-gray-900 mb-4">没有找到答案？</h2>
          <p className="text-gray-500 mb-6">联系我们的客服团队获取更多帮助</p>
          <div className="flex items-center justify-center gap-4">
            <Link href="/contact" className="inline-flex items-center gap-2 px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 font-medium">
              <MessageSquare className="h-4 w-4" />在线咨询
            </Link>
            <a href="tel:400-888-8888" className="inline-flex items-center gap-2 px-6 py-3 bg-white border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 font-medium">
              <Phone className="h-4 w-4" />400-888-8888
            </a>
          </div>
        </div>
      </section>
      <Footer />
    </div>
  );
}
