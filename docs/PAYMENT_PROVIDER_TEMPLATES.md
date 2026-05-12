# Payment Provider Implementation Templates

## WeChat Pay Provider Template

```typescript
// /app/src/lib/payment-providers/wechat.ts

import crypto from 'crypto';
import axios from 'axios';
import {
  BasePaymentProvider,
  PaymentProviderType,
  PaymentIntent,
  WebhookVerification,
  PaymentStatus,
  RefundResult,
  PaymentProviderConfig
} from './base';

export class WeChatPayProvider extends BasePaymentProvider {
  private baseUrl: string;

  constructor(config: PaymentProviderConfig) {
    super(config, PaymentProviderType.WECHAT_PAY);
    this.baseUrl = config.mode === 'LIVE'
      ? 'https://api.mch.weixin.qq.com'
      : 'https://api.mch.weixin.qq.com'; // WeChat doesn't have separate sandbox
  }

  async createPayment(
    amount: number,
    orderId: string,
    metadata?: Record<string, unknown>
  ): Promise<PaymentIntent> {
    // WeChat Pay Native (QR Code) API
    const url = `${this.baseUrl}/v3/pay/transactions/native`;
    
    // Convert yuan to cents (fen)
    const amountInCents = Math.round(amount * 100);
    
    const body = {
      appid: this.config.appId,
      mchid: this.config.merchantId,
      description: `Order ${orderId}`,
      out_trade_no: orderId,
      notify_url: this.config.notifyUrl,
      amount: {
        total: amountInCents,
        currency: 'CNY'
      }
    };

    try {
      const signature = this.generateSignature('POST', '/v3/pay/transactions/native', body);
      
      const response = await axios.post(url, body, {
        headers: {
          'Content-Type': 'application/json',
          'Authorization': signature
        },
        timeout: 10000
      });

      return {
        id: orderId,
        externalNo: orderId, // WeChat uses out_trade_no
        amount,
        currency: 'CNY',
        status: 'pending',
        codeUrl: response.data.code_url, // QR code URL
        expiresAt: new Date(Date.now() + 2 * 60 * 60 * 1000), // 2 hours
        rawResponse: response.data
      };
    } catch (error: any) {
      throw new Error(`WeChat Pay API error: ${error.message}`);
    }
  }

  async verifyWebhook(
    body: string | Buffer,
    signature: string,
    headers: Record<string, string>
  ): Promise<WebhookVerification> {
    try {
      // WeChat Pay uses Wechatpay-Signature header
      const timestamp = headers['wechatpay-timestamp'];
      const nonce = headers['wechatpay-nonce'];
      const wechatSignature = headers['wechatpay-signature'];
      const serial = headers['wechatpay-serial'];

      if (!wechatSignature || !timestamp || !nonce) {
        return {
          isValid: false,
          error: 'Missing signature headers'
        };
      }

      // Verify signature
      const message = `${timestamp}\n${nonce}\n${body}\n`;
      const isValid = this.verifySignatureWithPublicKey(message, wechatSignature);

      if (!isValid) {
        return {
          isValid: false,
          error: 'Invalid signature'
        };
      }

      // Decrypt webhook body (WeChat encrypts sensitive data)
      const decrypted = this.decryptWebhookBody(body.toString());
      const data = JSON.parse(decrypted);

      // Map WeChat status to our status
      let status: 'processing' | 'success' | 'failed' | 'refunded' = 'processing';
      if (data.trade_state === 'SUCCESS') {
        status = 'success';
      } else if (data.trade_state === 'CLOSED' || data.trade_state === 'REVOKED') {
        status = 'failed';
      } else if (data.trade_state === 'REFUND') {
        status = 'refunded';
      }

      return {
        isValid: true,
        externalNo: data.out_trade_no,
        status,
        eventType: data.event_type,
        amount: data.amount?.total ? data.amount.total / 100 : undefined, // Convert fen to yuan
        data: decrypted
      };
    } catch (error: any) {
      return {
        isValid: false,
        error: error.message
      };
    }
  }

  async queryPaymentStatus(externalNo: string): Promise<PaymentStatus> {
    const url = `${this.baseUrl}/v3/pay/transactions/out-trade-no/${externalNo}`;
    
    try {
      const signature = this.generateSignature('GET', `/v3/pay/transactions/out-trade-no/${externalNo}`, '');
      
      const response = await axios.get(url, {
        params: {
          mchid: this.config.merchantId
        },
        headers: {
          'Authorization': signature
        },
        timeout: 10000
      });

      const data = response.data;
      let status: PaymentStatus['status'] = 'pending';

      switch (data.trade_state) {
        case 'SUCCESS':
          status = 'success';
          break;
        case 'CLOSED':
        case 'REVOKED':
          status = 'failed';
          break;
        case 'REFUND':
          status = 'refunded';
          break;
        case 'NOTPAY':
        case 'USERPAYING':
          status = 'pending';
          break;
        default:
          status = 'pending';
      }

      return {
        externalNo,
        status,
        paidAt: data.success_time ? new Date(data.success_time) : undefined,
        amount: data.amount?.total ? data.amount.total / 100 : undefined,
        rawResponse: data
      };
    } catch (error: any) {
      throw new Error(`Query payment status failed: ${error.message}`);
    }
  }

  async refund(
    externalNo: string,
    amount: number,
    reason: string
  ): Promise<RefundResult> {
    const url = `${this.baseUrl}/v3/refund/domestic/refunds`;
    
    const refundId = `refund_${Date.now()}`;
    const amountInCents = Math.round(amount * 100);

    const body = {
      out_trade_no: externalNo,
      out_refund_no: refundId,
      reason,
      amount: {
        refund: amountInCents,
        total: amountInCents, // Should be from original payment
        currency: 'CNY'
      },
      notify_url: this.config.notifyUrl?.replace('/notify', '/refund-notify')
    };

    try {
      const signature = this.generateSignature('POST', '/v3/refund/domestic/refunds', body);
      
      const response = await axios.post(url, body, {
        headers: {
          'Content-Type': 'application/json',
          'Authorization': signature
        },
        timeout: 10000
      });

      let status: RefundResult['status'] = 'pending';
      if (response.data.status === 'SUCCESS') {
        status = 'success';
      } else if (response.data.status === 'CLOSED' || response.data.status === 'ABNORMAL') {
        status = 'failed';
      } else if (response.data.status === 'PROCESSING') {
        status = 'processing';
      }

      return {
        refundId,
        externalRefundNo: response.data.refund_id,
        status,
        amount,
        rawResponse: response.data
      };
    } catch (error: any) {
      throw new Error(`Refund failed: ${error.message}`);
    }
  }

  async testConnection(): Promise<{ success: boolean; message: string }> {
    try {
      // Test by querying certificates
      const url = `${this.baseUrl}/v3/certificates`;
      const signature = this.generateSignature('GET', '/v3/certificates', '');
      
      await axios.get(url, {
        headers: {
          'Authorization': signature
        },
        timeout: 5000
      });

      return {
        success: true,
        message: 'WeChat Pay configuration is valid'
      };
    } catch (error: any) {
      return {
        success: false,
        message: `Connection test failed: ${error.message}`
      };
    }
  }

  // Private helper methods
  private generateSignature(method: string, path: string, body: any): string {
    const timestamp = Math.floor(Date.now() / 1000);
    const nonce = crypto.randomBytes(16).toString('hex');
    const bodyStr = typeof body === 'string' ? body : JSON.stringify(body);

    // Build signature message
    const message = `${method}\n${path}\n${timestamp}\n${nonce}\n${bodyStr}\n`;

    // Sign with private key
    const sign = crypto.createSign('RSA-SHA256');
    sign.update(message);
    const signature = sign.sign(this.config.privateKey!, 'base64');

    // Build Authorization header
    return `WECHATPAY2-SHA256-RSA2048 mchid="${this.config.merchantId}",nonce_str="${nonce}",signature="${signature}",timestamp="${timestamp}",serial_no="${this.config.certSerialNo}"`;
  }

  private verifySignatureWithPublicKey(message: string, signature: string): boolean {
    const verify = crypto.createVerify('RSA-SHA256');
    verify.update(message);
    return verify.verify(this.config.publicKey!, signature, 'base64');
  }

  private decryptWebhookBody(encryptedBody: string): string {
    // WeChat Pay uses AEAD_AES_256_GCM encryption for webhook data
    const { resource } = JSON.parse(encryptedBody);
    const { ciphertext, associated_data, nonce } = resource;

    const key = Buffer.from(this.config.apiKey!, 'utf8'); // v3 key
    const decipher = crypto.createDecipheriv(
      'aes-256-gcm',
      key,
      Buffer.from(nonce, 'base64')
    );

    decipher.setAuthTag(Buffer.from(ciphertext.slice(-32), 'base64'));
    decipher.setAAD(Buffer.from(associated_data, 'utf8'));

    let decrypted = decipher.update(ciphertext.slice(0, -32), 'base64', 'utf8');
    decrypted += decipher.final('utf8');

    return decrypted;
  }
}
```

