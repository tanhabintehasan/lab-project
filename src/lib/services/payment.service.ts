/**
 * Payment Orchestration Service
 * Manages payment creation and processing with proper provider abstraction
 */

import { PaymentProviderType, PaymentMethod } from '@prisma/client';
import prisma from '@/lib/db';
import { getPaymentProviderByType, getDefaultPaymentProvider } from './payment-config.service';
import { BasePaymentProvider, PaymentIntent } from '../payment-providers/base';
import { WeChatPayProvider } from '../payment-providers/wechat';
import { AlipayProvider } from '../payment-providers/alipay';

/**
 * Get payment provider instance
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
 * Create a payment
 */
export async function createPayment(data: {
  orderId: string;
  amount: number;
  method: PaymentMethod;
  userId?: string;
  description?: string;
}): Promise<{
  paymentId: string;
  paymentIntent: PaymentIntent;
}> {
  try {
    // Determine provider based on payment method
    let providerType: PaymentProviderType;
    
    switch (data.method) {
      case 'WECHAT_PAY':
        providerType = PaymentProviderType.WECHAT_PAY;
        break;
      case 'ALIPAY':
        providerType = PaymentProviderType.ALIPAY;
        break;
      default:
        throw new Error(`Payment method ${data.method} not supported for provider-based payments`);
    }

    // Get provider configuration
    const providerConfig = await getPaymentProviderByType(providerType);
    
    if (!providerConfig) {
      throw new Error(`No enabled ${providerType} provider found. Please configure payment provider in admin panel.`);
    }

    // Get provider instance
    const provider = getProviderInstance(providerConfig);

    // Create payment intent with provider
    const paymentIntent = await provider.createPayment(
      data.amount,
      data.orderId,
      {
        description: data.description,
        userId: data.userId
      }
    );

    // Create payment record in database
    const payment = await prisma.payment.create({
      data: {
        orderId: data.orderId,
        providerId: providerConfig.id,
        method: data.method,
        amount: data.amount,
        currency: 'CNY',
        status: 'pending',
        transactionId: paymentIntent.id,
        externalNo: paymentIntent.externalNo
      }
    });

    return {
      paymentId: payment.id,
      paymentIntent
    };
  } catch (error) {
    console.error('Payment creation error:', error);
    throw new Error(
      `Failed to create payment: ${error instanceof Error ? error.message : 'Unknown error'}`
    );
  }
}

/**
 * Query payment status from provider
 */
export async function queryPaymentStatus(paymentId: string): Promise<{
  status: string;
  paidAt?: Date;
  amount?: number;
}> {
  try {
    const payment = await prisma.payment.findUnique({
      where: { id: paymentId },
      include: { provider: true }
    });

    if (!payment) {
      throw new Error('Payment not found');
    }

    if (!payment.provider) {
      throw new Error('Payment provider not found');
    }

    if (!payment.externalNo) {
      throw new Error('External payment number not found');
    }

    // Get provider instance
    const providerConfig = await getPaymentProviderByType(payment.provider.type);
    if (!providerConfig) {
      throw new Error('Provider configuration not found');
    }

    const provider = getProviderInstance(providerConfig);

    // Query status from provider
    const status = await provider.queryPaymentStatus(payment.externalNo);

    // Update payment record
    await prisma.payment.update({
      where: { id: paymentId },
      data: {
        status: status.status,
        paidAt: status.paidAt,
        updatedAt: new Date()
      }
    });

    return {
      status: status.status,
      paidAt: status.paidAt,
      amount: status.amount
    };
  } catch (error) {
    console.error('Query payment status error:', error);
    throw new Error(
      `Failed to query payment status: ${error instanceof Error ? error.message : 'Unknown error'}`
    );
  }
}

/**
 * Process refund
 */
export async function processRefund(data: {
  paymentId: string;
  amount: number;
  reason: string;
  userId?: string;
}): Promise<{
  success: boolean;
  refundId: string;
  status: string;
}> {
  try {
    const payment = await prisma.payment.findUnique({
      where: { id: data.paymentId },
      include: { provider: true }
    });

    if (!payment) {
      throw new Error('Payment not found');
    }

    if (!payment.provider) {
      throw new Error('Payment provider not found');
    }

    if (!payment.externalNo) {
      throw new Error('External payment number not found');
    }

    if (payment.status !== 'success') {
      throw new Error('Cannot refund payment that is not successful');
    }

    // Get provider instance
    const providerConfig = await getPaymentProviderByType(payment.provider.type);
    if (!providerConfig) {
      throw new Error('Provider configuration not found');
    }

    const provider = getProviderInstance(providerConfig);

    // Process refund with provider
    const refundResult = await provider.refund(
      payment.externalNo,
      data.amount,
      data.reason
    );

    // Update payment record
    await prisma.payment.update({
      where: { id: data.paymentId },
      data: {
        status: refundResult.status === 'success' ? 'refunded' : 'refunding',
        refundAmount: data.amount,
        refundedAt: refundResult.status === 'success' ? new Date() : null,
        updatedAt: new Date()
      }
    });

    // TODO: Create audit log for refund

    return {
      success: true,
      refundId: refundResult.refundId,
      status: refundResult.status
    };
  } catch (error) {
    console.error('Process refund error:', error);
    throw new Error(
      `Failed to process refund: ${error instanceof Error ? error.message : 'Unknown error'}`
    );
  }
}

/**
 * Get payment details
 */
export async function getPaymentDetails(paymentId: string) {
  const payment = await prisma.payment.findUnique({
    where: { id: paymentId },
    include: {
      provider: true,
      order: {
        select: {
          orderNo: true,
          totalAmount: true,
          status: true
        }
      }
    }
  });

  if (!payment) {
    throw new Error('Payment not found');
  }

  return payment;
}
