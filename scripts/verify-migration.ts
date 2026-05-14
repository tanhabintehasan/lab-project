import { prisma } from '../src/lib/db';

async function verify() {
  const categories = await prisma.serviceCategory.findMany({ take: 3 });
  console.log(JSON.stringify(categories, null, 2));
  await prisma.$disconnect();
}

verify();
