/**
 * Webhook Processing Service
 * Handles webhook verification, idempotency, and payment status updates
 */

import { PaymentProviderType } from '@prisma/client';
import prisma from '@/lib/db';
import { getPaymentProviderById } from './payment-config.service';
import { BasePaymentProvider } from '../payment-providers/base';
import { WeChatPayProvider } from '../payment-providers/wechat';
import { AlipayProvider } from '../payment-providers/alipay';
import { queryPaymentStatus } from './payment.service';

/**
 * Get provider instance
 */
function getProviderInstance(config: any): BasePaymentProvider {
  const providerConfig = {
    appId: config.appId,
    merchantId: config.merchantId,
    apiKey: config.apiKey,
    apiSecret: config.apiSecret,
    privateKey: config.privateKey,
    publicKey: config.publicKey,
    certSerialNo: config.certSerialNo,
    notifyUrl: config.notifyUrl,
    mode: config.mode,
    config: config.config
  };

  switch (config.type) {
    case PaymentProviderType.WECHAT_PAY:
      return new WeChatPayProvider(providerConfig);
    case PaymentProviderType.ALIPAY:
      return new AlipayProvider(providerConfig);
    default:
      throw new Error(`Unsupported payment provider type: ${config.type}`);
  }
}

/**
 * Process webhook notification
 */
export async function processWebhook(data: {
  providerId: string;
  body: string | Buffer;
  signature: string;
  headers: Record<string, string>;
}): Promise<{
  success: boolean;
  message: string;
  shouldRetry?: boolean;
}> {
  const webhookLogId = crypto.randomUUID();
  
  try {
    // Log webhook receipt
    const webhookLog = await prisma.webhookLog.create({
      data: {
        id: webhookLogId,
        provider: data.providerId,
        payload: typeof data.body === 'string' ? data.body : data.body.toString('utf8'),
        signature: data.signature,
        isVerified: false
      }
    });

    // Get provider configuration
    const providerConfig = await getPaymentProviderById(data.providerId);
    
    if (!providerConfig) {
      await prisma.webhookLog.update({
        where: { id: webhookLogId },
        data: {
          errorMessage: 'Provider configuration not found',
          processedAt: new Date()
        }
      });
      
      return {
        success: false,
        message: 'Provider not found',
        shouldRetry: false
      };
    }

    // Get provider instance
    const provider = getProviderInstance(providerConfig);

    // Verify webhook signature
    const verification = await provider.verifyWebhook(
      data.body,
      data.signature,
      data.headers
    );

    if (!verification.isValid) {
      await prisma.webhookLog.update({
        where: { id: webhookLogId },
        data: {
          isVerified: false,
          errorMessage: verification.error || 'Signature verification failed',
          processedAt: new Date()
        }
      });

      return {
        success: false,
        message: verification.error || 'Invalid signature',
        shouldRetry: false
      };
    }

    // Mark webhook as verified
    await prisma.webhookLog.update({
      where: { id: webhookLogId },
      data: {
        isVerified: true,
        eventType: verification.eventType
      }
    });

    // Find payment by external number
    const payment = await prisma.payment.findFirst({
      where: {
        externalNo: verification.externalNo
      },
      include: {
        order: true
      }
    });

    if (!payment) {
      await prisma.webhookLog.update({
        where: { id: webhookLogId },
        data: {
          errorMessage: `Payment not found for external number: ${verification.externalNo}`,
          processedAt: new Date()
        }
      });

      return {
        success: false,
        message: 'Payment not found',
        shouldRetry: true // May arrive before payment is created
      };
    }

    // Check idempotency - has this webhook been processed already?
    if (payment.verifiedAt && payment.status === 'success') {
      await prisma.webhookLog.update({
        where: { id: webhookLogId },
        data: {
          relatedEntity: 'Payment',
          relatedId: payment.id,
          processedAt: new Date()
        }
      });

      return {
        success: true,
        message: 'Already processed (idempotent)',
        shouldRetry: false
      };
    }

    // Update payment status to 'processing' first
    await prisma.payment.update({
      where: { id: payment.id },
      data: {
        status: 'processing',
        notifyData: verification.data as any,
        verifiedAt: new Date(),
        updatedAt: new Date()
      }
    });

    // Double-check status by querying provider API
    try {
      const statusCheck = await queryPaymentStatus(payment.id);
      
      // If payment is confirmed as successful, process it
      if (statusCheck.status === 'success') {
        await processSuccessfulPayment(payment.id, payment.orderId);
        
        await prisma.webhookLog.update({
          where: { id: webhookLogId },
          data: {
            relatedEntity: 'Payment',
            relatedId: payment.id,
            processedAt: new Date()
          }
        });

        return {
          success: true,
          message: 'Payment processed successfully'
        };
      } else if (statusCheck.status === 'failed' || statusCheck.status === 'expired') {
        // Mark payment as failed
        await prisma.payment.update({
          where: { id: payment.id },
          data: {
            status: statusCheck.status,
            updatedAt: new Date()
          }
        });

        await prisma.webhookLog.update({
          where: { id: webhookLogId },
          data: {
            relatedEntity: 'Payment',
            relatedId: payment.id,
            processedAt: new Date()
          }
        });

        return {
          success: true,
          message: `Payment ${statusCheck.status}`
        };
      } else {
        // Status is still pending or processing
        await prisma.webhookLog.update({
          where: { id: webhookLogId },
          data: {
            relatedEntity: 'Payment',
            relatedId: payment.id,
            processedAt: new Date()
          }
        });

        return {
          success: true,
          message: 'Payment status updated, still processing'
        };
      }
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown error';
      
      await prisma.webhookLog.update({
        where: { id: webhookLogId },
        data: {
          errorMessage: `Status check failed: ${errorMessage}`,
          processedAt: new Date()
        }
      });

      return {
        success: false,
        message: errorMessage,
        shouldRetry: true
      };
    }
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    
    try {
      await prisma.webhookLog.update({
        where: { id: webhookLogId },
        data: {
          errorMessage,
          processedAt: new Date()
        }
      });
    } catch (logError) {
      console.error('Failed to update webhook log:', logError);
    }

    return {
      success: false,
      message: errorMessage,
      shouldRetry: true
    };
  }
}

