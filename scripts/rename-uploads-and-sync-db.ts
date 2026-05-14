/**
 * Rename upload files (spaces → hyphens) and sync DB records
 * -----------------------------------------------------------------
 * Scans your uploads/settings folder, renames files with spaces to
 * use hyphens, copies them into public/uploads/settings, and updates
 * hardcoded source-code paths + Prisma DB records.
 *
 * Run: npx tsx scripts/rename-uploads-and-sync-db.ts
 */

import 'dotenv/config';
import fs from 'fs';
import path from 'path';
import prisma from '../src/lib/db';

/* ───── config ───── */
const SOURCE_DIR = path.resolve(process.cwd(), 'uploads/settings');
const PUBLIC_DIR = path.resolve(process.cwd(), 'public/uploads/settings');

/* ───── helpers ───── */
function toHyphenName(name: string): string {
  return name
    .replace(/\s+/g, '-')           // collapse spaces → single hyphen
    .replace(/-+/g, '-');           // safety: no double hyphens
}

function ensureDir(dir: string) {
  if (!fs.existsSync(dir)) {
    fs.mkdirSync(dir, { recursive: true });
    console.log(`  📁 Created ${dir}`);
  }
}

/* ───── main ───── */
async function main() {
  ensureDir(PUBLIC_DIR);

  if (!fs.existsSync(SOURCE_DIR)) {
    console.error(`❌ Source dir not found: ${SOURCE_DIR}`);
    process.exit(1);
  }

  const entries = fs.readdirSync(SOURCE_DIR, { withFileTypes: true });
  const files = entries.filter((e) => e.isFile() && e.name.includes(' '));

  if (files.length === 0) {
    console.log('✅ No files with spaces found. Nothing to do.');
    return;
  }

  const renames: { oldName: string; newName: string; oldPath: string; newPath: string }[] = [];

  for (const file of files) {
    const oldName = file.name;
    const newName = toHyphenName(oldName);
    const oldPath = path.join(SOURCE_DIR, oldName);
    const newPath = path.join(SOURCE_DIR, newName);
    const publicPath = path.join(PUBLIC_DIR, newName);

    // 1. Rename in source dir
    fs.renameSync(oldPath, newPath);
    console.log(`  📝 Renamed: "${oldName}" → "${newName}"`);

    // 2. Copy clean name into public/
    fs.copyFileSync(newPath, publicPath);
    console.log(`  📤 Copied to public/uploads/settings/${newName}`);

    renames.push({
      oldName,
      newName,
      oldPath: `/uploads/settings/${oldName}`,
      newPath: `/uploads/settings/${newName}`,
    });
  }

  // 3. Update hardcoded source files
  const sourceFiles = [
    path.resolve(process.cwd(), 'src/app/[locale]/page.tsx'),
    path.resolve(process.cwd(), 'src/lib/homepage-data.ts'),
  ];

  for (const srcFile of sourceFiles) {
    if (!fs.existsSync(srcFile)) continue;
    let content = fs.readFileSync(srcFile, 'utf-8');
    let changed = false;

    for (const r of renames) {
      // handle both spaced and already-compact references
      const oldCompact = r.oldPath.replace(/%20/g, ' ');
      if (content.includes(oldCompact)) {
        content = content.split(oldCompact).join(r.newPath);
        changed = true;
      }
      // also catch variants without the full path prefix
      const rawOld = `/${r.oldName}`;
      const rawNew = `/${r.newName}`;
      if (content.includes(rawOld)) {
        content = content.split(rawOld).join(rawNew);
        changed = true;
      }
    }

    if (changed) {
      fs.writeFileSync(srcFile, content, 'utf-8');
      console.log(`  💾 Updated ${path.relative(process.cwd(), srcFile)}`);
    }
  }

  // 4. Update DB records (CMSSection, CMSSectionItem, SiteSetting)
  console.log('  🔄 Updating database records...');

  for (const r of renames) {
    const oldUrl = r.oldPath;
    const newUrl = r.newPath;

    // CMSSection.imageUrl
    const sections = await prisma.cMSSection.updateMany({
      where: { imageUrl: { contains: oldUrl } },
      data: { imageUrl: { set: undefined } }, // Prisma doesn't support replace in updateMany; use $executeRaw below
    });

    // Use raw SQL for string-replace across text columns
    await prisma.$executeRaw`
      UPDATE "CMSSection"
      SET "imageUrl" = REPLACE("imageUrl", ${oldUrl}, ${newUrl})
      WHERE "imageUrl" LIKE ${'%' + oldUrl + '%'};
    `;

    await prisma.$executeRaw`
      UPDATE "CMSSectionItem"
      SET "imageUrl" = REPLACE("imageUrl", ${oldUrl}, ${newUrl})
      WHERE "imageUrl" LIKE ${'%' + oldUrl + '%'};
    `;

    await prisma.$executeRaw`
      UPDATE "SiteSetting"
      SET "logoUrl" = REPLACE("logoUrl", ${oldUrl}, ${newUrl})
      WHERE "logoUrl" LIKE ${'%' + oldUrl + '%'};
    `;

    await prisma.$executeRaw`
      UPDATE "SiteSetting"
      SET "logoUploadUrl" = REPLACE("logoUploadUrl", ${oldUrl}, ${newUrl})
      WHERE "logoUploadUrl" LIKE ${'%' + oldUrl + '%'};
    `;

    await prisma.$executeRaw`
      UPDATE "SiteSetting"
      SET "faviconUrl" = REPLACE("faviconUrl", ${oldUrl}, ${newUrl})
      WHERE "faviconUrl" LIKE ${'%' + oldUrl + '%'};
    `;
  }

  console.log('✅ Done! Restart your dev server to see the changes.');
}

main()
  .catch((err) => {
    console.error('❌ Fatal error:', err);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
