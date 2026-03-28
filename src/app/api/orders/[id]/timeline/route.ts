import { NextRequest } from 'next/server';
import { z } from 'zod';
import { prisma } from '@/lib/db';
import { successResponse, errorResponse, withAuth } from '@/lib/api-helpers';
import { JWTPayload } from '@/lib/auth';

const timelineSchema = z.object({
  status: z.string(),
  title: z.string(),
  description: z.string().optional(),
});

const handler = async (request: NextRequest, user: JWTPayload) => {
  try {
    const url = new URL(request.url);
    const pathParts = url.pathname.split('/');
    const orderId = pathParts[pathParts.length - 2];

    const body = await request.json();
    const data = timelineSchema.parse(body);

    // Check order exists and user has access
    const order = await prisma.order.findUnique({
      where: { id: orderId },
    });

    if (!order) return errorResponse('订单不存在', 404);

    if (user.role !== 'SUPER_ADMIN' && user.role !== 'LAB_PARTNER' && order.userId !== user.userId) {
      return errorResponse('权限不足', 403);
    }

    // Create timeline entry
    const timeline = await prisma.orderTimeline.create({
      data: {
        orderId,
        status: data.status,
        title: data.title,
        description: data.description,
        operator: user.userId,
      },
    });

    return successResponse({ timeline }, 201);
  } catch (error) {
    if (error instanceof z.ZodError) {
      return errorResponse(error.issues[0]?.message || '参数无效', 400);
    }
    console.error('Timeline create error:', error);
    return errorResponse('添加记录失败', 500);
  }
};

export const POST = withAuth(handler, ['SUPER_ADMIN', 'LAB_PARTNER']);
