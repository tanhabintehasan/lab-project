import { NextRequest } from 'next/server';
import { z } from 'zod';
import { prisma } from '@/lib/db';
import { successResponse, errorResponse, withAuth } from '@/lib/api-helpers';
import { cmsPageSchema } from '@/lib/validations';
import { JWTPayload } from '@/lib/auth';

export const runtime = 'nodejs';

function extractId(request: NextRequest): string | null {
  const segments = request.nextUrl.pathname.split('/');
  return segments[segments.length - 1] || null;
}

const cmsPointPutSchema = z.object({
  id: z.string().min(1),
  textZh: z.string().max(500).optional().nullable(),
  textEn: z.string().max(500).optional().nullable(),
  sortOrder: z.number().int().optional(),
  isEnabled: z.boolean().optional(),
});

const cmsItemPutSchema = z.object({
  id: z.string().min(1),
  titleZh: z.string().max(500).optional().nullable(),
  titleEn: z.string().max(500).optional().nullable(),
  subtitleZh: z.string().max(500).optional().nullable(),
  subtitleEn: z.string().max(500).optional().nullable(),
  descriptionZh: z.string().max(10000).optional().nullable(),
  descriptionEn: z.string().max(10000).optional().nullable(),
  imageUrl: z.string().max(500).optional().nullable(),
  imageAltZh: z.string().max(200).optional().nullable(),
  imageAltEn: z.string().max(200).optional().nullable(),
  linkUrl: z.string().max(500).optional().nullable(),
  linkLabelZh: z.string().max(200).optional().nullable(),
  linkLabelEn: z.string().max(200).optional().nullable(),
  icon: z.string().max(100).optional().nullable(),
  badgeZh: z.string().max(200).optional().nullable(),
  badgeEn: z.string().max(200).optional().nullable(),
  value: z.string().max(200).optional().nullable(),
  sortOrder: z.number().int().optional(),
  isEnabled: z.boolean().optional(),
  points: z.array(cmsPointPutSchema).optional(),
});

const cmsSectionPutSchema = z.object({
  id: z.string().min(1),
  sectionKey: z.string().max(100).optional(),
  name: z.string().max(200).optional().nullable(),
  titleZh: z.string().max(500).optional().nullable(),
  titleEn: z.string().max(500).optional().nullable(),
  subtitleZh: z.string().max(500).optional().nullable(),
  subtitleEn: z.string().max(500).optional().nullable(),
  descriptionZh: z.string().max(10000).optional().nullable(),
  descriptionEn: z.string().max(10000).optional().nullable(),
  badgeZh: z.string().max(200).optional().nullable(),
  badgeEn: z.string().max(200).optional().nullable(),
  imageUrl: z.string().max(500).optional().nullable(),
  imageAltZh: z.string().max(200).optional().nullable(),
  imageAltEn: z.string().max(200).optional().nullable(),
  layoutType: z.string().max(50).optional().nullable(),
  styleVariant: z.string().max(50).optional().nullable(),
  isEnabled: z.boolean().optional(),
  isPublished: z.boolean().optional(),
  sortOrder: z.number().int().optional(),
  items: z.array(cmsItemPutSchema).optional(),
});

const cmsPagePutSchema = cmsPageSchema.partial().extend({
  sections: z.array(cmsSectionPutSchema).optional(),
});

const handleGet = async (request: NextRequest) => {
  try {
    const id = extractId(request);
    if (!id) return errorResponse('参数无效', 400);
    const page = await prisma.cMSPage.findUnique({
      where: { id },
      include: {
        sections: {
          orderBy: [{ sortOrder: 'asc' }, { createdAt: 'asc' }],
          include: {
            items: {
              orderBy: [{ sortOrder: 'asc' }, { createdAt: 'asc' }],
              include: {
                points: { orderBy: [{ sortOrder: 'asc' }, { createdAt: 'asc' }] },
              },
            },
          },
        },
      },
    });
    if (!page) return errorResponse('内容不存在', 404);
    return successResponse(page);
  } catch (err) {
    console.error('GET /api/admin/cms/:id error:', err);
    return errorResponse('获取失败', 500);
  }
};

function cleanData<T extends Record<string, any>>(obj: T): Partial<T> {
  const out: any = {};
  for (const [key, value] of Object.entries(obj)) {
    if (value !== undefined) {
      out[key] = value === null ? undefined : value;
    }
  }
  return out;
}

