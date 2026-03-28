import { NextRequest } from 'next/server';
import { Prisma } from '@prisma/client';
import { z } from 'zod';
import { prisma } from '@/lib/db';
import {
  errorResponse,
  getAuthUser,
  getPaginationParams,
  paginatedResponse,
  successResponse,
} from '@/lib/api-helpers';
import { isAdmin } from '@/lib/auth';

export async function GET(request: NextRequest) {
  const user = await getAuthUser(request);
  if (!user) return errorResponse('未授权', 401);

  try {
    const { page, pageSize, skip } = getPaginationParams(request);
    const url = new URL(request.url);
    const status = url.searchParams.get('status') || undefined;

    const where = {
      ...(isAdmin(user.role) ? {} : { userId: user.userId }),
      ...(status ? { status: status as never } : {}),
    };

    const [quotations, total] = await Promise.all([
      prisma.quotation.findMany({
        where,
        include: { rfq: { select: { requestNo: true, title: true } } },
        orderBy: { createdAt: 'desc' },
        skip,
        take: pageSize,
      }),
      prisma.quotation.count({ where }),
    ]);

    return paginatedResponse(quotations, total, page, pageSize);
  } catch {
    return errorResponse('获取失败', 500);
  }
}

const createQuotationSchema = z.object({
  userId: z.string().cuid().optional(),
  rfqId: z.string().cuid().optional().nullable(),
  title: z.string().min(1).max(200),
  items: z.array(z.record(z.unknown())).default([]),
  totalAmount: z.number().positive(),
  validUntil: z.string().optional().nullable(),
  notes: z.string().max(5000).optional().nullable(),
});

export async function POST(request: NextRequest) {
  const user = await getAuthUser(request);
  if (!user) return errorResponse('未授权', 401);

  try {
    const body = await request.json();
    const data = createQuotationSchema.parse(body);

    let targetUserId = user.userId;
    if (data.userId && data.userId !== user.userId) {
      if (!isAdmin(user.role)) {
        return errorResponse('无权为其他用户创建报价', 403);
      }
      targetUserId = data.userId;
    }

    const quotation = await prisma.quotation.create({
      data: {
        quotationNo: `QT${Date.now().toString(36).toUpperCase()}`,
        userId: targetUserId,
        rfqId: data.rfqId || null,
        title: data.title,
        items: JSON.parse(JSON.stringify(data.items)) as Prisma.InputJsonValue,
        totalAmount: data.totalAmount,
        validUntil: data.validUntil ? new Date(data.validUntil) : null,
        notes: data.notes,
        status: 'SENT',
      },
    });

    await prisma.auditLog.create({
      data: {
        userId: user.userId,
        action: 'CREATE_QUOTATION',
        entity: 'Quotation',
        entityId: quotation.id,
        details: JSON.parse(
          JSON.stringify({ targetUserId, rfqId: data.rfqId })
        ) as Prisma.InputJsonValue,
      },
    });

    return successResponse(quotation, 201);
  } catch (error) {
    if (error instanceof z.ZodError) {
      return errorResponse(error.issues[0]?.message || '参数无效', 400);
    }
    return errorResponse('创建失败', 500);
  }
}