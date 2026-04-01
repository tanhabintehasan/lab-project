import { NextRequest } from 'next/server';
import { z } from 'zod';
import { prisma } from '@/lib/db';
import { successResponse, errorResponse, withAuth } from '@/lib/api-helpers';
import { labReportCreateSchema } from '@/lib/validations';
import { generateReportNo } from '@/lib/utils';
import { JWTPayload } from '@/lib/auth';

const handler = async (request: NextRequest, user: JWTPayload) => {
  try {
    const body = await request.json();
    const data = labReportCreateSchema.parse(body);
    
    // Verify order is assigned to this lab
    const labUser = await prisma.labUser.findUnique({ where: { userId: user.userId } });
    const order = await prisma.order.findUnique({ where: { id: data.orderId } });
    if (!order || !labUser || order.assignedLabId !== labUser.labId) {
      return errorResponse('无权为此订单创建报告', 403);
    }
    
    const report = await prisma.report.create({
      data: {
        reportNo: generateReportNo(),
        orderId: data.orderId,
        title: data.title,
        summaryZh: data.summaryZh,
        summaryEn: data.summaryEn,
        fileUrl: data.fileUrl,
        status: 'DRAFT',
      },
    });
    await prisma.auditLog.create({
      data: { userId: user.userId, action: 'LAB_CREATE_REPORT', entity: 'Report', entityId: report.id },
    });
    return successResponse(report, 201);
  } catch (error) {
    if (error instanceof z.ZodError) return errorResponse(error.issues[0]?.message || '参数无效', 400);
    return errorResponse('创建失败', 500);
  }
};

export const POST = withAuth(handler, ['LAB_PARTNER']);