const handlePut = async (request: NextRequest, user: JWTPayload) => {
  try {
    const id = extractId(request);
    if (!id) return errorResponse('参数无效', 400);
    const body = await request.json();
    const parsed = cmsPagePutSchema.parse(body);

    const { sections, ...pageDataRaw } = parsed;
    const pageData = cleanData(pageDataRaw);

    const updatedPage = await prisma.$transaction(async (tx) => {
      const page = await tx.cMSPage.update({
        where: { id },
        data: {
          ...pageData,
          publishedAt: pageData.isPublished ? new Date() : undefined,
        } as any,
      });

      if (!sections) return page;

      const payloadSectionIds = sections.map((s) => s.id);
      const payloadItemIds: string[] = [];
      const payloadPointIds: string[] = [];
      for (const s of sections) {
        for (const i of s.items || []) {
          payloadItemIds.push(i.id);
          for (const p of i.points || []) {
            payloadPointIds.push(p.id);
          }
        }
      }

      // 1. Delete removed points
      const existingPoints = await tx.cMSSectionItemPoint.findMany({
        where: {
          item: { section: { pageId: id } },
        },
        select: { id: true },
      });
      const pointsToDelete = existingPoints
        .filter((p) => !payloadPointIds.includes(p.id))
        .map((p) => p.id);
      if (pointsToDelete.length > 0) {
        await tx.cMSSectionItemPoint.deleteMany({
          where: { id: { in: pointsToDelete } },
        });
      }

      // 2. Delete removed items
      const existingItems = await tx.cMSSectionItem.findMany({
        where: {
          section: { pageId: id },
        },
        select: { id: true },
      });
      const itemsToDelete = existingItems
        .filter((i) => !payloadItemIds.includes(i.id))
        .map((i) => i.id);
      if (itemsToDelete.length > 0) {
        await tx.cMSSectionItem.deleteMany({
          where: { id: { in: itemsToDelete } },
        });
      }

      // 3. Delete removed sections
      const existingSections = await tx.cMSSection.findMany({
        where: { pageId: id },
        select: { id: true },
      });
      const sectionsToDelete = existingSections
        .filter((s) => !payloadSectionIds.includes(s.id))
        .map((s) => s.id);
      if (sectionsToDelete.length > 0) {
        await tx.cMSSection.deleteMany({
          where: { id: { in: sectionsToDelete } },
        });
      }

      // 4. Upsert sections
      for (const section of sections) {
        const { items, ...sectionFields } = section;
        await tx.cMSSection.upsert({
          where: { id: section.id },
          update: cleanData(sectionFields) as any,
          create: {
            ...cleanData(sectionFields),
            id: section.id,
            pageId: page.id,
          } as any,
        });

        // 5. Upsert items
        for (const item of items || []) {
          const { points, ...itemFields } = item;
          await tx.cMSSectionItem.upsert({
            where: { id: item.id },
            update: cleanData(itemFields) as any,
            create: {
              ...cleanData(itemFields),
              id: item.id,
              sectionId: section.id,
            } as any,
          });

          // 6. Upsert points
          for (const point of points || []) {
            await tx.cMSSectionItemPoint.upsert({
              where: { id: point.id },
              update: cleanData(point) as any,
              create: {
                ...cleanData(point),
                id: point.id,
                itemId: item.id,
              } as any,
            });
          }
        }
      }

      return page;
    });

    await prisma.auditLog.create({
      data: {
        userId: user.userId,
        action: 'ADMIN_UPDATE_CMS',
        entity: 'CMSPage',
        entityId: updatedPage.id,
      },
    });

    const pageWithRelations = await prisma.cMSPage.findUnique({
      where: { id: updatedPage.id },
      include: {
        sections: {
          orderBy: [{ sortOrder: 'asc' }, { createdAt: 'asc' }],
          include: {
            items: {
              orderBy: [{ sortOrder: 'asc' }, { createdAt: 'asc' }],
              include: {
                points: { orderBy: [{ sortOrder: 'asc' }, { createdAt: 'asc' }] },
              },
            },
          },
        },
      },
    });

    return successResponse(pageWithRelations);
  } catch (error) {
    if (error instanceof z.ZodError) {
      const messages = error.issues.map((i) => `${i.path.join('.')}: ${i.message}`).join('; ');
      console.error('PUT /api/admin/cms/:id validation error:', messages);
      return errorResponse(messages, 400);
    }
    console.error('PUT /api/admin/cms/:id error:', error);
    return errorResponse('更新失败', 500);
  }
};

const handleDelete = async (request: NextRequest, user: JWTPayload) => {
  try {
    const id = extractId(request);
    if (!id) return errorResponse('参数无效', 400);
    await prisma.cMSPage.delete({ where: { id } });
    await prisma.auditLog.create({
      data: {
        userId: user.userId,
        action: 'ADMIN_DELETE_CMS',
        entity: 'CMSPage',
        entityId: id,
      },
    });
    return successResponse(null, 204);
  } catch (err) {
    console.error('DELETE /api/admin/cms/:id error:', err);
    return errorResponse('删除失败', 500);
  }
};

export const GET = withAuth(handleGet, ['SUPER_ADMIN']);
export const PUT = withAuth(handlePut, ['SUPER_ADMIN']);
export const DELETE = withAuth(handleDelete, ['SUPER_ADMIN']);
