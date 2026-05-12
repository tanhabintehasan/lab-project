-- Add missing sample-related columns to TestingService
-- These fields exist in schema.prisma but were never migrated to the database

ALTER TABLE "TestingService"
  ADD COLUMN IF NOT EXISTS "sampleCount" TEXT,
  ADD COLUMN IF NOT EXISTS "sampleSize" TEXT,
  ADD COLUMN IF NOT EXISTS "sampleWeight" TEXT,
  ADD COLUMN IF NOT EXISTS "sampleCondition" TEXT,
  ADD COLUMN IF NOT EXISTS "samplePreservation" TEXT,
  ADD COLUMN IF NOT EXISTS "samplePreparation" TEXT;
