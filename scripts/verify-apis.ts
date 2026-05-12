import { prisma } from '../src/lib/db';

async function main() {
  let exitCode = 0;

  // 1. Verify /api/site-settings logic
  try {
    const settings = await prisma.siteSetting.findFirst({ orderBy: { createdAt: 'asc' } });
    console.log('✅ /api/site-settings:', settings ? `found id=${settings.id}` : 'empty (fallback will be used)');
  } catch (e: any) {
    console.error('❌ /api/site-settings query failed:', e.message);
    exitCode = 1;
  }

  // 2. Verify /api/cms/homepage logic
  try {
    const page = await prisma.cMSPage.findUnique({
      where: { slug: 'homepage' },
      include: {
        sections: {
          where: { isPublished: true, isEnabled: true },
          orderBy: [{ sortOrder: 'asc' }, { createdAt: 'asc' }],
          include: {
            items: {
              where: { isEnabled: true },
              orderBy: [{ sortOrder: 'asc' }, { createdAt: 'asc' }],
              include: {
                points: {
                  where: { isEnabled: true },
                  orderBy: [{ sortOrder: 'asc' }, { createdAt: 'asc' }],
                },
              },
            },
          },
        },
      },
    });
    if (!page) {
      console.error('❌ /api/cms/homepage: homepage page not found');
      exitCode = 1;
    } else {
      const sections = page.sections || [];
      const items = sections.flatMap((s: any) => s.items || []);
      const points = items.flatMap((i: any) => i.points || []);
      console.log(`✅ /api/cms/homepage: page=${page.id}, sections=${sections.length}, items=${items.length}, points=${points.length}`);
    }
  } catch (e: any) {
    console.error('❌ /api/cms/homepage query failed:', e.message);
    exitCode = 1;
  }

  // 3. Verify /api/admin/cms/:id logic (get first CMSPage)
  try {
    const firstPage = await prisma.cMSPage.findFirst({ select: { id: true } });
    if (!firstPage) {
      console.log('ℹ️ /api/admin/cms/:id: no CMSPage to test');
    } else {
      const page = await prisma.cMSPage.findUnique({
        where: { id: firstPage.id },
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
      if (!page) {
        console.error('❌ /api/admin/cms/:id: page not found');
        exitCode = 1;
      } else {
        console.log(`✅ /api/admin/cms/:id: page=${page.id}, sections=${page.sections?.length || 0}`);
      }
    }
  } catch (e: any) {
    console.error('❌ /api/admin/cms/:id query failed:', e.message);
    exitCode = 1;
  }

  // 4. Verify no orphans
  try {
    const orphanItems = await prisma.cMSSectionItem.count({
      where: { sectionId: { notIn: (await prisma.cMSSection.findMany({ select: { id: true } })).map((s) => s.id) } },
    });
    const orphanPoints = await prisma.cMSSectionItemPoint.count({
      where: { itemId: { notIn: (await prisma.cMSSectionItem.findMany({ select: { id: true } })).map((i) => i.id) } },
    });
    if (orphanItems > 0 || orphanPoints > 0) {
      console.error(`❌ Orphans found: items=${orphanItems}, points=${orphanPoints}`);
      exitCode = 1;
    } else {
      console.log('✅ No orphan CMS data');
    }
  } catch (e: any) {
    console.error('❌ Orphan check failed:', e.message);
    exitCode = 1;
  }

  process.exit(exitCode);
}

main().catch((e) => { console.error(e); process.exit(1); }).finally(() => prisma.$disconnect());
