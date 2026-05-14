/**
 * Master Seed — Comprehensive Demo Data
 * ------------------------------------------------------------------------
 * Idempotent upsert-based seed script. Safe to run multiple times.
 * Restores relational patterns (Labs → Equipment → Services) and populates
 * all new schema fields with realistic bilingual demo data.
 *
 * Run: npx tsx prisma/seed.ts
 * ------------------------------------------------------------------------
 */

import 'dotenv/config';
import { PrismaClient, Prisma } from '@prisma/client';
import { PrismaPg } from '@prisma/adapter-pg';
import bcrypt from 'bcryptjs';

if (!process.env.DATABASE_URL) {
  throw new Error('DATABASE_URL is not set');
}

const adapter = new PrismaPg({ connectionString: process.env.DATABASE_URL });

const prisma = new PrismaClient({
  adapter,
  log: ['error'],
});

/* ─────────────────────── Helpers ─────────────────────── */

async function hashPassword(password: string): Promise<string> {
  return bcrypt.hash(password, 12);
}

function cuid(prefix: string, idx: number): string {
  // deterministic fake-cuid for upsert stability
  return `${prefix}${String(idx).padStart(6, '0')}seed000000000000`;
}

const UNSPLASH = {
  lab: [
    'https://images.unsplash.com/photo-1582719471384-894fbb16e074?w=800&q=80',
    'https://images.unsplash.com/photo-1532094349884-543bc11b234d?w=800&q=80',
    'https://images.unsplash.com/photo-1532187863486-abf9dbad1b69?w=800&q=80',
  ],
  equipment: [
    'https://images.unsplash.com/photo-1581093458791-9f3c3900df4b?w=600&q=80',
    'https://images.unsplash.com/photo-1532094349884-543bc11b234d?w=600&q=80',
    'https://images.unsplash.com/photo-1582719471384-894fbb16e074?w=600&q=80',
    'https://images.unsplash.com/photo-1518770660439-4636190af475?w=600&q=80',
    'https://images.unsplash.com/photo-1558618666-fcd25c85f82e?w=600&q=80',
    'https://images.unsplash.com/photo-1581092160562-40aa08e78837?w=600&q=80',
    'https://images.unsplash.com/photo-1563770557-37c45e7d2b7e?w=600&q=80',
    'https://images.unsplash.com/photo-1555664424-778a69022365?w=600&q=80',
    'https://images.unsplash.com/photo-1516110833967-0b5716ca1387?w=600&q=80',
    'https://images.unsplash.com/photo-1580584126903-c17d41830450?w=600&q=80',
  ],
  service: [
    'https://images.unsplash.com/photo-1581093458791-9f3c3900df4b?w=600&q=80',
    'https://images.unsplash.com/photo-1532094349884-543bc11b234d?w=600&q=80',
    'https://images.unsplash.com/photo-1582719471384-894fbb16e074?w=600&q=80',
    'https://images.unsplash.com/photo-1518770660439-4636190af475?w=600&q=80',
    'https://images.unsplash.com/photo-1558618666-fcd25c85f82e?w=600&q=80',
    'https://images.unsplash.com/photo-1581092160562-40aa08e78837?w=600&q=80',
    'https://images.unsplash.com/photo-1563770557-37c45e7d2b7e?w=600&q=80',
    'https://images.unsplash.com/photo-1555664424-778a69022365?w=600&q=80',
    'https://images.unsplash.com/photo-1516110833967-0b5716ca1387?w=600&q=80',
    'https://images.unsplash.com/photo-1580584126903-c17d41830450?w=600&q=80',
  ],
  cover: 'https://images.unsplash.com/photo-1582719471384-894fbb16e074?w=1200&q=80',
  logo: 'https://images.unsplash.com/photo-1614680376593-902f74cf0d41?w=200&q=80',
  avatar: 'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?w=200&q=80',
};

/* ─────────────────────── Main ─────────────────────── */

