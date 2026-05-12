import { NextRequest } from 'next/server';
import { z } from 'zod';
import { prisma } from '@/lib/db';
import { successResponse, errorResponse, getAuthUser } from '@/lib/api-helpers';
import { addressSchema } from '@/lib/validations';

export async function PUT(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const user = await getAuthUser(request);
  if (!user) return errorResponse('未授权', 401);
  const { id } = await params;
  try {
    const existing = await prisma.address.findFirst({ where: { id, userId: user.userId } });
    if (!existing) return errorResponse('地址不存在', 404);
    const body = await request.json();
    const data = addressSchema.partial().parse(body);
    if (data.isDefault) {
      await prisma.address.updateMany({ where: { userId: user.userId }, data: { isDefault: false } });
    }
    const updated = await prisma.address.update({ where: { id }, data });
    return successResponse(updated);
  } catch (error) {
    if (error instanceof z.ZodError) return errorResponse(error.issues[0]?.message || '参数无效', 400);
    return errorResponse('更新失败', 500);
  }
}

export async function DELETE(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const user = await getAuthUser(request);
  if (!user) return errorResponse('未授权', 401);
  const { id } = await params;
  try {
    const existing = await prisma.address.findFirst({ where: { id, userId: user.userId } });
    if (!existing) return errorResponse('地址不存在', 404);
    await prisma.address.delete({ where: { id } });
    return successResponse({ message: '已删除' });
  } catch { return errorResponse('删除失败', 500); }
}
