/**
 * Aliyun SMS Provider Implementation
 * Docs: https://help.aliyun.com/document_detail/101414.html
 */

import * as crypto from 'crypto';
import { BaseSMSProvider, SMSProviderConfig, SMSResult } from './base';

interface AliyunSMSResponse {
  Code: string;
  Message: string;
  BizId?: string;
  RequestId: string;
}

export class AliyunSMSProvider extends BaseSMSProvider {
  private readonly endpoint: string;

  constructor(config: SMSProviderConfig) {
    super(config, 'aliyun_sms');
    this.endpoint = config.endpoint || 'https://dysmsapi.aliyuncs.com';
  }

  /**
   * Generate Aliyun signature
   */
  private generateSignature(params: Record<string, string>): string {
    if (!this.config.accessSecret) {
      throw new Error('Access secret is required for Aliyun SMS');
    }

    // Sort parameters
    const sortedKeys = Object.keys(params).sort();
    const canonicalizedQueryString = sortedKeys
      .map(key => `${this.percentEncode(key)}=${this.percentEncode(params[key])}`)
      .join('&');

    // Build string to sign
    const stringToSign = `GET&${this.percentEncode('/')}&${this.percentEncode(canonicalizedQueryString)}`;

    // Sign with HMAC-SHA1
    const hmac = crypto.createHmac('sha1', `${this.config.accessSecret}&`);
    hmac.update(stringToSign);
    return hmac.digest('base64');
  }

  /**
   * URL encode following RFC 3986
   */
  private percentEncode(str: string): string {
    return encodeURIComponent(str)
      .replace(/!/g, '%21')
      .replace(/'/g, '%27')
      .replace(/\(/g, '%28')
      .replace(/\)/g, '%29')
      .replace(/\*/g, '%2A');
  }

  /**
   * Build common request parameters
   */
  private buildCommonParams(): Record<string, string> {
    const timestamp = new Date().toISOString().replace(/\.\d{3}/, '');
    const nonce = crypto.randomBytes(16).toString('hex');

    return {
      'AccessKeyId': this.config.accessKey || '',
      'Format': 'JSON',
      'SignatureMethod': 'HMAC-SHA1',
      'SignatureVersion': '1.0',
      'SignatureNonce': nonce,
      'Timestamp': timestamp,
      'Version': '2017-05-25'
    };
  }

  /**
   * Send SMS
   */
  async sendSMS(
    phone: string,
    message: string | Record<string, string>,
    templateId?: string
  ): Promise<SMSResult> {
    try {
      // Remove country code if present
      const phoneNumber = phone.startsWith('+86') ? phone.substring(3) : phone;

      // Build request parameters
      const params: Record<string, string> = {
        ...this.buildCommonParams(),
        'Action': 'SendSms',
        'PhoneNumbers': phoneNumber,
        'SignName': this.config.signName || '',
        'TemplateCode': templateId || this.config.templateId || ''
      };

      // Add template params
      if (typeof message === 'object') {
        params['TemplateParam'] = JSON.stringify(message);
      } else {
        params['TemplateParam'] = JSON.stringify({ message });
      }

      // Generate signature
      params['Signature'] = this.generateSignature(params);

      // Build query string
      const queryString = Object.entries(params)
        .map(([key, value]) => `${encodeURIComponent(key)}=${encodeURIComponent(value)}`)
        .join('&');

      // Make request
      const response = await fetch(`${this.endpoint}/?${queryString}`, {
        method: 'GET'
      });

      const data: AliyunSMSResponse = await response.json();

      if (data.Code === 'OK') {
        return {
          success: true,
          messageId: data.BizId,
          rawResponse: data
        };
      } else {
        return {
          success: false,
          error: `${data.Code}: ${data.Message}`,
          rawResponse: data
        };
      }
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error'
      };
    }
  }

  /**
   * Test connection
   */
  async testConnection(): Promise<{ success: boolean; message: string }> {
    try {
      // Test by attempting to query account balance
      const params: Record<string, string> = {
        ...this.buildCommonParams(),
        'Action': 'QuerySendDetails',
        'PhoneNumber': '13800000000', // Test number
        'SendDate': '20200101',
        'PageSize': '1',
        'CurrentPage': '1'
      };

      params['Signature'] = this.generateSignature(params);

      const queryString = Object.entries(params)
        .map(([key, value]) => `${encodeURIComponent(key)}=${encodeURIComponent(value)}`)
        .join('&');

      const response = await fetch(`${this.endpoint}/?${queryString}`, {
        method: 'GET'
      });

      const data: AliyunSMSResponse = await response.json();

      if (data.Code === 'OK' || data.Code === 'isv.BUSINESS_LIMIT_CONTROL') {
        // Business limit control means credentials are valid
        return { success: true, message: 'Connection successful' };
      } else if (data.Code.includes('InvalidAccessKeyId') || data.Code.includes('SignatureDoesNotMatch')) {
        return { success: false, message: 'Invalid credentials' };
      } else {
        return { success: true, message: 'Connection successful (credentials valid)' };
      }
    } catch (error) {
      return {
        success: false,
        message: error instanceof Error ? error.message : 'Connection failed'
      };
    }
  }
}
