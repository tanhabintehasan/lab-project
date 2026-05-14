// prisma.config.ts
import "dotenv/config";
import { defineConfig } from "prisma/config";

export default defineConfig({
  schema: "prisma/schema.prisma",
  migrations: {
    path: "prisma/migrations",
    seed: "tsx prisma/seed-minimal.ts",
  },
  datasource: {
    // Adding 30 second timeout to handle slow ISP handshakes
    url: `${process.env.DATABASE_URL!}&connect_timeout=30`,
  },
});