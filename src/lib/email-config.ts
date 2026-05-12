/**
 * Dynamic email configuration lookup.
 * Reads the active EMAIL integration from IntegrationSetting.
 */

import { prisma } from '@/lib/db';
import { decrypt } from '@/lib/services/encryption.service';

export interface EmailIntegrationConfig {
  provider: 'console' | 'smtp' | 'sendgrid' | 'resend';
  from: string;
  // SMTP
  host?: string;
  port?: number;
  secure?: boolean;
  user?: string;
  pass?: string;
  // API keys (Resend / SendGrid)
  apiKey?: string;
  // Extra config
  config?: Record<string, unknown>;
}

export async function getEmailIntegrationConfig(): Promise<EmailIntegrationConfig> {
  const setting = await prisma.integrationSetting.findFirst({
    where: {
      type: 'EMAIL',
      isEnabled: true,
    },
    orderBy: {
      isDefault: 'desc',
    },
  });

  if (!setting) {
    return {
      provider: 'console',
      from: process.env.EMAIL_FROM || 'noreply@labtest.com',
    };
  }

  const provider = (setting.provider as EmailIntegrationConfig['provider']) || 'console';
  const config = (setting.config as Record<string, unknown>) || {};

  const from =
    (config.from as string) ||
    (config.emailFrom as string) ||
    process.env.EMAIL_FROM ||
    'noreply@labtest.com';

  const result: EmailIntegrationConfig = {
    provider,
    from,
    config,
  };

  if (provider === 'smtp') {
    result.host =
      (config.host as string) ||
      (config.smtpHost as string) ||
      process.env.SMTP_HOST ||
      undefined;
    result.port =
      typeof config.port === 'number'
        ? config.port
        : typeof config.smtpPort === 'number'
          ? config.smtpPort
          : process.env.SMTP_PORT
            ? Number(process.env.SMTP_PORT)
            : 587;
    result.secure =
      typeof config.secure === 'boolean'
        ? config.secure
        : typeof config.smtpSecure === 'boolean'
          ? config.smtpSecure
          : process.env.SMTP_SECURE === 'true';
    result.user =
      (config.user as string) ||
      (config.smtpUser as string) ||
      process.env.SMTP_USER ||
      undefined;
    result.pass =
      (config.pass as string) ||
      (config.smtpPass as string) ||
      (setting.apiSecret ? decrypt(setting.apiSecret) : undefined) ||
      process.env.SMTP_PASS ||
      undefined;
  }

  if (provider === 'resend' || provider === 'sendgrid') {
    result.apiKey =
      (config.apiKey as string) ||
      (setting.apiKey ? decrypt(setting.apiKey) : undefined) ||
      process.env.RESEND_API_KEY ||
      process.env.SENDGRID_API_KEY ||
      undefined;
  }

  return result;
}
