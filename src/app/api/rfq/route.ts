import { RFQStatus, Prisma } from '@prisma/client';
import { NextRequest } from 'next/server';
import { z } from 'zod';
import { prisma } from '@/lib/db';
import {
  successResponse,
  errorResponse,
  paginatedResponse,
  getPaginationParams,
  getAuthUser,
} from '@/lib/api-helpers';
import { generateRFQNo } from '@/lib/utils';

const requestTypeEnum = z.enum(['RFQ', 'CUSTOM_TESTING']);
const expectedOutputEnum = z.enum(['REPORT', 'REPORT_CERTIFICATE']);
const urgencyEnum = z.enum(['NORMAL', 'URGENT', 'VERY_URGENT']);

const createRFQSchema = z.object({
  requestType: requestTypeEnum.optional().default('RFQ'),
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

  // custom testing fields
  sampleName: z.string().optional(),
  sampleCondition: z.string().optional(),
  testPurpose: z.string().optional(),
  testingStandard: z.string().optional(),
  expectedOutput: expectedOutputEnum.optional(),
  urgency: urgencyEnum.optional(),

  attachments: z
    .array(
      z.object({
        url: z.string(),
        fileName: z.string(),
      })
    )
    .optional(),
});

const META_PREFIX = '[META]';

type ParsedMeta = {
  requestType: 'RFQ' | 'CUSTOM_TESTING';
  sampleName?: string;
  sampleCondition?: string;
  testPurpose?: string;
  testingStandard?: string;
  expectedOutput?: 'REPORT' | 'REPORT_CERTIFICATE';
  urgency?: 'NORMAL' | 'URGENT' | 'VERY_URGENT';
  contactName?: string;
  contactPhone?: string;
  contactEmail?: string;
};

function buildNotesWithMeta(input: {
  requestType: 'RFQ' | 'CUSTOM_TESTING';
  requirements?: string;
  sampleName?: string;
  sampleCondition?: string;
  testPurpose?: string;
  testingStandard?: string;
  expectedOutput?: 'REPORT' | 'REPORT_CERTIFICATE';
  urgency?: 'NORMAL' | 'URGENT' | 'VERY_URGENT';
  contactName?: string;
  contactPhone?: string;
  contactEmail?: string;
}) {
  const meta: ParsedMeta = {
    requestType: input.requestType,
    sampleName: input.sampleName || undefined,
    sampleCondition: input.sampleCondition || undefined,
    testPurpose: input.testPurpose || undefined,
    testingStandard: input.testingStandard || undefined,
    expectedOutput: input.expectedOutput,
    urgency: input.urgency,
    contactName: input.contactName || undefined,
    contactPhone: input.contactPhone || undefined,
    contactEmail: input.contactEmail || undefined,
  };

  return `${META_PREFIX}${JSON.stringify(meta)}\n${input.requirements || ''}`.trim();
}

function parseNotes(notes?: string | null): {
  cleanRequirements: string;
  meta: ParsedMeta;
} {
  if (!notes) {
    return {
      cleanRequirements: '',
      meta: { requestType: 'RFQ' },
    };
  }

  const firstLineBreak = notes.indexOf('\n');
  const firstLine = firstLineBreak === -1 ? notes : notes.slice(0, firstLineBreak);

  if (!firstLine.startsWith(META_PREFIX)) {
    return {
      cleanRequirements: notes,
      meta: { requestType: 'RFQ' },
    };
  }

  try {
    const metaJson = firstLine.replace(META_PREFIX, '');
    const parsed = JSON.parse(metaJson) as ParsedMeta;
    const cleanRequirements = firstLineBreak === -1 ? '' : notes.slice(firstLineBreak + 1).trim();

    return {
      cleanRequirements,
      meta: {
        requestType: parsed.requestType || 'RFQ',
        sampleName: parsed.sampleName,
        sampleCondition: parsed.sampleCondition,
        testPurpose: parsed.testPurpose,
        testingStandard: parsed.testingStandard,
        expectedOutput: parsed.expectedOutput,
        urgency: parsed.urgency,
        contactName: parsed.contactName,
        contactPhone: parsed.contactPhone,
        contactEmail: parsed.contactEmail,
      },
    };
  } catch {
    return {
      cleanRequirements: notes,
      meta: { requestType: 'RFQ' },
    };
  }
}

