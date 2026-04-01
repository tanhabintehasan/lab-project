import { NextRequest } from 'next/server';
import { z } from 'zod';
import { prisma } from '@/lib/db';
import { verifyPassword, hashPassword } from '@/lib/auth';
import { successResponse, errorResponse, getAuthUser } from '@/lib/api-helpers';
import { changePasswordSchema } from '@/lib/validations';

export async function PUT(request: NextRequest) {
  const user = await getAuthUser(request);
  if (!user) return errorResponse('未授权', 401);
  try {
    const body = await request.json();
    const data = changePasswordSchema.parse(body);
    const dbUser = await prisma.user.findUnique({ where: { id: user.userId } });
    if (!dbUser) return errorResponse('用户不存在', 404);
    const valid = await verifyPassword(data.oldPassword, dbUser.passwordHash);
    if (!valid) return errorResponse('原密码错误', 400);
    const hash = await hashPassword(data.newPassword);
    await prisma.user.update({ where: { id: user.userId }, data: { passwordHash: hash } });
    await prisma.auditLog.create({
      data: { userId: user.userId, action: 'CHANGE_PASSWORD', entity: 'User', entityId: user.userId },
    });
    return successResponse({ message: '密码已更新' });
  } catch (error) {
    if (error instanceof z.ZodError) return errorResponse(error.issues[0]?.message || '参数无效', 400);
    return errorResponse('更新失败', 500);
  }
}
