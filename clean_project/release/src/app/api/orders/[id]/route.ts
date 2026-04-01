import { NextRequest } from 'next/server';
import { Prisma } from '@prisma/client';
import { z } from 'zod';
import { prisma } from '@/lib/db';
import { successResponse, errorResponse, getAuthUser } from '@/lib/api-helpers';
import { isAdmin } from '@/lib/auth';
import { orderUpdateSchema, isValidTransition } from '@/lib/validations';

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const user = await getAuthUser(request);
  if (!user) return errorResponse('未授权', 401);

  const { id } = await params;

  try {
    const order = await prisma.order.findUnique({
      where: { id },
      include: {
        items: {
          include: {
            service: {
              select: { nameZh: true, slug: true },
            },
          },
        },
        samples: {
          include: {
            timeline: {
              orderBy: { createdAt: 'desc' },
            },
          },
        },
        timeline: {
          orderBy: { createdAt: 'desc' },
        },
        reports: true,
        payments: true,
        address: true,
        lab: {
          select: { nameZh: true, slug: true },
        },
        user: {
          select: { id: true, name: true, email: true },
        },
      },
    });

    if (!order) return errorResponse('订单不存在', 404);

    const isOwner = order.userId === user.userId;
    const isAssignedLab = user.role === 'LAB_PARTNER' && order.assignedLabId !== null;

    if (!isOwner && !isAdmin(user.role) && !isAssignedLab) {
      return errorResponse('无权访问', 403);
    }

    return successResponse(order);
  } catch {
    return errorResponse('获取失败', 500);
  }
}

export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const user = await getAuthUser(request);
  if (!user) return errorResponse('未授权', 401);

  const { id } = await params;

  try {
    const body = await request.json();
    const data = orderUpdateSchema.parse(body);

    const order = await prisma.order.findUnique({
      where: { id },
    });

    if (!order) return errorResponse('订单不存在', 404);

    const isOwner = order.userId === user.userId;
    const isAssignedLab = user.role === 'LAB_PARTNER' && order.assignedLabId !== null;

    if (!isOwner && !isAdmin(user.role) && !isAssignedLab) {
      return errorResponse('无权修改此订单', 403);
    }

    if (data.status) {
      if (!isValidTransition(user.role, order.status, data.status)) {
        return errorResponse(`当前角色不允许从 ${order.status} 转为 ${data.status}`, 403);
      }
    }

    if (data.assignedLabId && !isAdmin(user.role)) {
      return errorResponse('只有管理员可以分配实验室', 403);
    }

    const updateData: Prisma.OrderUncheckedUpdateInput = {};

    if (data.status) {
      updateData.status = data.status;
    }

    if (data.assignedLabId) {
      updateData.assignedLabId = data.assignedLabId;
    }

    const updated = await prisma.order.update({
      where: { id },
      data: updateData,
    });

    if (data.status) {
      await prisma.orderTimeline.create({
        data: {
          orderId: id,
          status: data.status,
          title: `状态更新为 ${data.status}`,
          operator: user.email,
        },
      });
    }

    await prisma.auditLog.create({
      data: {
        userId: user.userId,
        action: 'UPDATE_ORDER',
        entity: 'Order',
        entityId: id,
        details: JSON.parse(JSON.stringify(data)) as Prisma.InputJsonValue,
      },
    });

    return successResponse(updated);
  } catch (error) {
    if (error instanceof z.ZodError) {
      return errorResponse(error.issues[0]?.message || '参数无效', 400);
    }

    return errorResponse('更新失败', 500);
  }
}