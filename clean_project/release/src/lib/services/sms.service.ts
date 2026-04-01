/**
 * SMS Service
 * Orchestrates SMS sending through configured providers
 */

import { getIntegrationByType } from './integration-config.service';
import { IntegrationType } from '@prisma/client';
import { BaseSMSProvider } from '../sms-providers/base';
import { AliyunSMSProvider } from '../sms-providers/aliyun';
import { TencentSMSProvider } from '../sms-providers/tencent';

/**
 * Get SMS provider instance
 */
async function getSMSProvider(): Promise<BaseSMSProvider | null> {
  try {
    const config = await getIntegrationByType(IntegrationType.SMS);
    
    if (!config) {
      console.error('No SMS provider configured');
      return null;
    }

    const providerConfig = {
      apiKey: config.apiKey,
      apiSecret: config.apiSecret,
      accessKey: config.accessKey,
      accessSecret: config.accessSecret,
      signName: (config.config as any)?.signName,
      templateId: (config.config as any)?.templateId,
      endpoint: config.endpoint,
      region: config.region,
      mode: config.mode,
      config: config.config
    };

    switch (config.provider) {
      case 'aliyun_sms':
      case 'aliyun':
        return new AliyunSMSProvider(providerConfig);
      
      case 'tencent_sms':
      case 'tencent':
        return new TencentSMSProvider(providerConfig);
      
      default:
        console.error(`Unknown SMS provider: ${config.provider}`);
        return null;
    }
  } catch (error) {
    console.error('Get SMS provider error:', error);
    return null;
  }
}

/**
 * Send OTP code via SMS
 * @param phone Phone number (with or without country code)
 * @param code OTP code
 * @returns Success status and message ID
 */
export async function sendOTPSMS(
  phone: string,
  code: string
): Promise<{ success: boolean; messageId?: string; error?: string }> {
  try {
    const provider = await getSMSProvider();
    
    if (!provider) {
      return {
        success: false,
        error: 'SMS provider not configured. Please configure in admin panel.'
      };
    }

    // Ensure phone has country code
    const formattedPhone = phone.startsWith('+') ? phone : `+86${phone}`;

    const result = await provider.sendOTP(formattedPhone, code);

    if (result.success) {
      return {
        success: true,
        messageId: result.messageId
      };
    } else {
      return {
        success: false,
        error: result.error || 'Failed to send SMS'
      };
    }
  } catch (error) {
    console.error('Send OTP SMS error:', error);
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Failed to send SMS'
    };
  }
}

/**
 * Send generic SMS
 * @param phone Phone number
 * @param message Message or template variables
 * @param templateId Optional template ID
 */
export async function sendSMS(
  phone: string,
  message: string | Record<string, string>,
  templateId?: string
): Promise<{ success: boolean; messageId?: string; error?: string }> {
  try {
    const provider = await getSMSProvider();
    
    if (!provider) {
      return {
        success: false,
        error: 'SMS provider not configured'
      };
    }

    const formattedPhone = phone.startsWith('+') ? phone : `+86${phone}`;

    const result = await provider.sendSMS(formattedPhone, message, templateId);

    if (result.success) {
      return {
        success: true,
        messageId: result.messageId
      };
    } else {
      return {
        success: false,
        error: result.error || 'Failed to send SMS'
      };
    }
  } catch (error) {
    console.error('Send SMS error:', error);
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Failed to send SMS'
    };
  }
}
