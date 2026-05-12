import { NextRequest } from 'next/server';
import { z } from 'zod';
import { prisma } from '@/lib/db';
import { successResponse, errorResponse, withAuth } from '@/lib/api-helpers';
import { labOrderUpdateSchema, isValidTransition } from '@/lib/validations';
import { JWTPayload } from '@/lib/auth';

const handler = async (request: NextRequest, user: JWTPayload) => {
  const url = new URL(request.url);
  const id = url.pathname.split('/').slice(-1)[0]!;
  try {
    const body = await request.json();
    const data = labOrderUpdateSchema.parse(body);
    const order = await prisma.order.findUnique({ where: { id } });
    if (!order) return errorResponse('订单不存在', 404);
    
    // Verify this lab partner is assigned
    const labUser = await prisma.labUser.findUnique({ where: { userId: user.userId } });
    if (!labUser || order.assignedLabId !== labUser.labId) {
      return errorResponse('无权修改此订单', 403);
    }
    
    if (!isValidTransition('LAB_PARTNER', order.status, data.status)) {
      return errorResponse(`不允许从 ${order.status} 转为 ${data.status}`, 403);
    }
    
    const updated = await prisma.order.update({ where: { id }, data: { status: data.status } });
    await prisma.orderTimeline.create({
      data: { orderId: id, status: data.status, title: `实验室更新: ${data.status}`, operator: user.email },
    });
    await prisma.auditLog.create({
      data: { userId: user.userId, action: 'LAB_UPDATE_ORDER', entity: 'Order', entityId: id, details: { status: data.status } },
    });
    return successResponse(updated);
  } catch (error) {
    if (error instanceof z.ZodError) return errorResponse(error.issues[0]?.message || '参数无效', 400);
    return errorResponse('更新失败', 500);
  }
};

export const PATCH = withAuth(handler, ['LAB_PARTNER']);
