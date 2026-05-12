import { RFQStatus } from '@prisma/client';
import { NextRequest } from 'next/server';
import { z } from 'zod';
import { prisma } from '@/lib/db';
import { successResponse, errorResponse, getAuthUser } from '@/lib/api-helpers';

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

const updateRFQSchema = z.object({
  status: z.nativeEnum(RFQStatus).optional(),
  adminNote: z.string().optional(),
});

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
        meta = JSON.parse(line.replace(META_PREFIX, '')) as ParsedMeta;
      } catch {}
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

function rebuildNotes(input: {
  meta: ParsedMeta;
  cleanRequirements: string;
  adminNote?: string;
}) {
  const parts = [`${META_PREFIX}${JSON.stringify(input.meta)}`];

  if (input.adminNote?.trim()) {
    parts.push(`${ADMIN_NOTE_PREFIX}${input.adminNote.trim()}`);
  }

  if (input.cleanRequirements?.trim()) {
    parts.push(input.cleanRequirements.trim());
  }

  return parts.join('\n').trim();
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

function isAdminRole(role?: string) {
  return !!role && !['CUSTOMER', 'ENTERPRISE_MEMBER'].includes(role);
}

export async function GET(
  request: NextRequest,
  context: { params: Promise<{ id: string }> }
) {
  const user = await getAuthUser(request);
  if (!user) return errorResponse('未授权', 401);

  const { id } = await context.params;

  try {
    const rfq = await prisma.rFQRequest.findUnique({
      where: { id },
      include: {
        user: { select: { id: true, name: true, email: true } },
        files: true,
        quotations: true,
        messages: {
          orderBy: { createdAt: 'desc' },
          take: 20,
        },
      },
    });

    if (!rfq) return errorResponse('需求不存在', 404);

    if (!isAdminRole(user.role) && rfq.userId !== user.userId) {
      return errorResponse('无权限访问', 403);
    }

    return successResponse(serializeRFQ(rfq));
  } catch (error) {
    console.error('RFQ detail fetch error:', error);
    return errorResponse('获取需求详情失败', 500);
  }
}

export async function PATCH(
  request: NextRequest,
  context: { params: Promise<{ id: string }> }
) {
  const user = await getAuthUser(request);
  if (!user) return errorResponse('未授权', 401);

  if (!isAdminRole(user.role)) {
    return errorResponse('仅管理员可操作', 403);
  }

  const { id } = await context.params;

  try {
    const body = await request.json();
    const data = updateRFQSchema.parse(body);

    const existing = await prisma.rFQRequest.findUnique({
      where: { id },
    });

    if (!existing) return errorResponse('需求不存在', 404);

    const parsed = parseNotes(existing.notes);

    const updated = await prisma.rFQRequest.update({
      where: { id },
      data: {
        status: data.status ?? existing.status,
        notes: rebuildNotes({
          meta: parsed.meta,
          cleanRequirements: parsed.cleanRequirements,
          adminNote: data.adminNote ?? parsed.adminNote,
        }),
      },
      include: {
        user: { select: { id: true, name: true, email: true } },
        files: true,
        quotations: true,
      },
    });

    return successResponse(serializeRFQ(updated));
  } catch (error) {
    if (error instanceof z.ZodError) {
      return errorResponse(error.issues[0]?.message || '请求参数无效', 400);
    }

    console.error('RFQ patch error:', error);
    return errorResponse('更新需求失败', 500);
  }
}

export async function DELETE(
  request: NextRequest,
  context: { params: Promise<{ id: string }> }
) {
  const user = await getAuthUser(request);
  if (!user) return errorResponse('未授权', 401);

  if (!isAdminRole(user.role)) {
    return errorResponse('仅管理员可删除', 403);
  }

  const { id } = await context.params;

  try {
    const existing = await prisma.rFQRequest.findUnique({
      where: { id },
      include: {
        files: true,
        quotations: { select: { id: true } },
        messages: { select: { id: true } },
      },
    });

    if (!existing) {
      return errorResponse('需求不存在', 404);
    }

    if (existing.quotations.length > 0) {
      return errorResponse('该需求已有报价，不能删除', 400);
    }

    await prisma.$transaction(async (tx) => {
      await tx.rFQFile.deleteMany({
        where: { rfqId: id },
      });

      await tx.rFQMessage.deleteMany({
        where: { rfqId: id },
      });

      await tx.notification.deleteMany({
        where: {
          userId: existing.userId,
          link: '/dashboard/quotations',
        },
      });

      await tx.rFQRequest.delete({
        where: { id },
      });
    });

    return successResponse({ id, deleted: true });
  } catch (error) {
    console.error('RFQ delete error:', error);
    return errorResponse('删除需求失败', 500);
  }
}
