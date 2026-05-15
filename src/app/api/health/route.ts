import { NextResponse } from 'next/server';
import { prisma } from '@/lib/db';

export const runtime = 'nodejs';

/**
 * GET /api/health
 *
 * Lightweight diagnostic endpoint for load balancers and monitoring.
 * Returns 200 if the database connection works, 500 otherwise.
 * Does NOT expose runtime version or internal paths.
 */
export async function GET() {
  const checks: Record<string, { ok: boolean; detail?: string }> = {};

  // 1. Env check
  checks.env = {
    ok: !!process.env.DATABASE_URL,
    detail: process.env.DATABASE_URL
      ? 'DATABASE_URL is set'
      : 'DATABASE_URL is MISSING',
  };

  // 2. DB connectivity check
  if (checks.env.ok) {
    try {
      await prisma.$queryRaw`SELECT 1`;
      checks.database = { ok: true, detail: 'Connected' };
    } catch (err: any) {
      checks.database = {
        ok: false,
        detail: err?.message || 'Unknown DB error',
      };
    }
  } else {
    checks.database = {
      ok: false,
      detail: 'Skipped (DATABASE_URL missing)',
    };
  }

  const allOk = Object.values(checks).every((c) => c.ok);

  return NextResponse.json(
    {
      status: allOk ? 'healthy' : 'unhealthy',
      checks,
    },
    { status: allOk ? 200 : 500 }
  );
}
