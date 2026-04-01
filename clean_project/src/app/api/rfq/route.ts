import { RFQStatus, Prisma } from '@prisma/client';
import { NextRequest } from 'next/server';
import { z } from 'zod';
import { prisma } from '@/lib/db';
import { successResponse, errorResponse, paginatedResponse, getPaginationParams, getAuthUser } from '@/lib/api-helpers';
import { generateRFQNo } from '@/lib/utils';

const createRFQSchema = z.object({
  title: z.string().min(1, '请输入需求标题'),
  category: z.string().optional(),
  material: z.string().optional(),
  industry: z.string().optional(),
  quantity: z.string().optional(),
  requirements: z.string().optional(),
  deadline: z.string().optional(),
  contactName: z.string().optional(),
  contactPhone: z.string().optional(),
  contactEmail: z.string().optional(),
  attachments: z.array(z.object({
    url: z.string(),
    fileName: z.string(),
  })).optional(),
});

export async function GET(request: NextRequest) {
  const user = await getAuthUser(request);
  if (!user) return errorResponse('未授权', 401);

  try {
    const { page, pageSize, skip } = getPaginationParams(request);
    const url = new URL(request.url);
    const status = url.searchParams.get('status');

    const where: Prisma.RFQRequestWhereInput = {};
    if (user.role === 'CUSTOMER' || user.role === 'ENTERPRISE_MEMBER') {
      where.userId = user.userId;
    }
    if (status && (Object.values(RFQStatus) as string[]).includes(status)) where.status = status as RFQStatus;

    const [rfqs, total] = await Promise.all([
      prisma.rFQRequest.findMany({
        where,
        include: {
          user: { select: { name: true, email: true } },
          files: true,
          quotations: { select: { id: true, status: true, totalAmount: true } },
          _count: { select: { messages: true } },
        },
        orderBy: { createdAt: 'desc' },
        skip,
        take: pageSize,
      }),
      prisma.rFQRequest.count({ where }),
    ]);

    return paginatedResponse(rfqs, total, page, pageSize);
  } catch (error) {
    console.error('RFQ fetch error:', error);
    return errorResponse('获取需求列表失败', 500);
  }
}

export async function POST(request: NextRequest) {
  const user = await getAuthUser(request);
  if (!user) return errorResponse('未授权', 401);

  try {
    const body = await request.json();
    const data = createRFQSchema.parse(body);

    const rfq = await prisma.$transaction(async (tx) => {
      // Create RFQ
      const newRFQ = await tx.rFQRequest.create({
        data: {
          requestNo: generateRFQNo(),
          userId: user.userId,
          title: data.title,
          materialDesc: data.material,
          productType: data.category,
          testingTarget: data.industry,
          quantity: data.quantity,
          deadline: data.deadline ? new Date(data.deadline) : undefined,
          notes: data.requirements,
          status: 'SUBMITTED',
        },
      });

      // Create file records if any
      if (data.attachments && data.attachments.length > 0) {
        await tx.rFQFile.createMany({
          data: data.attachments.map(att => ({
            rfqId: newRFQ.id,
            fileName: att.fileName,
            fileUrl: att.url,
            fileType: att.fileName.split('.').pop() || 'unknown',
            fileSize: 0,
            version: 1,
          })),
        });
      }

      // Create notification
      await tx.notification.create({
        data: {
          userId: user.userId,
          type: 'QUOTATION',
          titleZh: '需求提交成功',
          titleEn: 'Request Submitted',
          contentZh: `您的检测需求 ${newRFQ.requestNo} 已提交，我们将尽快为您处理。`,
          contentEn: `Your testing request ${newRFQ.requestNo} has been submitted.`,
          link: `/dashboard/quotations`,
        },
      });

      return newRFQ;
    });

    return successResponse(rfq, 201);
  } catch (error) {
    if (error instanceof z.ZodError) {
      return errorResponse(error.issues[0]?.message || '请求参数无效', 400);
    }
    console.error('RFQ creation error:', error);
    return errorResponse('提交需求失败', 500);
  }
}
