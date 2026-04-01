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
const ADMIN_NOTE_PREFIX = '[ADMIN_NOTE]';

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
  adminNote?: string;
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

  const parts = [`${META_PREFIX}${JSON.stringify(meta)}`];

  if (input.adminNote?.trim()) {
    parts.push(`${ADMIN_NOTE_PREFIX}${input.adminNote.trim()}`);
  }

  if (input.requirements?.trim()) {
    parts.push(input.requirements.trim());
  }

  return parts.join('\n').trim();
}

function parseNotes(notes?: string | null): {
  cleanRequirements: string;
  adminNote: string;
  meta: ParsedMeta;
} {
  if (!notes) {
    return {
      cleanRequirements: '',
      adminNote: '',
      meta: { requestType: 'RFQ' },
    };
  }

  const lines = notes.split('\n');
  let meta: ParsedMeta = { requestType: 'RFQ' };
  let adminNote = '';
  const contentLines: string[] = [];

  for (const line of lines) {
    if (line.startsWith(META_PREFIX)) {
      try {
        const parsed = JSON.parse(line.replace(META_PREFIX, '')) as ParsedMeta;
        meta = {
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
        };
      } catch {
        // ignore broken meta
      }
      continue;
    }

    if (line.startsWith(ADMIN_NOTE_PREFIX)) {
      adminNote = line.replace(ADMIN_NOTE_PREFIX, '').trim();
      continue;
    }

    contentLines.push(line);
  }

  return {
    cleanRequirements: contentLines.join('\n').trim(),
    adminNote,
    meta,
  };
}

function serializeRFQ(rfq: any) {
  const { cleanRequirements, adminNote, meta } = parseNotes(rfq.notes);

  return {
    ...rfq,
    requestType: meta.requestType || 'RFQ',
    requirements: cleanRequirements,
    adminNote,
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

function buildRequestTypeFilter(requestType: string | null): Prisma.RFQRequestWhereInput | null {
  if (requestType === 'CUSTOM_TESTING') {
    return {
      notes: {
        contains: `${META_PREFIX}{"requestType":"CUSTOM_TESTING"`,
      },
    };
  }

  if (requestType === 'RFQ') {
    return {
      OR: [
        { notes: null },
        { notes: { equals: '' } },
        {
          NOT: {
            notes: {
              contains: `${META_PREFIX}{"requestType":"CUSTOM_TESTING"`,
            },
          },
        },
      ],
    };
  }

  return null;
}

export async function GET(request: NextRequest) {
  const user = await getAuthUser(request);
  if (!user) return errorResponse('未授权', 401);

  try {
    const { page, pageSize, skip } = getPaginationParams(request);
    const url = new URL(request.url);

    const status = url.searchParams.get('status');
    const requestType = url.searchParams.get('requestType');
    const q = url.searchParams.get('q')?.trim();

    const andConditions: Prisma.RFQRequestWhereInput[] = [];

    if (user.role === 'CUSTOMER' || user.role === 'ENTERPRISE_MEMBER') {
      andConditions.push({ userId: user.userId });
    }

    if (status && (Object.values(RFQStatus) as string[]).includes(status)) {
      andConditions.push({ status: status as RFQStatus });
    }

    const requestTypeFilter = buildRequestTypeFilter(requestType);
    if (requestTypeFilter) {
      andConditions.push(requestTypeFilter);
    }

    if (q) {
      andConditions.push({
        OR: [
          { requestNo: { contains: q, mode: 'insensitive' } },
          { title: { contains: q, mode: 'insensitive' } },
          { materialDesc: { contains: q, mode: 'insensitive' } },
          { productType: { contains: q, mode: 'insensitive' } },
          { testingTarget: { contains: q, mode: 'insensitive' } },
          { notes: { contains: q, mode: 'insensitive' } },
          { user: { name: { contains: q, mode: 'insensitive' } } },
          { user: { email: { contains: q, mode: 'insensitive' } } },
        ],
      });
    }

    const where: Prisma.RFQRequestWhereInput =
      andConditions.length > 0 ? { AND: andConditions } : {};

    const [rfqs, total] = await Promise.all([
      prisma.rFQRequest.findMany({
        where,
        include: {
          user: { select: { id: true, name: true, email: true } },
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