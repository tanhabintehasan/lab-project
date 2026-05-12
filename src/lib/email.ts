/**
 * Email service abstraction.
 * Supports: console (dev), smtp, sendgrid, ses, resend
 * Configure via IntegrationSetting (type: EMAIL) or env vars.
 */

import { getEmailIntegrationConfig, EmailIntegrationConfig } from './email-config';
import nodemailer from 'nodemailer';

export interface EmailMessage {
  to: string | string[];
  from?: string;
  subject: string;
  html: string;
  text?: string;
  attachments?: Array<{
    filename: string;
    content: Buffer | string;
    contentType?: string;
  }>;
}

export interface EmailProvider {
  name: string;
  send(message: EmailMessage): Promise<{ success: boolean; messageId?: string; error?: string }>;
}

// ─── Console provider (development) ──────────────────────────
class ConsoleEmailProvider implements EmailProvider {
  name = 'console';

  async send(message: EmailMessage): Promise<{ success: boolean; messageId?: string }> {
    const messageId = `console_${Date.now()}_${Math.random().toString(36).slice(2)}`;
    console.log('\n' + '='.repeat(80));
    console.log('📧 [EMAIL] Would send email:');
    console.log('From:', message.from || 'noreply@labtest.com');
    console.log('To:', Array.isArray(message.to) ? message.to.join(', ') : message.to);
    console.log('Subject:', message.subject);
    console.log('─'.repeat(80));
    console.log(message.text || message.html);
    console.log('='.repeat(80) + '\n');
    return { success: true, messageId };
  }
}

// ─── SMTP provider ───────────────────────────────────────────
class SMTPEmailProvider implements EmailProvider {
  name = 'smtp';
  private config: EmailIntegrationConfig;

  constructor(config: EmailIntegrationConfig) {
    this.config = config;
  }

  async send(message: EmailMessage): Promise<{ success: boolean; messageId?: string; error?: string }> {
    try {
      const transporter = nodemailer.createTransport({
        host: this.config.host,
        port: this.config.port,
        secure: this.config.secure,
        auth: this.config.user
          ? {
              user: this.config.user,
              pass: this.config.pass || '',
            }
          : undefined,
      });

      const info = await transporter.sendMail({
        from: message.from || this.config.from,
        to: message.to,
        subject: message.subject,
        html: message.html,
        text: message.text,
        attachments: message.attachments,
      });

      return { success: true, messageId: info.messageId };
    } catch (error) {
      const errMsg = error instanceof Error ? error.message : 'SMTP send failed';
      console.error('[SMTP] Error:', errMsg);
      return { success: false, error: errMsg };
    }
  }
}

// ─── Resend provider ─────────────────────────────────────────
class ResendEmailProvider implements EmailProvider {
  name = 'resend';
  private config: EmailIntegrationConfig;

  constructor(config: EmailIntegrationConfig) {
    this.config = config;
  }

  async send(message: EmailMessage): Promise<{ success: boolean; messageId?: string; error?: string }> {
    try {
      if (!this.config.apiKey) {
        throw new Error('Resend API key not configured');
      }

      const body: any = {
        from: message.from || this.config.from,
        to: Array.isArray(message.to) ? message.to : [message.to],
        subject: message.subject,
        html: message.html,
        text: message.text,
      };

      // attachments not supported in the simplest Resend endpoint without multipart,
      // but for our use-case we can skip them or base64 encode later if needed.

      const res = await fetch('https://api.resend.com/emails', {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${this.config.apiKey}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(body),
      });

      const data = await res.json().catch(() => ({}));

      if (!res.ok) {
        throw new Error(data.message || `Resend error ${res.status}`);
      }

      return { success: true, messageId: data.id };
    } catch (error) {
      const errMsg = error instanceof Error ? error.message : 'Resend send failed';
      console.error('[Resend] Error:', errMsg);
      return { success: false, error: errMsg };
    }
  }
}

// ─── SendGrid provider ───────────────────────────────────────
class SendGridEmailProvider implements EmailProvider {
  name = 'sendgrid';
  private config: EmailIntegrationConfig;

  constructor(config: EmailIntegrationConfig) {
    this.config = config;
  }

  async send(message: EmailMessage): Promise<{ success: boolean; messageId?: string; error?: string }> {
    try {
      if (!this.config.apiKey) {
        throw new Error('SendGrid API key not configured');
      }

      const toList = Array.isArray(message.to) ? message.to : [message.to];

      const body = {
        personalizations: toList.map((email) => ({
          to: [{ email }],
        })),
        from: { email: message.from || this.config.from },
        subject: message.subject,
        content: [
          ...(message.text ? [{ type: 'text/plain', value: message.text }] : []),
          { type: 'text/html', value: message.html },
        ],
      };

      const res = await fetch('https://api.sendgrid.com/v3/mail/send', {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${this.config.apiKey}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(body),
      });

      if (!res.ok) {
        const text = await res.text().catch(() => '');
        throw new Error(text || `SendGrid error ${res.status}`);
      }

      return { success: true, messageId: res.headers.get('x-message-id') || undefined };
    } catch (error) {
      const errMsg = error instanceof Error ? error.message : 'SendGrid send failed';
      console.error('[SendGrid] Error:', errMsg);
      return { success: false, error: errMsg };
    }
  }
}

// ─── Factory ─────────────────────────────────────────────────
export async function getEmailProvider(): Promise<EmailProvider> {
  const config = await getEmailIntegrationConfig();

  switch (config.provider) {
    case 'smtp':
      return new SMTPEmailProvider(config);
    case 'sendgrid':
      return new SendGridEmailProvider(config);
    case 'resend':
      return new ResendEmailProvider(config);
    case 'console':
    default:
      return new ConsoleEmailProvider();
  }
}

// ─── Helper functions ────────────────────────────────────────
export async function sendEmail(
  message: EmailMessage
): Promise<{ success: boolean; messageId?: string; error?: string }> {
  const provider = await getEmailProvider();
  const config = await getEmailIntegrationConfig();
  const from = message.from || config.from;
  return provider.send({ ...message, from });
}
