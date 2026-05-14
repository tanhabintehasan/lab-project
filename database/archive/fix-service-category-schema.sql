-- Fix ServiceCategory schema to match prisma/schema.prisma

-- Add deletedAt if missing (required by soft-delete extension)
ALTER TABLE "ServiceCategory"
  ADD COLUMN IF NOT EXISTS "deletedAt" TIMESTAMP(3);

-- Ensure new JSONB columns exist
ALTER TABLE "ServiceCategory"
  ADD COLUMN IF NOT EXISTS "name" JSONB,
  ADD COLUMN IF NOT EXISTS "description" JSONB,
  ADD COLUMN IF NOT EXISTS "seoTitle" JSONB,
  ADD COLUMN IF NOT EXISTS "seoDescription" JSONB;

-- Migrate data from old columns to JSONB (idempotent)
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
WHERE "name" IS NULL;

-- Ensure name is NOT NULL
ALTER TABLE "ServiceCategory"
  ALTER COLUMN "name" SET NOT NULL;
