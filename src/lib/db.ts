import { Pool } from 'pg';
import { PrismaPg } from '@prisma/adapter-pg';
import { PrismaClient } from '@prisma/client';

// Safety guard: pg + PrismaPg are Node-only and will crash in Edge runtime
if (typeof (globalThis as any).EdgeRuntime !== 'undefined') {
  throw new Error(
    'Prisma client with pg adapter cannot run in Edge runtime. ' +
    'Add "export const runtime = \'nodejs\';" to your page/layout/route.'
  );
}

const globalForPrisma = globalThis as unknown as {
  prisma?: PrismaClient;
};

function createPrismaClient(): PrismaClient {
  if (!process.env.DATABASE_URL) {
    throw new Error('DATABASE_URL is not set');
  }

  // External Pool with server-safe limits to avoid saturating Supabase PgBouncer
  // allowExitOnIdle is intentionally omitted so the pool survives between
  // Netlify serverless function warm-starts rather than self-destructing.
  const pool = new Pool({
    connectionString: process.env.DATABASE_URL,
    max: 3,
    idleTimeoutMillis: 10000,
    connectionTimeoutMillis: 5000,
  });

  const adapter = new PrismaPg(pool);

  return new PrismaClient({
    adapter,
    log: ['error'],
  });
}

function getPrismaClient(): PrismaClient {
  if (!globalForPrisma.prisma) {
    globalForPrisma.prisma = createPrismaClient();
  }
  return globalForPrisma.prisma;
}

/**
 * Lazy PrismaClient proxy.
 * Delays DATABASE_URL validation and Pool creation until the first query,
 * preventing build failures when the database is not available at build time.
 */
export const prisma = new Proxy({} as PrismaClient, {
  get(_target, prop) {
    const client = getPrismaClient();
    const value = (client as any)[prop];
    return typeof value === 'function' ? value.bind(client) : value;
  },
});

export default prisma;