## Payment Service Template

```typescript
// /app/src/lib/services/payment.service.ts

import prisma from '@/lib/db';
import { PaymentProviderFactory } from '@/lib/payment-providers/factory';
import { WebhookLog } from '@prisma/client';

export class PaymentService {
  /**
   * Create payment (DO NOT credit wallet here)
   */
  static async createPayment(params: {
    orderId: string;
    amount: number;
    method: 'WECHAT_PAY' | 'ALIPAY' | 'UNION_PAY';
    userId: string;
  }) {
    // Get payment provider
    const provider = await PaymentProviderFactory.getProvider(params.method);

    // Create payment record (status: pending)
    const payment = await prisma.payment.create({
      data: {
        orderId: params.orderId,
        providerId: provider.id,
        method: params.method,
        amount: params.amount,
        currency: 'CNY',
        status: 'pending'
      }
    });

    // Call provider API
    const intent = await provider.provider.createPayment(
      params.amount,
      params.orderId,
      { userId: params.userId }
    );

    // Update with external No
    await prisma.payment.update({
      where: { id: payment.id },
      data: {
        externalNo: intent.externalNo,
        transactionId: intent.externalNo
      }
    });

    return {
      paymentId: payment.id,
      codeUrl: intent.codeUrl,
      redirectUrl: intent.redirectUrl,
      expiresAt: intent.expiresAt
    };
  }

  /**
   * Handle webhook notification
   * CRITICAL: Do NOT credit wallet here, only mark as "processing"
   */
  static async handleWebhook(params: {
    provider: string;
    body: string | Buffer;
    signature: string;
    headers: Record<string, string>;
  }) {
    // Log webhook
    const webhookLog = await prisma.webhookLog.create({
      data: {
        provider: params.provider,
        payload: params.body.toString(),
        signature: params.signature,
        isVerified: false
      }
    });

    try {
      // Get provider
      const providerInstance = await PaymentProviderFactory.getProviderByType(params.provider as any);

      // Verify webhook
      const verification = await providerInstance.provider.verifyWebhook(
        params.body,
        params.signature,
        params.headers
      );

      // Update webhook log
      await prisma.webhookLog.update({
        where: { id: webhookLog.id },
        data: {
          isVerified: verification.isValid,
          eventType: verification.eventType,
          errorMessage: verification.error
        }
      });

      if (!verification.isValid) {
        throw new Error('Webhook verification failed');
      }

      // Find payment
      const payment = await prisma.payment.findFirst({
        where: {
          externalNo: verification.externalNo
        },
        include: {
          order: true
        }
      });

      if (!payment) {
        throw new Error('Payment not found');
      }

      // Update webhook log with payment relation
      await prisma.webhookLog.update({
        where: { id: webhookLog.id },
        data: {
          relatedEntity: 'Payment',
          relatedId: payment.id
        }
      });

      // Mark as "processing" (NOT success yet)
      await prisma.payment.update({
        where: { id: payment.id },
        data: {
          status: 'processing',
          notifyData: verification.data as any
        }
      });

      // Double-check with provider API before crediting
      await this.verifyAndCompletePayment(payment.id);

      return { success: true, paymentId: payment.id };
    } catch (error: any) {
      await prisma.webhookLog.update({
        where: { id: webhookLog.id },
        data: {
          errorMessage: error.message
        }
      });
      throw error;
    }
  }

  /**
   * Verify payment with provider API and complete payment
   * CRITICAL: Only credit wallet here after double verification
   */
  static async verifyAndCompletePayment(paymentId: string) {
    const payment = await prisma.payment.findUnique({
      where: { id: paymentId },
      include: {
        order: {
          include: {
            user: {
              include: {
                wallet: true
              }
            }
          }
        },
        provider: true
      }
    });

    if (!payment || !payment.externalNo) {
      throw new Error('Payment not found');
    }

    // Get provider
    const providerInstance = await PaymentProviderFactory.getProviderByType(payment.provider!.type);

    // Query provider API
    const status = await providerInstance.provider.queryPaymentStatus(payment.externalNo);

    if (status.status !== 'success') {
      // Not yet successful, update status
      await prisma.payment.update({
        where: { id: paymentId },
        data: {
          status: status.status
        }
      });
      return { success: false, status: status.status };
    }

    // Payment verified as successful
    // Now safe to credit wallet and mark order as paid
    await prisma.$transaction(async (tx) => {
      // Update payment
      await tx.payment.update({
        where: { id: paymentId },
        data: {
          status: 'success',
          paidAt: new Date(),
          verifiedAt: new Date()
        }
      });

      // Credit wallet if wallet recharge
      if (payment.order.userId && payment.order.user.wallet) {
        await tx.wallet.update({
          where: { userId: payment.order.userId },
          data: {
            balance: {
              increment: payment.amount
            }
          }
        });

        // Create transaction record
        await tx.transaction.create({
          data: {
            walletId: payment.order.user.wallet.id,
            type: 'RECHARGE',
            amount: payment.amount,
            balanceAfter: payment.order.user.wallet.balance.toNumber() + payment.amount.toNumber(),
            description: `Payment ${paymentId}`,
            referenceType: 'payment',
            referenceId: paymentId
          }
        });
      }

      // Update order status
      await tx.order.update({
        where: { id: payment.orderId },
        data: {
          paymentStatus: 'PAID',
          paidAmount: payment.amount
        }
      });

      // Audit log
      await tx.auditLog.create({
        data: {
          userId: payment.order.userId,
          action: 'PAYMENT_COMPLETED',
          entity: 'Payment',
          entityId: paymentId,
          details: {
            amount: payment.amount.toString(),
            externalNo: payment.externalNo
          }
        }
      });
    });

    return { success: true };
  }

  /**
   * Refund payment
   */
  static async refund(params: {
    paymentId: string;
    amount: number;
    reason: string;
    operatorId: string;
  }) {
    const payment = await prisma.payment.findUnique({
      where: { id: params.paymentId },
      include: {
        provider: true,
        order: {
          include: {
            user: {
              include: {
                wallet: true
              }
            }
          }
        }
      }
    });

    if (!payment || payment.status !== 'success') {
      throw new Error('Payment not found or not successful');
    }

    // Get provider
    const providerInstance = await PaymentProviderFactory.getProviderByType(payment.provider!.type);

    // Call provider refund API
    const refundResult = await providerInstance.provider.refund(
      payment.externalNo!,
      params.amount,
      params.reason
    );

    // Update payment
    await prisma.$transaction(async (tx) => {
      await tx.payment.update({
        where: { id: params.paymentId },
        data: {
          status: 'refunded',
          refundedAt: new Date(),
          refundAmount: params.amount
        }
      });

      // Debit wallet
      if (payment.order.user.wallet) {
        await tx.wallet.update({
          where: { userId: payment.order.userId! },
          data: {
            balance: {
              decrement: params.amount
            }
          }
        });

        await tx.transaction.create({
          data: {
            walletId: payment.order.user.wallet.id,
            type: 'REFUND',
            amount: -params.amount,
            balanceAfter: payment.order.user.wallet.balance.toNumber() - params.amount.toNumber(),
            description: `Refund ${params.reason}`,
            referenceType: 'payment',
            referenceId: payment.id
          }
        });
      }

      // Audit log
      await tx.auditLog.create({
        data: {
          userId: params.operatorId,
          action: 'PAYMENT_REFUNDED',
          entity: 'Payment',
          entityId: params.paymentId,
          details: {
            amount: params.amount.toString(),
            reason: params.reason,
            refundId: refundResult.refundId
          }
        }
      });
    });

    return { success: true, refundId: refundResult.refundId };
  }
}
```

## Usage Example

```typescript
// In order payment API route
export async function POST(request: NextRequest) {
  const user = await getAuthUser(request);
  const { orderId, amount, method } = await request.json();

  try {
    // Create payment (does NOT credit wallet)
    const payment = await PaymentService.createPayment({
      orderId,
      amount,
      method,
      userId: user.userId
    });

    // Return QR code / redirect URL to client
    return successResponse({
      paymentId: payment.paymentId,
      codeUrl: payment.codeUrl,
      expiresAt: payment.expiresAt
    });
  } catch (error: any) {
    return errorResponse(error.message, 500);
  }
}

// In webhook route
export async function POST(request: NextRequest) {
  const body = await request.text();
  const signature = request.headers.get('wechatpay-signature') || '';
  
  try {
    await PaymentService.handleWebhook({
      provider: 'WECHAT_PAY',
      body,
      signature,
      headers: Object.fromEntries(request.headers)
    });

    // Return success to provider
    return new Response(JSON.stringify({ code: 'SUCCESS' }), {
      status: 200
    });
  } catch (error) {
    return new Response(JSON.stringify({ code: 'FAIL' }), {
      status: 500
    });
  }
}
```
