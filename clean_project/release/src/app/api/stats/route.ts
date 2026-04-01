import { NextRequest } from 'next/server';
import { prisma } from '@/lib/db';
import { successResponse, errorResponse } from '@/lib/api-helpers';

export async function GET(request: NextRequest) {
  try {
    const [serviceCount, labCount, orderCount, reportCount, userCount] = await Promise.all([
      prisma.testingService.count({ where: { isActive: true } }),
      prisma.laboratory.count({ where: { status: 'ACTIVE' } }),
      prisma.order.count(),
      prisma.report.count(),
      prisma.user.count(),
    ]);

    return successResponse({
      services: serviceCount,
      labs: labCount,
      orders: orderCount,
      reports: reportCount,
      users: userCount,
    });
  } catch (error) {
    console.error('Stats fetch error:', error);
    return errorResponse('获取统计数据失败', 500);
  }
}
