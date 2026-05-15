import { NextRequest } from 'next/server';
import { z } from 'zod';
import { prisma } from '@/lib/db';
import {
  withAdminApi,
  apiSuccess,
  apiError,
  apiValidationError,
  logAdminAudit,
} from '@/lib/admin-api';
import { JWTPayload } from '@/lib/auth';

export const runtime = 'nodejs';

// ─── Validation ──────────────────────────────────────────────

const reorderItemSchema = z.object({
  id: z.string().cuid(),
  sortOrder: z.number().int(),
});

const reorderBodySchema = z.object({
  items: z.array(reorderItemSchema).min(1),
});

function formatZodIssues(error: z.ZodError): Record<string, string[]> {
  const map: Record<string, string[]> = {};
  for (const issue of error.issues) {
    const path = issue.path.join('.') || 'root';
    if (!map[path]) map[path] = [];
    map[path].push(issue.message);
  }
  return map;
}

// ─── PATCH ───────────────────────────────────────────────────

const handlePatch = async (request: NextRequest, user: JWTPayload) => {
  const body = await request.json();

  let data: z.infer<typeof reorderBodySchema>;
  try {
    data = reorderBodySchema.parse(body);
  } catch (err) {
    if (err instanceof z.ZodError) {
      return apiValidationError('请求参数错误', formatZodIssues(err));
    }
    throw err;
  }

  const ids = data.items.map((i) => i.id);

  // Verify all categories exist
  const existing = await prisma.serviceCategory.findMany({
    where: { id: { in: ids } },
    select: { id: true },
  });

  if (existing.length !== ids.length) {
    return apiError('部分分类不存在，请刷新页面后重试', 400);
  }

  // Transactionally update sortOrder
  await prisma.$transaction(
    data.items.map((item) =>
      prisma.serviceCategory.update({
        where: { id: item.id },
        data: { sortOrder: item.sortOrder },
      })
    )
  );

  await logAdminAudit({
    userId: user.userId,
    action: 'ADMIN_REORDER_SERVICE_CATEGORIES',
    entity: 'ServiceCategory',
    entityId: ids.join(','),
    details: { count: data.items.length, items: data.items },
  });

  return apiSuccess({ updated: data.items.length });
};

export const PATCH = withAdminApi(handlePatch, { roles: ['SUPER_ADMIN'] });
