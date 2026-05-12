import { NextResponse } from 'next/server';
import { prisma } from '@/lib/db';

export async function GET() {
  const checks: Record<string, string> = {};
  let dbOk = false;
  let serviceOk = false;

  try {
    await prisma.$queryRaw`SELECT 1`;
    checks.database = 'connected';
    dbOk = true;
  } catch {
    checks.database = 'failed';
  }

  try {
    const count = await prisma.testingService.count();
    checks.testingService = `${count} rows`;
    serviceOk = true;
  } catch {
    checks.testingService = 'failed';
  }

  const allOk = dbOk && serviceOk;
  return NextResponse.json(
    { ok: allOk, checks },
    { status: allOk ? 200 : 500 }
  );
}
