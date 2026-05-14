-- ============================================================
-- FINAL SCHEMA CLEANUP (2026-04-15)
-- Run: npx prisma db execute --file database/migrations/20260415_final_schema_cleanup.sql
--
-- 1. Renames any legacy homepage ID from page-home-default -> page-home
-- 2. Adds missing columns to SiteSetting (logoUploadUrl, brandColor)
-- 3. Adds missing columns to EquipmentBooking (bookingDate, contactName, contactPhone, serviceName)
-- 4. Adds missing columns to Payment (providerId, notifyData, verifiedAt, refundedAt, refundAmount)
-- 5. Creates missing utility tables if needed
-- ============================================================

-- ------------------------------------------------------------------
-- 1. Rename legacy homepage CMSPage ID
-- ------------------------------------------------------------------
DO $$
BEGIN
    IF EXISTS (SELECT 1 FROM "CMSPage" WHERE id = 'page-home-default')
       AND NOT EXISTS (SELECT 1 FROM "CMSPage" WHERE id = 'page-home') THEN
        UPDATE "CMSPage" SET id = 'page-home' WHERE id = 'page-home-default';
    END IF;
END $$;

-- ------------------------------------------------------------------
-- 2. SiteSetting missing columns
-- ------------------------------------------------------------------
DO $$
BEGIN
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'SiteSetting' AND column_name = 'logoUploadUrl') THEN
        ALTER TABLE "SiteSetting" ADD COLUMN "logoUploadUrl" TEXT;
    END IF;
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'SiteSetting' AND column_name = 'brandColor') THEN
        ALTER TABLE "SiteSetting" ADD COLUMN "brandColor" TEXT;
    END IF;
END $$;

-- ------------------------------------------------------------------
-- 3. EquipmentBooking missing columns
-- ------------------------------------------------------------------
DO $$
BEGIN
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'EquipmentBooking' AND column_name = 'bookingDate') THEN
        ALTER TABLE "EquipmentBooking" ADD COLUMN "bookingDate" DATE;
    END IF;
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'EquipmentBooking' AND column_name = 'contactName') THEN
        ALTER TABLE "EquipmentBooking" ADD COLUMN "contactName" TEXT;
    END IF;
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'EquipmentBooking' AND column_name = 'contactPhone') THEN
        ALTER TABLE "EquipmentBooking" ADD COLUMN "contactPhone" TEXT;
    END IF;
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'EquipmentBooking' AND column_name = 'serviceName') THEN
        ALTER TABLE "EquipmentBooking" ADD COLUMN "serviceName" TEXT;
    END IF;
END $$;

-- ------------------------------------------------------------------
-- 4. Payment missing columns
-- ------------------------------------------------------------------
DO $$
BEGIN
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'Payment' AND column_name = 'providerId') THEN
        ALTER TABLE "Payment" ADD COLUMN "providerId" TEXT;
    END IF;
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'Payment' AND column_name = 'notifyData') THEN
        ALTER TABLE "Payment" ADD COLUMN "notifyData" JSONB;
    END IF;
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'Payment' AND column_name = 'verifiedAt') THEN
        ALTER TABLE "Payment" ADD COLUMN "verifiedAt" TIMESTAMP(3) WITHOUT TIME ZONE;
    END IF;
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'Payment' AND column_name = 'refundedAt') THEN
        ALTER TABLE "Payment" ADD COLUMN "refundedAt" TIMESTAMP(3) WITHOUT TIME ZONE;
    END IF;
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'Payment' AND column_name = 'refundAmount') THEN
        ALTER TABLE "Payment" ADD COLUMN "refundAmount" DECIMAL(12,2);
    END IF;
END $$;

-- ------------------------------------------------------------------
-- 5. Session missing columns
-- ------------------------------------------------------------------
DO $$
BEGIN
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'Session' AND column_name = 'csrfToken') THEN
        ALTER TABLE "Session" ADD COLUMN "csrfToken" TEXT;
    END IF;
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'Session' AND column_name = 'csrfTokenExpiresAt') THEN
        ALTER TABLE "Session" ADD COLUMN "csrfTokenExpiresAt" TIMESTAMP(3) WITHOUT TIME ZONE;
    END IF;
END $$;

-- ------------------------------------------------------------------
-- 6. Ensure PaymentProvider table exists
-- ------------------------------------------------------------------
DO $$
BEGIN
    IF NOT EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'PaymentProvider') THEN
        CREATE TYPE "PaymentProviderType" AS ENUM ('WECHAT_PAY', 'ALIPAY', 'UNION_PAY', 'BANK_TRANSFER', 'MANUAL_QR');
        CREATE TYPE "ProviderMode" AS ENUM ('SANDBOX', 'LIVE');
        CREATE TABLE "PaymentProvider" (
            "id" TEXT NOT NULL PRIMARY KEY,
            "name" TEXT NOT NULL,
            "nameEn" TEXT,
            "type" "PaymentProviderType" NOT NULL,
            "appId" TEXT,
            "merchantId" TEXT,
            "publicKey" TEXT,
            "privateKey" TEXT,
            "notifyUrl" TEXT,
            "returnUrl" TEXT,
            "apiEndpoint" TEXT,
            "mode" "ProviderMode" NOT NULL DEFAULT 'SANDBOX',
            "isActive" BOOLEAN NOT NULL DEFAULT true,
            "sortOrder" INTEGER NOT NULL DEFAULT 0,
            "createdAt" TIMESTAMP(3) WITHOUT TIME ZONE NOT NULL DEFAULT CURRENT_TIMESTAMP,
            "updatedAt" TIMESTAMP(3) WITHOUT TIME ZONE NOT NULL DEFAULT CURRENT_TIMESTAMP
        );
    END IF;
END $$;

-- ------------------------------------------------------------------
-- 7. Payment provider FK (idempotent)
-- ------------------------------------------------------------------
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.table_constraints
        WHERE constraint_name = 'Payment_providerId_fkey' AND table_name = 'Payment'
    ) THEN
        ALTER TABLE "Payment" ADD CONSTRAINT "Payment_providerId_fkey"
            FOREIGN KEY ("providerId") REFERENCES "PaymentProvider"("id");
    END IF;
END $$;
