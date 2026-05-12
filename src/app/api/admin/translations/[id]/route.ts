import { NextRequest } from 'next/server';
import { prisma } from '@/lib/db';
import { successResponse, errorResponse, withAuth } from '@/lib/api-helpers';
import { JWTPayload } from '@/lib/auth';
import { z } from 'zod';

const updateSchema = z.object({
  value: z.string(),
});

const handler = async (request: NextRequest, user: JWTPayload) => {
  try {
    const url = new URL(request.url);
    const pathParts = url.pathname.split('/');
    const id = pathParts[pathParts.length - 1];

    const body = await request.json();
    const data = updateSchema.parse(body);

    await prisma.translation.update({
      where: { id },
      data: { value: data.value },
    });

    return successResponse({ message: '翻译已更新' });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return errorResponse(error.issues[0]?.message || '参数无效', 400);
    }
    console.error('Translation update error:', error);
    return errorResponse('更新翻译失败', 500);
  }
};

export const PATCH = withAuth(handler, ['SUPER_ADMIN']);
