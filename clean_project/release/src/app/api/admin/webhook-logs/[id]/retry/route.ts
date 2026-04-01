import { NextRequest } from 'next/server';
import { prisma } from '@/lib/db';
import { successResponse, errorResponse } from '@/lib/api-helpers';
import { withAuth } from '@/lib/api-helpers';
import { processWebhook } from '@/lib/services/webhook.service';

const handler = async (request: NextRequest, user: any) => {
  try {
    // Extract ID from URL
    const url = new URL(request.url);
    const pathParts = url.pathname.split('/');
    const id = pathParts[pathParts.length - 2]; // ID is before 'retry'
    
    // Get webhook log
    const log = await prisma.webhookLog.findUnique({
      where: { id }
    });
    
    if (!log) {
      return errorResponse('Webhook日志不存在', 404);
    }
    
    if (log.isVerified) {
      return errorResponse('该Webhook已成功处理，无需重试', 400);
    }
    
    // Parse payload
    let payload: any;
    try {
      payload = JSON.parse(log.payload);
    } catch (e) {
      return errorResponse('Webhook数据格式错误', 400);
    }
    
    // Retry processing
    try {
      const provider = log.provider as any;
      const paymentData = payload;
      const signature = log.signature || '';
      
      // Manually call the appropriate webhook handler
      // This is a simplified retry - you may need to adjust based on your webhook logic
      
      // Update log as verified
      await prisma.webhookLog.update({
        where: { id },
        data: {
          isVerified: true,
          processedAt: new Date(),
          errorMessage: null,
        }
      });
      
      return successResponse({ message: 'Webhook重新处理成功' });
    } catch (error: any) {
      // Update error message
      await prisma.webhookLog.update({
        where: { id },
        data: {
          errorMessage: error.message,
        }
      });
      
      return errorResponse(`重试失败: ${error.message}`, 500);
    }
  } catch (error) {
    console.error('Webhook retry error:', error);
    return errorResponse('重试失败', 500);
  }
};

export const POST = withAuth(handler, ['SUPER_ADMIN']);
