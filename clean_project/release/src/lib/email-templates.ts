/**
 * Email templates for various notifications
 */

const siteUrl = process.env.NEXT_PUBLIC_SITE_URL || 'http://localhost:3000';
const siteName = '实验室检测平台';

interface TemplateData {
  [key: string]: string | number | boolean | undefined;
}

function baseTemplate(content: string): string {
  return `
<!DOCTYPE html>
<html lang="zh-CN">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <style>
    body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Arial, sans-serif; line-height: 1.6; color: #333; margin: 0; padding: 0; background-color: #f5f5f5; }
    .container { max-width: 600px; margin: 20px auto; background: white; border-radius: 8px; overflow: hidden; box-shadow: 0 2px 8px rgba(0,0,0,0.1); }
    .header { background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); color: white; padding: 30px 20px; text-align: center; }
    .header h1 { margin: 0; font-size: 24px; }
    .content { padding: 30px 20px; }
    .button { display: inline-block; padding: 12px 24px; background: #667eea; color: white; text-decoration: none; border-radius: 6px; margin: 20px 0; }
    .footer { background: #f9f9f9; padding: 20px; text-align: center; font-size: 12px; color: #666; }
    .divider { border-top: 1px solid #eee; margin: 20px 0; }
  </style>
</head>
<body>
  <div class="container">
    <div class="header">
      <h1>🧪 ${siteName}</h1>
    </div>
    <div class="content">
      ${content}
    </div>
    <div class="footer">
      <p>此邮件由系统自动发送，请勿回复。</p>
      <p>&copy; ${new Date().getFullYear()} ${siteName}. All rights reserved.</p>
    </div>
  </div>
</body>
</html>
  `;
}

export function passwordResetEmail(data: { name: string; resetUrl: string }): { subject: string; html: string; text: string } {
  const html = baseTemplate(`
    <h2>密码重置请求</h2>
    <p>您好 ${data.name}，</p>
    <p>我们收到了您的密码重置请求。请点击下面的按钮重置您的密码：</p>
    <p style="text-align: center;">
      <a href="${data.resetUrl}" class="button">重置密码</a>
    </p>
    <p>或复制以下链接到浏览器：</p>
    <p style="word-break: break-all; color: #667eea;">${data.resetUrl}</p>
    <div class="divider"></div>
    <p style="color: #999; font-size: 14px;">此链接将在1小时后失效。如果您没有请求重置密码，请忽略此邮件。</p>
  `);

  const text = `密码重置请求\n\n您好 ${data.name}，\n\n我们收到了您的密码重置请求。请访问以下链接重置您的密码：\n\n${data.resetUrl}\n\n此链接将在1小时后失效。如果您没有请求重置密码，请忽略此邮件。`;

  return { subject: '重置您的密码 - ' + siteName, html, text };
}

export function orderStatusEmail(data: { name: string; orderNo: string; status: string; orderUrl: string }): { subject: string; html: string; text: string } {
  const statusMap: Record<string, string> = {
    PAID: '已支付',
    SAMPLE_RECEIVED: '样品已接收',
    TESTING_IN_PROGRESS: '检测进行中',
    REPORT_DELIVERED: '报告已送达',
    COMPLETED: '已完成',
  };

  const statusText = statusMap[data.status] || data.status;
  const html = baseTemplate(`
    <h2>订单状态更新</h2>
    <p>您好 ${data.name}，</p>
    <p>您的订单 <strong>${data.orderNo}</strong> 状态已更新为：<strong style="color: #667eea;">${statusText}</strong></p>
    <p style="text-align: center;">
      <a href="${data.orderUrl}" class="button">查看订单详情</a>
    </p>
  `);

  const text = `订单状态更新\n\n您好 ${data.name}，\n\n您的订单 ${data.orderNo} 状态已更新为：${statusText}\n\n查看详情：${data.orderUrl}`;

  return { subject: `订单 ${data.orderNo} 状态更新 - ${siteName}`, html, text };
}

export function reportReadyEmail(data: { name: string; orderNo: string; reportUrl: string }): { subject: string; html: string; text: string } {
  const html = baseTemplate(`
    <h2>📋 检测报告已生成</h2>
    <p>您好 ${data.name}，</p>
    <p>您的订单 <strong>${data.orderNo}</strong> 的检测报告已经生成，现在可以查看和下载了！</p>
    <p style="text-align: center;">
      <a href="${data.reportUrl}" class="button">查看报告</a>
    </p>
  `);

  const text = `检测报告已生成\n\n您好 ${data.name}，\n\n您的订单 ${data.orderNo} 的检测报告已经生成，现在可以查看和下载了！\n\n查看报告：${data.reportUrl}`;

  return { subject: `检测报告已就绪 - 订单 ${data.orderNo}`, html, text };
}

export function enterpriseInviteEmail(data: { name: string; companyName: string; inviterName: string; inviteUrl: string; role: string }): { subject: string; html: string; text: string } {
  const html = baseTemplate(`
    <h2>🏢 企业成员邀请</h2>
    <p>您好 ${data.name}，</p>
    <p><strong>${data.inviterName}</strong> 邀请您加入 <strong>${data.companyName}</strong>，担任 <strong>${data.role}</strong> 角色。</p>
    <p style="text-align: center;">
      <a href="${data.inviteUrl}" class="button">接受邀请</a>
    </p>
    <p>或复制以下链接到浏览器：</p>
    <p style="word-break: break-all; color: #667eea;">${data.inviteUrl}</p>
    <div class="divider"></div>
    <p style="color: #999; font-size: 14px;">此邀请将在7天后失效。</p>
  `);

  const text = `企业成员邀请\n\n您好 ${data.name}，\n\n${data.inviterName} 邀请您加入 ${data.companyName}，担任 ${data.role} 角色。\n\n接受邀请：${data.inviteUrl}\n\n此邀请将在7天后失效。`;

  return { subject: `${data.companyName} 邀请您加入 - ${siteName}`, html, text };
}

export function quotationReceivedEmail(data: { name: string; quotationNo: string; totalAmount: number; quotationUrl: string }): { subject: string; html: string; text: string } {
  const html = baseTemplate(`
    <h2>💰 收到新报价</h2>
    <p>您好 ${data.name}，</p>
    <p>您的需求已收到报价！</p>
    <ul style="list-style: none; padding: 0;">
      <li><strong>报价编号：</strong>${data.quotationNo}</li>
      <li><strong>报价金额：</strong>¥${data.totalAmount.toFixed(2)}</li>
    </ul>
    <p style="text-align: center;">
      <a href="${data.quotationUrl}" class="button">查看报价详情</a>
    </p>
  `);

  const text = `收到新报价\n\n您好 ${data.name}，\n\n您的需求已收到报价！\n报价编号：${data.quotationNo}\n报价金额：¥${data.totalAmount.toFixed(2)}\n\n查看详情：${data.quotationUrl}`;

  return { subject: `新报价 ${data.quotationNo} - ${siteName}`, html, text };
}