/**
 * Process successful payment
 * Updates order status, credits wallet if applicable, creates timeline entries
 */
async function processSuccessfulPayment(
  paymentId: string,
  orderId: string
): Promise<void> {
  try {
    await prisma.$transaction(async (tx) => {
      // Update payment status
      const payment = await tx.payment.update({
        where: { id: paymentId },
        data: {
          status: 'success',
          paidAt: new Date(),
          updatedAt: new Date()
        }
      });

      // Update order
      const order = await tx.order.findUnique({
        where: { id: orderId }
      });

      if (!order) {
        throw new Error('Order not found');
      }

      const newPaidAmount = parseFloat(order.paidAmount.toString()) + parseFloat(payment.amount.toString());
      const totalAmount = parseFloat(order.totalAmount.toString());
      
      const isFullyPaid = newPaidAmount >= totalAmount;

      await tx.order.update({
        where: { id: orderId },
        data: {
          paidAmount: newPaidAmount,
          paymentStatus: isFullyPaid ? 'PAID' : 'PARTIAL',
          status: isFullyPaid && order.status === 'PENDING_PAYMENT' ? 'PAID' : order.status,
          updatedAt: new Date()
        }
      });

      // Create order timeline entry
      await tx.orderTimeline.create({
        data: {
          orderId,
          status: 'PAID',
          title: '支付成功',
          description: `支付金额: ￥${payment.amount}`,
          operator: 'system'
        }
      });

      // TODO: Create audit log
      // TODO: Send notification to user
    });
  } catch (error) {
    console.error('Process successful payment error:', error);
    throw error;
  }
}
