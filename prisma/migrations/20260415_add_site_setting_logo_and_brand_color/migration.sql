-- Add missing columns to SiteSetting
ALTER TABLE "SiteSetting" ADD COLUMN "logoUploadUrl" TEXT;
ALTER TABLE "SiteSetting" ADD COLUMN "brandColor" TEXT;
