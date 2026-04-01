import { NextRequest } from 'next/server';
import { Prisma } from '@prisma/client';
import { z } from 'zod';
import { prisma } from '@/lib/db';
import { successResponse, errorResponse } from '@/lib/api-helpers';
import { contactSchema } from '@/lib/validations';
import { rateLimit, getRateLimitKey } from '@/lib/rate-limit';

export async function POST(request: NextRequest) {
  const rlKey = getRateLimitKey(request, 'contact');
  const rl = rateLimit(rlKey, 3, 60_000);
  if (!rl.ok) return errorResponse('请求过于频繁', 429);

  try {
    const body = await request.json();
    const data = contactSchema.parse(body);

    await prisma.auditLog.create({
      data: {
        action: 'CONTACT_FORM',
        entity: 'Contact',
        details: JSON.parse(JSON.stringify(data)) as Prisma.InputJsonValue,
        ipAddress: request.headers.get('x-forwarded-for') || 'unknown',
      },
    });

    return successResponse({ message: '提交成功，我们会尽快与您联系' });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return errorResponse(error.issues[0]?.message || '参数无效', 400);
    }
    return errorResponse('提交失败', 500);
  }
}