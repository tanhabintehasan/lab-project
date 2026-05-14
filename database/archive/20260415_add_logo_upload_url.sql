-- Add logoUploadUrl to SiteSetting (idempotent)
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns
        WHERE table_name = 'SiteSetting' AND column_name = 'logoUploadUrl'
    ) THEN
        ALTER TABLE "SiteSetting" ADD COLUMN "logoUploadUrl" TEXT;
    END IF;
END $$;
