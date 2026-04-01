import { PrismaClient } from '@prisma/client';
import { PrismaPg } from '@prisma/adapter-pg';
import bcrypt from 'bcryptjs';

const adapter = new PrismaPg({
  connectionString: process.env.DATABASE_URL!,
});

const prisma = new PrismaClient({
  adapter,
});

async function main() {
  console.log('Creating test users...');

  // Use the same hashing config as the app (12 rounds)
  const hashedPassword = await bcrypt.hash('password123', 12);

  // Create Super Admin
  try {
    const superAdmin = await prisma.user.upsert({
      where: { email: 'admin@demo.com' },
      update: {
        role: 'SUPER_ADMIN',
        status: 'ACTIVE',
        passwordHash: hashedPassword,
      },
      create: {
        name: 'Super Admin',
        email: 'admin@demo.com',
        phone: '+8613800000001',
        passwordHash: hashedPassword,
        role: 'SUPER_ADMIN',
        status: 'ACTIVE',
        emailVerified: true,
        phoneVerified: true,
      },
    });
    console.log('✅ Super Admin created/updated:', superAdmin.email);
  } catch (error: any) {
    console.error('❌ Failed to create Super Admin:', error.message);
  }

  // Create Finance Admin
  try {
    const financeAdmin = await prisma.user.upsert({
      where: { email: 'finance@demo.com' },
      update: {
        role: 'FINANCE_ADMIN',
        status: 'ACTIVE',
        passwordHash: hashedPassword,
      },
      create: {
        name: 'Finance Admin',
        email: 'finance@demo.com',
        phone: '+8613800000002',
        passwordHash: hashedPassword,
        role: 'FINANCE_ADMIN',
        status: 'ACTIVE',
        emailVerified: true,
        phoneVerified: true,
      },
    });
    console.log('✅ Finance Admin created/updated:', financeAdmin.email);
  } catch (error: any) {
    console.error('❌ Failed to create Finance Admin:', error.message);
  }

  // Verify users exist
  console.log('\n✅ Verifying users...');
  const users = await prisma.user.findMany({
    where: {
      email: {
        in: ['admin@demo.com', 'finance@demo.com'],
      },
    },
    select: {
      email: true,
      role: true,
      status: true,
    },
  });
  console.log('Users in database:', JSON.stringify(users, null, 2));

  console.log('\n✅ Test users created successfully!');
  console.log('Super Admin: admin@demo.com / password123');
  console.log('Finance Admin: finance@demo.com / password123');
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
