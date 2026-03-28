/**
 * WeChat Pay Provider Implementation
 * Supports Native (QR Code) payment method
 */

import * as crypto from 'crypto';
import { 
  BasePaymentProvider, 
  PaymentIntent, 
  WebhookVerification, 
  PaymentStatus, 
  RefundResult,
  PaymentProviderType,
  PaymentProviderConfig
} from './base';

interface WeChatPayResponse {
  code_url?: string;
  prepay_id?: string;
  mweb_url?: string;
}

interface WeChatPayNotify {
  id: string;
  create_time: string;
  event_type: string;
  resource_type: string;
  resource: {
    ciphertext: string;
    nonce: string;
    associated_data: string;
  };
  summary: string;
}

export class WeChatPayProvider extends BasePaymentProvider {
  private readonly apiBaseUrl: string;

  constructor(config: PaymentProviderConfig) {
    super(config, PaymentProviderType.WECHAT_PAY);
    this.apiBaseUrl = config.mode === 'LIVE' 
      ? 'https://api.mch.weixin.qq.com'
      : 'https://api.mch.weixin.qq.com'; // WeChat doesn't have separate sandbox URL
  }

  /**
   * Generate WeChat Pay signature
   */
  private generateSignature(
    method: string,
    url: string,
    timestamp: string,
    nonce: string,
    body: string
  ): string {
    const message = `${method}\n${url}\n${timestamp}\n${nonce}\n${body}\n`;
    
    if (!this.config.privateKey) {
      throw new Error('Private key is required for WeChat Pay');
    }

    const sign = crypto.createSign('RSA-SHA256');
    sign.update(message);
    return sign.sign(this.config.privateKey, 'base64');
  }

  /**
   * Build Authorization header for WeChat Pay API
   */
  private buildAuthHeader(
    method: string,
    url: string,
    body: string
  ): string {
    const timestamp = Math.floor(Date.now() / 1000).toString();
    const nonce = crypto.randomBytes(16).toString('hex');
    const signature = this.generateSignature(method, url, timestamp, nonce, body);

    return `WECHATPAY2-SHA256-RSA2048 mchid="${this.config.merchantId}",nonce_str="${nonce}",signature="${signature}",timestamp="${timestamp}",serial_no="${this.config.certSerialNo}"`;
  }

  /**
   * Make API request to WeChat Pay
   */
  private async request(
    method: string,
    path: string,
    body?: Record<string, unknown>
  ): Promise<any> {
    const url = `${this.apiBaseUrl}${path}`;
    const bodyStr = body ? JSON.stringify(body) : '';
    
    const headers: Record<string, string> = {
      'Content-Type': 'application/json',
      'Accept': 'application/json',
      'User-Agent': 'Lab-Platform/1.0',
    };

    // Add authorization header
    if (method !== 'GET' || bodyStr) {
      headers['Authorization'] = this.buildAuthHeader(method, path, bodyStr);
    }

    const response = await fetch(url, {
      method,
      headers,
      body: bodyStr || undefined
    });

    const responseText = await response.text();
    
    if (!response.ok) {
      throw new Error(`WeChat Pay API error: ${response.status} ${responseText}`);
    }

    return responseText ? JSON.parse(responseText) : {};
  }

  /**
   * Create payment (Native - QR Code)
   */
  async createPayment(
    amount: number,
    orderId: string,
    metadata?: Record<string, unknown>
  ): Promise<PaymentIntent> {
    try {
      const outTradeNo = `${orderId}_${Date.now()}`;
      
      const body = {
        appid: this.config.appId,
        mchid: this.config.merchantId,
        description: metadata?.description || '实验室检测服务',
        out_trade_no: outTradeNo,
        notify_url: this.config.notifyUrl,
        amount: {
          total: Math.round(amount * 100), // Convert yuan to fen (cents)
          currency: 'CNY'
        },
        attach: JSON.stringify({ orderId, ...metadata })
      };

      const response: WeChatPayResponse = await this.request(
        'POST',
        '/v3/pay/transactions/native',
        body
      );

      return {
        id: outTradeNo,
        externalNo: outTradeNo,
        amount,
        currency: 'CNY',
        status: 'pending',
        codeUrl: response.code_url,
        expiresAt: new Date(Date.now() + 2 * 60 * 60 * 1000), // 2 hours
        rawResponse: response
      };
    } catch (error) {
      throw new Error(
        `Failed to create WeChat payment: ${error instanceof Error ? error.message : 'Unknown error'}`
      );
    }
  }

