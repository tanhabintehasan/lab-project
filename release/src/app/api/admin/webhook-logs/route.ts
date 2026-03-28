import { NextRequest } from 'next/server';
import { prisma } from '@/lib/db';
import { successResponse, errorResponse } from '@/lib/api-helpers';
import { withAuth } from '@/lib/api-helpers';

const handler = async (request: NextRequest) => {
  try {
    const { searchParams } = new URL(request.url);
    
    // Pagination
    const page = Number(searchParams.get('page')) || 1;
    const pageSize = Number(searchParams.get('pageSize')) || 20;
    const skip = (page - 1) * pageSize;
    
    // Filters
    const provider = searchParams.get('provider');
    const isVerified = searchParams.get('isVerified');
    const dateFrom = searchParams.get('dateFrom');
    const dateTo = searchParams.get('dateTo');
    
    // Build where clause
    const where: any = {};
    
    if (provider) {
      where.provider = provider;
    }
    
    if (isVerified !== null && isVerified !== undefined && isVerified !== '') {
      where.isVerified = isVerified === 'true';
    }
    
    if (dateFrom || dateTo) {
      where.createdAt = {};
      if (dateFrom) {
        where.createdAt.gte = new Date(dateFrom);
      }
      if (dateTo) {
        where.createdAt.lte = new Date(dateTo);
      }
    }
    
    // Fetch logs and total count
    const [logs, totalCount] = await Promise.all([
      prisma.webhookLog.findMany({
        where,
        orderBy: { createdAt: 'desc' },
        skip,
        take: pageSize,
        select: {
          id: true,
          provider: true,
          eventType: true,
          isVerified: true,
          processedAt: true,
          errorMessage: true,
          relatedEntity: true,
          relatedId: true,
          createdAt: true,
          // Don't send full payload to client for performance
        }
      }),
      prisma.webhookLog.count({ where })
    ]);
    
    return successResponse({
      logs,
      pagination: {
        page,
        pageSize,
        totalCount,
        totalPages: Math.ceil(totalCount / pageSize),
      }
    });
  } catch (error) {
    console.error('Webhook logs fetch error:', error);
    return errorResponse('获取Webhook日志失败', 500);
  }
};

export const GET = withAuth(handler, ['SUPER_ADMIN', 'FINANCE_ADMIN']);
