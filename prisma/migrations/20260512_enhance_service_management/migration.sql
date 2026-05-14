-- Migration: Enhance Service Management
-- Add basePrice, discountPrice, turnaroundTime, status, and TestingServiceMedia

-- 1. Add ServiceStatus enum type
DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'ServiceStatus') THEN
    CREATE TYPE "ServiceStatus" AS ENUM ('DRAFT', 'PUBLISHED');
  END IF;
END $$;

-- 2. Add new columns to TestingService
ALTER TABLE "TestingService"
  ADD COLUMN IF NOT EXISTS "basePrice" DECIMAL(12, 2),
  ADD COLUMN IF NOT EXISTS "discountPrice" DECIMAL(12, 2),
  ADD COLUMN IF NOT EXISTS "turnaroundTime" TEXT,
  ADD COLUMN IF NOT EXISTS "status" "ServiceStatus" DEFAULT 'DRAFT';

-- 3. Migrate existing data
UPDATE "TestingService"
SET
  "basePrice" = "priceMin",
  "discountPrice" = "priceMax",
  "turnaroundTime" = "turnaroundDesc",
  "status" = CASE WHEN "isActive" = true THEN 'PUBLISHED'::"ServiceStatus" ELSE 'DRAFT'::"ServiceStatus" END
WHERE "status" IS NULL;

-- 4. Create TestingServiceMedia table
CREATE TABLE IF NOT EXISTS "TestingServiceMedia" (
  id TEXT NOT NULL DEFAULT gen_random_uuid()::text,
  "serviceId" TEXT NOT NULL,
  url TEXT NOT NULL,
  caption TEXT,
  "sortOrder" INTEGER NOT NULL DEFAULT 0,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

  CONSTRAINT "TestingServiceMedia_pkey" PRIMARY KEY (id)
);

-- 5. Add foreign key for TestingServiceMedia
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.table_constraints
    WHERE constraint_name = 'TestingServiceMedia_serviceId_fkey'
    AND table_name = 'TestingServiceMedia'
  ) THEN
    ALTER TABLE "TestingServiceMedia"
      ADD CONSTRAINT "TestingServiceMedia_serviceId_fkey"
      FOREIGN KEY ("serviceId") REFERENCES "TestingService"(id) ON DELETE CASCADE ON UPDATE NO ACTION;
  END IF;
END $$;

-- 6. Add index on TestingServiceMedia.serviceId
CREATE INDEX IF NOT EXISTS "TestingServiceMedia_serviceId_idx" ON "TestingServiceMedia"("serviceId");

-- 7. Add index on TestingService.status
CREATE INDEX IF NOT EXISTS "TestingService_status_idx" ON "TestingService"(status);
