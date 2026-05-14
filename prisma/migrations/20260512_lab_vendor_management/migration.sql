-- Lab Vendor Management Enhancement
-- Adds vendor/commercial relationship fields to Laboratory

DO $$
BEGIN
  -- Add VendorTier enum if not exists
  IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'VendorTier') THEN
    CREATE TYPE "VendorTier" AS ENUM ('PREMIUM', 'STANDARD', 'BASIC');
  END IF;
END $$;

-- Add new columns to Laboratory table (idempotent)
ALTER TABLE "Laboratory"
  ADD COLUMN IF NOT EXISTS "vendorCode" VARCHAR(50) UNIQUE,
  ADD COLUMN IF NOT EXISTS "commissionRate" DECIMAL(5, 2),
  ADD COLUMN IF NOT EXISTS "contractStartDate" TIMESTAMP(3),
  ADD COLUMN IF NOT EXISTS "contractEndDate" TIMESTAMP(3),
  ADD COLUMN IF NOT EXISTS "vendorTier" "VendorTier" DEFAULT 'STANDARD',
  ADD COLUMN IF NOT EXISTS "billingEmail" VARCHAR(255),
  ADD COLUMN IF NOT EXISTS "billingAddress" TEXT,
  ADD COLUMN IF NOT EXISTS "taxId" VARCHAR(100),
  ADD COLUMN IF NOT EXISTS "businessLicense" VARCHAR(200),
  ADD COLUMN IF NOT EXISTS "primaryContactName" VARCHAR(200),
  ADD COLUMN IF NOT EXISTS "primaryContactPhone" VARCHAR(20);
