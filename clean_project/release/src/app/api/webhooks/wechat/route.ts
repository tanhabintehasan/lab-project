/**
 * WeChat Pay Webhook Handler
 * POST /api/webhooks/wechat
 */

import { NextRequest, NextResponse } from 'next/server';
import { processWebhook } from '@/lib/services/webhook.service';
import { getPaymentProviderByType } from '@/lib/services/payment-config.service';
import { PaymentProviderType } from '@prisma/client';

export async function POST(request: NextRequest) {
  try {
    // Get raw body
    const body = await request.text();
    
    // Get headers
    const headers: Record<string, string> = {};
    request.headers.forEach((value, key) => {
      headers[key.toLowerCase()] = value;
    });

    // Get signature from headers
    const signature = headers['wechatpay-signature'] || '';
    
    if (!signature) {
      return NextResponse.json(
        { code: 'FAIL', message: 'Missing signature' },
        { status: 400 }
      );
    }

    // Get WeChat Pay provider
    const provider = await getPaymentProviderByType(PaymentProviderType.WECHAT_PAY);
    
    if (!provider) {
      console.error('WeChat Pay provider not configured');
      return NextResponse.json(
        { code: 'FAIL', message: 'Provider not configured' },
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
      
      // Return 200 if it's a duplicate or non-retryable error
      if (!result.shouldRetry) {
        return NextResponse.json(
          { code: 'SUCCESS', message: result.message }
        );
      }
      
      return NextResponse.json(
        { code: 'FAIL', message: result.message },
        { status: 500 }
      );
    }

    // Return success response in WeChat Pay format
    return NextResponse.json({
      code: 'SUCCESS',
      message: result.message
    });
  } catch (error) {
    console.error('WeChat Pay webhook error:', error);
    
    return NextResponse.json(
      {
        code: 'FAIL',
        message: error instanceof Error ? error.message : 'Internal server error'
      },
      { status: 500 }
    );
  }
}
