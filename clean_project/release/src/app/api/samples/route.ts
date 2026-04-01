import { SampleStatus, Prisma } from '@prisma/client';
import { NextRequest } from 'next/server';
import { z } from 'zod';
import { prisma } from '@/lib/db';
import { successResponse, errorResponse, paginatedResponse, getPaginationParams, getAuthUser } from '@/lib/api-helpers';
import { generateSampleNo } from '@/lib/utils';

export async function GET(request: NextRequest) {
  const user = await getAuthUser(request);
  if (!user) return errorResponse('未授权', 401);

  try {
    const { page, pageSize, skip } = getPaginationParams(request);
    const url = new URL(request.url);
    const status = url.searchParams.get('status');
    const orderId = url.searchParams.get('orderId');

    const where: Prisma.SampleWhereInput = {};

    if (user.role === 'CUSTOMER') {
      where.order = { userId: user.userId };
    }

    if (status && (Object.values(SampleStatus) as string[]).includes(status)) where.status = status as SampleStatus;
    if (orderId) where.orderId = orderId;

    const [samples, total] = await Promise.all([
      prisma.sample.findMany({
        where,
        include: {
          order: { select: { orderNo: true, userId: true } },
          timeline: { orderBy: { createdAt: 'desc' }, take: 5 },
          photos: true,
        },
        orderBy: { createdAt: 'desc' },
        skip,
        take: pageSize,
      }),
      prisma.sample.count({ where }),
    ]);

    return paginatedResponse(samples, total, page, pageSize);
  } catch (error) {
    console.error('Samples fetch error:', error);
    return errorResponse('获取样品列表失败', 500);
  }
}

const createSampleSchema = z.object({
  orderId: z.string(),
  name: z.string().min(1),
  description: z.string().optional(),
  materialType: z.string().optional(),
  quantity: z.string().optional(),
});

export async function POST(request: NextRequest) {
  const user = await getAuthUser(request);
  if (!user) return errorResponse('未授权', 401);

  try {
    const body = await request.json();
    const data = createSampleSchema.parse(body);

    const sample = await prisma.sample.create({
      data: {
        sampleNo: generateSampleNo(),
        orderId: data.orderId,
        name: data.name,
        description: data.description,
        materialType: data.materialType,
        quantity: data.quantity,
        timeline: {
          create: {
            status: 'PENDING_SUBMISSION',
            title: '样品已登记',
            description: '等待客户寄送样品',
          },
        },
      },
    });

    return successResponse(sample, 201);
  } catch (error) {
    if (error instanceof z.ZodError) {
      return errorResponse(error.issues[0]?.message || '请求参数无效', 400);
    }
    return errorResponse('创建样品记录失败', 500);
  }
}
