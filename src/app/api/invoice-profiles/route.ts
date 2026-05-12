import { NextRequest } from 'next/server';
import { z } from 'zod';
import { prisma } from '@/lib/db';
import { successResponse, errorResponse, getAuthUser } from '@/lib/api-helpers';
import { invoiceProfileSchema } from '@/lib/validations';

export async function GET(request: NextRequest) {
  const user = await getAuthUser(request);
  if (!user) return errorResponse('未授权', 401);
  try {
    const profiles = await prisma.invoiceProfile.findMany({
      where: { userId: user.userId },
      orderBy: [{ isDefault: 'desc' }, { companyName: 'asc' }],
    });
    return successResponse(profiles);
  } catch { return errorResponse('获取失败', 500); }
}

export async function POST(request: NextRequest) {
  const user = await getAuthUser(request);
  if (!user) return errorResponse('未授权', 401);
  try {
    const body = await request.json();
    const data = invoiceProfileSchema.parse(body);
    if (data.isDefault) {
      await prisma.invoiceProfile.updateMany({ where: { userId: user.userId }, data: { isDefault: false } });
    }
    const profile = await prisma.invoiceProfile.create({
      data: { userId: user.userId, ...data, isDefault: data.isDefault || false },
    });
    return successResponse(profile, 201);
  } catch (error) {
    if (error instanceof z.ZodError) return errorResponse(error.issues[0]?.message || '参数无效', 400);
    return errorResponse('创建失败', 500);
  }
}
