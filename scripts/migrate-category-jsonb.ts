/**
 * Migration: ServiceCategory name/description/seo → JSONB
 *
 * Converts existing flat columns to JSONB format without data loss.
 * Uses raw SQL to read old fields (Prisma Client no longer knows them).
 *
 * Run: npx tsx scripts/migrate-category-jsonb.ts
 */

import { prisma } from '../src/lib/db';

interface OldCategory {
  id: string;
  namezh: string;
  nameen: string | null;
  desczh: string | null;
  descen: string | null;
  seotitlezh: string | null;
  seotitleen: string | null;
  seodesczh: string | null;
  seodescen: string | null;
}

async function migrate() {
  console.log('[Migrate] Starting ServiceCategory JSONB migration...');

  // Read old fields via raw SQL (column names are lowercase in Postgres result)
  const rows = await prisma.$queryRaw<OldCategory[]>`
    SELECT
      id,
      "nameZh"  as namezh,
      "nameEn"  as nameen,
      "descZh"  as desczh,
      "descEn"  as descen,
      "seoTitleZh" as seotitlezh,
      "seoTitleEn" as seotitleen,
      "seoDescZh"  as seodesczh,
      "seoDescEn"  as seodescen
    FROM "ServiceCategory"
    WHERE "deletedAt" IS NULL
  `;

  console.log(`[Migrate] Found ${rows.length} categories to process`);

  let migrated = 0;
  let errors = 0;

  for (const row of rows) {
    try {
      const name = { zh: row.namezh || '', en: row.nameen || null };
      const description = { zh: row.desczh || null, en: row.descen || null };
      const seoTitle = { zh: row.seotitlezh || null, en: row.seotitleen || null };
      const seoDescription = { zh: row.seodesczh || null, en: row.seodescen || null };

      await prisma.serviceCategory.update({
        where: { id: row.id },
        data: { name, description, seoTitle, seoDescription },
      });

      migrated++;
      console.log(`[Migrate] ✅ ${row.id} — ${name.zh}`);
    } catch (err) {
      errors++;
      console.error(`[Migrate] ❌ ${row.id} failed:`, err);
    }
  }

  console.log(`\n[Migrate] Done: ${migrated} migrated, ${errors} errors`);
  console.log('[Migrate] Next step: run the SQL cleanup to drop old columns:');
  console.log(`
-- Run these in your PostgreSQL console:
ALTER TABLE "ServiceCategory" DROP COLUMN IF EXISTS "nameZh";
ALTER TABLE "ServiceCategory" DROP COLUMN IF EXISTS "nameEn";
ALTER TABLE "ServiceCategory" DROP COLUMN IF EXISTS "descZh";
ALTER TABLE "ServiceCategory" DROP COLUMN IF EXISTS "descEn";
ALTER TABLE "ServiceCategory" DROP COLUMN IF EXISTS "seoTitleZh";
ALTER TABLE "ServiceCategory" DROP COLUMN IF EXISTS "seoTitleEn";
ALTER TABLE "ServiceCategory" DROP COLUMN IF EXISTS "seoDescZh";
ALTER TABLE "ServiceCategory" DROP COLUMN IF EXISTS "seoDescEn";
  `);
}

migrate()
  .catch((err) => {
    console.error('[Migrate] Fatal error:', err);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());
