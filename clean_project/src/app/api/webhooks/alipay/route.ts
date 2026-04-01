/**
 * Alipay Webhook Handler
 * POST /api/webhooks/alipay
 */

import { NextRequest, NextResponse } from 'next/server';
import { processWebhook } from '@/lib/services/webhook.service';
import { getPaymentProviderByType } from '@/lib/services/payment-config.service';
import { PaymentProviderType } from '@prisma/client';

export async function POST(request: NextRequest) {
  try {
    // Get form-urlencoded body
    const body = await request.text();
    
    // Parse form data to get signature
    const params = new URLSearchParams(body);
    const signature = params.get('sign') || '';
    
    if (!signature) {
      return NextResponse.json(
        { success: false, message: 'Missing signature' },
        { status: 400 }
      );
    }

    // Get headers
    const headers: Record<string, string> = {};
    request.headers.forEach((value, key) => {
      headers[key.toLowerCase()] = value;
    });

    // Get Alipay provider
    const provider = await getPaymentProviderByType(PaymentProviderType.ALIPAY);
    
    if (!provider) {
      console.error('Alipay provider not configured');
      return NextResponse.json(
        { success: false, message: 'Provider not configured' },
        { status: 500 }
      );
    }

    // Process webhook
    const result = await processWebhook({
      providerId: provider.id,
      body,
      signature,
      headers
    });

    if (!result.success) {
      console.error('Webhook processing failed:', result.message);
      
      // Return success="true" if it's a duplicate or non-retryable error
      // Alipay expects "success" for idempotent responses
      if (!result.shouldRetry || result.message.includes('Already processed')) {
        return new NextResponse('success', {
          status: 200,
          headers: { 'Content-Type': 'text/plain' }
        });
      }
      
      return new NextResponse('fail', {
        status: 500,
        headers: { 'Content-Type': 'text/plain' }
      });
    }

    // Return success response in Alipay format (plain text "success")
    return new NextResponse('success', {
      status: 200,
      headers: { 'Content-Type': 'text/plain' }
    });
  } catch (error) {
    console.error('Alipay webhook error:', error);
    
    return new NextResponse('fail', {
      status: 500,
      headers: { 'Content-Type': 'text/plain' }
    });
  }
}
