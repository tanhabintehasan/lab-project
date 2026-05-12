import "dotenv/config";
import { defineConfig } from "prisma/config";

export default defineConfig({
  schema: "prisma/schema.prisma",
  datasource: {
    // Fallback dummy URL ensures prisma generate works on build machines
    // (e.g. Netlify) when DATABASE_URL is only available at runtime.
    url: process.env.DATABASE_URL || "postgresql://localhost:5432/postgres?schema=public",
  },
  migrations: {
    seed: "tsx prisma/seed.ts",
  },
});