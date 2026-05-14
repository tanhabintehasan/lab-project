-- Financial Ledger Migration
-- Adds LabWallet, LabTransaction support, and ledger fields to Transaction
-- Run this manually against the database to keep schema in sync
-- without requiring prisma migrate deploy (due to pending migration situation)

-- 1. Add PAYOUT to TransactionType enum
-- PostgreSQL enums are tricky; we use a text check constraint approach
-- or add the enum value if the column is already an enum.
-- Since Prisma uses native PostgreSQL enums, we need to add the value:
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM pg_enum
        WHERE enumlabel = 'PAYOUT'
        AND enumtypid = (SELECT oid FROM pg_type WHERE typname = 'TransactionType')
    ) THEN
        ALTER TYPE "TransactionType" ADD VALUE 'PAYOUT';
    END IF;
END $$;

-- 2. Add ledger fields to Transaction table
ALTER TABLE "Transaction"
    ADD COLUMN IF NOT EXISTS "labWalletId" TEXT,
    ADD COLUMN IF NOT EXISTS "grossAmount" DECIMAL(12, 2),
    ADD COLUMN IF NOT EXISTS "platformFee" DECIMAL(12, 2),
    ADD COLUMN IF NOT EXISTS "netAmount" DECIMAL(12, 2),
    ADD COLUMN IF NOT EXISTS "feeRate" DECIMAL(5, 4);

-- 3. Add index on labWalletId
CREATE INDEX IF NOT EXISTS "Transaction_labWalletId_idx" ON "Transaction"("labWalletId");
CREATE INDEX IF NOT EXISTS "Transaction_referenceType_referenceId_idx" ON "Transaction"("referenceType", "referenceId");

-- 4. Create LabWallet table
CREATE TABLE IF NOT EXISTS "LabWallet" (
    "id" TEXT NOT NULL DEFAULT gen_random_uuid()::text,
    "labId" TEXT NOT NULL,
    "balance" DECIMAL(12, 2) NOT NULL DEFAULT 0,
    "frozenAmount" DECIMAL(12, 2) NOT NULL DEFAULT 0,
    "totalEarned" DECIMAL(12, 2) NOT NULL DEFAULT 0,
    "totalWithdrawn" DECIMAL(12, 2) NOT NULL DEFAULT 0,
    "currency" TEXT NOT NULL DEFAULT 'CNY',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "LabWallet_pkey" PRIMARY KEY ("id"),
    CONSTRAINT "LabWallet_labId_key" UNIQUE ("labId"),
    CONSTRAINT "LabWallet_labId_fkey" FOREIGN KEY ("labId") REFERENCES "Laboratory"("id") ON DELETE CASCADE ON UPDATE NO ACTION
);

CREATE INDEX IF NOT EXISTS "LabWallet_labId_idx" ON "LabWallet"("labId");

-- 5. Add FK from Transaction to LabWallet
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.table_constraints
        WHERE constraint_name = 'Transaction_labWalletId_fkey'
        AND table_name = 'Transaction'
    ) THEN
        ALTER TABLE "Transaction"
            ADD CONSTRAINT "Transaction_labWalletId_fkey"
            FOREIGN KEY ("labWalletId") REFERENCES "LabWallet"("id")
            ON DELETE SET NULL ON UPDATE NO ACTION;
    END IF;
END $$;

-- 6. Add platformFeeRate to SiteSetting
ALTER TABLE "SiteSetting"
    ADD COLUMN IF NOT EXISTS "platformFeeRate" DECIMAL(5, 4) NOT NULL DEFAULT 0.15;

-- 7. Seed default SiteSetting row if none exists (so platformFeeRate is readable)
INSERT INTO "SiteSetting" ("id", "siteName", "platformFeeRate")
SELECT gen_random_uuid()::text, '度量衡科研平台', 0.15
WHERE NOT EXISTS (SELECT 1 FROM "SiteSetting" LIMIT 1);
