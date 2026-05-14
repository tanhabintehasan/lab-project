import { NextRequest } from 'next/server';
import { z } from 'zod';
import { prisma } from '@/lib/db';
import { successResponse, errorResponse, withAuth } from '@/lib/api-helpers';
import { JWTPayload } from '@/lib/auth';
import { sendEmail } from '@/lib/email';
import { orderStatusEmail } from '@/lib/email-templates';
import { isValidTransition } from '@/lib/validations';
import { recordLabPayout } from '@/lib/financial-ledger';

const statusSchema = z.object({
  status: z.enum(['PENDING_PAYMENT', 'PAID', 'SAMPLE_PENDING', 'SAMPLE_SHIPPED', 'SAMPLE_RECEIVED', 'SAMPLE_INSPECTED', 'TESTING_IN_PROGRESS', 'TESTING_COMPLETE', 'REPORT_GENERATING', 'REPORT_APPROVED', 'REPORT_DELIVERED', 'COMPLETED', 'CANCELLED', 'REFUNDING', 'REFUNDED']),
  note: z.string().optional(),
  force: z.boolean().optional(),
});

const handler = async (request: NextRequest, user: JWTPayload) => {
  try {
    const url = new URL(request.url);
    const pathParts = url.pathname.split('/');
    const orderId = pathParts[pathParts.length - 2];

    const body = await request.json();
    const data = statusSchema.parse(body);

    // Get order
    const order = await prisma.order.findUnique({
      where: { id: orderId },
      include: { user: true },
    });

    if (!order) return errorResponse('订单不存在', 404);

    // Check permissions (admin or order owner)
    if (user.role !== 'SUPER_ADMIN' && user.role !== 'LAB_PARTNER' && order.userId !== user.userId) {
      return errorResponse('权限不足', 403);
    }

    // Validate transition unless force override by SUPER_ADMIN
    if (!data.force || user.role !== 'SUPER_ADMIN') {
      if (!isValidTransition(user.role, order.status, data.status)) {
        return errorResponse(`当前角色不允许从 ${order.status} 转为 ${data.status}`, 403);
      }
    }

    // Gate: do not allow TESTING_IN_PROGRESS until all samples are RECEIVED
    if (data.status === 'TESTING_IN_PROGRESS') {
      const samples = await prisma.sample.findMany({
        where: { orderId },
        select: { status: true },
      });
      if (samples.length > 0) {
        const pending = samples.filter(
          (s) => s.status === 'PENDING_SUBMISSION' || s.status === 'SHIPPED'
        );
        if (pending.length > 0) {
          return errorResponse(
            `Cannot start testing: ${pending.length} sample(s) not yet received by the lab`,
            422
          );
        }
      }
    }

    // Update order status
    const updatedOrder = await prisma.$transaction(async (tx) => {
      const updated = await tx.order.update({
        where: { id: orderId },
        data: { status: data.status },
      });

      // Add timeline entry
      const timelineTitle = data.force && user.role === 'SUPER_ADMIN'
        ? `[强制] ${getStatusTitle(data.status)}`
        : getStatusTitle(data.status);
      await tx.orderTimeline.create({
        data: {
          orderId,
          status: data.status,
          title: timelineTitle,
          description: data.note || getStatusDescription(data.status),
          operator: user.userId,
        },
      });

      // Create notification
      await tx.notification.create({
        data: {
          userId: order.userId,
          type: 'ORDER',
          titleZh: '订单状态更新',
          titleEn: 'Order Status Updated',
          contentZh: `您的订单 ${order.orderNo} 状态已更新为: ${getStatusTitle(data.status)}`,
          contentEn: `Your order ${order.orderNo} status has been updated to: ${data.status}`,
          link: `/dashboard/orders/${orderId}`,
        },
      });

      // Audit log
      await tx.auditLog.create({
        data: {
          userId: user.userId,
          action: data.force ? 'FORCE_UPDATE_ORDER_STATUS' : 'UPDATE_ORDER_STATUS',
          entity: 'Order',
          entityId: orderId,
          details: {
            oldStatus: order.status,
            newStatus: data.status,
            note: data.note,
            force: data.force,
          },
        },
      });

      return updated;
    });

    // Auto-create lab payout after successful order completion (non-blocking)
    if (data.status === 'COMPLETED' && order.assignedLabId && order.paymentStatus === 'PAID') {
      try {
        await recordLabPayout(
          orderId,
          order.assignedLabId,
          order.totalAmount,
          {
            description: `订单完成收益: ${order.orderNo}`,
            referenceType: 'order',
            referenceId: orderId,
          }
        );
      } catch (payoutError) {
        console.error('Auto lab payout failed for order', orderId, payoutError);
        // Non-blocking: order completes even if payout recording fails
      }
    }

    // Send email notification
    const emailContent = orderStatusEmail({
      name: order.user.name,
      orderNo: order.orderNo,
      status: data.status,
      orderUrl: `${process.env.NEXT_PUBLIC_SITE_URL}/dashboard/orders/${orderId}`,
    });

    if (order.user.email) {
      await sendEmail({
        to: order.user.email,
        subject: emailContent.subject,
        html: emailContent.html,
        text: emailContent.text,
      });
    }

    return successResponse({ order: updatedOrder });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return errorResponse(error.issues[0]?.message || '参数无效', 400);
    }
    console.error('Order status update error:', error);
    return errorResponse('状态更新失败', 500);
  }
};

function getStatusTitle(status: string): string {
  const titles: Record<string, string> = {
    PENDING_PAYMENT: '待支付',
    PAID: '已支付',
    SAMPLE_PENDING: '待寄样',
    SAMPLE_SHIPPED: '样品已寄出',
    SAMPLE_RECEIVED: '样品已接收',
    SAMPLE_INSPECTED: '样品已检验',
    TESTING_IN_PROGRESS: '检测进行中',
    TESTING_COMPLETE: '检测完成',
    REPORT_GENERATING: '报告生成中',
    REPORT_APPROVED: '报告已审核',
    REPORT_DELIVERED: '报告已送达',
    COMPLETED: '订单完成',
    CANCELLED: '订单取消',
    REFUNDING: '退款中',
    REFUNDED: '已退款',
  };
  return titles[status] || status;
}

function getStatusDescription(status: string): string {
  const descriptions: Record<string, string> = {
    PENDING_PAYMENT: '请尽快完成支付',
    PAID: '款项已收到，正在处理您的订单',
    SAMPLE_PENDING: '请尽快寄送样品',
    SAMPLE_SHIPPED: '您的样品已寄出',
    SAMPLE_RECEIVED: '我们已收到您的样品，即将开始检测',
    SAMPLE_INSPECTED: '样品检验通过',
    TESTING_IN_PROGRESS: '您的样品正在检测中',
    TESTING_COMPLETE: '检测工作已完成',
    REPORT_GENERATING: '正在生成检测报告',
    REPORT_APPROVED: '报告已通过审核',
    REPORT_DELIVERED: '检测报告已生成，可以查看和下载',
    COMPLETED: '订单已完成，感谢您的信任',
    CANCELLED: '订单已取消',
    REFUNDING: '正在处理退款',
    REFUNDED: '退款已处理完成',
  };
  return descriptions[status] || '状态已更新';
}

export const PATCH = withAuth(handler, ['SUPER_ADMIN', 'LAB_PARTNER', 'LAB_MANAGER']);
