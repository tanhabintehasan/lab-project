-- Phase 2: Payment Control System Enhancements
-- Date: 2025-03-23
-- Purpose: Add support for manual payment methods (QR codes, bank transfers)
--          and enhanced payment provider configuration

-- Add new payment provider type
ALTER TYPE "PaymentProviderType" ADD VALUE IF NOT EXISTS 'MANUAL_QR';

-- Add new fields to PaymentProvider table
ALTER TABLE "PaymentProvider" 
  ADD COLUMN IF NOT EXISTS "nameEn" TEXT,
  ADD COLUMN IF NOT EXISTS "qrCodeUrl" TEXT,
  ADD COLUMN IF NOT EXISTS "instructionsZh" TEXT,
  ADD COLUMN IF NOT EXISTS "instructionsEn" TEXT,
  ADD COLUMN IF NOT EXISTS "bankName" TEXT,
  ADD COLUMN IF NOT EXISTS "bankAccount" TEXT,
  ADD COLUMN IF NOT EXISTS "accountHolder" TEXT,
  ADD COLUMN IF NOT EXISTS "minAmount" DECIMAL(12,2),
  ADD COLUMN IF NOT EXISTS "maxAmount" DECIMAL(12,2),
  ADD COLUMN IF NOT EXISTS "supportedCurrency" TEXT DEFAULT 'CNY',
  ADD COLUMN IF NOT EXISTS "displayOrder" INTEGER DEFAULT 0;

-- Create index on displayOrder for efficient ordering
CREATE INDEX IF NOT EXISTS "PaymentProvider_displayOrder_idx" ON "PaymentProvider"("displayOrder");

-- Update existing providers with default display order
UPDATE "PaymentProvider" 
SET "displayOrder" = 0 
WHERE "displayOrder" IS NULL;

-- Make supportedCurrency non-null with default
ALTER TABLE "PaymentProvider" 
  ALTER COLUMN "supportedCurrency" SET DEFAULT 'CNY',
  ALTER COLUMN "supportedCurrency" SET NOT NULL;

-- Migration notes:
-- 1. This migration is safe to run multiple times (uses IF NOT EXISTS)
-- 2. Existing payment providers will get default values
-- 3. No data loss occurs
-- 4. New fields are all nullable except supportedCurrency and displayOrder
