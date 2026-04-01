/**
 * Email service abstraction.
 * Supports: console (dev), smtp, sendgrid, ses, resend
 * Configure via EMAIL_PROVIDER env var.
 */

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
    console.log('From:', message.from || process.env.EMAIL_FROM || 'noreply@labtest.com');
    console.log('To:', Array.isArray(message.to) ? message.to.join(', ') : message.to);
    console.log('Subject:', message.subject);
    console.log('─'.repeat(80));
    console.log(message.text || message.html);
    console.log('='.repeat(80) + '\n');
    return { success: true, messageId };
  }
}

// ─── SMTP provider (production) ──────────────────────────────
class SMTPEmailProvider implements EmailProvider {
  name = 'smtp';

  async send(message: EmailMessage): Promise<{ success: boolean; messageId?: string; error?: string }> {
    // TODO: Implement with nodemailer
    // const nodemailer = require('nodemailer');
    // const transporter = nodemailer.createTransport({ ... });
    console.warn('[SMTP] Not yet configured, falling back to console');
    return new ConsoleEmailProvider().send(message);
  }
}

// ─── SendGrid provider ───────────────────────────────────────
class SendGridEmailProvider implements EmailProvider {
  name = 'sendgrid';

  async send(message: EmailMessage): Promise<{ success: boolean; messageId?: string; error?: string }> {
    // TODO: Implement with @sendgrid/mail
    console.warn('[SendGrid] Not yet configured, falling back to console');
    return new ConsoleEmailProvider().send(message);
  }
}

// ─── Resend provider ─────────────────────────────────────────
class ResendEmailProvider implements EmailProvider {
  name = 'resend';

  async send(message: EmailMessage): Promise<{ success: boolean; messageId?: string; error?: string }> {
    // TODO: Implement with resend SDK
    console.warn('[Resend] Not yet configured, falling back to console');
    return new ConsoleEmailProvider().send(message);
  }
}

// ─── Factory ─────────────────────────────────────────────────
let _provider: EmailProvider | null = null;

export function getEmailProvider(): EmailProvider {
  if (_provider) return _provider;

  const providerType = process.env.EMAIL_PROVIDER || 'console';
  switch (providerType) {
    case 'smtp':
      _provider = new SMTPEmailProvider();
      break;
    case 'sendgrid':
      _provider = new SendGridEmailProvider();
      break;
    case 'resend':
      _provider = new ResendEmailProvider();
      break;
    case 'console':
    default:
      _provider = new ConsoleEmailProvider();
  }

  return _provider;
}

// ─── Helper functions ────────────────────────────────────────
export async function sendEmail(message: EmailMessage): Promise<{ success: boolean; messageId?: string; error?: string }> {
  const provider = getEmailProvider();
  const from = message.from || process.env.EMAIL_FROM || 'noreply@labtest.com';
  return provider.send({ ...message, from });
}
