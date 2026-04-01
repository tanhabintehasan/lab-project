import { NextRequest } from 'next/server';
import { z } from 'zod';
import { prisma } from '@/lib/db';
import { successResponse, errorResponse, getAuthUser } from '@/lib/api-helpers';
import { quotationActionSchema } from '@/lib/validations';

export async function PATCH(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const user = await getAuthUser(request);
  if (!user) return errorResponse('未授权', 401);
  const { id } = await params;
  try {
    const quotation = await prisma.quotation.findFirst({ where: { id, userId: user.userId } });
    if (!quotation) return errorResponse('报价不存在', 404);
    if (quotation.status !== 'SENT' && quotation.status !== 'VIEWED') {
      return errorResponse('此报价不可操作', 400);
    }
    const body = await request.json();
    const { action } = quotationActionSchema.parse(body);
    const updated = await prisma.quotation.update({
      where: { id },
      data: { status: action === 'accept' ? 'ACCEPTED' : 'REJECTED' },
    });
    return successResponse(updated);
  } catch (error) {
    if (error instanceof z.ZodError) return errorResponse(error.issues[0]?.message || '参数无效', 400);
    return errorResponse('操作失败', 500);
  }
}
