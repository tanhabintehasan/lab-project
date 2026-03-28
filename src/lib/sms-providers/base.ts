/**
 * SMS Provider Base Interface
 * All SMS providers must implement this interface
 */

export interface SMSProviderConfig {
  apiKey?: string;
  apiSecret?: string;
  accessKey?: string;
  accessSecret?: string;
  signName?: string;
  templateId?: string;
  endpoint?: string;
  region?: string;
  mode: 'SANDBOX' | 'LIVE';
  config?: Record<string, unknown>;
}

export interface SMSResult {
  success: boolean;
  messageId?: string;
  error?: string;
  rawResponse?: unknown;
}

/**
 * Base SMS Provider Interface
 */
export abstract class BaseSMSProvider {
  protected config: SMSProviderConfig;
  protected providerName: string;

  constructor(config: SMSProviderConfig, providerName: string) {
    this.config = config;
    this.providerName = providerName;
  }

  /**
   * Send SMS message
   * 
   * @param phone Phone number (international format: +86...)
   * @param message Plain text message or template variables
   * @param templateId Optional template ID (overrides config)
   */
  abstract sendSMS(
    phone: string,
    message: string | Record<string, string>,
    templateId?: string
  ): Promise<SMSResult>;

  /**
   * Send OTP code
   * Convenience method for sending OTP codes
   * 
   * @param phone Phone number
   * @param code OTP code
   */
  async sendOTP(phone: string, code: string): Promise<SMSResult> {
    return this.sendSMS(phone, { code });
  }

  /**
   * Test connection to provider
   * Used by admin panel to verify configuration
   */
  abstract testConnection(): Promise<{ success: boolean; message: string }>;

  /**
   * Get provider name
   */
  getProviderName(): string {
    return this.providerName;
  }

  /**
   * Get provider mode
   */
  getMode(): 'SANDBOX' | 'LIVE' {
    return this.config.mode;
  }
}
