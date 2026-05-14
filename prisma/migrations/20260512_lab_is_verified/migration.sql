-- Add isVerified column to Laboratory table
ALTER TABLE "Laboratory"
  ADD COLUMN IF NOT EXISTS "isVerified" BOOLEAN NOT NULL DEFAULT false;
