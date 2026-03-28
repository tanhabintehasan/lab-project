/**
 * Payment Provider Base Interface
 * All payment providers must implement this interface
 */

export enum PaymentProviderType {
  WECHAT_PAY = 'WECHAT_PAY',
  ALIPAY = 'ALIPAY',
  UNION_PAY = 'UNION_PAY',
  BANK_TRANSFER = 'BANK_TRANSFER'
}

export interface PaymentIntent {
  // Internal payment ID
  id: string;
  
  // Provider's transaction ID
  externalNo: string;
  
  // Amount in yuan (not cents)
  amount: number;
  
  // Currency code
  currency: string;
  
  // Payment status
  status: 'pending' | 'processing' | 'success' | 'failed' | 'expired' | 'refunded';
  
  // For QR code / redirect payments
  codeUrl?: string;
  redirectUrl?: string;
  
  // Expires at
  expiresAt?: Date;
  
  // Raw provider response
  rawResponse?: unknown;
}

export interface WebhookVerification {
  // Is signature valid?
  isValid: boolean;
  
  // Provider's transaction ID
  externalNo?: string;
  
  // Payment status from webhook
  status?: 'pending' | 'processing' | 'success' | 'failed' | 'expired' | 'refunded';
  
  // Event type
  eventType?: string;
  
  // Amount from webhook (for verification)
  amount?: number;
  
  // Raw parsed data
  data?: unknown;
  
  // Error if verification failed
  error?: string;
}

export interface PaymentStatus {
  externalNo: string;
  status: 'pending' | 'processing' | 'success' | 'failed' | 'expired' | 'refunded';
  paidAt?: Date;
  amount?: number;
  rawResponse?: unknown;
}

export interface RefundResult {
  refundId: string;
  externalRefundNo: string;
  status: 'pending' | 'processing' | 'success' | 'failed';
  amount: number;
  rawResponse?: unknown;
}

export interface PaymentProviderConfig {
  appId?: string;
  merchantId?: string;
  apiKey?: string;
  apiSecret?: string;
  privateKey?: string;
  publicKey?: string;
  certSerialNo?: string;
  notifyUrl?: string;
  mode: 'SANDBOX' | 'LIVE';
  config?: Record<string, unknown>;
}

/**
 * Base Payment Provider Interface
 */
export abstract class BasePaymentProvider {
  protected config: PaymentProviderConfig;
  protected type: PaymentProviderType;

  constructor(config: PaymentProviderConfig, type: PaymentProviderType) {
    this.config = config;
    this.type = type;
  }

  /**
   * Create a payment intent
   * 
   * @param amount Amount in yuan (not cents)
   * @param orderId Internal order ID
   * @param metadata Additional metadata
   */
  abstract createPayment(
    amount: number,
    orderId: string,
    metadata?: Record<string, unknown>
  ): Promise<PaymentIntent>;

  /**
   * Verify webhook signature and parse data
   * 
   * @param body Raw request body (string or buffer)
   * @param signature Signature from headers
   * @param headers All request headers
   */
  abstract verifyWebhook(
    body: string | Buffer,
    signature: string,
    headers: Record<string, string>
  ): Promise<WebhookVerification>;

  /**
   * Query payment status from provider
   * Used to double-check status after webhook
   * 
   * @param externalNo Provider's transaction ID
   */
  abstract queryPaymentStatus(externalNo: string): Promise<PaymentStatus>;

  /**
   * Request a refund
   * 
   * @param externalNo Provider's transaction ID
   * @param amount Amount to refund (in yuan)
   * @param reason Refund reason
   */
  abstract refund(
    externalNo: string,
    amount: number,
    reason: string
  ): Promise<RefundResult>;

  /**
   * Test connection to provider
   * Used by admin panel to verify configuration
   */
  abstract testConnection(): Promise<{ success: boolean; message: string }>;

  /**
   * Get provider type
   */
  getType(): PaymentProviderType {
    return this.type;
  }

  /**
   * Get provider mode
   */
  getMode(): 'SANDBOX' | 'LIVE' {
    return this.config.mode;
  }
}

/**
 * Provider Registry
 */
export class PaymentProviderRegistry {
  private static providers = new Map<PaymentProviderType, typeof BasePaymentProvider>();

  static register(type: PaymentProviderType, provider: typeof BasePaymentProvider) {
    this.providers.set(type, provider);
  }

  static get(type: PaymentProviderType): typeof BasePaymentProvider | undefined {
    return this.providers.get(type);
  }

  static getAll(): PaymentProviderType[] {
    return Array.from(this.providers.keys());
  }
}
