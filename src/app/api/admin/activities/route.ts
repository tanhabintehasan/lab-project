import { NextRequest } from 'next/server';
import { prisma } from '@/lib/db';
import { successResponse, errorResponse } from '@/lib/api-helpers';
import { withAuth } from '@/lib/api-helpers';

const handler = async (request: NextRequest) => {
  try {
    const { searchParams } = new URL(request.url);
    const type = searchParams.get('type') || 'all'; // payments, refunds, withdrawals, audit
    const limit = Number(searchParams.get('limit')) || 10;

    let data: unknown[] = [];

    switch (type) {
      case 'payments': {
        data = await prisma.payment.findMany({
          take: limit,
          orderBy: { createdAt: 'desc' },
          include: {
            order: {
              select: {
                orderNo: true,
                user: {
                  select: { name: true, email: true }
                }
              }
            }
          }
        });
        break;
      }

      case 'refunds': {
        data = await prisma.payment.findMany({
          where: { status: 'refunded' },
          take: limit,
          orderBy: { refundedAt: 'desc' },
          include: {
            order: {
              select: {
                orderNo: true,
                user: {
                  select: { name: true, email: true }
                }
              }
            }
          }
        });
        break;
      }

      case 'withdrawals': {
        data = await prisma.withdrawalRequest.findMany({
          take: limit,
          orderBy: { createdAt: 'desc' },
          select: {
            id: true,
            amount: true,
            method: true,
            status: true,
            createdAt: true,
            processedAt: true,
            userId: true,
          }
        });
        break;
      }

      case 'audit': {
        data = await prisma.auditLog.findMany({
          take: limit,
          orderBy: { createdAt: 'desc' },
          include: {
            user: {
              select: { name: true, email: true, role: true }
            }
          }
        });
        break;
      }

      case 'webhooks': {
        data = await prisma.webhookLog.findMany({
          where: { isVerified: false },
          take: limit,
          orderBy: { createdAt: 'desc' },
          select: {
            id: true,
            provider: true,
            eventType: true,
            isVerified: true,
            errorMessage: true,
            createdAt: true,
            relatedEntity: true,
            relatedId: true,
          }
        });
        break;
      }

      default: {
        // Return all recent activities
        const [payments, refunds, withdrawals, auditLogs] = await Promise.all([
          prisma.payment.findMany({
            take: 5,
            orderBy: { createdAt: 'desc' },
            include: {
              order: {
                select: {
                  orderNo: true,
                  user: {
                    select: { name: true, email: true }
                  }
                }
              }
            }
          }),
          prisma.payment.findMany({
            where: { status: 'refunded' },
            take: 5,
            orderBy: { refundedAt: 'desc' },
            include: {
              order: {
                select: {
                  orderNo: true,
                  user: {
                    select: { name: true, email: true }
                  }
                }
              }
            }
          }),
          prisma.withdrawalRequest.findMany({
            take: 5,
            orderBy: { createdAt: 'desc' },
          }),
          prisma.auditLog.findMany({
            take: 5,
            orderBy: { createdAt: 'desc' },
            include: {
              user: {
                select: { name: true, email: true, role: true }
              }
            }
          }),
        ]);

        return successResponse({
          payments,
          refunds,
          withdrawals,
          auditLogs,
        });
      }
    }

    return successResponse(data);
  } catch (error) {
    console.error('Recent activities fetch error:', error);
    return errorResponse('获取失败', 500);
  }
};

export const GET = withAuth(handler, ['SUPER_ADMIN', 'FINANCE_ADMIN']);
