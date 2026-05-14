import { NextResponse } from 'next/server';

export const runtime = 'nodejs';

/**
 * GET /api/debug
 *
 * Diagnostic endpoint that returns raw error details.
 * DO NOT leave this exposed in production long-term.
 */
export async function GET() {
  const results: Record<string, any> = {};

  // 1. Environment
  results.env = {
    NODE_ENV: process.env.NODE_ENV,
    DATABASE_URL_SET: !!process.env.DATABASE_URL,
    DATABASE_URL_LENGTH: process.env.DATABASE_URL?.length ?? 0,
    DATABASE_URL_HOST: process.env.DATABASE_URL
      ? new URL(process.env.DATABASE_URL).host
      : 'N/A',
  };

  // 2. Bare pg connection test
  try {
    const { Pool } = await import('pg');
    const pool = new Pool({
      connectionString: process.env.DATABASE_URL,
      max: 1,
      connectionTimeoutMillis: 10000,
    });
    const client = await pool.connect();
    const pgResult = await client.query('SELECT 1 as ok');
    client.release();
    await pool.end();
    results.pg = { ok: true, row: pgResult.rows[0] };
  } catch (err: any) {
    results.pg = {
      ok: false,
      name: err?.name,
      message: err?.message,
      stack: err?.stack?.split('\n').slice(0, 6),
      code: err?.code,
    };
  }

  // 3. Prisma adapter test
  try {
    const { PrismaPg } = await import('@prisma/adapter-pg');
    const { PrismaClient } = await import('@prisma/client');
    const { Pool } = await import('pg');

    const pool = new Pool({
      connectionString: process.env.DATABASE_URL,
      max: 1,
      connectionTimeoutMillis: 10000,
    });

    const adapter = new PrismaPg(pool);
    const prisma = new PrismaClient({ adapter, log: ['error'] });

    const prismaResult = await prisma.$queryRaw`SELECT 1 as ok`;
    await prisma.$disconnect();
    await pool.end();

    results.prisma = { ok: true, row: prismaResult };
  } catch (err: any) {
    results.prisma = {
      ok: false,
      name: err?.name,
      message: err?.message,
      stack: err?.stack?.split('\n').slice(0, 10),
      code: err?.code,
    };
  }

  // 4. Prisma singleton test (the way the app actually uses it)
  try {
    const { prisma } = await import('@/lib/db');
    const count = await prisma.siteSetting.count();
    results.prismaSingleton = { ok: true, count };
  } catch (err: any) {
    results.prismaSingleton = {
      ok: false,
      name: err?.name,
      message: err?.message,
      stack: err?.stack?.split('\n').slice(0, 10),
      code: err?.code,
    };
  }

  const allOk =
    results.pg?.ok &&
    results.prisma?.ok &&
    results.prismaSingleton?.ok;

  return NextResponse.json(
    { status: allOk ? 'healthy' : 'unhealthy', results },
    { status: allOk ? 200 : 500 }
  );
}
