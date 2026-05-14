-- ============================================================================
-- Supabase Storage RLS Policies
-- ============================================================================
-- Run this in the Supabase SQL Editor to enable authenticated/admin uploads.
-- These policies allow:
--   1. Anonymous users to READ public files (e.g., CMS images, logos)
--   2. Authenticated users to READ all files
--   3. SUPER_ADMIN / FINANCE_ADMIN to INSERT/UPDATE/DELETE in any bucket
--   4. LAB_PARTNER to INSERT/UPDATE/DELETE in lab-specific buckets
--
-- Prerequisites:
--   - buckets named: admin, equipment, services, service-categories,
--     general, avatar, settings, cms, lab-media
--   - Auth users have a `role` claim in their JWT (app_metadata or user_metadata)
-- ============================================================================

-- ─── Enable RLS on storage.objects ──────────────────────────────────────────
ALTER TABLE storage.objects ENABLE ROW LEVEL SECURITY;

-- Drop existing policies to avoid conflicts during re-runs
DROP POLICY IF EXISTS "Public read access" ON storage.objects;
DROP POLICY IF EXISTS "Authenticated read access" ON storage.objects;
DROP POLICY IF EXISTS "Admin full access" ON storage.objects;
DROP POLICY IF EXISTS "Lab partner bucket access" ON storage.objects;
DROP POLICY IF EXISTS "User avatar self-service" ON storage.objects;

-- ─── Policy 1: Public read for all objects ──────────────────────────────────
-- Covers logos, CMS images, lab photos, service images served on public pages
CREATE POLICY "Public read access"
ON storage.objects
FOR SELECT
TO anon, authenticated
USING (true);

-- ─── Policy 2: Admin full CRUD ──────────────────────────────────────────────
-- SUPER_ADMIN and FINANCE_ADMIN can upload, replace, and delete in ANY bucket
CREATE POLICY "Admin full access"
ON storage.objects
FOR ALL
TO authenticated
USING (
  coalesce(
    (auth.jwt() -> 'app_metadata' ->> 'role'),
    (auth.jwt() -> 'user_metadata' ->> 'role'),
    ''
  ) IN ('SUPER_ADMIN', 'FINANCE_ADMIN')
)
WITH CHECK (
  coalesce(
    (auth.jwt() -> 'app_metadata' ->> 'role'),
    (auth.jwt() -> 'user_metadata' ->> 'role'),
    ''
  ) IN ('SUPER_ADMIN', 'FINANCE_ADMIN')
);

-- ─── Policy 3: Lab partner scoped access ────────────────────────────────────
-- LAB_PARTNER users can manage files in lab-media and equipment buckets
CREATE POLICY "Lab partner bucket access"
ON storage.objects
FOR ALL
TO authenticated
USING (
  coalesce(
    (auth.jwt() -> 'app_metadata' ->> 'role'),
    (auth.jwt() -> 'user_metadata' ->> 'role'),
    ''
  ) = 'LAB_PARTNER'
  AND bucket_id IN ('lab-media', 'equipment', 'services')
)
WITH CHECK (
  coalesce(
    (auth.jwt() -> 'app_metadata' ->> 'role'),
    (auth.jwt() -> 'user_metadata' ->> 'role'),
    ''
  ) = 'LAB_PARTNER'
  AND bucket_id IN ('lab-media', 'equipment', 'services')
);

-- ─── Policy 4: User avatar self-service ─────────────────────────────────────
-- Any authenticated user can upload/replace/delete their OWN avatar
CREATE POLICY "User avatar self-service"
ON storage.objects
FOR ALL
TO authenticated
USING (
  bucket_id = 'avatar'
  AND (storage.foldername(name))[1] = auth.uid()::text
)
WITH CHECK (
  bucket_id = 'avatar'
  AND (storage.foldername(name))[1] = auth.uid()::text
);

-- ============================================================================
-- Bucket Creation (idempotent)
-- ============================================================================
INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES
  ('admin',       'admin',       true, 52428800, ARRAY['image/jpeg','image/png','image/webp','application/pdf']),
  ('equipment',   'equipment',   true, 52428800, ARRAY['image/jpeg','image/png','image/webp']),
  ('services',    'services',    true, 52428800, ARRAY['image/jpeg','image/png','image/webp']),
  ('service-categories', 'service-categories', true, 52428800, ARRAY['image/jpeg','image/png','image/webp']),
  ('general',     'general',     true, 52428800, ARRAY['image/jpeg','image/png','image/webp','application/pdf']),
  ('avatar',      'avatar',      true, 5242880,  ARRAY['image/jpeg','image/png','image/webp']),
  ('settings',    'settings',    true, 52428800, ARRAY['image/jpeg','image/png','image/webp']),
  ('cms',         'cms',         true, 52428800, ARRAY['image/jpeg','image/png','image/webp']),
  ('lab-media',   'lab-media',   true, 52428800, ARRAY['image/jpeg','image/png','image/webp'])
ON CONFLICT (id) DO UPDATE SET
  public = EXCLUDED.public,
  file_size_limit = EXCLUDED.file_size_limit,
  allowed_mime_types = EXCLUDED.allowed_mime_types;
