/**
 * Alipay Provider Implementation
 * Supports PC Website payment (form redirect)
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

interface AlipayResponse {
  code: string;
  msg: string;
  [key: string]: any;
}

export class AlipayProvider extends BasePaymentProvider {
  private readonly apiBaseUrl: string;
  private readonly gatewayUrl: string;

  constructor(config: PaymentProviderConfig) {
    super(config, PaymentProviderType.ALIPAY);
    this.apiBaseUrl = config.mode === 'LIVE'
      ? 'https://openapi.alipay.com/gateway.do'
      : 'https://openapi-sandbox.dl.alipaydev.com/gateway.do';
    this.gatewayUrl = this.apiBaseUrl;
  }

  /**
   * Generate Alipay signature (RSA2)
   */
  private generateSignature(params: Record<string, any>): string {
    // Sort params alphabetically and build string
    const sortedKeys = Object.keys(params).sort();
    const signString = sortedKeys
      .filter(key => params[key] && key !== 'sign')
      .map(key => `${key}=${params[key]}`)
      .join('&');

    if (!this.config.privateKey) {
      throw new Error('Private key is required for Alipay');
    }

    const sign = crypto.createSign('RSA-SHA256');
    sign.update(signString, 'utf8');
    return sign.sign(this.config.privateKey, 'base64');
  }

  /**
   * Verify Alipay signature
   */
  private verifySignature(
    params: Record<string, any>,
    signature: string
  ): boolean {
    if (!this.config.publicKey) {
      throw new Error('Alipay public key is required for verification');
    }

    // Sort params alphabetically and build string
    const sortedKeys = Object.keys(params).sort();
    const signString = sortedKeys
      .filter(key => params[key] && key !== 'sign' && key !== 'sign_type')
      .map(key => `${key}=${params[key]}`)
      .join('&');

    const verify = crypto.createVerify('RSA-SHA256');
    verify.update(signString, 'utf8');
    return verify.verify(this.config.publicKey, signature, 'base64');
  }

  /**
   * Build API request parameters
   */
  private buildRequestParams(
    method: string,
    bizContent: Record<string, any>
  ): Record<string, string> {
    const params: Record<string, string> = {
      app_id: this.config.appId || '',
      method,
      format: 'JSON',
      charset: 'utf-8',
      sign_type: 'RSA2',
      timestamp: new Date().toISOString().replace('T', ' ').split('.')[0],
      version: '1.0',
      biz_content: JSON.stringify(bizContent)
    };

    if (this.config.notifyUrl && method.includes('pay')) {
      params.notify_url = this.config.notifyUrl;
    }

    // Generate and add signature
    params.sign = this.generateSignature(params);

    return params;
  }

  /**
   * Make API request to Alipay
   */
  private async request(
    method: string,
    bizContent: Record<string, any>
  ): Promise<AlipayResponse> {
    const params = this.buildRequestParams(method, bizContent);

    // Build query string
    const queryString = Object.entries(params)
      .map(([key, value]) => `${key}=${encodeURIComponent(value)}`)
      .join('&');

    const response = await fetch(`${this.gatewayUrl}?${queryString}`, {
      method: 'GET'
    });

    if (!response.ok) {
      throw new Error(`Alipay API error: ${response.status}`);
    }

    const data = await response.json();
    
    // Extract response from wrapper
    const responseKey = Object.keys(data).find(key => key.endsWith('_response'));
    if (!responseKey) {
      throw new Error('Invalid Alipay response format');
    }

    const result = data[responseKey] as AlipayResponse;

    if (result.code !== '10000') {
      throw new Error(`Alipay error: ${result.msg} (${result.code})`);
    }

    return result;
  }

  /**
   * Create payment (Web payment form)
   */
  async createPayment(
    amount: number,
    orderId: string,
    metadata?: Record<string, unknown>
  ): Promise<PaymentIntent> {
    try {
      const outTradeNo = `${orderId}_${Date.now()}`;

      const bizContent = {
        out_trade_no: outTradeNo,
        product_code: 'FAST_INSTANT_TRADE_PAY',
        total_amount: amount.toFixed(2),
        subject: metadata?.description || '实验室检测服务',
        body: metadata?.body || '实验室检测服务费用',
        passback_params: JSON.stringify({ orderId, ...metadata })
      };

      const params = this.buildRequestParams(
        'alipay.trade.page.pay',
        bizContent
      );

      // Build payment URL
      const queryString = Object.entries(params)
        .map(([key, value]) => `${key}=${encodeURIComponent(value)}`)
        .join('&');

      const paymentUrl = `${this.gatewayUrl}?${queryString}`;

      return {
        id: outTradeNo,
        externalNo: outTradeNo,
        amount,
        currency: 'CNY',
        status: 'pending',
        redirectUrl: paymentUrl,
        expiresAt: new Date(Date.now() + 30 * 60 * 1000), // 30 minutes
        rawResponse: { paymentUrl }
      };
    } catch (error) {
      throw new Error(
        `Failed to create Alipay payment: ${error instanceof Error ? error.message : 'Unknown error'}`
      );
    }
  }

  /**
   * Verify Alipay webhook/notify
   */
  async verifyWebhook(
    body: string | Buffer,
    signature: string,
    headers: Record<string, string>
  ): Promise<WebhookVerification> {
    try {
      // Parse notify params
      const bodyStr = typeof body === 'string' ? body : body.toString('utf8');
      const params: Record<string, any> = {};
      
      // Parse URL-encoded params
      bodyStr.split('&').forEach(pair => {
        const [key, value] = pair.split('=');
        if (key && value) {
          params[decodeURIComponent(key)] = decodeURIComponent(value);
        }
      });

      // Get signature from params or header
      const sign = params.sign || signature;
      if (!sign) {
        return {
          isValid: false,
          error: 'Missing signature'
        };
      }

      // Verify signature
      const isValid = this.verifySignature(params, sign);

      if (!isValid) {
        return {
          isValid: false,
          error: 'Invalid signature'
        };
      }

      // Check trade status
      const tradeStatus = params.trade_status;
      let status: WebhookVerification['status'];

      if (tradeStatus === 'TRADE_SUCCESS' || tradeStatus === 'TRADE_FINISHED') {
        status = 'success';
      } else if (tradeStatus === 'WAIT_BUYER_PAY') {
        status = 'processing';
      } else if (tradeStatus === 'TRADE_CLOSED') {
        status = 'failed';
      } else {
        status = 'processing';
      }

      return {
        isValid: true,
        externalNo: params.out_trade_no,
        status,
        eventType: 'payment.notify',
        amount: params.total_amount ? parseFloat(params.total_amount) : undefined,
        data: params
      };
    } catch (error) {
      return {
        isValid: false,
        error: error instanceof Error ? error.message : 'Unknown error'
      };
    }
  }

  /**
   * Query payment status
   */
  async queryPaymentStatus(externalNo: string): Promise<PaymentStatus> {
    try {
      const response = await this.request('alipay.trade.query', {
        out_trade_no: externalNo
      });

      let status: PaymentStatus['status'];
      const tradeStatus = response.trade_status;

      if (tradeStatus === 'TRADE_SUCCESS' || tradeStatus === 'TRADE_FINISHED') {
        status = 'success';
      } else if (tradeStatus === 'WAIT_BUYER_PAY') {
        status = 'pending';
      } else if (tradeStatus === 'TRADE_CLOSED') {
        status = 'failed';
      } else {
        status = 'processing';
      }

      return {
        externalNo: response.out_trade_no,
        status,
        paidAt: response.send_pay_date ? new Date(response.send_pay_date) : undefined,
        amount: response.total_amount ? parseFloat(response.total_amount) : undefined,
        rawResponse: response
      };
    } catch (error) {
      throw new Error(
        `Failed to query Alipay payment: ${error instanceof Error ? error.message : 'Unknown error'}`
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

      const response = await this.request('alipay.trade.refund', {
        out_trade_no: externalNo,
        refund_amount: amount.toFixed(2),
        refund_reason: reason,
        out_request_no: outRefundNo
      });

      return {
        refundId: outRefundNo,
        externalRefundNo: response.trade_no || outRefundNo,
        status: 'success',
        amount: parseFloat(response.refund_fee || amount.toString()),
        rawResponse: response
      };
    } catch (error) {
      throw new Error(
        `Failed to process Alipay refund: ${error instanceof Error ? error.message : 'Unknown error'}`
      );
    }
  }

  /**
   * Test connection
   */
  async testConnection(): Promise<{ success: boolean; message: string }> {
    try {
      // Test by querying a non-existent order
      const testOrderNo = `test_${Date.now()}`;
      
      try {
        await this.request('alipay.trade.query', {
          out_trade_no: testOrderNo
        });
      } catch (error) {
        const message = error instanceof Error ? error.message : '';
        // If we get a proper error response (order not found), connection is working
        if (message.includes('ACQ.TRADE_NOT_EXIST') || message.includes('40004')) {
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
