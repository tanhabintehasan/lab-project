import { NextRequest } from 'next/server';
import { z } from 'zod';
import { prisma } from '@/lib/db';
import { successResponse, errorResponse, withAuth } from '@/lib/api-helpers';
import { JWTPayload } from '@/lib/auth';
import { sendEmail } from '@/lib/email';
import { orderStatusEmail } from '@/lib/email-templates';

const statusSchema = z.object({
  status: z.enum(['PENDING_SUBMISSION', 'SHIPPED', 'RECEIVED', 'INSPECTING', 'INSPECTION_PASSED', 'INSPECTION_FAILED', 'TESTING', 'TESTING_COMPLETE', 'STORED', 'RETURNED']),
  note: z.string().optional(),
});

const handler = async (request: NextRequest, user: JWTPayload) => {
  try {
    const url = new URL(request.url);
    const pathParts = url.pathname.split('/');
    const sampleId = pathParts[pathParts.length - 2];

    const body = await request.json();
    const data = statusSchema.parse(body);

    // Get sample with order info
    const sample = await prisma.sample.findUnique({
      where: { id: sampleId },
      include: {
        order: { include: { user: true } },
      },
    });

    if (!sample) return errorResponse('样品不存在', 404);

    // Only lab partners and admins can update
    if (user.role !== 'SUPER_ADMIN' && user.role !== 'LAB_PARTNER') {
      return errorResponse('权限不足', 403);
    }

    // Update sample status
    const updatedSample = await prisma.$transaction(async (tx) => {
      const updated = await tx.sample.update({
        where: { id: sampleId },
        data: { status: data.status },
      });

      // Add timeline entry
      await tx.sampleTimeline.create({
        data: {
          sampleId,
          status: data.status,
          title: getSampleStatusTitle(data.status),
          description: data.note || getSampleStatusDescription(data.status),
          operator: user.userId,
        },
      });

      // Create notification
      await tx.notification.create({
        data: {
          userId: sample.order.userId,
          type: 'ORDER',
          titleZh: '样品状态更新',
          titleEn: 'Sample Status Updated',
          contentZh: `订单 ${sample.order.orderNo} 的样品状态已更新为: ${getSampleStatusTitle(data.status)}`,
          contentEn: `Sample status for order ${sample.order.orderNo} has been updated to: ${data.status}`,
          link: `/dashboard/orders/${sample.orderId}`,
        },
      });

      return updated;
    });

    // Send email notification
    const emailContent = orderStatusEmail({
      name: sample.order.user.name,
      orderNo: sample.order.orderNo,
      status: data.status,
      orderUrl: `${process.env.NEXT_PUBLIC_SITE_URL}/dashboard/orders/${sample.orderId}`,
    });

    await sendEmail({
      to: sample.order.user.email,
      subject: `样品状态更新 - 订单 ${sample.order.orderNo}`,
      html: emailContent.html,
      text: emailContent.text,
    });

    return successResponse({ sample: updatedSample });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return errorResponse(error.issues[0]?.message || '参数无效', 400);
    }
    console.error('Sample status update error:', error);
    return errorResponse('状态更新失败', 500);
  }
};

function getSampleStatusTitle(status: string): string {
  const titles: Record<string, string> = {
    PENDING_SUBMISSION: '待提交',
    SHIPPED: '已寄出',
    RECEIVED: '已接收',
    INSPECTING: '检验中',
    INSPECTION_PASSED: '检验通过',
    INSPECTION_FAILED: '检验失败',
    TESTING: '检测中',
    TESTING_COMPLETE: '检测完成',
    STORED: '已存储',
    RETURNED: '已退回',
  };
  return titles[status] || status;
}

function getSampleStatusDescription(status: string): string {
  const descriptions: Record<string, string> = {
    PENDING_SUBMISSION: '样品等待提交',
    SHIPPED: '样品已寄出',
    RECEIVED: '样品已安全接收',
    INSPECTING: '样品检验中',
    INSPECTION_PASSED: '样品检验通过',
    INSPECTION_FAILED: '样品检验未通过',
    TESTING: '样品正在检测中',
    TESTING_COMPLETE: '样品检测完成',
    STORED: '样品已存储',
    RETURNED: '样品已退回',
  };
  return descriptions[status] || '状态已更新';
}

export const PATCH = withAuth(handler, ['SUPER_ADMIN', 'LAB_PARTNER']);
