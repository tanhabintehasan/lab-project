/**
 * Minimal Safe Seed
 * Idempotent — safe to run multiple times on existing databases.
 * Creates only core catalog data and a default admin user.
 */

import { config } from 'dotenv';
import { PrismaClient } from '@prisma/client';
import { PrismaPg } from '@prisma/adapter-pg';
import bcrypt from 'bcryptjs';

config();

if (!process.env.DATABASE_URL) {
  throw new Error('DATABASE_URL is not set');
}

const prisma = new PrismaClient({
  adapter: new PrismaPg({ connectionString: process.env.DATABASE_URL }),
});

async function hashPassword(password: string): Promise<string> {
  return bcrypt.hash(password, 12);
}

async function main() {
  console.log('🌱 Starting minimal safe seed...');

  // ─── Service Categories ─────────────────────────────────────
  const categories = [
    { slug: 'material-testing', nameZh: '材料检测', nameEn: 'Material Testing', sortOrder: 1, icon: '🔬' },
    { slug: 'environmental', nameZh: '环境检测', nameEn: 'Environmental Testing', sortOrder: 2, icon: '🌿' },
    { slug: 'electrical', nameZh: '电子电器检测', nameEn: 'Electrical Testing', sortOrder: 3, icon: '⚡' },
    { slug: 'mechanical', nameZh: '机械检测', nameEn: 'Mechanical Testing', sortOrder: 4, icon: '⚙️' },
  ];

  for (const cat of categories) {
    await prisma.serviceCategory.upsert({
      where: { slug: cat.slug },
      update: {},
      create: {
        ...cat,
        icon: cat.icon,
        iconUrl: null,
      },
    });
  }
  console.log('✅ Categories seeded');

  // ─── Materials ──────────────────────────────────────────────
  const materials = [
    { slug: 'metal', nameZh: '金属材料', nameEn: 'Metal' },
    { slug: 'polymer', nameZh: '高分子材料', nameEn: 'Polymer' },
    { slug: 'ceramic', nameZh: '陶瓷材料', nameEn: 'Ceramic' },
  ];

  for (const m of materials) {
    await prisma.material.upsert({
      where: { slug: m.slug },
      update: {},
      create: m,
    });
  }
  console.log('✅ Materials seeded');

  // ─── Industries ─────────────────────────────────────────────
  const industries = [
    { slug: 'aerospace', nameZh: '航空航天', nameEn: 'Aerospace' },
    { slug: 'automotive', nameZh: '汽车制造', nameEn: 'Automotive' },
    { slug: 'electronics', nameZh: '电子电器', nameEn: 'Electronics' },
  ];

  for (const ind of industries) {
    await prisma.industry.upsert({
      where: { slug: ind.slug },
      update: {},
      create: ind,
    });
  }
  console.log('✅ Industries seeded');

  // ─── Testing Standards ──────────────────────────────────────
  const standards = [
    { code: 'GB/T', nameZh: '中国国家标准', nameEn: 'Chinese National Standard' },
    { code: 'ASTM', nameZh: '美国材料试验协会', nameEn: 'ASTM International' },
    { code: 'ISO', nameZh: '国际标准化组织', nameEn: 'ISO' },
  ];

  for (const std of standards) {
    await prisma.testingStandard.upsert({
      where: { code: std.code },
      update: {},
      create: std,
    });
  }
  console.log('✅ Standards seeded');

  // ─── Default Admin User ─────────────────────────────────────
  const adminEmail = process.env.ADMIN_EMAIL || 'admin@labtest.com';
  const adminPassword = process.env.ADMIN_PASSWORD || 'Admin@123456';

  const adminUser = await prisma.user.upsert({
    where: { phone: '+8610000000000' },
    update: {},
    create: {
      phone: '+8610000000000',
      email: adminEmail,
      passwordHash: await hashPassword(adminPassword),
      name: 'Administrator',
      role: 'SUPER_ADMIN',
      status: 'ACTIVE',
      phoneVerified: true,
      emailVerified: true,
    },
  });

  await prisma.wallet.upsert({
    where: { userId: adminUser.id },
    update: {},
    create: { userId: adminUser.id },
  });
  console.log('✅ Admin user seeded:', adminEmail);

  // ─── Site Settings ──────────────────────────────────────────
  await prisma.siteSetting.upsert({
    where: { id: 'default' },
    update: {},
    create: {
      id: 'default',
      siteName: '度量衡科研平台',
      siteNameEn: 'Metrology Research Platform',
      footerTextZh: '立足科学前沿，服务中国创新',
      footerCopyrightZh: `© ${new Date().getFullYear()} 度量衡科研平台`,
      seoTitleZh: '度量衡科研平台 — 一站式检测服务平台',
      seoDescriptionZh: '连接企业与优质实验室，提供高效、透明、可靠的检测解决方案',
      seoKeywordsZh: '检测,科研,实验室,材料测试',
    },
  });
  console.log('✅ Site settings seeded');

  // ─── CMS Homepage ───────────────────────────────────────────
  await prisma.cMSPage.upsert({
    where: { slug: 'homepage' },
    update: {},
    create: {
      slug: 'homepage',
      titleZh: '首页',
      titleEn: 'Home',
      type: 'HOME',
      isPublished: true,
    },
  });
  console.log('✅ CMS homepage seeded');

  // ─── Laboratories ───────────────────────────────────────────
  const labs = [
    { slug: 'beijing-testing-center', nameZh: '北京综合检测中心', nameEn: 'Beijing Testing Center', city: '北京', status: 'ACTIVE' },
    { slug: 'shanghai-material-lab', nameZh: '上海材料实验室', nameEn: 'Shanghai Material Laboratory', city: '上海', status: 'ACTIVE' },
    { slug: 'shenzhen-electronics-lab', nameZh: '深圳电子检测实验室', nameEn: 'Shenzhen Electronics Testing Lab', city: '深圳', status: 'ACTIVE' },
    { slug: 'smart-manufacturing-lab', nameZh: '智能制造与材料工程实验室', nameEn: 'Smart Manufacturing & Materials Engineering Lab', city: '深圳', status: 'ACTIVE', coverImage: '/images/homepage/lab4.png', imageUrl: '/images/homepage/lab4.png' },
  ];

  for (const lab of labs) {
    await prisma.laboratory.upsert({
      where: { slug: lab.slug },
      update: {},
      create: {
        ...lab,
        shortDescZh: `${lab.nameZh} — 专业检测与研发服务`,
        address: `${lab.city}市科技园区`,
        status: lab.status as any,
      },
    });
  }
  console.log('✅ Laboratories seeded');

  console.log('🎉 Minimal seed completed successfully!');
}

main()
  .catch((e) => {
    console.error('Seed error:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