async function main() {
  console.log('🌱 Master Seed starting...');

  /* ── 0.  Admin / Demo users (all 8 roles) ─────────────────────────── */
  const passwordHash = await hashPassword('demo123456');

  const userConfigs = [
    { phone: '+8613800000000', name: '系统管理员',     role: 'SUPER_ADMIN'       as const, email: 'admin.demo@labtest.local' },
    { phone: '+8613800000001', name: '财务管理员',     role: 'FINANCE_ADMIN'     as const, email: 'finance.demo@labtest.local' },
    { phone: '+8613800000002', name: '客户张三',       role: 'CUSTOMER'          as const, email: 'customer1.demo@labtest.local' },
    { phone: '+8613800000003', name: '客户李四',       role: 'CUSTOMER'          as const, email: 'customer2.demo@labtest.local' },
    { phone: '+8613800000004', name: '企业王总',       role: 'ENTERPRISE_MEMBER' as const, email: 'enterprise.demo@labtest.local' },
    { phone: '+8613800000005', name: '企业赵成员',     role: 'ENTERPRISE_MEMBER' as const, email: 'member.demo@labtest.local' },
    { phone: '+8613800000006', name: '实验室伙伴',     role: 'LAB_PARTNER'       as const, email: 'labpartner.demo@labtest.local' },
    { phone: '+8613800000007', name: '技术员小刘',     role: 'TECHNICIAN'        as const, email: 'tech.demo@labtest.local' },
  ];

  const users: Record<string, { id: string; phone: string; role: string; name: string }> = {};

  for (const cfg of userConfigs) {
    const user = await prisma.user.upsert({
      where: { phone: cfg.phone },
      update: {
        passwordHash,
        name: cfg.name,
        role: cfg.role,
        status: 'ACTIVE',
        phoneVerified: true,
        emailVerified: true,
        email: cfg.email,
      },
      create: {
        phone: cfg.phone,
        email: cfg.email,
        passwordHash,
        name: cfg.name,
        role: cfg.role,
        status: 'ACTIVE',
        locale: 'zh-CN',
        phoneVerified: true,
        emailVerified: true,
        avatar: UNSPLASH.avatar,
      },
    });
    users[cfg.phone] = user;
    console.log(`  ✅ User: ${cfg.phone} → ${cfg.role}`);
  }

  /* ── 1.  Wallets ──────────────────────────────────────────────────── */
  for (const cfg of userConfigs) {
    const user = users[cfg.phone];
    await prisma.wallet.upsert({
      where: { userId: user.id },
      update: {},
      create: {
        userId: user.id,
        balance: new Prisma.Decimal(10000),
        frozenAmount: new Prisma.Decimal(0),
        currency: 'CNY',
      },
    });
  }
  console.log('  💰 Wallets seeded');

  /* ── 2.  Company + Memberships + CompanyWallet ────────────────────── */
  const company = await prisma.company.upsert({
    where: { id: 'demo-company-001' },
    update: {},
    create: {
      id: 'demo-company-001',
      name: '示范科技有限公司',
      registrationNo: '91110000MA00XXXX01',
      industry: '新材料',
      size: '100-500人',
      address: '北京市海淀区中关村大街1号',
      contactPerson: '企业王总',
      contactPhone: '+8613800000004',
      contactEmail: 'enterprise@demo.com',
      logo: UNSPLASH.logo,
      status: 'VERIFIED',
      contractPricing: true,
      billingEnabled: true,
      approvalRequired: true,
    },
  });

  await prisma.companyMembership.upsert({
    where: { userId: users['+8613800000004'].id },
    update: {},
    create: {
      userId: users['+8613800000004'].id,
      companyId: company.id,
      role: 'owner',
    },
  });

  await prisma.companyMembership.upsert({
    where: { userId: users['+8613800000005'].id },
    update: {},
    create: {
      userId: users['+8613800000005'].id,
      companyId: company.id,
      role: 'member',
    },
  });

  await prisma.companyWallet.upsert({
    where: { companyId: company.id },
    update: {},
    create: {
      companyId: company.id,
      balance: new Prisma.Decimal(50000),
      frozenAmount: new Prisma.Decimal(0),
      creditLimit: new Prisma.Decimal(100000),
      currency: 'CNY',
    },
  });
  console.log('  🏢 Company seeded');

  /* ── 3.  Addresses ────────────────────────────────────────────────── */
  const addressData = [
    {
      id: 'demo-addr-001',
      userPhone: '+8613800000002',
      label: '公司',
      name: '客户张三',
      phone: '+8613800000002',
      province: '上海市',
      city: '上海市',
      district: '浦东新区',
      street: '张江高科技园区科苑路88号',
      postalCode: '201203',
    },
    {
      id: 'demo-addr-002',
      userPhone: '+8613800000003',
      label: '家里',
      name: '客户李四',
      phone: '+8613800000003',
      province: '广东省',
      city: '深圳市',
      district: '南山区',
      street: '粤海街道高新南一道1号',
      postalCode: '518057',
    },
    {
      id: 'demo-addr-003',
      userPhone: '+8613800000004',
      label: '公司总部',
      name: '企业王总',
      phone: '+8613800000004',
      province: '北京市',
      city: '北京市',
      district: '海淀区',
      street: '中关村大街1号',
      postalCode: '100080',
    },
    {
      id: 'demo-addr-004',
      userPhone: '+8613800000005',
      label: '办公地址',
      name: '企业赵成员',
      phone: '+8613800000005',
      province: '北京市',
      city: '北京市',
      district: '海淀区',
      street: '中关村大街1号',
      postalCode: '100080',
    },
  ];

  for (const addr of addressData) {
    await prisma.address.upsert({
      where: { id: addr.id },
      update: {},
      create: {
        id: addr.id,
        userId: users[addr.userPhone].id,
        label: addr.label,
        name: addr.name,
        phone: addr.phone,
        province: addr.province,
        city: addr.city,
        district: addr.district,
        street: addr.street,
        postalCode: addr.postalCode,
        isDefault: true,
      },
    });
  }
  console.log('  📍 Addresses seeded');

  /* ── 4.  Invoice Profiles ─────────────────────────────────────────── */
  await prisma.invoiceProfile.upsert({
    where: { id: 'demo-inv-001' },
    update: {},
    create: {
      id: 'demo-inv-001',
      userId: users['+8613800000004'].id,
      companyName: '示范科技有限公司',
      taxNumber: '91110000MA00XXXX01',
      bankName: '中国工商银行北京分行',
      bankAccount: '0200 1234 5678 9012 345',
      address: '北京市海淀区中关村大街1号',
      phone: '010-12345678',
      isDefault: true,
    },
  });
  console.log('  🧾 Invoice profiles seeded');

  /* ── 5.  Site Settings ────────────────────────────────────────────── */
  await prisma.siteSetting.upsert({
    where: { id: 'default' },
    update: {},
    create: {
      id: 'default',
      siteName: '度量衡科研平台',
      siteNameEn: 'Metrology Research Platform',
      logoUrl: UNSPLASH.logo,
      logoUploadUrl: UNSPLASH.logo,
      faviconUrl: UNSPLASH.logo,
      brandColor: '#0066B3',
      supportEmail: 'support@labtest.com',
      supportPhone: '400-888-8888',
      addressZh: '北京市朝阳区科技园区',
      footerTextZh: '立足科学前沿，服务中国创新',
      footerTextEn: 'At the forefront of science, serving innovation in China',
      footerCopyrightZh: `© ${new Date().getFullYear()} 度量衡科研平台`,
      footerCopyrightEn: `© ${new Date().getFullYear()} Metrology Research Platform`,
      footerContactPhone: '400-888-8888',
      footerContactEmail: 'contact@labtest.com',
      footerContactAddress: '北京市朝阳区科技园区',
      footerIcp: '京ICP备12345678号',
      seoTitleZh: '度量衡科研平台 — 一站式检测服务平台',
      seoTitleEn: 'Metrology Research Platform — One-Stop Testing Service',
      seoDescriptionZh: '连接企业与优质实验室，提供高效、透明、可靠的检测解决方案',
      seoDescriptionEn: 'Connecting enterprises with quality labs for efficient testing solutions',
      seoKeywordsZh: '检测,科研,实验室,材料测试',
      seoKeywordsEn: 'testing, laboratory, materials, research',
    },
  });
  console.log('  ⚙️ Site settings seeded');

  /* ── 6.  App Config ───────────────────────────────────────────────── */
  const appConfigs = [
    { key: 'GOOGLE_MAPS_API_KEY', value: '', category: 'maps', description: 'Google Maps API Key' },
    { key: 'SMTP_HOST', value: 'smtp.qq.com', category: 'email', description: 'SMTP Server Host' },
    { key: 'SMTP_PORT', value: '587', category: 'email', description: 'SMTP Server Port' },
    { key: 'SMS_API_KEY', value: '', category: 'sms', description: 'SMS Provider API Key' },
    { key: 'OSS_ACCESS_KEY_ID', value: '', category: 'storage', description: 'Alibaba OSS Access Key ID' },
  ];

  for (const cfg of appConfigs) {
    await prisma.appConfig.upsert({
      where: { key: cfg.key },
      update: {},
      create: { ...cfg, isEncrypted: false },
    });
  }
  console.log('  🔧 App config seeded');

  /* ── 7.  Laboratories (4) ─────────────────────────────────────────── */
  const labData = [
    {
      id: 'demo-lab-001',
      slug: 'beijing-testing-center',
      nameZh: '北京检测中心',
      nameEn: 'Beijing Testing Center',
      shortDescZh: '国家级第三方检测机构',
      shortDescEn: 'National third-party testing institution',
      fullDescZh:
        '拥有CNAS和CMA双认证，配备国际先进检测设备，提供材料力学、化学成分、环境模拟等全方位检测服务。服务范围覆盖航空航天、汽车制造、电子电器等多个领域。',
      fullDescEn:
        'CNAS and CMA certified, equipped with internationally advanced testing facilities, providing comprehensive testing services including material mechanics, chemical composition, and environmental simulation.',
      city: '北京',
      province: '北京市',
      address: '北京市海淀区中关村科学城北区',
      phone: '010-12345678',
      email: 'contact@bjtest.com',
      website: 'https://bjtest.demo',
      logo: UNSPLASH.lab[0],
      coverImage: '/uploads/settings/lab-1.jpg',
      imageUrl: '/uploads/settings/lab-1.jpg',
      certifications: ['CNAS', 'CMA', 'ISO 17025'],
      specialties: ['材料检测', '环境检测', '电子电器'],
      operatingHours: { weekday: '09:00-18:00', weekend: '10:00-16:00' },
      status: 'ACTIVE',
      rating: new Prisma.Decimal(4.8),
      completedOrders: 500,
      avgTurnaroundDays: new Prisma.Decimal(7),
    },
    {
      id: 'demo-lab-002',
      slug: 'shanghai-material-lab',
      nameZh: '上海材料实验室',
      nameEn: 'Shanghai Material Laboratory',
      shortDescZh: '专注于新材料研发与检测',
      shortDescEn: 'Specializing in new material R&D and testing',
      fullDescZh:
        '依托上海交通大学材料学院，拥有扫描电镜、X射线衍射仪等高端设备，专注于纳米材料、复合材料、生物材料的检测与研发。',
      fullDescEn:
        'Affiliated with Shanghai Jiao Tong University Materials School, equipped with SEM, XRD and other high-end instruments.',
      city: '上海',
      province: '上海市',
      address: '上海市闵行区东川路800号',
      phone: '021-87654321',
      email: 'info@shmaterial.demo',
      website: 'https://shmaterial.demo',
      logo: UNSPLASH.lab[1],
      coverImage: '/uploads/settings/lab-2.jpg',
      imageUrl: '/uploads/settings/lab-2.jpg',
      certifications: ['CNAS', 'CMA', 'NADCAP'],
      specialties: ['金属材料', '高分子材料', '纳米材料'],
      operatingHours: { weekday: '08:30-17:30', weekend: 'closed' },
      status: 'ACTIVE',
      rating: new Prisma.Decimal(4.9),
      completedOrders: 320,
      avgTurnaroundDays: new Prisma.Decimal(5),
    },
    {
      id: 'demo-lab-003',
      slug: 'shenzhen-electronics-lab',
      nameZh: '深圳电子检测实验室',
      nameEn: 'Shenzhen Electronics Testing Lab',
      shortDescZh: '华南领先的电子电器检测机构',
      shortDescEn: 'Leading electronics testing lab in South China',
      fullDescZh:
        '位于深圳南山科技园，拥有EMC测试、安规测试、可靠性测试等全套能力，服务华为、大疆等知名企业。',
      fullDescEn:
        'Located in Shenzhen Nanshan Tech Park, offering full EMC, safety and reliability testing capabilities.',
      city: '深圳',
      province: '广东省',
      address: '深圳市南山区高新南一道9号',
      phone: '0755-12345678',
      email: 'service@szemc.demo',
      website: 'https://szemc.demo',
      logo: UNSPLASH.lab[2],
      coverImage: '/uploads/settings/lab-3.jpg',
      imageUrl: '/uploads/settings/lab-3.jpg',
      certifications: ['CNAS', 'CMA', 'UL', 'TÜV'],
      specialties: ['EMC测试', '安规测试', '可靠性测试'],
      operatingHours: { weekday: '09:00-18:00', weekend: '09:00-12:00' },
      status: 'ACTIVE',
      rating: new Prisma.Decimal(4.7),
      completedOrders: 780,
      avgTurnaroundDays: new Prisma.Decimal(3),
    },
    {
      id: 'demo-lab-004',
      slug: 'smart-manufacturing-lab',
      nameZh: '智能制造与材料工程实验室',
      nameEn: 'Smart Manufacturing & Materials Engineering Lab',
      shortDescZh: '专注于高分子材料研发、3D打印工艺优化及工业级设备可靠性验证',
      shortDescEn: 'Focuses on polymer R&D, 3D-printing process optimization, and industrial equipment reliability verification',
      fullDescZh:
        '位于深圳光明科学城，配备工业级3D打印系统、高分子合成与表征平台、可靠性加速寿命试验设备。为新能源、消费电子、医疗器械等行业提供从材料研发到量产验证的全链条服务。',
      fullDescEn:
        'Located in Shenzhen Guangming Science City, equipped with industrial-grade 3D printing systems, polymer synthesis & characterization platforms, and accelerated life-test equipment.',
      city: '深圳',
      province: '广东省',
      address: '深圳市光明区新湖街道光辉大道168号',
      phone: '0755-98765432',
      email: 'contact@smartmfg.demo',
      website: 'https://smartmfg.demo',
      logo: UNSPLASH.lab[0],
      coverImage: '/uploads/settings/lab-4.jpg',
      imageUrl: '/uploads/settings/lab-4.jpg',
      certifications: ['CNAS', 'CMA', 'ISO 9001'],
      specialties: ['高分子材料', '3D打印', '可靠性验证'],
      operatingHours: { weekday: '08:30-17:30', weekend: 'closed' },
      status: 'ACTIVE',
      rating: new Prisma.Decimal(4.9),
      completedOrders: 420,
      avgTurnaroundDays: new Prisma.Decimal(6),
    },
  ];

  const labs: Record<string, typeof labData[0] & { dbId: string }> = {};

  for (const lab of labData) {
    const created = await prisma.laboratory.upsert({
      where: { slug: lab.slug },
      update: {
        imageUrl: lab.imageUrl,
        coverImage: lab.coverImage,
      },
      create: {
        id: lab.id,
        slug: lab.slug,
        nameZh: lab.nameZh,
        nameEn: lab.nameEn,
        shortDescZh: lab.shortDescZh,
        shortDescEn: lab.shortDescEn,
        fullDescZh: lab.fullDescZh,
        fullDescEn: lab.fullDescEn,
        city: lab.city,
        province: lab.province,
        address: lab.address,
        phone: lab.phone,
        email: lab.email,
        website: lab.website,
        logo: lab.logo,
        coverImage: lab.coverImage,
        imageUrl: lab.imageUrl,
        certifications: lab.certifications,
        specialties: lab.specialties,
        operatingHours: lab.operatingHours,
        status: lab.status as any,
        rating: lab.rating,
        completedOrders: lab.completedOrders,
        avgTurnaroundDays: lab.avgTurnaroundDays,
      },
    });
    labs[lab.slug] = { ...lab, dbId: created.id };
    console.log(`  🔬 Lab: ${lab.nameZh}`);
  }

  /* ── 8.  LabUser + LabWallet ──────────────────────────────────────── */
  await prisma.labUser.upsert({
    where: { userId: users['+8613800000006'].id },
    update: {},
    create: {
      userId: users['+8613800000006'].id,
      labId: labs['beijing-testing-center'].dbId,
      role: 'admin',
    },
  });

  for (const lab of Object.values(labs)) {
    await prisma.labWallet.upsert({
      where: { labId: lab.dbId },
      update: {},
      create: {
        labId: lab.dbId,
        balance: new Prisma.Decimal(0),
        frozenAmount: new Prisma.Decimal(0),
        totalEarned: new Prisma.Decimal(0),
        totalWithdrawn: new Prisma.Decimal(0),
        currency: 'CNY',
      },
    });
  }
  console.log('  🔗 LabUsers & LabWallets seeded');

  /* ── 9.  LabMedia ─────────────────────────────────────────────────── */
  for (let i = 0; i < labData.length; i++) {
    const lab = Object.values(labs)[i];
    await prisma.labMedia.upsert({
      where: { id: `lab-media-${i + 1}` },
      update: {},
      create: {
        id: `lab-media-${i + 1}`,
        labId: lab.dbId,
        type: 'photo',
        url: UNSPLASH.lab[i % UNSPLASH.lab.length],
        caption: lab.nameZh,
        sortOrder: i,
      },
    });
  }
  console.log('  🖼️ LabMedia seeded');

  /* ── 10. Service Categories ───────────────────────────────────────── */
  const categories = [
    { slug: 'material-testing',    nameZh: '材料检测',       nameEn: 'Material Testing',       sortOrder: 1, icon: '🔬', iconUrl: '', image: UNSPLASH.service[0] },
    { slug: 'environmental',       nameZh: '环境检测',       nameEn: 'Environmental Testing',  sortOrder: 2, icon: '🌿', iconUrl: '', image: UNSPLASH.service[1] },
    { slug: 'electrical',          nameZh: '电子电器检测',   nameEn: 'Electrical Testing',     sortOrder: 3, icon: '⚡', iconUrl: '', image: UNSPLASH.service[2] },
    { slug: 'mechanical',          nameZh: '机械检测',       nameEn: 'Mechanical Testing',     sortOrder: 4, icon: '⚙️', iconUrl: '', image: UNSPLASH.service[3] },
    { slug: 'chemical',            nameZh: '化学分析',       nameEn: 'Chemical Analysis',      sortOrder: 5, icon: '🧪', iconUrl: '', image: UNSPLASH.service[4] },
    { slug: 'biological',          nameZh: '生物检测',       nameEn: 'Biological Testing',     sortOrder: 6, icon: '🧬', iconUrl: '', image: UNSPLASH.service[5] },
    { slug: 'patent-services',     nameZh: '专利服务',       nameEn: 'Patent Services',        sortOrder: 7, icon: '📄', iconUrl: '', image: UNSPLASH.service[6] },
    { slug: 'paper-services',      nameZh: '论文服务',       nameEn: 'Paper Services',         sortOrder: 8, icon: '📝', iconUrl: '', image: UNSPLASH.service[7] },
  ];

  const categoryMap: Record<string, { id: string; slug: string }> = {};

  for (const cat of categories) {
    const created = await prisma.serviceCategory.upsert({
      where: { slug: cat.slug },
      update: {},
      create: {
        slug: cat.slug,
        nameZh: cat.nameZh,
        nameEn: cat.nameEn,
        sortOrder: cat.sortOrder,
        icon: cat.icon,
        iconUrl: cat.iconUrl || null,
        image: cat.image,
        isActive: true,
        descZh: `专业的${cat.nameZh}服务，提供权威可靠的检测报告。`,
        descEn: `Professional ${cat.nameEn} services with authoritative reports.`,
      },
    });
    categoryMap[cat.slug] = { id: created.id, slug: cat.slug };
  }
  console.log('  📂 Service categories seeded');

  /* ── 11. Materials ────────────────────────────────────────────────── */
  const materials = [
    { slug: 'metal',       nameZh: '金属材料',       nameEn: 'Metal Materials' },
    { slug: 'polymer',     nameZh: '高分子材料',     nameEn: 'Polymer Materials' },
    { slug: 'ceramic',     nameZh: '陶瓷材料',       nameEn: 'Ceramic Materials' },
    { slug: 'composite',   nameZh: '复合材料',       nameEn: 'Composite Materials' },
    { slug: 'semiconductor', nameZh: '半导体材料',   nameEn: 'Semiconductor Materials' },
  ];

  const materialMap: Record<string, { id: string }> = {};
  for (const m of materials) {
    const created = await prisma.material.upsert({
      where: { slug: m.slug },
      update: {},
      create: { ...m, isActive: true },
    });
    materialMap[m.slug] = { id: created.id };
  }
  console.log('  🧱 Materials seeded');

  /* ── 12. Industries ───────────────────────────────────────────────── */
  const industries = [
    { slug: 'aerospace',   nameZh: '航空航天',       nameEn: 'Aerospace' },
    { slug: 'automotive',  nameZh: '汽车制造',       nameEn: 'Automotive' },
    { slug: 'electronics', nameZh: '电子电器',       nameEn: 'Electronics' },
    { slug: 'medical',     nameZh: '医疗器械',       nameEn: 'Medical Devices' },
    { slug: 'energy',      nameZh: '新能源',         nameEn: 'New Energy' },
  ];

  const industryMap: Record<string, { id: string }> = {};
  for (const ind of industries) {
    const created = await prisma.industry.upsert({
      where: { slug: ind.slug },
      update: {},
      create: { ...ind, isActive: true },
    });
    industryMap[ind.slug] = { id: created.id };
  }
  console.log('  🏭 Industries seeded');

  /* ── 13. Testing Standards ────────────────────────────────────────── */
  const standards = [
    { code: 'GB/T',   nameZh: '中国国家标准',         nameEn: 'Chinese National Standard',       organization: '国家标准化管理委员会' },
    { code: 'ASTM',   nameZh: '美国材料试验协会',     nameEn: 'ASTM International',              organization: 'ASTM International' },
    { code: 'ISO',    nameZh: '国际标准化组织',       nameEn: 'International Organization for Standardization', organization: 'ISO' },
    { code: 'JIS',    nameZh: '日本工业标准',         nameEn: 'Japanese Industrial Standards',   organization: 'JISC' },
    { code: 'DIN',    nameZh: '德国工业标准',         nameEn: 'German Industrial Standard',      organization: 'DIN' },
  ];

  const standardMap: Record<string, { id: string }> = {};
  for (const std of standards) {
    const created = await prisma.testingStandard.upsert({
      where: { code: std.code },
      update: {},
      create: { ...std, isActive: true },
    });
    standardMap[std.code] = { id: created.id };
  }
  console.log('  📋 Testing standards seeded');

  /* ── 14. Testing Services (10) ────────────────────────────────────── */
  const services = [
    {
      slug: 'tensile-testing',
      nameZh: '拉伸性能测试',
      nameEn: 'Tensile Performance Testing',
      categorySlug: 'material-testing',
      priceMin: 300,
      priceMax: 1500,
      turnaroundDays: 3,
      materialSlugs: ['metal', 'polymer'],
      industrySlugs: ['automotive', 'aerospace'],
      standardSlugs: ['GB/T', 'ASTM'],
    },
    {
      slug: 'hardness-testing',
      nameZh: '硬度测试',
      nameEn: 'Hardness Testing',
      categorySlug: 'material-testing',
      priceMin: 200,
      priceMax: 800,
      turnaroundDays: 2,
      materialSlugs: ['metal', 'ceramic'],
      industrySlugs: ['automotive', 'electronics'],
      standardSlugs: ['GB/T', 'ISO'],
    },
    {
      slug: 'emc-testing',
      nameZh: '电磁兼容测试',
      nameEn: 'EMC Testing',
      categorySlug: 'electrical',
      priceMin: 2000,
      priceMax: 8000,
      turnaroundDays: 5,
      materialSlugs: ['semiconductor'],
      industrySlugs: ['electronics', 'automotive'],
      standardSlugs: ['GB/T', 'ISO', 'DIN'],
    },
    {
      slug: 'environmental-reliability',
      nameZh: '环境可靠性测试',
      nameEn: 'Environmental Reliability Testing',
      categorySlug: 'environmental',
      priceMin: 1500,
      priceMax: 6000,
      turnaroundDays: 7,
      materialSlugs: ['polymer', 'composite'],
      industrySlugs: ['aerospace', 'energy'],
      standardSlugs: ['GB/T', 'ASTM', 'JIS'],
    },
    {
      slug: 'chemical-composition',
      nameZh: '化学成分分析',
      nameEn: 'Chemical Composition Analysis',
      categorySlug: 'chemical',
      priceMin: 500,
      priceMax: 2500,
      turnaroundDays: 3,
      materialSlugs: ['metal', 'ceramic', 'semiconductor'],
      industrySlugs: ['electronics', 'medical'],
      standardSlugs: ['GB/T', 'ASTM'],
    },
    {
      slug: 'fatigue-testing',
      nameZh: '疲劳性能测试',
      nameEn: 'Fatigue Performance Testing',
      categorySlug: 'mechanical',
      priceMin: 1000,
      priceMax: 5000,
      turnaroundDays: 5,
      materialSlugs: ['metal', 'composite'],
      industrySlugs: ['aerospace', 'automotive'],
      standardSlugs: ['ASTM', 'ISO', 'DIN'],
    },
    {
      slug: 'biocompatibility',
      nameZh: '生物相容性测试',
      nameEn: 'Biocompatibility Testing',
      categorySlug: 'biological',
      priceMin: 3000,
      priceMax: 12000,
      turnaroundDays: 14,
      materialSlugs: ['polymer'],
      industrySlugs: ['medical'],
      standardSlugs: ['ISO', 'GB/T'],
    },
    {
      slug: 'thermal-analysis',
      nameZh: '热分析测试',
      nameEn: 'Thermal Analysis Testing',
      categorySlug: 'material-testing',
      priceMin: 800,
      priceMax: 3000,
      turnaroundDays: 3,
      materialSlugs: ['polymer', 'metal', 'ceramic'],
      industrySlugs: ['electronics', 'energy'],
      standardSlugs: ['GB/T', 'ISO'],
    },
    {
      slug: 'patent-search',
      nameZh: '专利检索分析',
      nameEn: 'Patent Search & Analysis',
      categorySlug: 'patent-services',
      priceMin: 2000,
      priceMax: 10000,
      turnaroundDays: 10,
      materialSlugs: [],
      industrySlugs: ['electronics', 'medical', 'energy'],
      standardSlugs: [],
    },
    {
      slug: 'paper-editing',
      nameZh: '论文润色修改',
      nameEn: 'Academic Paper Editing',
      categorySlug: 'paper-services',
      priceMin: 500,
      priceMax: 3000,
      turnaroundDays: 5,
      materialSlugs: [],
      industrySlugs: [],
      standardSlugs: [],
    },
  ];

  const serviceMap: Record<string, { id: string; slug: string }> = {};

  for (let i = 0; i < services.length; i++) {
    const svc = services[i];
    const cat = categoryMap[svc.categorySlug];
    if (!cat) continue;

    const created = await prisma.testingService.upsert({
      where: { slug: svc.slug },
      update: {},
      create: {
        slug: svc.slug,
        categoryId: cat.id,
        nameZh: svc.nameZh,
        nameEn: svc.nameEn,
        shortDescZh: `专业${svc.nameZh}服务，数据准确可靠。`,
        shortDescEn: `Professional ${svc.nameEn} with accurate and reliable data.`,
        fullDescZh:
          `我们的${svc.nameZh}服务采用国际先进设备，严格遵循${svc.standardSlugs.join('、')}标准，为客户提供权威可靠的检测报告。`,
        fullDescEn:
          `Our ${svc.nameEn} service uses internationally advanced equipment and strictly follows ${svc.standardSlugs.join(', ')} standards.`,
        pricingModel: svc.priceMax > 5000 ? 'RANGE' : 'FIXED',
        priceMin: new Prisma.Decimal(svc.priceMin),
        priceMax: new Prisma.Decimal(svc.priceMax),
        currency: 'CNY',
        turnaroundDays: svc.turnaroundDays,
        sampleRequirement: '样品量≥50g，固体/液体均可',
        sampleCount: '1-3个平行样',
        sampleSize: '根据具体测试项目确定',
        sampleWeight: '≥50g',
        sampleCondition: '常温干燥保存',
        samplePreservation: '密封避光，常温运输',
        samplePreparation: '客户可自行制备或委托实验室制备',
        deliverables: '电子版报告 + 纸质报告（可选）',
        isActive: true,
        isFeatured: i < 4,
        isHot: i < 3,
        sortOrder: i,
        seoTitleZh: `${svc.nameZh} — 专业检测服务平台`,
        seoTitleEn: `${svc.nameEn} — Professional Testing Platform`,
        seoDescZh: `提供权威的${svc.nameZh}服务，检测报告具有CNAS/CMA认证效力。`,
        seoDescEn: `Authoritative ${svc.nameEn} service with CNAS/CMA certified reports.`,
      },
    });
    serviceMap[svc.slug] = { id: created.id, slug: svc.slug };

    // Link materials
    for (const ms of svc.materialSlugs) {
      const m = materialMap[ms];
      if (m) {
        await prisma.serviceMaterial.upsert({
          where: { serviceId_materialId: { serviceId: created.id, materialId: m.id } },
          update: {},
          create: { serviceId: created.id, materialId: m.id },
        });
      }
    }

    // Link industries
    for (const ins of svc.industrySlugs) {
      const ind = industryMap[ins];
      if (ind) {
        await prisma.serviceIndustry.upsert({
          where: { serviceId_industryId: { serviceId: created.id, industryId: ind.id } },
          update: {},
          create: { serviceId: created.id, industryId: ind.id },
        });
      }
    }

    // Link standards
    for (const ss of svc.standardSlugs) {
      const std = standardMap[ss];
      if (std) {
        await prisma.serviceStandard.upsert({
          where: { serviceId_standardId: { serviceId: created.id, standardId: std.id } },
          update: {},
          create: { serviceId: created.id, standardId: std.id },
        });
      }
    }
  }
  console.log('  🧪 Testing services seeded (10)');

  /* ── 15. TestingServiceCustomField ────────────────────────────────── */
  const customFields = [
    { serviceSlug: 'tensile-testing', label: '试样标距', fieldType: 'TEXT', isRequired: true, placeholder: '请输入标距长度(mm)' },
    { serviceSlug: 'tensile-testing', label: '加载速率', fieldType: 'SELECT', options: '1mm/min,5mm/min,10mm/min,50mm/min', isRequired: true },
    { serviceSlug: 'emc-testing', label: '产品型号', fieldType: 'TEXT', isRequired: true, placeholder: '请输入产品型号' },
    { serviceSlug: 'emc-testing', label: '工作频率', fieldType: 'TEXT', isRequired: false, placeholder: '例如: 2.4GHz' },
    { serviceSlug: 'chemical-composition', label: '目标元素', fieldType: 'TEXT', isRequired: true, placeholder: '例如: Fe, C, Mn' },
  ];

  for (const cf of customFields) {
    const svc = serviceMap[cf.serviceSlug];
    if (!svc) continue;
    await prisma.testingServiceCustomField.upsert({
      where: { id: `cf-${cf.serviceSlug}-${cf.label}` },
      update: {},
      create: {
        id: `cf-${cf.serviceSlug}-${cf.label}`,
        serviceId: svc.id,
        label: cf.label,
        fieldType: cf.fieldType,
        options: cf.options || null,
        isRequired: cf.isRequired,
        placeholder: cf.placeholder || null,
        sortOrder: 0,
      },
    });
  }
  console.log('  📝 Custom fields seeded');

  /* ── 16. LabService links ─────────────────────────────────────────── */
  const labServiceLinks = [
    { labSlug: 'beijing-testing-center', serviceSlugs: ['tensile-testing', 'hardness-testing', 'thermal-analysis', 'chemical-composition'] },
    { labSlug: 'shanghai-material-lab',  serviceSlugs: ['tensile-testing', 'fatigue-testing', 'chemical-composition', 'thermal-analysis'] },
    { labSlug: 'shenzhen-electronics-lab', serviceSlugs: ['emc-testing', 'environmental-reliability'] },
  ];

  for (const link of labServiceLinks) {
    const lab = labs[link.labSlug];
    if (!lab) continue;
    for (const ss of link.serviceSlugs) {
      const svc = serviceMap[ss];
      if (!svc) continue;
      await prisma.labService.upsert({
        where: { labId_serviceId: { labId: lab.dbId, serviceId: svc.id } },
        update: {},
        create: {
          labId: lab.dbId,
          serviceId: svc.id,
          isActive: true,
        },
      });
    }
  }
  console.log('  🔗 LabService links seeded');

  /* ── 17. Equipment (10) ───────────────────────────────────────────── */
  const equipmentList = [
    {
      slug: 'universal-testing-machine',
      nameZh: '万能材料试验机',
      nameEn: 'Universal Testing Machine',
      labSlug: 'beijing-testing-center',
      model: 'Instron 5985',
      manufacturer: 'Instron',
      descZh: '可进行拉伸、压缩、弯曲等多种力学性能测试，最大载荷250kN。',
      descEn: 'Multi-purpose mechanical testing with max load 250kN.',
      hourlyRate: 300,
      quantity: 2,
    },
    {
      slug: 'sem-microscope',
      nameZh: '扫描电子显微镜',
      nameEn: 'Scanning Electron Microscope',
      labSlug: 'shanghai-material-lab',
      model: 'ZEISS Sigma 300',
      manufacturer: 'ZEISS',
      descZh: '高分辨率表面形貌观察与成分分析，分辨率可达1.0nm。',
      descEn: 'High-resolution surface imaging with 1.0nm resolution.',
      hourlyRate: 500,
      quantity: 1,
    },
    {
      slug: 'emc-chamber',
      nameZh: '电磁兼容暗室',
      nameEn: 'EMC Anechoic Chamber',
      labSlug: 'shenzhen-electronics-lab',
      model: 'ETS-Lindgren 3m',
      manufacturer: 'ETS-Lindgren',
      descZh: '3米法电波暗室，满足CISPR 16标准，频率范围30MHz-18GHz。',
      descEn: '3-meter anechoic chamber, CISPR 16 compliant, 30MHz-18GHz.',
      hourlyRate: 800,
      quantity: 1,
    },
    {
      slug: 'xrd-diffractometer',
      nameZh: 'X射线衍射仪',
      nameEn: 'X-Ray Diffractometer',
      labSlug: 'shanghai-material-lab',
      model: 'Bruker D8 Advance',
      manufacturer: 'Bruker',
      descZh: '物相分析、晶体结构测定，角度范围2θ: -110°~168°。',
      descEn: 'Phase analysis and crystal structure determination.',
      hourlyRate: 400,
      quantity: 1,
    },
    {
      slug: 'hardness-tester',
      nameZh: '维氏硬度计',
      nameEn: 'Vickers Hardness Tester',
      labSlug: 'beijing-testing-center',
      model: 'Mitutoyo HM-220',
      manufacturer: 'Mitutoyo',
      descZh: '显微硬度测试，载荷范围10gf-2kgf，自动压痕测量。',
      descEn: 'Micro-hardness testing with auto indentation measurement.',
      hourlyRate: 150,
      quantity: 3,
    },
    {
      slug: 'thermal-analyzer',
      nameZh: '差示扫描量热仪',
      nameEn: 'Differential Scanning Calorimeter',
      labSlug: 'shanghai-material-lab',
      model: 'TA Instruments Q2000',
      manufacturer: 'TA Instruments',
      descZh: '热转变温度、比热容测定，温度范围-90°C~550°C。',
      descEn: 'Thermal transition and heat capacity measurement.',
      hourlyRate: 350,
      quantity: 1,
    },
    {
      slug: 'climate-chamber',
      nameZh: '恒温恒湿试验箱',
      nameEn: 'Climate Test Chamber',
      labSlug: 'shenzhen-electronics-lab',
      model: 'Weiss WK3-180/40',
      manufacturer: 'Weiss Technik',
      descZh: '温度范围-40°C~180°C，湿度范围10%~98%RH，容积180L。',
      descEn: 'Temp -40°C~180°C, humidity 10%~98%RH, 180L volume.',
      hourlyRate: 200,
      quantity: 4,
    },
    {
      slug: 'icp-ms',
      nameZh: '电感耦合等离子体质谱仪',
      nameEn: 'ICP-MS',
      labSlug: 'beijing-testing-center',
      model: 'PerkinElmer NexION 2000',
      manufacturer: 'PerkinElmer',
      descZh: '痕量元素分析，检出限可达ppt级，可同时测定70+元素。',
      descEn: 'Trace element analysis with ppt-level detection limits.',
      hourlyRate: 600,
      quantity: 1,
    },
    {
      slug: 'fatigue-testing-machine',
      nameZh: '高频疲劳试验机',
      nameEn: 'High-Frequency Fatigue Tester',
      labSlug: 'shanghai-material-lab',
      model: 'Shimadzu EHF-EM100kN',
      manufacturer: 'Shimadzu',
      descZh: '拉压疲劳测试，频率范围0.01Hz~100Hz，最大载荷100kN。',
      descEn: 'Tension-compression fatigue testing, 0.01Hz~100Hz.',
      hourlyRate: 450,
      quantity: 1,
    },
    {
      slug: 'spectrophotometer',
      nameZh: '紫外可见分光光度计',
      nameEn: 'UV-Vis Spectrophotometer',
      labSlug: 'beijing-testing-center',
      model: 'Shimadzu UV-2600i',
      manufacturer: 'Shimadzu',
      descZh: '波长范围185nm~900nm，带宽0.1/0.2/0.5/1/2/5nm可选。',
      descEn: 'Wavelength range 185nm~900nm with selectable bandwidth.',
      hourlyRate: 120,
      quantity: 2,
    },
  ];

  const equipmentMap: Record<string, { id: string }> = {};

  for (let i = 0; i < equipmentList.length; i++) {
    const eq = equipmentList[i];
    const lab = labs[eq.labSlug];
    const created = await prisma.equipment.upsert({
      where: { slug: eq.slug },
      update: {},
      create: {
        slug: eq.slug,
        labId: lab?.dbId || null,
        nameZh: eq.nameZh,
        nameEn: eq.nameEn,
        model: eq.model,
        manufacturer: eq.manufacturer,
        descZh: eq.descZh,
        descEn: eq.descEn,
        specifications: {
          capacity: eq.slug.includes('universal') ? '250kN' : 'N/A',
          resolution: '0.001N',
          accuracy: '±0.5%',
        },
        certifications: ['CNAS', 'CMA'],
        images: [UNSPLASH.equipment[i % UNSPLASH.equipment.length]],
        status: 'AVAILABLE',
        bookable: true,
        quantity: eq.quantity,
        hourlyRate: new Prisma.Decimal(eq.hourlyRate),
        isActive: true,
      },
    });
    equipmentMap[eq.slug] = { id: created.id };

    // Equipment media
    await prisma.equipmentMedia.upsert({
      where: { id: `eq-media-${i}` },
      update: {},
      create: {
        id: `eq-media-${i}`,
        equipmentId: created.id,
        url: UNSPLASH.equipment[i % UNSPLASH.equipment.length],
        caption: eq.nameZh,
        sortOrder: 0,
      },
    });
  }
  console.log('  🔧 Equipment seeded (10)');

  /* ── 18. TestingServiceMedia ──────────────────────────────────────── */
  for (let i = 0; i < services.length; i++) {
    const svc = serviceMap[services[i].slug];
    if (!svc) continue;
    await prisma.testingServiceMedia.upsert({
      where: { id: `svc-media-${i}` },
      update: {},
      create: {
        id: `svc-media-${i}`,
        serviceId: svc.id,
        url: UNSPLASH.service[i % UNSPLASH.service.length],
        caption: services[i].nameZh,
        sortOrder: 0,
      },
    });
  }
  console.log('  🖼️ TestingServiceMedia seeded');

  /* ── 19. CMS Homepage ─────────────────────────────────────────────── */
  const cmsPage = await prisma.cMSPage.upsert({
    where: { slug: 'homepage' },
    update: {},
    create: {
      slug: 'homepage',
      type: 'HOME',
      titleZh: '首页',
      titleEn: 'Home',
      contentZh: '欢迎来到度量衡科研平台',
      contentEn: 'Welcome to Metrology Research Platform',
      excerpt: '一站式检测服务平台',
      coverImage: UNSPLASH.cover,
      isPublished: true,
      sortOrder: 0,
    },
  });

  const heroSection = await prisma.cMSSection.upsert({
    where: { id: 'cms-hero' },
    update: {},
    create: {
      id: 'cms-hero',
      pageId: cmsPage.id,
      sectionKey: 'hero',
      name: 'Hero Banner',
      titleZh: '一站式检测服务平台',
      titleEn: 'One-Stop Testing Service Platform',
      subtitleZh: '连接企业与优质实验室',
      subtitleEn: 'Connecting Enterprises with Quality Labs',
      descriptionZh: '提供高效、透明、可靠的检测解决方案',
      descriptionEn: 'Efficient, transparent, and reliable testing solutions',
      imageUrl: UNSPLASH.cover,
      layoutType: 'fullwidth',
      styleVariant: 'gradient',
      isEnabled: true,
      isPublished: true,
      sortOrder: 0,
    },
  });

  const statsSection = await prisma.cMSSection.upsert({
    where: { id: 'cms-stats' },
    update: {},
    create: {
      id: 'cms-stats',
      pageId: cmsPage.id,
      sectionKey: 'stats',
      name: 'Statistics',
      titleZh: '平台数据',
      titleEn: 'Platform Statistics',
      isEnabled: true,
      isPublished: true,
      sortOrder: 1,
    },
  });

  const statItems = [
    { titleZh: '入驻实验室', titleEn: 'Partner Labs', value: '50+', icon: 'lab' },
    { titleZh: '检测服务', titleEn: 'Testing Services', value: '200+', icon: 'service' },
    { titleZh: '服务企业', titleEn: 'Enterprise Clients', value: '1000+', icon: 'building' },
    { titleZh: '检测报告', titleEn: 'Reports Issued', value: '50000+', icon: 'file' },
  ];

  for (let i = 0; i < statItems.length; i++) {
    const si = statItems[i];
    await prisma.cMSSectionItem.upsert({
      where: { id: `stat-item-${i}` },
      update: {},
      create: {
        id: `stat-item-${i}`,
        sectionId: statsSection.id,
        titleZh: si.titleZh,
        titleEn: si.titleEn,
        value: si.value,
        icon: si.icon,
        sortOrder: i,
        isEnabled: true,
      },
    });
  }

  const labsSection = await prisma.cMSSection.upsert({
    where: { id: 'cms-labs' },
    update: {},
    create: {
      id: 'cms-labs',
      pageId: cmsPage.id,
      sectionKey: 'featured-labs',
      name: 'Featured Labs',
      titleZh: '推荐实验室',
      titleEn: 'Featured Laboratories',
      isEnabled: true,
      isPublished: true,
      sortOrder: 2,
    },
  });

  for (let i = 0; i < labData.length; i++) {
    const lab = labData[i];
    await prisma.cMSSectionItem.upsert({
      where: { id: `lab-item-${i}` },
      update: {},
      create: {
        id: `lab-item-${i}`,
        sectionId: labsSection.id,
        titleZh: lab.nameZh,
        titleEn: lab.nameEn,
        descriptionZh: lab.shortDescZh,
        descriptionEn: lab.shortDescEn,
        imageUrl: lab.logo,
        linkUrl: `/labs/${lab.slug}`,
        sortOrder: i,
        isEnabled: true,
      },
    });
  }
  console.log('  🏠 CMS homepage seeded');

  /* ── 20. Referral Config ──────────────────────────────────────────── */
  await prisma.referralConfig.upsert({
    where: { id: 'default' },
    update: {},
    create: {
      id: 'default',
      registrationReward: new Prisma.Decimal(50),
      commissionRate: new Prisma.Decimal(0.05),
      minWithdrawalAmount: new Prisma.Decimal(100),
      frozenDays: 30,
      maxTiers: 2,
      isActive: true,
      registrationRedPacketAmount: new Prisma.Decimal(10),
      orderRewardRate: new Prisma.Decimal(0.10),
      paperRewardMaxAmount: new Prisma.Decimal(5000),
      promoCopyZh: '邀请好友注册，双方各得50元红包！',
      promoCopyEn: 'Invite friends and get ¥50 each!',
    },
  });
  console.log('  🎁 Referral config seeded');

  /* ── 21. Payment Providers ────────────────────────────────────────── */
  const paymentProviders = [
    {
      name: '支付宝',
      nameEn: 'Alipay',
      type: 'ALIPAY',
      appId: 'demo-alipay-appid',
      merchantId: 'demo-alipay-mid',
      isEnabled: true,
      isDefault: true,
      instructionsZh: '请使用支付宝扫码支付',
      instructionsEn: 'Please scan QR code with Alipay',
      minAmount: new Prisma.Decimal(0.01),
      maxAmount: new Prisma.Decimal(50000),
    },
    {
      name: '微信支付',
      nameEn: 'WeChat Pay',
      type: 'WECHAT_PAY',
      appId: 'demo-wechat-appid',
      merchantId: 'demo-wechat-mid',
      isEnabled: true,
      isDefault: false,
      instructionsZh: '请使用微信扫码支付',
      instructionsEn: 'Please scan QR code with WeChat',
      minAmount: new Prisma.Decimal(0.01),
      maxAmount: new Prisma.Decimal(50000),
    },
  ];

  for (let i = 0; i < paymentProviders.length; i++) {
    const pp = paymentProviders[i];
    await prisma.paymentProvider.upsert({
      where: { id: `pay-provider-${i}` },
      update: {},
      create: {
        id: `pay-provider-${i}`,
        name: pp.name,
        nameEn: pp.nameEn,
        type: pp.type as any,
        appId: pp.appId,
        merchantId: pp.merchantId,
        isEnabled: pp.isEnabled,
        isDefault: pp.isDefault,
        instructionsZh: pp.instructionsZh,
        instructionsEn: pp.instructionsEn,
        minAmount: pp.minAmount,
        maxAmount: pp.maxAmount,
        mode: 'SANDBOX' as any,
        supportedCurrency: 'CNY',
        displayOrder: i,
      },
    });
  }
  console.log('  💳 Payment providers seeded');

  /* ── 22. Translations ─────────────────────────────────────────────── */
  const translations = [
    { key: 'siteName', locale: 'zh-CN', value: '度量衡科研平台', category: 'site' },
    { key: 'siteName', locale: 'en',   value: 'Metrology Research Platform', category: 'site' },
    { key: 'login', locale: 'zh-CN', value: '登录', category: 'auth' },
    { key: 'login', locale: 'en',   value: 'Login', category: 'auth' },
    { key: 'register', locale: 'zh-CN', value: '注册', category: 'auth' },
    { key: 'register', locale: 'en',   value: 'Register', category: 'auth' },
  ];

  for (const tr of translations) {
    await prisma.translation.upsert({
      where: { key_locale: { key: tr.key, locale: tr.locale } },
      update: {},
      create: tr,
    });
  }
  console.log('  🌐 Translations seeded');

  /* ── 23. Orders + OrderItems + OrderTimeline ──────────────────────── */
  const orderData = [
    {
      id: 'demo-order-001',
      orderNo: 'ORD-2026001',
      userPhone: '+8613800000002',
      status: 'COMPLETED',
      paymentStatus: 'PAID',
      totalAmount: 1500,
      serviceSlug: 'tensile-testing',
      labSlug: 'beijing-testing-center',
    },
    {
      id: 'demo-order-002',
      orderNo: 'ORD-2026002',
      userPhone: '+8613800000003',
      status: 'TESTING_IN_PROGRESS',
      paymentStatus: 'PAID',
      totalAmount: 3000,
      serviceSlug: 'emc-testing',
      labSlug: 'shenzhen-electronics-lab',
    },
    {
      id: 'demo-order-003',
      orderNo: 'ORD-2026003',
      userPhone: '+8613800000004',
      status: 'SAMPLE_RECEIVED',
      paymentStatus: 'PAID',
      totalAmount: 2500,
      serviceSlug: 'chemical-composition',
      labSlug: 'shanghai-material-lab',
    },
  ];

  for (const od of orderData) {
    const user = users[od.userPhone];
    const svc = serviceMap[od.serviceSlug];
    const lab = labs[od.labSlug];

    const order = await prisma.order.upsert({
      where: { id: od.id },
      update: {},
      create: {
        id: od.id,
        orderNo: od.orderNo,
        userId: user.id,
        status: od.status as any,
        paymentStatus: od.paymentStatus as any,
        totalAmount: new Prisma.Decimal(od.totalAmount),
        paidAmount: new Prisma.Decimal(od.totalAmount),
        currency: 'CNY',
        assignedLabId: lab?.dbId || null,
        notes: 'Demo order created by seed script',
      },
    });

    if (svc) {
      await prisma.orderItem.upsert({
        where: { id: `${od.id}-item` },
        update: {},
        create: {
          id: `${od.id}-item`,
          orderId: order.id,
          serviceId: svc.id,
          quantity: 1,
          unitPrice: new Prisma.Decimal(od.totalAmount),
          subtotal: new Prisma.Decimal(od.totalAmount),
        },
      });
    }

    const timelineEvents = [
      { status: 'PENDING_PAYMENT', title: '订单创建', description: '订单已创建，等待付款' },
      { status: 'PAID', title: '付款完成', description: '客户已完成付款' },
      { status: 'SAMPLE_SHIPPED', title: '样品寄送', description: '样品已寄送至实验室' },
      { status: 'SAMPLE_RECEIVED', title: '样品接收', description: '实验室已接收样品' },
    ];

    for (let i = 0; i < timelineEvents.length; i++) {
      const ev = timelineEvents[i];
      await prisma.orderTimeline.upsert({
        where: { id: `${od.id}-tl-${i}` },
        update: {},
        create: {
          id: `${od.id}-tl-${i}`,
          orderId: order.id,
          status: ev.status,
          title: ev.title,
          description: ev.description,
          operator: 'System',
        },
      });
    }
  }
  console.log('  📦 Orders seeded');

  /* ── 24. Samples + SamplePhotos + SampleTimeline ──────────────────── */
  const sampleData = [
    { id: 'demo-sample-001', orderId: 'demo-order-001', name: '铝合金拉伸试样', status: 'TESTING_COMPLETE' },
    { id: 'demo-sample-002', orderId: 'demo-order-002', name: 'PCB板EMC样品', status: 'TESTING' },
    { id: 'demo-sample-003', orderId: 'demo-order-003', name: '不锈钢成分样品', status: 'INSPECTION_PASSED' },
  ];

  for (const sd of sampleData) {
    await prisma.sample.upsert({
      where: { id: sd.id },
      update: {},
      create: {
        id: sd.id,
        sampleNo: `SMP-${sd.id.slice(-3)}`,
        orderId: sd.orderId,
        name: sd.name,
        materialType: 'solid',
        quantity: '3件',
        condition: '良好',
        status: sd.status as any,
        trackingNo: 'SF1234567890',
        courier: '顺丰速运',
        notes: 'Demo sample',
      },
    });

    await prisma.samplePhoto.upsert({
      where: { id: `${sd.id}-photo` },
      update: {},
      create: {
        id: `${sd.id}-photo`,
        sampleId: sd.id,
        photoUrl: UNSPLASH.equipment[0],
        caption: sd.name,
      },
    });

    await prisma.sampleTimeline.upsert({
      where: { id: `${sd.id}-tl` },
      update: {},
      create: {
        id: `${sd.id}-tl`,
        sampleId: sd.id,
        status: sd.status,
        title: '状态更新',
        description: `样品${sd.name}状态更新为${sd.status}`,
      },
    });
  }
  console.log('  🧫 Samples seeded');

  /* ── 25. Reports + ReportAttachments ──────────────────────────────── */
  const reportData = [
    { id: 'demo-report-001', orderId: 'demo-order-001', title: '铝合金拉伸性能检测报告', status: 'APPROVED' },
  ];

  for (const rd of reportData) {
    await prisma.report.upsert({
      where: { id: rd.id },
      update: {},
      create: {
        id: rd.id,
        reportNo: `RPT-${rd.id.slice(-3)}`,
        orderId: rd.orderId,
        title: rd.title,
        summaryZh: '样品经检测，各项性能指标均符合标准要求。',
        summaryEn: 'All performance indicators meet the standard requirements.',
        status: rd.status as any,
        fileUrl: 'https://example.com/demo-report.pdf',
      },
    });

    await prisma.reportAttachment.upsert({
      where: { id: `${rd.id}-att` },
      update: {},
      create: {
        id: `${rd.id}-att`,
        reportId: rd.id,
        fileName: '原始数据.xlsx',
        fileUrl: 'https://example.com/demo-data.xlsx',
        fileType: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
      },
    });
  }
  console.log('  📄 Reports seeded');

  /* ── 26. Certificate Templates + Certificates ─────────────────────── */
  const certTemplate = await prisma.certificateTemplate.upsert({
    where: { slug: 'service-completion' },
    update: {},
    create: {
      id: 'demo-cert-template-001',
      slug: 'service-completion',
      name: '服务完成证书',
      type: 'SERVICE_COMPLETION',
      titleTemplate: '检测服务完成证书',
      bodyTemplate: '兹证明 {{company}} 委托的 {{service}} 检测服务已完成，结果符合相关标准要求。',
      backgroundUrl: UNSPLASH.cover,
      logoUrl: UNSPLASH.logo,
      signatureName: '张主任',
      signatureTitle: '实验室主任',
      signatureImageUrl: UNSPLASH.avatar,
      isActive: true,
    },
  });

  await prisma.certificate.upsert({
    where: { id: 'demo-cert-001' },
    update: {},
    create: {
      id: 'demo-cert-001',
      certificateNo: 'CERT-2026001',
      userId: users['+8613800000002'].id,
      orderId: 'demo-order-001',
      templateId: certTemplate.id,
      type: 'SERVICE_COMPLETION',
      title: '铝合金拉伸性能检测完成证书',
      subtitle: 'Certificate of Completion',
      description: '样品经检测，各项性能指标均符合GB/T标准要求。',
      status: 'ISSUED',
      fileUrl: 'https://example.com/demo-cert.pdf',
      previewUrl: 'https://example.com/demo-cert-preview.png',
      verificationCode: 'VERIFY123456',
      issuedAt: new Date(),
    },
  });
  console.log('  📜 Certificates seeded');

  /* ── 27. RFQ + Quotations ─────────────────────────────────────────── */
  const rfq = await prisma.rFQRequest.upsert({
    where: { id: 'demo-rfq-001' },
    update: {},
    create: {
      id: 'demo-rfq-001',
      requestNo: 'RFQ-2026001',
      userId: users['+8613800000002'].id,
      title: '航空铝合金材料检测询价',
      materialDesc: '7075-T6航空铝合金板材',
      productType: '板材',
      testingTarget: '拉伸性能、疲劳性能、化学成分',
      issue: '需要满足AMS-QQ-A-250/12标准',
      standardReq: 'AMS-QQ-A-250/12, ASTM B209',
      quantity: '50件',
      budget: '20000-50000',
      notes: '用于新型无人机结构件',
      status: 'QUOTED',
    },
  });

  await prisma.rFQFile.upsert({
    where: { id: 'demo-rfq-file-001' },
    update: {},
    create: {
      id: 'demo-rfq-file-001',
      rfqId: rfq.id,
      fileName: '技术要求.pdf',
      fileUrl: 'https://example.com/demo-tech-spec.pdf',
      fileType: 'application/pdf',
      fileSize: 1024000,
    },
  });

  await prisma.rFQMessage.upsert({
    where: { id: 'demo-rfq-msg-001' },
    update: {},
    create: {
      id: 'demo-rfq-msg-001',
      rfqId: rfq.id,
      senderId: users['+8613800000002'].id,
      content: '请问检测周期是多久？',
    },
  });

  await prisma.quotation.upsert({
    where: { id: 'demo-quote-001' },
    update: {},
    create: {
      id: 'demo-quote-001',
      quotationNo: 'QT-2026001',
      rfqId: rfq.id,
      userId: users['+8613800000002'].id,
      title: '航空铝合金检测报价',
      items: [
        { name: '拉伸性能测试', quantity: 50, unitPrice: 300, subtotal: 15000 },
        { name: '疲劳性能测试', quantity: 50, unitPrice: 500, subtotal: 25000 },
        { name: '化学成分分析', quantity: 50, unitPrice: 200, subtotal: 10000 },
      ],
      totalAmount: new Prisma.Decimal(50000),
      currency: 'CNY',
      validUntil: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000),
      termsZh: '付款方式：预付50%，报告出具后付清尾款。',
      termsEn: 'Payment: 50% upfront, balance due upon report delivery.',
      status: 'SENT',
    },
  });
  console.log('  📋 RFQ & Quotations seeded');

  /* ── 28. Notifications ────────────────────────────────────────────── */
  const notifications = [
    { userPhone: '+8613800000002', type: 'ORDER' as const, titleZh: '订单状态更新', contentZh: '您的订单ORD-2026001已完成检测。' },
    { userPhone: '+8613800000002', type: 'SYSTEM' as const, titleZh: '欢迎加入', contentZh: '欢迎使用度量衡科研平台！' },
    { userPhone: '+8613800000004', type: 'SYSTEM' as const, titleZh: '企业认证通过', contentZh: '您的企业认证已通过审核。' },
  ];

  for (let i = 0; i < notifications.length; i++) {
    const n = notifications[i];
    await prisma.notification.upsert({
      where: { id: `demo-notif-${i}` },
      update: {},
      create: {
        id: `demo-notif-${i}`,
        userId: users[n.userPhone].id,
        type: n.type,
        titleZh: n.titleZh,
        titleEn: n.titleZh,
        contentZh: n.contentZh,
        contentEn: n.contentZh,
        isRead: false,
      },
    });
  }
  console.log('  🔔 Notifications seeded');

  /* ── 29. Audit Logs ───────────────────────────────────────────────── */
  await prisma.auditLog.upsert({
    where: { id: 'demo-audit-001' },
    update: {},
    create: {
      id: 'demo-audit-001',
      userId: users['+8613800000000'].id,
      action: 'LOGIN',
      entity: 'User',
      entityId: users['+8613800000000'].id,
      details: { method: 'password' },
      ipAddress: '127.0.0.1',
    },
  });
  console.log('  📋 Audit logs seeded');

  /* ── Done ─────────────────────────────────────────────────────────── */
  console.log('');
  console.log('✅ Master Seed Complete');
  console.log('');
  console.log('Summary:');
  console.log('  • 8 demo users (all roles)');
  console.log('  • 3 laboratories with media');
  console.log('  • 10 testing services with relations');
  console.log('  • 10 equipment items with media');
  console.log('  • 8 service categories');
  console.log('  • 5 materials, 5 industries, 5 standards');
  console.log('  • 1 company + 2 memberships');
  console.log('  • 3 orders + samples + reports');
  console.log('  • 1 certificate + template');
  console.log('  • 1 RFQ + quotation');
  console.log('  • CMS homepage with sections');
  console.log('  • Site settings, app config, translations');
  console.log('');
  console.log('Login credentials:');
  console.log('  Phone: +8613800000000 → +8613800000007');
  console.log('  Password: demo123456');
}

main()
  .then(async () => {
    await prisma.$disconnect();
    process.exit(0);
  })
  .catch(async (e) => {
    console.error('❌ Seed failed:', e);
    await prisma.$disconnect();
    process.exit(1);
  });
