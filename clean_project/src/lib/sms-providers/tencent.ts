/**
 * Tencent Cloud SMS Provider Implementation
 * Docs: https://cloud.tencent.com/document/product/382/52077
 */

import * as crypto from 'crypto';
import { BaseSMSProvider, SMSProviderConfig, SMSResult } from './base';

interface TencentSMSResponse {
  Response: {
    SendStatusSet?: Array<{
      Code: string;
      Message: string;
      PhoneNumber: string;
      SerialNo: string;
    }>;
    RequestId: string;
    Error?: {
      Code: string;
      Message: string;
    };
  };
}

export class TencentSMSProvider extends BaseSMSProvider {
  private readonly endpoint: string;
  private readonly sdkAppId: string;

  constructor(config: SMSProviderConfig) {
    super(config, 'tencent_sms');
    this.endpoint = config.endpoint || 'sms.tencentcloudapi.com';
    this.sdkAppId = (config.config?.sdkAppId as string) || '';
  }

  /**
   * Generate Tencent Cloud signature v3
   */
  private generateSignature(
    payload: string,
    timestamp: number,
    date: string
  ): string {
    if (!this.config.apiSecret) {
      throw new Error('API secret is required for Tencent SMS');
    }

    const service = 'sms';
    const algorithm = 'TC3-HMAC-SHA256';
    const canonicalRequest = [
      'POST',
      '/',
      '',
      'content-type:application/json',
      'host:' + this.endpoint,
      '',
      'content-type;host',
      this.sha256(payload)
    ].join('\n');

    const credentialScope = `${date}/${service}/tc3_request`;
    const stringToSign = [
      algorithm,
      timestamp,
      credentialScope,
      this.sha256(canonicalRequest)
    ].join('\n');

    const secretDate = this.hmacSha256(date, `TC3${this.config.apiSecret}`);
    const secretService = this.hmacSha256(service, secretDate);
    const secretSigning = this.hmacSha256('tc3_request', secretService);
    const signature = this.hmacSha256(stringToSign, secretSigning, 'hex');

    return signature;
  }

  private sha256(message: string): string {
    return crypto.createHash('sha256').update(message).digest('hex');
  }

  private hmacSha256(
    message: string,
    secret: string | Buffer,
    encoding: 'hex' | 'buffer' = 'buffer'
  ): any {
    const hmac = crypto.createHmac('sha256', secret);
    hmac.update(message);
    return encoding === 'hex' ? hmac.digest('hex') : hmac.digest();
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
      // Format phone number (Tencent requires +86 prefix)
      const phoneNumber = phone.startsWith('+') ? phone : `+86${phone}`;

      // Prepare template params
      let templateParams: string[];
      if (typeof message === 'object') {
        // Convert object to array (order matters for Tencent)
        templateParams = Object.values(message);
      } else {
        templateParams = [message];
      }

      // Build request payload
      const payload = {
        PhoneNumberSet: [phoneNumber],
        SmsSdkAppId: this.sdkAppId,
        SignName: this.config.signName || '',
        TemplateId: templateId || this.config.templateId || '',
        TemplateParamSet: templateParams
      };

      const payloadString = JSON.stringify(payload);
      const timestamp = Math.floor(Date.now() / 1000);
      const date = new Date(timestamp * 1000).toISOString().split('T')[0];

      // Generate signature
      const signature = this.generateSignature(payloadString, timestamp, date);

      // Build authorization header
      const algorithm = 'TC3-HMAC-SHA256';
      const credentialScope = `${date}/sms/tc3_request`;
      const authorization = `${algorithm} Credential=${this.config.apiKey}/${credentialScope}, SignedHeaders=content-type;host, Signature=${signature}`;

      // Make request
      const response = await fetch(`https://${this.endpoint}`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Host': this.endpoint,
          'X-TC-Action': 'SendSms',
          'X-TC-Version': '2021-01-11',
          'X-TC-Timestamp': timestamp.toString(),
          'X-TC-Region': this.config.region || 'ap-guangzhou',
          'Authorization': authorization
        },
        body: payloadString
      });

      const data: TencentSMSResponse = await response.json();

      if (data.Response.Error) {
        return {
          success: false,
          error: `${data.Response.Error.Code}: ${data.Response.Error.Message}`,
          rawResponse: data
        };
      }

      const sendStatus = data.Response.SendStatusSet?.[0];
      if (sendStatus && sendStatus.Code === 'Ok') {
        return {
          success: true,
          messageId: sendStatus.SerialNo,
          rawResponse: data
        };
      } else {
        return {
          success: false,
          error: sendStatus?.Message || 'Unknown error',
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
      // Test by querying SMS statistics
      const payload = JSON.stringify({
        Limit: 1,
        Offset: 0
      });

      const timestamp = Math.floor(Date.now() / 1000);
      const date = new Date(timestamp * 1000).toISOString().split('T')[0];
      const signature = this.generateSignature(payload, timestamp, date);

      const algorithm = 'TC3-HMAC-SHA256';
      const credentialScope = `${date}/sms/tc3_request`;
      const authorization = `${algorithm} Credential=${this.config.apiKey}/${credentialScope}, SignedHeaders=content-type;host, Signature=${signature}`;

      const response = await fetch(`https://${this.endpoint}`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Host': this.endpoint,
          'X-TC-Action': 'PullSmsSendStatus',
          'X-TC-Version': '2021-01-11',
          'X-TC-Timestamp': timestamp.toString(),
          'X-TC-Region': this.config.region || 'ap-guangzhou',
          'Authorization': authorization
        },
        body: payload
      });

      const data: TencentSMSResponse = await response.json();

      if (data.Response.Error) {
        const errorCode = data.Response.Error.Code;
        if (errorCode.includes('AuthFailure')) {
          return { success: false, message: 'Invalid credentials' };
        }
        return { success: false, message: data.Response.Error.Message };
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
