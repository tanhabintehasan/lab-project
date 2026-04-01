import { NextRequest } from 'next/server';
import { prisma } from '@/lib/db';
import { successResponse, errorResponse } from '@/lib/api-helpers';
import { withAuth } from '@/lib/api-helpers';

const handler = async (request: NextRequest, user: any) => {
  try {
    // Extract ID from URL
    const url = new URL(request.url);
    const pathParts = url.pathname.split('/');
    const id = pathParts[pathParts.length - 1];
    
    const log = await prisma.webhookLog.findUnique({
      where: { id },
      select: {
        id: true,
        provider: true,
        eventType: true,
        payload: true,
        signature: true,
        isVerified: true,
        processedAt: true,
        errorMessage: true,
        relatedEntity: true,
        relatedId: true,
        createdAt: true,
      }
    });
    
    if (!log) {
      return errorResponse('Webhook日志不存在', 404);
    }
    
    return successResponse(log);
  } catch (error) {
    console.error('Webhook log details fetch error:', error);
    return errorResponse('获取详情失败', 500);
  }
};

export const GET = withAuth(handler, ['SUPER_ADMIN', 'FINANCE_ADMIN']);
