import { NextRequest } from 'next/server';
import { prisma } from '@/lib/db';
import { successResponse, errorResponse } from '@/lib/api-helpers';
import { getPaymentProvider, checkIdempotency, setIdempotency } from '@/lib/payments';
import { sendEmail } from '@/lib/email';
import { orderStatusEmail } from '@/lib/email-templates';

export async function POST(request: NextRequest) {
  try {
    const body = await request.text();
    const signature = request.headers.get('stripe-signature') || 
                     request.headers.get('x-payment-signature') || '';

    const provider = getPaymentProvider();
    const verification = await provider.verifyWebhook(body, signature);

    if (!verification.valid) {
      return errorResponse('Invalid webhook signature', 401);
    }

    const { event, paymentId, status } = verification;

    // Idempotency check
    const idempotencyKey = `webhook:${paymentId}`;
    const cached = checkIdempotency(idempotencyKey);
    if (cached) {
      return successResponse({ message: 'Already processed' });
    }

    // Find payment record
    const payment = await prisma.payment.findFirst({
      where: { transactionId: paymentId },
      include: { order: { include: { user: true } } },
    });

    if (!payment) {
      console.warn(`[Webhook] Payment not found: ${paymentId}`);
      return successResponse({ message: 'Payment not found' });
    }

    // Update payment status
    if (status === 'succeeded' && payment.status !== 'success') {
      await prisma.$transaction(async (tx) => {
        // Update payment
        await tx.payment.update({
          where: { id: payment.id },
          data: { status: 'success', paidAt: new Date() },
        });

        // Update order
        await tx.order.update({
          where: { id: payment.orderId },
          data: {
            paymentStatus: 'PAID',
            paidAmount: { increment: payment.amount },
            status: 'PAID',
          },
        });

        // Add order timeline
        await tx.orderTimeline.create({
          data: {
            orderId: payment.orderId,
            status: 'PAID',
            title: '支付成功',
            description: `支付金额: ¥${payment.amount}`,
            operator: 'system',
          },
        });

        // Create notification
        await tx.notification.create({
          data: {
            userId: payment.order.userId,
            type: 'ORDER',
            titleZh: '订单支付成功',
            titleEn: 'Payment Successful',
            contentZh: `您的订单 ${payment.order.orderNo} 已成功支付，我们将尽快处理。`,
            contentEn: `Your order ${payment.order.orderNo} has been paid successfully.`,
            link: `/dashboard/orders/${payment.orderId}`,
          },
        });
      });

      // Send email notification
      const emailContent = orderStatusEmail({
        name: payment.order.user.name,
        orderNo: payment.order.orderNo,
        status: 'PAID',
        orderUrl: `${process.env.NEXT_PUBLIC_SITE_URL}/dashboard/orders/${payment.orderId}`,
      });

      await sendEmail({
        to: payment.order.user.email,
        subject: emailContent.subject,
        html: emailContent.html,
        text: emailContent.text,
      });
    } else if (status === 'failed') {
      await prisma.payment.update({
        where: { id: payment.id },
        data: { status: 'failed' },
      });
    } else if (status === 'refunded') {
      await prisma.$transaction(async (tx) => {
        await tx.payment.update({
          where: { id: payment.id },
          data: { status: 'refunded' },
        });

        await tx.order.update({
          where: { id: payment.orderId },
          data: {
            paymentStatus: 'REFUNDED',
            status: 'REFUNDED',
          },
        });

        await tx.orderTimeline.create({
          data: {
            orderId: payment.orderId,
            status: 'REFUNDED',
            title: '退款成功',
            description: `退款金额: ¥${payment.amount}`,
            operator: 'system',
          },
        });
      });
    }

    // Mark as processed
    setIdempotency(idempotencyKey, { processed: true, timestamp: Date.now() });

    return successResponse({ message: 'Webhook processed successfully' });
  } catch (error) {
    console.error('[Webhook] Error:', error);
    return errorResponse('Webhook processing failed', 500);
  }
}
