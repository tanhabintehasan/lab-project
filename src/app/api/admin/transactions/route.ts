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
    const status = searchParams.get('status');
    const providerId = searchParams.get('providerId');
    const providerType = searchParams.get('providerType');
    const userId = searchParams.get('userId');
    const orderId = searchParams.get('orderId');
    const transactionId = searchParams.get('transactionId'); // externalNo
    const dateFrom = searchParams.get('dateFrom');
    const dateTo = searchParams.get('dateTo');
    const minAmount = searchParams.get('minAmount');
    const maxAmount = searchParams.get('maxAmount');
    const search = searchParams.get('search'); // Search in orderNo or transactionId
    
    // Build where clause
    const where: any = {};
    
    if (status) {
      where.status = status;
    }
    
    if (providerId) {
      where.providerId = providerId;
    }
    
    if (userId) {
      where.order = { userId };
    }
    
    if (orderId) {
      where.orderId = orderId;
    }
    
    if (transactionId) {
      where.externalNo = { contains: transactionId };
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
    
    if (minAmount || maxAmount) {
      where.amount = {};
      if (minAmount) {
        where.amount.gte = Number(minAmount);
      }
      if (maxAmount) {
        where.amount.lte = Number(maxAmount);
      }
    }
    
    if (search) {
      where.OR = [
        { externalNo: { contains: search, mode: 'insensitive' } },
        { transactionId: { contains: search, mode: 'insensitive' } },
        { order: { orderNo: { contains: search, mode: 'insensitive' } } },
      ];
    }
    
    // Add provider type filter if specified
    if (providerType) {
      where.provider = { type: providerType };
    }
    
    // Fetch payments and total count
    const [payments, totalCount, statusCounts] = await Promise.all([
      prisma.payment.findMany({
        where,
        orderBy: { createdAt: 'desc' },
        skip,
        take: pageSize,
        include: {
          order: {
            select: {
              orderNo: true,
              totalAmount: true,
              user: {
                select: {
                  id: true,
                  name: true,
                  email: true,
                }
              }
            }
          },
          provider: {
            select: {
              id: true,
              name: true,
              type: true,
            }
          }
        }
      }),
      prisma.payment.count({ where }),
      // Get status counts for filters
      prisma.payment.groupBy({
        by: ['status'],
        _count: true,
        where: Object.keys(where).length > 0 && where.status ? 
          { ...where, status: undefined } : where,
      })
    ]);
    
    // Calculate summary stats
    const summary = await prisma.payment.aggregate({
      where,
      _sum: {
        amount: true,
        refundAmount: true,
      },
      _count: true,
    });
    
    return successResponse({
      payments,
      pagination: {
        page,
        pageSize,
        totalCount,
        totalPages: Math.ceil(totalCount / pageSize),
      },
      summary: {
        totalAmount: summary._sum.amount || 0,
        totalRefundAmount: summary._sum.refundAmount || 0,
        totalTransactions: summary._count,
      },
      statusCounts: statusCounts.reduce((acc: any, item: any) => {
        acc[item.status] = item._count;
        return acc;
      }, {}),
    });
  } catch (error) {
    console.error('Transactions fetch error:', error);
    return errorResponse('获取交易记录失败', 500);
  }
};

export const GET = withAuth(handler, ['SUPER_ADMIN', 'FINANCE_ADMIN']);