function serializeRFQ(rfq: any) {
  const { cleanRequirements, meta } = parseNotes(rfq.notes);

  return {
    ...rfq,
    requestType: meta.requestType || 'RFQ',
    requirements: cleanRequirements,
    sampleName: meta.sampleName || '',
    sampleCondition: meta.sampleCondition || '',
    testPurpose: meta.testPurpose || '',
    testingStandard: meta.testingStandard || '',
    expectedOutput: meta.expectedOutput || '',
    urgency: meta.urgency || '',
    contactName: meta.contactName || '',
    contactPhone: meta.contactPhone || '',
    contactEmail: meta.contactEmail || '',
  };
}

export async function GET(request: NextRequest) {
  const user = await getAuthUser(request);
  if (!user) return errorResponse('未授权', 401);

  try {
    const { page, pageSize, skip } = getPaginationParams(request);
    const url = new URL(request.url);
    const status = url.searchParams.get('status');
    const requestType = url.searchParams.get('requestType');

    const where: Prisma.RFQRequestWhereInput = {};

    if (user.role === 'CUSTOMER' || user.role === 'ENTERPRISE_MEMBER') {
      where.userId = user.userId;
    }

    if (status && (Object.values(RFQStatus) as string[]).includes(status)) {
      where.status = status as RFQStatus;
    }

    if (requestType === 'CUSTOM_TESTING') {
      where.notes = {
        contains: `${META_PREFIX}{"requestType":"CUSTOM_TESTING"`,
      };
    }

    if (requestType === 'RFQ') {
      where.OR = [
        { notes: null },
        { notes: { equals: '' } },
        {
          NOT: {
            notes: {
              contains: `${META_PREFIX}{"requestType":"CUSTOM_TESTING"`,
            },
          },
        },
      ];
    }

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

    return paginatedResponse(rfqs.map(serializeRFQ), total, page, pageSize);
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

    const requestTitle =
      data.requestType === 'CUSTOM_TESTING'
        ? `[定制测试] ${data.title}`
        : data.title;

    const rfq = await prisma.$transaction(async (tx) => {
      const newRFQ = await tx.rFQRequest.create({
        data: {
          requestNo: generateRFQNo(),
          userId: user.userId,
          title: requestTitle,
          materialDesc: data.material,
          productType: data.category,
          testingTarget: data.industry,
          quantity: data.quantity,
          deadline: data.deadline ? new Date(data.deadline) : undefined,
          notes: buildNotesWithMeta({
            requestType: data.requestType,
            requirements: data.requirements,
            sampleName: data.sampleName,
            sampleCondition: data.sampleCondition,
            testPurpose: data.testPurpose,
            testingStandard: data.testingStandard,
            expectedOutput: data.expectedOutput,
            urgency: data.urgency,
            contactName: data.contactName,
            contactPhone: data.contactPhone,
            contactEmail: data.contactEmail,
          }),
          status: 'SUBMITTED',
        },
      });

      if (data.attachments && data.attachments.length > 0) {
        await tx.rFQFile.createMany({
          data: data.attachments.map((att) => ({
            rfqId: newRFQ.id,
            fileName: att.fileName,
            fileUrl: att.url,
            fileType: att.fileName.split('.').pop() || 'unknown',
            fileSize: 0,
            version: 1,
          })),
        });
      }

      await tx.notification.create({
        data: {
          userId: user.userId,
          type: 'QUOTATION',
          titleZh: data.requestType === 'CUSTOM_TESTING' ? '定制测试需求提交成功' : '需求提交成功',
          titleEn: data.requestType === 'CUSTOM_TESTING' ? 'Custom Testing Submitted' : 'Request Submitted',
          contentZh:
            data.requestType === 'CUSTOM_TESTING'
              ? `您的定制测试需求 ${newRFQ.requestNo} 已提交，后台将尽快审核并联系您。`
              : `您的检测需求 ${newRFQ.requestNo} 已提交，我们将尽快为您处理。`,
          contentEn:
            data.requestType === 'CUSTOM_TESTING'
              ? `Your custom testing request ${newRFQ.requestNo} has been submitted.`
              : `Your testing request ${newRFQ.requestNo} has been submitted.`,
          link: '/dashboard/quotations',
        },
      });

      return newRFQ;
    });

    return successResponse(serializeRFQ(rfq), 201);
  } catch (error) {
    if (error instanceof z.ZodError) {
      return errorResponse(error.issues[0]?.message || '请求参数无效', 400);
    }

    console.error('RFQ creation error:', error);
    return errorResponse('提交需求失败', 500);
  }
}