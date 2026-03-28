import { NextRequest } from 'next/server';
import { z } from 'zod';
import { prisma } from '@/lib/db';
import { successResponse, errorResponse, withAuth } from '@/lib/api-helpers';
import { JWTPayload } from '@/lib/auth';
import { sendEmail } from '@/lib/email';
import { reportReadyEmail } from '@/lib/email-templates';

const publishSchema = z.object({
  makePublic: z.boolean().default(false),
});

const handler = async (request: NextRequest, user: JWTPayload) => {
  try {
    const url = new URL(request.url);
    const pathParts = url.pathname.split('/');
    const reportId = pathParts[pathParts.length - 2];

    const body = await request.json();
    const data = publishSchema.parse(body);

    // Get report with order info
    const report = await prisma.report.findUnique({
      where: { id: reportId },
      include: {
        order: { include: { user: true } },
      },
    });

    if (!report) return errorResponse('报告不存在', 404);

    // Only lab partners and admins can publish
    if (user.role !== 'SUPER_ADMIN' && user.role !== 'LAB_PARTNER') {
      return errorResponse('权限不足', 403);
    }

    // Publish report
    const publishedReport = await prisma.$transaction(async (tx) => {
      const updated = await tx.report.update({
        where: { id: reportId },
        data: {
          status: 'PUBLISHED',
        },
      });

      // Update order status
      await tx.order.update({
        where: { id: report.orderId },
        data: { status: 'REPORT_DELIVERED' },
      });

      // Add order timeline
      await tx.orderTimeline.create({
        data: {
          orderId: report.orderId,
          status: 'REPORT_DELIVERED',
          title: '报告已生成',
          description: '检测报告已生成，可以查看和下载',
          operator: user.userId,
        },
      });

      // Create notification
      await tx.notification.create({
        data: {
          userId: report.order.userId,
          type: 'REPORT',
          titleZh: '检测报告已生成',
          titleEn: 'Report Ready',
          contentZh: `订单 ${report.order.orderNo} 的检测报告已生成，现在可以查看和下载`,
          contentEn: `Report for order ${report.order.orderNo} is now available`,
          link: `/dashboard/reports/${reportId}`,
        },
      });

      return updated;
    });

    // Send email notification
    const emailContent = reportReadyEmail({
      name: report.order.user.name,
      orderNo: report.order.orderNo,
      reportUrl: `${process.env.NEXT_PUBLIC_SITE_URL}/dashboard/reports/${reportId}`,
    });

    await sendEmail({
      to: report.order.user.email,
      subject: emailContent.subject,
      html: emailContent.html,
      text: emailContent.text,
    });

    return successResponse({ report: publishedReport });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return errorResponse(error.issues[0]?.message || '参数无效', 400);
    }
    console.error('Report publish error:', error);
    return errorResponse('发布报告失败', 500);
  }
};

export const POST = withAuth(handler, ['SUPER_ADMIN', 'LAB_PARTNER']);
