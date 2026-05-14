-- Manual migration for UserBrowseLog table
-- Run this SQL against your database if Prisma migrations are not yet applied

CREATE TABLE IF NOT EXISTS "UserBrowseLog" (
  id TEXT PRIMARY KEY DEFAULT gen_random_uuid()::text,
  "userId" TEXT NOT NULL,
  "categoryId" TEXT NOT NULL,
  "serviceId" TEXT,
  "sourcePage" TEXT,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP
);

-- Indexes
CREATE INDEX IF NOT EXISTS "UserBrowseLog_userId_createdAt_idx" ON "UserBrowseLog"("userId", "createdAt");
CREATE INDEX IF NOT EXISTS "UserBrowseLog_categoryId_createdAt_idx" ON "UserBrowseLog"("categoryId", "createdAt");
CREATE INDEX IF NOT EXISTS "UserBrowseLog_userId_categoryId_idx" ON "UserBrowseLog"("userId", "categoryId");

-- Foreign keys (optional — skip if your DB setup handles these differently)
-- ALTER TABLE "UserBrowseLog" ADD CONSTRAINT "UserBrowseLog_userId_fkey"
--   FOREIGN KEY ("userId") REFERENCES "User"(id) ON DELETE CASCADE ON UPDATE NO ACTION;
-- ALTER TABLE "UserBrowseLog" ADD CONSTRAINT "UserBrowseLog_categoryId_fkey"
--   FOREIGN KEY ("categoryId") REFERENCES "ServiceCategory"(id) ON DELETE CASCADE ON UPDATE NO ACTION;
