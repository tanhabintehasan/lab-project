-- Migration: ServiceCategory flat columns → JSONB
-- Safe, idempotent, preserves all existing data.

-- 1. Add new JSONB columns (if not already present)
ALTER TABLE "ServiceCategory"
  ADD COLUMN IF NOT EXISTS "name" JSONB,
  ADD COLUMN IF NOT EXISTS "description" JSONB,
  ADD COLUMN IF NOT EXISTS "seoTitle" JSONB,
  ADD COLUMN IF NOT EXISTS "seoDescription" JSONB;

-- 2. Migrate data from old columns to JSONB
UPDATE "ServiceCategory"
SET
  "name" = jsonb_build_object(
    'zh', COALESCE("nameZh", ''),
    'en', "nameEn"
  ),
  "description" = jsonb_build_object(
    'zh', "descZh",
    'en', "descEn"
  ),
  "seoTitle" = jsonb_build_object(
    'zh', "seoTitleZh",
    'en', "seoTitleEn"
  ),
  "seoDescription" = jsonb_build_object(
    'zh', "seoDescZh",
    'en', "seoDescEn"
  )
WHERE "name" IS NULL;  -- only migrate rows that haven't been migrated yet

-- 3. Ensure "name" is NOT NULL (matches Prisma schema)
ALTER TABLE "ServiceCategory"
  ALTER COLUMN "name" SET NOT NULL;

-- 4. Drop old columns (run this AFTER confirming frontend/backend are fully updated)
-- Uncomment when ready:
-- ALTER TABLE "ServiceCategory"
--   DROP COLUMN IF EXISTS "nameZh",
--   DROP COLUMN IF EXISTS "nameEn",
--   DROP COLUMN IF EXISTS "descZh",
--   DROP COLUMN IF EXISTS "descEn",
--   DROP COLUMN IF EXISTS "seoTitleZh",
--   DROP COLUMN IF EXISTS "seoTitleEn",
--   DROP COLUMN IF EXISTS "seoDescZh",
--   DROP COLUMN IF EXISTS "seoDescEn";
