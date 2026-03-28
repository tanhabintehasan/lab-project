import { NextRequest } from 'next/server';
import { prisma } from '@/lib/db';
import { successResponse, errorResponse, withAuth } from '@/lib/api-helpers';
import { JWTPayload } from '@/lib/auth';
import { getPaymentProvider } from '@/lib/payments';
import { z } from 'zod';

const refundSchema = z.object({
  amount: z.number().positive().optional(),
  reason: z.string().optional(),
});

const handler = async (request: NextRequest, user: JWTPayload) => {
  try {
    // Extract id from URL path
    const url = new URL(request.url);
    const pathParts = url.pathname.split('/');
    const id = pathParts[pathParts.length - 2]; // /api/payments/[id]/refund

    const body = await request.json();
    const data = refundSchema.parse(body);

    // Find payment
    const payment = await prisma.payment.findUnique({
      where: { id },
      include: { order: true },
    });

    if (!payment) return errorResponse('支付记录不存在', 404);
    if (payment.status !== 'success') return errorResponse('只能退款已成功的支付', 400);
    if (!payment.transactionId) return errorResponse('缺少支付交易ID', 400);

    const refundAmount = data.amount || Number(payment.amount);

    // Process refund through payment provider
    const provider = getPaymentProvider();
    const refundResult = await provider.refund(payment.transactionId, refundAmount);

    if (refundResult.status === 'succeeded') {
      await prisma.$transaction(async (tx) => {
        // Update payment status
        await tx.payment.update({
          where: { id },
          data: { status: 'refunded' },
        });

        // Update order status
        await tx.order.update({
          where: { id: payment.orderId },
          data: {
            paymentStatus: 'REFUNDED',
            status: 'REFUNDED',
          },
        });

        // Add timeline entry
        await tx.orderTimeline.create({
          data: {
            orderId: payment.orderId,
            status: 'REFUNDED',
            title: '退款成功',
            description: `退款金额: ¥${refundAmount}，原因: ${data.reason || '无'}`,
            operator: 'admin',
          },
        });

        // Create notification
        await tx.notification.create({
          data: {
            userId: payment.order.userId,
            type: 'ORDER',
            titleZh: '订单退款成功',
            titleEn: 'Refund Processed',
            contentZh: `订单 ${payment.order.orderNo} 已成功退款 ¥${refundAmount}`,
            contentEn: `Refund of ¥${refundAmount} has been processed for order ${payment.order.orderNo}`,
            link: `/dashboard/orders/${payment.orderId}`,
          },
        });
      });

      return successResponse({
        refund: {
          id: refundResult.id,
          amount: refundAmount,
          status: refundResult.status,
        },
      });
    } else {
      return errorResponse('退款处理失败', 500);
    }
  } catch (error) {
    if (error instanceof z.ZodError) {
      return errorResponse(error.issues[0]?.message || '参数无效', 400);
    }
    console.error('Refund error:', error);
    return errorResponse('退款失败', 500);
  }
};

export const POST = withAuth(handler, ['SUPER_ADMIN', 'FINANCE_ADMIN']);
