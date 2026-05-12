import { prisma } from '../src/lib/db';

async function runMigration() {
  console.log('Starting CMS migration...\n');

  // 1. Create SiteSetting table if missing
  try {
    await prisma.$executeRaw`
      CREATE TABLE IF NOT EXISTS "SiteSetting" (
        "id" TEXT NOT NULL,
        "siteName" TEXT NOT NULL DEFAULT '度量衡科研平台',
        "siteNameEn" TEXT,
        "logoUrl" TEXT,
        "logoUploadUrl" TEXT,
        "brandColor" TEXT,
        "faviconUrl" TEXT,
        "supportEmail" TEXT,
        "supportPhone" TEXT,
        "whatsapp" TEXT,
        "wechat" TEXT,
        "addressZh" TEXT,
        "addressEn" TEXT,
        "facebookUrl" TEXT,
        "linkedinUrl" TEXT,
        "youtubeUrl" TEXT,
        "footerTextZh" TEXT,
        "footerTextEn" TEXT,
        "seoTitleZh" TEXT,
        "seoTitleEn" TEXT,
        "seoDescriptionZh" TEXT,
        "seoDescriptionEn" TEXT,
        "metadata" JSONB,
        "createdAt" TIMESTAMP(3) WITHOUT TIME ZONE NOT NULL DEFAULT CURRENT_TIMESTAMP,
        "updatedAt" TIMESTAMP(3) WITHOUT TIME ZONE NOT NULL DEFAULT CURRENT_TIMESTAMP,
        CONSTRAINT "SiteSetting_pkey" PRIMARY KEY ("id")
      )
    `;
    await prisma.$executeRaw`CREATE INDEX IF NOT EXISTS "SiteSetting_updatedAt_idx" ON "SiteSetting"("updatedAt")`;
    console.log('✅ SiteSetting table ensured');
  } catch (e: any) {
    console.error('❌ SiteSetting table creation failed:', e.message);
    throw e;
  }

  // 2. Insert default site settings if empty
  try {
    await prisma.$executeRaw`
      INSERT INTO "SiteSetting" ("id", "siteName", "supportEmail", "supportPhone", "addressZh", "footerTextZh", "seoTitleZh", "seoDescriptionZh")
      SELECT 'setting-default', '度量衡科研平台', 'support@labtest.com', '400-123-4567', '北京市朝阳区科技园区', '度量衡科研平台 — 立足科学前沿，服务中国创新。', '度量衡科研平台 | 专业科研检测服务', '度量衡科研平台提供前沿测试、化学成分分析、电化学测试、环境测试等专业科研检测服务。'
      WHERE NOT EXISTS (SELECT 1 FROM "SiteSetting" LIMIT 1)
    `;
    console.log('✅ Default site settings ensured');
  } catch (e: any) {
    console.error('❌ Default site settings insert failed:', e.message);
    throw e;
  }

  // 3. Ensure homepage CMSPage exists
  try {
    await prisma.$executeRaw`
      INSERT INTO "CMSPage" ("id", "slug", "type", "titleZh", "titleEn", "contentZh", "contentEn", "isPublished", "sortOrder", "publishedAt", "createdAt", "updatedAt")
      SELECT 'page-home', 'homepage', 'homepage', '首页', 'Homepage', NULL, NULL, true, 0, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP
      WHERE NOT EXISTS (SELECT 1 FROM "CMSPage" WHERE slug = 'homepage')
    `;
    console.log('✅ Homepage CMSPage ensured');
  } catch (e: any) {
    console.error('❌ Homepage CMSPage insert failed:', e.message);
    throw e;
  }

  // 4. Add pageId to CMSSection if missing
  const hasPageId = await prisma.$queryRaw`
    SELECT 1 as exists
    FROM information_schema.columns
    WHERE table_name = 'CMSSection' AND column_name = 'pageId'
  `;
  if (Array.isArray(hasPageId) && hasPageId.length === 0) {
    try {
      await prisma.$executeRaw`ALTER TABLE "CMSSection" ADD COLUMN "pageId" TEXT`;
      console.log('✅ pageId column added to CMSSection');
    } catch (e: any) {
      console.error('❌ Failed to add pageId:', e.message);
      throw e;
    }
  } else {
    console.log('ℹ️ pageId column already exists');
  }

  // 5. Populate pageId from pageKey (direct slug match)
  try {
    const directUpdated = await prisma.$executeRaw`
      UPDATE "CMSSection" s
      SET "pageId" = p.id
      FROM "CMSPage" p
      WHERE s."pageKey" = p.slug AND s."pageId" IS NULL
    `;
    console.log('✅ Populated pageId from direct slug matches');
  } catch (e: any) {
    console.error('❌ Direct pageId population failed:', e.message);
    throw e;
  }

  // 6. Populate pageId for 'home' -> 'homepage'
  try {
    await prisma.$executeRaw`
      UPDATE "CMSSection" s
      SET "pageId" = p.id
      FROM "CMSPage" p
      WHERE s."pageId" IS NULL AND s."pageKey" = 'home' AND p.slug = 'homepage'
    `;
    console.log('✅ Populated pageId for home->homepage mapping');
  } catch (e: any) {
    console.error('❌ Home mapping failed:', e.message);
    throw e;
  }

  // 7. Delete orphan sections with no valid pageId
  try {
    const orphanSections = await prisma.$queryRaw`SELECT id FROM "CMSSection" WHERE "pageId" IS NULL`;
    if (Array.isArray(orphanSections) && orphanSections.length > 0) {
      const ids = (orphanSections as any[]).map((r) => r.id);
      console.log('⚠️ Deleting orphan sections:', ids);
    }
    await prisma.$executeRaw`DELETE FROM "CMSSection" WHERE "pageId" IS NULL`;
    console.log('✅ Orphan sections deleted');
  } catch (e: any) {
    console.error('❌ Orphan section cleanup failed:', e.message);
    throw e;
  }

  // 8. Clean orphan items
  try {
    await prisma.$executeRaw`DELETE FROM "CMSSectionItem" WHERE "sectionId" NOT IN (SELECT id FROM "CMSSection")`;
    console.log('✅ Orphan items deleted');
  } catch (e: any) {
    console.error('❌ Orphan item cleanup failed:', e.message);
    throw e;
  }

  // 9. Clean orphan points
  try {
    await prisma.$executeRaw`DELETE FROM "CMSSectionItemPoint" WHERE "itemId" NOT IN (SELECT id FROM "CMSSectionItem")`;
    console.log('✅ Orphan points deleted');
  } catch (e: any) {
    console.error('❌ Orphan point cleanup failed:', e.message);
    throw e;
  }

  // 10. Make pageId NOT NULL and add FK
  try {
    await prisma.$executeRaw`ALTER TABLE "CMSSection" ALTER COLUMN "pageId" SET NOT NULL`;
    console.log('✅ pageId set to NOT NULL');
  } catch (e: any) {
    console.error('❌ Failed to set pageId NOT NULL:', e.message);
    throw e;
  }

  try {
    await prisma.$executeRaw`
      ALTER TABLE "CMSSection" 
      DROP CONSTRAINT IF EXISTS "CMSSection_pageId_fkey",
      ADD CONSTRAINT "CMSSection_pageId_fkey" 
        FOREIGN KEY ("pageId") REFERENCES "CMSPage"("id") ON DELETE CASCADE ON UPDATE CASCADE
    `;
    console.log('✅ Foreign key CMSSection_pageId_fkey added');
  } catch (e: any) {
    console.error('❌ Foreign key creation failed:', e.message);
    throw e;
  }

  // 11. Drop legacy pageKey column
  try {
    await prisma.$executeRaw`ALTER TABLE "CMSSection" DROP COLUMN IF EXISTS "pageKey"`;
    console.log('✅ Legacy pageKey column dropped');
  } catch (e: any) {
    console.error('❌ Failed to drop pageKey:', e.message);
    throw e;
  }

  // 12. Drop old indexes and create new ones
  const indexOps = [
    { sql: `DROP INDEX IF EXISTS "CMSSection_pageKey_isEnabled_sortOrder_idx"`, label: 'old idx 1' },
    { sql: `DROP INDEX IF EXISTS "CMSSection_pageKey_isPublished_sortOrder_idx"`, label: 'old idx 2' },
    { sql: `DROP INDEX IF EXISTS "CMSSection_pageKey_sectionKey_key"`, label: 'old unique idx' },
    { sql: `CREATE INDEX "CMSSection_pageId_idx" ON "CMSSection"("pageId")`, label: 'pageId idx' },
    { sql: `CREATE INDEX "CMSSection_sectionKey_idx" ON "CMSSection"("sectionKey")`, label: 'sectionKey idx' },
    { sql: `CREATE INDEX "CMSSection_pageId_isEnabled_sortOrder_idx" ON "CMSSection"("pageId", "isEnabled", "sortOrder")`, label: 'composite idx 1' },
    { sql: `CREATE INDEX "CMSSection_isPublished_idx" ON "CMSSection"("isPublished")`, label: 'isPublished idx' },
    { sql: `CREATE UNIQUE INDEX "CMSSection_pageId_sectionKey_key" ON "CMSSection"("pageId", "sectionKey")`, label: 'unique composite idx' },
    { sql: `CREATE INDEX "CMSSectionItem_sectionId_idx" ON "CMSSectionItem"("sectionId")`, label: 'item sectionId idx' },
    { sql: `CREATE INDEX "CMSSectionItemPoint_itemId_idx" ON "CMSSectionItemPoint"("itemId")`, label: 'point itemId idx' },
  ];

  for (const op of indexOps) {
    try {
      await prisma.$executeRawUnsafe(op.sql);
      console.log(`✅ Index operation: ${op.label}`);
    } catch (e: any) {
      // Ignore "already exists" errors
      if (e.message?.includes('already exists')) {
        console.log(`ℹ️ Index already exists: ${op.label}`);
      } else {
        console.error(`❌ Index operation failed (${op.label}):`, e.message);
        throw e;
      }
    }
  }

  // 13. Verify counts
  const counts = await prisma.$queryRaw`
    SELECT 
      (SELECT COUNT(*) FROM "SiteSetting")::int as site_settings_count,
      (SELECT COUNT(*) FROM "CMSPage" WHERE slug = 'homepage')::int as homepage_count,
      (SELECT COUNT(*) FROM "CMSSection")::int as cms_section_count,
      (SELECT COUNT(*) FROM "CMSSectionItem")::int as cms_item_count,
      (SELECT COUNT(*) FROM "CMSSectionItemPoint")::int as cms_point_count
  `;
  console.log('\n=== Final Counts ===');
  console.log(JSON.stringify(counts, null, 2));

  console.log('\n🎉 Migration completed successfully');
}

runMigration()
  .catch((e) => { console.error('\nMigration failed:', e); process.exit(1); })
  .finally(() => prisma.$disconnect());
