import { NextRequest } from 'next/server';
import { prisma } from '@/lib/db';
import { successResponse, errorResponse } from '@/lib/api-helpers';
import { withAuth } from '@/lib/api-helpers';
import { createAuditLog } from '@/lib/services/audit.service';

const handler = async (request: NextRequest, user: any) => {
  try {
    // Extract ID from URL
    const url = new URL(request.url);
    const pathParts = url.pathname.split('/');
    const id = pathParts[pathParts.length - 2]; // ID is before 'mark-paid'
    const body = await request.json();
    const { notes } = body;
    
    // Get payment
    const payment = await prisma.payment.findUnique({
      where: { id },
      include: {
        order: true,
        provider: true,
      }
    });
    
    if (!payment) {
      return errorResponse('支付记录不存在', 404);
    }
    
    // Check if payment is already successful
    if (payment.status === 'success') {
      return errorResponse('该支付已成功，无需手动确认', 400);
    }
    
    // Check if it's a manual payment method
    if (payment.provider && !['MANUAL_QR', 'BANK_TRANSFER'].includes(payment.provider.type)) {
      return errorResponse('只能手动确认二维码和银行转账支付', 400);
    }
    
    // Update payment and order status
    await prisma.$transaction(async (tx) => {
      // Update payment
      await tx.payment.update({
        where: { id },
        data: {
          status: 'success',
          paidAt: new Date(),
          updatedAt: new Date(),
        }
      });
      
      // Update order payment status
      await tx.order.update({
        where: { id: payment.orderId },
        data: {
          paymentStatus: 'PAID',
          status: 'PAID', // Move to next stage
        }
      });
      
      // Create order timeline entry
      await tx.orderTimeline.create({
        data: {
          orderId: payment.orderId,
          status: 'PAID',
          title: '支付确认',
          description: `管理员手动确认支付${notes ? `: ${notes}` : ''}`,
          operator: user.name || user.email,
        }
      });
    });
    
    // Audit log
    await createAuditLog({
      userId: user.userId,
      action: 'UPDATE',
      entity: 'Payment',
      entityId: id,
      details: {
        action: 'manual_mark_paid',
        orderNo: payment.order.orderNo,
        amount: payment.amount.toString(),
        notes,
      },
      ipAddress: request.headers.get('x-forwarded-for') || undefined,
    });
    
    return successResponse({ message: '支付已确认' });
  } catch (error) {
    console.error('Manual mark paid error:', error);
    return errorResponse('确认失败', 500);
  }
};

export const POST = withAuth(handler, ['SUPER_ADMIN', 'FINANCE_ADMIN']);
