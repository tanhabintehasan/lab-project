/**
 * Fix ServiceCategory columns
 * ---------------------------
 * The database was migrated to JSONB (name, description, seoTitle, seoDescription)
 * but schema.prisma and all code still expect flat columns (nameZh, nameEn, etc.).
 *
 * This script adds the flat columns back and populates them from the JSONB data.
 * Run: npx tsx scripts/fix-service-category-columns.ts
 */

import 'dotenv/config';
import prisma from '../src/lib/db';

async function main() {
  console.log('[Fix] Adding back flat columns to ServiceCategory...');

  // 1. Add flat columns if they don't exist
  await prisma.$queryRaw`
    ALTER TABLE "ServiceCategory"
      ADD COLUMN IF NOT EXISTS "nameZh" VARCHAR(191),
      ADD COLUMN IF NOT EXISTS "nameEn" VARCHAR(191),
      ADD COLUMN IF NOT EXISTS "descZh" TEXT,
      ADD COLUMN IF NOT EXISTS "descEn" TEXT,
      ADD COLUMN IF NOT EXISTS "seoTitleZh" VARCHAR(191),
      ADD COLUMN IF NOT EXISTS "seoTitleEn" VARCHAR(191),
      ADD COLUMN IF NOT EXISTS "seoDescZh" TEXT,
      ADD COLUMN IF NOT EXISTS "seoDescEn" TEXT;
  `;
  console.log('[Fix] Columns added (or already existed).');

  // 2. Populate flat columns from JSONB
  const result = await prisma.$queryRaw`
    UPDATE "ServiceCategory"
    SET
      "nameZh"     = COALESCE(name->>'zh', ''),
      "nameEn"     = NULLIF(name->>'en', ''),
      "descZh"     = NULLIF(description->>'zh', ''),
      "descEn"     = NULLIF(description->>'en', ''),
      "seoTitleZh" = NULLIF("seoTitle"->>'zh', ''),
      "seoTitleEn" = NULLIF("seoTitle"->>'en', ''),
      "seoDescZh"  = NULLIF("seoDescription"->>'zh', ''),
      "seoDescEn"  = NULLIF("seoDescription"->>'en', '')
    WHERE "nameZh" IS NULL;
  `;
  console.log('[Fix] Data migrated from JSONB to flat columns.');

  // 3. Ensure nameZh is NOT NULL (matches Prisma schema)
  await prisma.$queryRaw`
    ALTER TABLE "ServiceCategory"
      ALTER COLUMN "nameZh" SET NOT NULL;
  `;
  console.log('[Fix] nameZh set to NOT NULL.');

  // 4. Show current state
  const rows = await prisma.$queryRaw<{ id: string; namezh: string; nameen: string | null }[]>`
    SELECT id, "nameZh" as namezh, "nameEn" as nameen
    FROM "ServiceCategory"
    LIMIT 5;
  `;
  console.log('[Fix] Sample rows:');
  for (const row of rows) {
    console.log(`  ${row.id} — zh: "${row.namezh}" | en: "${row.nameen ?? ''}"`);
  }

  console.log('[Fix] ✅ Done. Run `npx prisma generate` then restart your dev server.');
}

main()
  .catch((err) => {
    console.error('[Fix] Fatal error:', err);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
