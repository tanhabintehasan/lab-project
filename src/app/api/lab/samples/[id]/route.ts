import { NextRequest } from 'next/server';
import { z } from 'zod';
import { prisma } from '@/lib/db';
import { successResponse, errorResponse, withAuth } from '@/lib/api-helpers';
import { labSampleUpdateSchema } from '@/lib/validations';
import { JWTPayload } from '@/lib/auth';

const handler = async (request: NextRequest, user: JWTPayload) => {
  const url = new URL(request.url);
  const id = url.pathname.split('/').slice(-1)[0]!;
  try {
    const body = await request.json();
    const data = labSampleUpdateSchema.parse(body);
    
    const sample = await prisma.sample.findUnique({
      where: { id },
      include: { order: { select: { assignedLabId: true } } },
    });
    if (!sample) return errorResponse('样品不存在', 404);
    
    // Verify lab assignment
    const labUser = await prisma.labUser.findUnique({ where: { userId: user.userId } });
    if (!labUser || sample.order.assignedLabId !== labUser.labId) {
      return errorResponse('无权修改此样品', 403);
    }
    
    const updated = await prisma.sample.update({
      where: { id },
      data: {
        status: data.status,
        ...(data.status === 'RECEIVED' ? { receivedAt: new Date(), receivedBy: user.email } : {}),
      },
    });
    await prisma.sampleTimeline.create({
      data: { sampleId: id, status: data.status, title: `样品状态: ${data.status}`, operator: user.email },
    });
    await prisma.auditLog.create({
      data: { userId: user.userId, action: 'LAB_UPDATE_SAMPLE', entity: 'Sample', entityId: id, details: { status: data.status } },
    });
    return successResponse(updated);
  } catch (error) {
    if (error instanceof z.ZodError) return errorResponse(error.issues[0]?.message || '参数无效', 400);
    return errorResponse('更新失败', 500);
  }
};

export const PATCH = withAuth(handler, ['LAB_PARTNER']);
