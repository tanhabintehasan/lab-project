-- Make email optional on User table for phone-only registration
ALTER TABLE "User" ALTER COLUMN "email" DROP NOT NULL;
