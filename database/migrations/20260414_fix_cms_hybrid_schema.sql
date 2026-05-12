-- ============================================================
-- PRODUCTION-SAFE CMS SCHEMA FIX
-- Run: npx prisma db execute --file database/migrations/20260414_fix_cms_hybrid_schema.sql
--
-- Fixes:
-- 1. Missing SiteSetting table -> creates it + inserts default row
-- 2. Missing homepage CMSPage -> inserts default homepage
-- 3. Hybrid pageKey/pageId on CMSSection -> migrates to clean pageId relational model
-- 4. Orphan sections/items/points -> removed
-- 5. Legacy indexes on pageKey -> rebuilt for pageId
-- ============================================================

-- ------------------------------------------------------------------
-- 1. SiteSetting table
-- ------------------------------------------------------------------
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
);

CREATE INDEX IF NOT EXISTS "SiteSetting_updatedAt_idx" ON "SiteSetting"("updatedAt");

-- Insert default settings only if table is empty
INSERT INTO "SiteSetting" (
    "id", "siteName", "supportEmail", "supportPhone", "addressZh",
    "footerTextZh", "seoTitleZh", "seoDescriptionZh"
)
SELECT
    'setting-default',
    '度量衡科研平台',
    'support@labtest.com',
    '400-123-4567',
    '北京市朝阳区科技园区',
    '度量衡科研平台 — 立足科学前沿，服务中国创新。',
    '度量衡科研平台 | 专业科研检测服务',
    '度量衡科研平台提供前沿测试、化学成分分析、电化学测试、环境测试等专业科研检测服务。'
WHERE NOT EXISTS (SELECT 1 FROM "SiteSetting" LIMIT 1);

-- ------------------------------------------------------------------
-- 2. Ensure homepage CMSPage exists
-- ------------------------------------------------------------------
INSERT INTO "CMSPage" (
    "id", "slug", "type", "titleZh", "titleEn",
    "contentZh", "contentEn", "isPublished", "sortOrder",
    "publishedAt", "createdAt", "updatedAt"
)
SELECT
    'page-home',
    'homepage',
    'homepage',
    '首页',
    'Homepage',
    NULL,
    NULL,
    true,
    0,
    CURRENT_TIMESTAMP,
    CURRENT_TIMESTAMP,
    CURRENT_TIMESTAMP
WHERE NOT EXISTS (SELECT 1 FROM "CMSPage" WHERE slug = 'homepage');

-- ------------------------------------------------------------------
-- 3. Migrate CMSSection from pageKey -> pageId
-- ------------------------------------------------------------------
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns
        WHERE table_name = 'CMSSection' AND column_name = 'pageId'
    ) THEN
        ALTER TABLE "CMSSection" ADD COLUMN "pageId" TEXT;
    END IF;
END $$;

-- Direct slug match (e.g. pageKey = 'homepage' -> CMSPage.slug = 'homepage')
UPDATE "CMSSection" s
SET "pageId" = p.id
FROM "CMSPage" p
WHERE s."pageKey" = p.slug AND s."pageId" IS NULL;

-- Normalize legacy 'home' -> 'homepage'
UPDATE "CMSSection" s
SET "pageId" = p.id
FROM "CMSPage" p
WHERE s."pageId" IS NULL AND s."pageKey" = 'home' AND p.slug = 'homepage';

-- Delete any sections that still cannot be linked to a valid page
DELETE FROM "CMSSection" WHERE "pageId" IS NULL;

-- ------------------------------------------------------------------
-- 4. Clean orphan items and points
-- ------------------------------------------------------------------
DELETE FROM "CMSSectionItem"
WHERE "sectionId" NOT IN (SELECT id FROM "CMSSection");

DELETE FROM "CMSSectionItemPoint"
WHERE "itemId" NOT IN (SELECT id FROM "CMSSectionItem");

-- ------------------------------------------------------------------
-- 5. Finalize CMSSection schema (NOT NULL + FK + drop pageKey)
-- ------------------------------------------------------------------
ALTER TABLE "CMSSection" ALTER COLUMN "pageId" SET NOT NULL;

ALTER TABLE "CMSSection"
DROP CONSTRAINT IF EXISTS "CMSSection_pageId_fkey",
ADD CONSTRAINT "CMSSection_pageId_fkey"
    FOREIGN KEY ("pageId") REFERENCES "CMSPage"("id")
    ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE "CMSSection" DROP COLUMN IF EXISTS "pageKey";

-- ------------------------------------------------------------------
-- 6. Rebuild indexes for new schema
-- ------------------------------------------------------------------
DROP INDEX IF EXISTS "CMSSection_pageKey_isEnabled_sortOrder_idx";
DROP INDEX IF EXISTS "CMSSection_pageKey_isPublished_sortOrder_idx";
DROP INDEX IF EXISTS "CMSSection_pageKey_sectionKey_key";

CREATE INDEX IF NOT EXISTS "CMSSection_pageId_idx" ON "CMSSection"("pageId");
CREATE INDEX IF NOT EXISTS "CMSSection_sectionKey_idx" ON "CMSSection"("sectionKey");
CREATE INDEX IF NOT EXISTS "CMSSection_pageId_isEnabled_sortOrder_idx" ON "CMSSection"("pageId", "isEnabled", "sortOrder");
CREATE INDEX IF NOT EXISTS "CMSSection_isPublished_idx" ON "CMSSection"("isPublished");
CREATE UNIQUE INDEX IF NOT EXISTS "CMSSection_pageId_sectionKey_key" ON "CMSSection"("pageId", "sectionKey");

CREATE INDEX IF NOT EXISTS "CMSSectionItem_sectionId_idx" ON "CMSSectionItem"("sectionId");
CREATE INDEX IF NOT EXISTS "CMSSectionItemPoint_itemId_idx" ON "CMSSectionItemPoint"("itemId");
