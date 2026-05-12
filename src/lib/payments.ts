/**
 * Payment provider abstraction.
 * Supports: mock (dev), stripe, wechat_pay, alipay, bank_transfer
 * Configure via PAYMENT_PROVIDER env var.
 */

export type PaymentStatus = 'pending' | 'processing' | 'succeeded' | 'failed' | 'expired' | 'refunded' | 'canceled';

export interface PaymentIntent {
  id: string;
  amount: number;
  currency: string;
  status: PaymentStatus;
  provider: string;
  providerPaymentId?: string;
  metadata?: Record<string, unknown>;
  redirectUrl?: string;
  expiresAt?: Date;
}

export interface RefundResult {
  id: string;
  amount: number;
  status: 'pending' | 'succeeded' | 'failed';
}

export interface PaymentProvider {
  name: string;
  createPaymentIntent(amount: number, currency: string, metadata: Record<string, unknown>): Promise<PaymentIntent>;
  verifyWebhook(body: string, signature: string): Promise<{ valid: boolean; event?: string; paymentId?: string; status?: PaymentStatus }>;
  refund(providerPaymentId: string, amount: number): Promise<RefundResult>;
}

// ─── Mock provider (development) ─────────────────────────────
class MockPaymentProvider implements PaymentProvider {
  name = 'mock';

  async createPaymentIntent(amount: number, currency: string, metadata: Record<string, unknown>): Promise<PaymentIntent> {
    const id = `mock_pi_${Date.now()}_${Math.random().toString(36).slice(2)}`;
    // Auto-succeed in dev
    return {
      id,
      amount,
      currency,
      status: 'succeeded',
      provider: 'mock',
      providerPaymentId: id,
      metadata,
    };
  }

  async verifyWebhook(_body: string, _signature: string) {
    return { valid: true, event: 'payment.succeeded', paymentId: 'mock', status: 'succeeded' as PaymentStatus };
  }

  async refund(_providerPaymentId: string, amount: number): Promise<RefundResult> {
    return { id: `mock_refund_${Date.now()}`, amount, status: 'succeeded' };
  }
}

// ─── Stripe provider (production) ────────────────────────────
class StripePaymentProvider implements PaymentProvider {
  name = 'stripe';

  async createPaymentIntent(amount: number, currency: string, metadata: Record<string, unknown>): Promise<PaymentIntent> {
    // TODO: Implement with stripe SDK
    // const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!);
    // const intent = await stripe.paymentIntents.create({ amount: amount * 100, currency, metadata });
    console.warn('[Stripe] Not yet configured, falling back to mock');
    return new MockPaymentProvider().createPaymentIntent(amount, currency, metadata);
  }

  async verifyWebhook(body: string, signature: string) {
    // TODO: Implement with stripe.webhooks.constructEvent
    return { valid: false };
  }

  async refund(providerPaymentId: string, amount: number): Promise<RefundResult> {
    // TODO: Implement
    return new MockPaymentProvider().refund(providerPaymentId, amount);
  }
}

// ─── Factory ─────────────────────────────────────────────────
let _provider: PaymentProvider | null = null;

export function getPaymentProvider(): PaymentProvider {
  if (_provider) return _provider;

  const providerType = process.env.PAYMENT_PROVIDER || 'mock';
  switch (providerType) {
    case 'stripe':
      _provider = new StripePaymentProvider();
      break;
    case 'mock':
    default:
      _provider = new MockPaymentProvider();
  }

  return _provider;
}

// ─── Idempotency ─────────────────────────────────────────────
const processedKeys = new Map<string, { result: unknown; expiresAt: number }>();

export function checkIdempotency(key: string): unknown | null {
  const entry = processedKeys.get(key);
  if (entry && entry.expiresAt > Date.now()) {
    return entry.result;
  }
  processedKeys.delete(key);
  return null;
}

export function setIdempotency(key: string, result: unknown, ttlMs: number = 86400000): void {
  processedKeys.set(key, { result, expiresAt: Date.now() + ttlMs });
}