  /**
   * Verify WeChat Pay webhook signature
   */
  async verifyWebhook(
    body: string | Buffer,
    signature: string,
    headers: Record<string, string>
  ): Promise<WebhookVerification> {
    try {
      const bodyStr = typeof body === 'string' ? body : body.toString('utf8');
      const timestamp = headers['wechatpay-timestamp'];
      const nonce = headers['wechatpay-nonce'];
      const serial = headers['wechatpay-serial'];

      if (!timestamp || !nonce || !serial) {
        return {
          isValid: false,
          error: 'Missing required webhook headers'
        };
      }

      // Build verification message
      const message = `${timestamp}\n${nonce}\n${bodyStr}\n`;

      // Verify signature using WeChat's platform certificate
      // Note: In production, you should fetch and cache the platform certificate
      const verify = crypto.createVerify('RSA-SHA256');
      verify.update(message);
      
      if (!this.config.publicKey) {
        return {
          isValid: false,
          error: 'Platform public key not configured'
        };
      }

      const isValid = verify.verify(this.config.publicKey, signature, 'base64');

      if (!isValid) {
        return {
          isValid: false,
          error: 'Invalid signature'
        };
      }

      // Parse webhook body
      const notify: WeChatPayNotify = JSON.parse(bodyStr);

      // Decrypt resource data
      const decrypted = this.decryptResource(
        notify.resource.ciphertext,
        notify.resource.nonce,
        notify.resource.associated_data
      );

      const resourceData = JSON.parse(decrypted);

      return {
        isValid: true,
        externalNo: resourceData.out_trade_no,
        status: this.mapWeChatStatus(resourceData.trade_state),
        eventType: notify.event_type,
        amount: resourceData.amount?.total ? resourceData.amount.total / 100 : undefined,
        data: resourceData
      };
    } catch (error) {
      return {
        isValid: false,
        error: error instanceof Error ? error.message : 'Unknown error'
      };
    }
  }

  /**
   * Decrypt WeChat Pay resource data
   */
  private decryptResource(
    ciphertext: string,
    nonce: string,
    associatedData: string
  ): string {
    if (!this.config.apiSecret) {
      throw new Error('API secret (v3 key) is required for decryption');
    }

    const key = Buffer.from(this.config.apiSecret, 'utf8');
    const ciphertextBuffer = Buffer.from(ciphertext, 'base64');
    const nonceBuffer = Buffer.from(nonce, 'utf8');
    const associatedDataBuffer = Buffer.from(associatedData, 'utf8');

    // Split ciphertext and auth tag
    const authTag = ciphertextBuffer.subarray(-16);
    const encryptedData = ciphertextBuffer.subarray(0, -16);

    const decipher = crypto.createDecipheriv('aes-256-gcm', key, nonceBuffer);
    decipher.setAuthTag(authTag);
    decipher.setAAD(associatedDataBuffer);

    let decrypted = decipher.update(encryptedData);
    decrypted = Buffer.concat([decrypted, decipher.final()]);

    return decrypted.toString('utf8');
  }

  /**
   * Map WeChat Pay status to internal status
   */
  private mapWeChatStatus(wechatStatus: string): 'pending' | 'processing' | 'success' | 'failed' | 'expired' | 'refunded' {
    const statusMap: Record<string, 'pending' | 'processing' | 'success' | 'failed' | 'expired' | 'refunded'> = {
      'SUCCESS': 'success',
      'REFUND': 'refunded',
      'NOTPAY': 'pending',
      'CLOSED': 'failed',
      'REVOKED': 'failed',
      'USERPAYING': 'processing',
      'PAYERROR': 'failed'
    };

    return statusMap[wechatStatus] || 'failed';
  }

  /**
   * Query payment status
   */
  async queryPaymentStatus(externalNo: string): Promise<PaymentStatus> {
    try {
      const response = await this.request(
        'GET',
        `/v3/pay/transactions/out-trade-no/${externalNo}?mchid=${this.config.merchantId}`
      );

      return {
        externalNo: response.out_trade_no,
        status: this.mapWeChatStatus(response.trade_state),
        paidAt: response.success_time ? new Date(response.success_time) : undefined,
        amount: response.amount?.total ? response.amount.total / 100 : undefined,
        rawResponse: response
      };
    } catch (error) {
      throw new Error(
        `Failed to query WeChat payment: ${error instanceof Error ? error.message : 'Unknown error'}`
      );
    }
  }

  /**
   * Request refund
   */
  async refund(
    externalNo: string,
    amount: number,
    reason: string
  ): Promise<RefundResult> {
    try {
      const outRefundNo = `${externalNo}_refund_${Date.now()}`;

      const body = {
        out_trade_no: externalNo,
        out_refund_no: outRefundNo,
        reason,
        amount: {
          refund: Math.round(amount * 100),
          total: Math.round(amount * 100),
          currency: 'CNY'
        },
        notify_url: this.config.notifyUrl
      };

      const response = await this.request(
        'POST',
        '/v3/refund/domestic/refunds',
        body
      );

      return {
        refundId: outRefundNo,
        externalRefundNo: response.refund_id || outRefundNo,
        status: response.status === 'SUCCESS' ? 'success' : 'processing',
        amount,
        rawResponse: response
      };
    } catch (error) {
      throw new Error(
        `Failed to process WeChat refund: ${error instanceof Error ? error.message : 'Unknown error'}`
      );
    }
  }

  /**
   * Test connection
   */
  async testConnection(): Promise<{ success: boolean; message: string }> {
    try {
      // Test by querying a non-existent order (will return specific error, proving connection works)
      const testOrderNo = `test_${Date.now()}`;
      
      try {
        await this.request(
          'GET',
          `/v3/pay/transactions/out-trade-no/${testOrderNo}?mchid=${this.config.merchantId}`
        );
      } catch (error) {
        const message = error instanceof Error ? error.message : '';
        // If we get a proper error response, connection is working
        if (message.includes('404') || message.includes('ORDER_NOT_EXIST')) {
          return { success: true, message: 'Connection successful' };
        }
        throw error;
      }

      return { success: true, message: 'Connection successful' };
    } catch (error) {
      return {
        success: false,
        message: error instanceof Error ? error.message : 'Connection failed'
      };
    }
  }
}
