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

function getDatabaseUrl(): string {
  const url = process.env.DATABASE_URL;
  if (!url) {
    throw new Error(
      'DATABASE_URL is not set. ' +
      'Ensure it is configured in your Netlify dashboard (Site settings → Environment variables).'
    );
  }
  // Supabase/Neon require SSL from serverless hosts like Netlify.
  // Append sslmode=require if the query string does not already contain it.
  if (!url.includes('sslmode=')) {
    const separator = url.includes('?') ? '&' : '?';
    return `${url}${separator}sslmode=require`;
  }
  return url;
}

function createPrismaClient(): PrismaClient {
  const connectionString = getDatabaseUrl();

  // External Pool with server-safe limits to avoid saturating Supabase PgBouncer
  const pool = new Pool({
    connectionString,
    max: 3,
    idleTimeoutMillis: 10000,
    connectionTimeoutMillis: 5000,
  });

  // Log connection errors so they show up in Netlify function logs
  pool.on('error', (err) => {
    console.error('[PrismaPool] Unexpected pool error:', err.message);
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
