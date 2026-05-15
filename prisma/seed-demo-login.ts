/**
 * Demo Login Seed — China-style phone-based authentication
 * ------------------------------------------------------------------------
 * Creates 8 demo users covering all roles, with wallets, company/lab links,
 * and address records. Fully idempotent — safe to run multiple times.
 *
 * Run:
 *   npx tsx prisma/seed-demo-login.ts
 * ------------------------------------------------------------------------
 */

import 'dotenv/config';
import { PrismaClient } from '@prisma/client';
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

async function hashPassword(password: string): Promise<string> {
  return bcrypt.hash(password, 12);
}

/* ─────────────────────────────────────────────────────────────────────── */

async function main() {
  console.log('🌱 Demo Login Seed starting...');

  const passwordHash = await hashPassword('demo123456');

  /* ── 1. Demo users (phone = primary identifier) ───────────────────── */
  const userConfigs = [
    { phone: '+8613800000000', name: '系统管理员',     role: 'SUPER_ADMIN'       as const },
    { phone: '+8613800000001', name: '财务管理员',     role: 'FINANCE_ADMIN'     as const },
    { phone: '+8613800000002', name: '客户张三',       role: 'CUSTOMER'          as const },
    { phone: '+8613800000003', name: '客户李四',       role: 'CUSTOMER'          as const },
    { phone: '+8613800000004', name: '企业王总',       role: 'ENTERPRISE_MEMBER' as const },
    { phone: '+8613800000005', name: '企业赵成员',     role: 'ENTERPRISE_MEMBER' as const },
    { phone: '+8613800000006', name: '实验室伙伴',     role: 'LAB_PARTNER'       as const },
    { phone: '+8613800000007', name: '技术员小刘',     role: 'TECHNICIAN'        as const },
  ];

  const upsertedUsers: Record<string, { id: string; phone: string; role: string }> = {};

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
      },
      create: {
        phone: cfg.phone,
        passwordHash,
        name: cfg.name,
        role: cfg.role,
        status: 'ACTIVE',
        locale: 'zh-CN',
        phoneVerified: true,
        emailVerified: true,
      },
    });
    upsertedUsers[cfg.phone] = user;
    console.log(`  ✅ ${cfg.phone} → ${cfg.role} (${user.id})`);
  }

  /* ── 2. Wallet for every user ─────────────────────────────────────── */
  for (const cfg of userConfigs) {
    const user = upsertedUsers[cfg.phone];
    await prisma.wallet.upsert({
      where: { userId: user.id },
      update: {},
      create: {
        userId: user.id,
        balance: 0,
        frozenAmount: 0,
        currency: 'CNY',
      },
    });
  }
  console.log('  💰 Wallets ensured for all users');

  /* ── 3. Company + CompanyWallet (enterprise users) ────────────────── */
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
      status: 'VERIFIED',
      contractPricing: true,
      billingEnabled: true,
      approvalRequired: true,
    },
  });
  console.log(`  🏢 Company: ${company.name}`);

  await prisma.companyMembership.upsert({
    where: { userId: upsertedUsers['+8613800000004'].id },
    update: { role: 'owner', companyId: company.id },
    create: {
      userId: upsertedUsers['+8613800000004'].id,
      companyId: company.id,
      role: 'owner',
    },
  });

  await prisma.companyMembership.upsert({
    where: { userId: upsertedUsers['+8613800000005'].id },
    update: { role: 'member', companyId: company.id },
    create: {
      userId: upsertedUsers['+8613800000005'].id,
      companyId: company.id,
      role: 'member',
    },
  });
  console.log('  👥 CompanyMembership: owner + member');

  await prisma.companyWallet.upsert({
    where: { companyId: company.id },
    update: {},
    create: {
      companyId: company.id,
      balance: 50000,
      frozenAmount: 0,
      creditLimit: 100000,
      currency: 'CNY',
    },
  });
  console.log('  💼 CompanyWallet created');

  /* ── 4. Laboratory + LabUser ──────────────────────────────────────── */
  const lab = await prisma.laboratory.upsert({
    where: { slug: 'demo-lab' },
    update: {},
    create: {
      id: 'demo-lab-001',
      slug: 'demo-lab',
      nameZh: '示范检测实验室',
      nameEn: 'Demo Testing Laboratory',
      shortDescZh: '专业的第三方检测机构',
      shortDescEn: 'Professional third-party testing institution',
      fullDescZh:
        '拥有完善的检测设备和专业的技术团队，提供材料力学、化学成分、环境模拟等全方位检测服务。',
      fullDescEn:
        'Equipped with advanced testing facilities and a professional technical team.',
      city: '北京',
      province: '北京市',
      phone: '010-12345678',
      email: 'lab@demo.com',
      status: 'ACTIVE',
      rating: 4.8,
      completedOrders: 500,
      avgTurnaroundDays: 7,
    },
  });
  console.log(`  🔬 Laboratory: ${lab.nameZh}`);

  await prisma.labUser.upsert({
    where: { userId: upsertedUsers['+8613800000006'].id },
    update: { labId: lab.id, role: 'admin' },
    create: {
      userId: upsertedUsers['+8613800000006'].id,
      labId: lab.id,
      role: 'admin',
    },
  });
  console.log('  🔗 LabUser linked to laboratory');

  /* ── 5. Address records ───────────────────────────────────────────── */
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
        userId: upsertedUsers[addr.userPhone].id,
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
  console.log('  📍 Addresses created for customers & enterprise users');

  console.log('🎉 Demo Login Seed completed successfully!');
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
