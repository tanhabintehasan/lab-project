import { NextRequest, NextResponse } from 'next/server';

export const runtime = 'nodejs';

/**
 * GET /api/debug
 *
 * Diagnostic endpoint that returns connection health details.
 * Requires admin authentication in production.
 * DO NOT leave this exposed long-term.
 */
export async function GET(request: NextRequest) {
  // Simple admin check: require a secret token in production
  const secretToken = request.headers.get('x-debug-token');
  if (
    process.env.NODE_ENV === 'production' &&
    secretToken !== process.env.DEBUG_SECRET_TOKEN
  ) {
    return NextResponse.json(
      { error: 'Unauthorized' },
      { status: 401 }
    );
  }

  const results: Record<string, any> = {};

  // 1. Environment
  results.env = {
    NODE_ENV: process.env.NODE_ENV,
    DATABASE_URL_SET: !!process.env.DATABASE_URL,
    DATABASE_URL_LENGTH: process.env.DATABASE_URL?.length ?? 0,
    DATABASE_URL_HOST: process.env.DATABASE_URL
      ? (() => {
          try {
            return new URL(process.env.DATABASE_URL).host;
          } catch {
            return 'INVALID_URL';
          }
        })()
      : 'N/A',
  };

  // 2. Prisma adapter test
  try {
    const { PrismaPg } = await import('@prisma/adapter-pg');
    const { PrismaClient } = await import('@prisma/client');

    const adapter = new PrismaPg({ connectionString: process.env.DATABASE_URL || '' });
    const prisma = new PrismaClient({ adapter, log: ['error'] });
    const prismaResult = await prisma.$queryRaw`SELECT 1 as ok`;
    await prisma.$disconnect();
    results.prisma = { ok: true, row: prismaResult };
  } catch (err: any) {
    results.prisma = {
      ok: false,
      name: err?.name,
      message: err?.message,
      code: err?.code,
    };
  }

  // 3. App singleton test
  try {
    const { prisma: appPrisma } = await import('@/lib/db');
    const count = await appPrisma.siteSetting.count();
    results.prismaSingleton = { ok: true, count };
  } catch (err: any) {
    results.prismaSingleton = {
      ok: false,
      name: err?.name,
      message: err?.message,
      code: err?.code,
    };
  }

  const allOk = results.prisma?.ok && results.prismaSingleton?.ok;

  return NextResponse.json(
    { status: allOk ? 'healthy' : 'unhealthy', results },
    { status: allOk ? 200 : 500 }
  );
}
