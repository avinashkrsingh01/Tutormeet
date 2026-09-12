-- ============================================================
-- TutorMeet — Storage Buckets + Security Policies
-- Version: 2.0
-- Run AFTER 012_indexes.sql
--
-- Buckets:
--  1. avatars         — public read, owner write
--  2. tutor-documents — PRIVATE, owner + admin only
-- ============================================================

-- ─── avatars (public) ────────────────────────────────────────────────────────

INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES (
  'avatars',
  'avatars',
  TRUE,
  5242880,  -- 5 MB
  ARRAY['image/jpeg', 'image/png', 'image/webp', 'image/gif']
) ON CONFLICT (id) DO UPDATE
  SET public = TRUE,
      file_size_limit = EXCLUDED.file_size_limit;

-- Authenticated users upload into their own folder: avatars/{user_id}/...
CREATE POLICY "avatars_insert"
  ON storage.objects FOR INSERT
  WITH CHECK (
    bucket_id = 'avatars'
    AND auth.uid()::text = (storage.foldername(name))[1]
  );

CREATE POLICY "avatars_update"
  ON storage.objects FOR UPDATE
  USING (
    bucket_id = 'avatars'
    AND auth.uid()::text = (storage.foldername(name))[1]
  );

CREATE POLICY "avatars_delete"
  ON storage.objects FOR DELETE
  USING (
    bucket_id = 'avatars'
    AND auth.uid()::text = (storage.foldername(name))[1]
  );

-- Public read — anyone can view avatars
CREATE POLICY "avatars_public_read"
  ON storage.objects FOR SELECT
  USING (bucket_id = 'avatars');

-- ─── tutor-documents (PRIVATE) ───────────────────────────────────────────────
-- SECURITY: This bucket must NEVER be public.
-- Files stored as: tutor-documents/{tutor_profile_id}/{doc_type}_{timestamp}_{filename}

INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES (
  'tutor-documents',
  'tutor-documents',
  FALSE,   -- MUST remain private
  10485760, -- 10 MB per document
  ARRAY['image/jpeg', 'image/png', 'application/pdf']
) ON CONFLICT (id) DO UPDATE
  SET public = FALSE,
      file_size_limit = EXCLUDED.file_size_limit;

-- Tutors upload into their own tutor_profile folder
CREATE POLICY "tutor_docs_insert"
  ON storage.objects FOR INSERT
  WITH CHECK (
    bucket_id = 'tutor-documents'
    AND auth.uid()::text = (storage.foldername(name))[1]
    AND EXISTS (
      SELECT 1 FROM profiles
      WHERE id = auth.uid() AND role = 'tutor' AND is_active = TRUE
    )
  );

-- SECURITY: Tutors can only read files in their own folder.
-- Admins can read any document.
-- Parents CANNOT access this bucket under any policy.
CREATE POLICY "tutor_docs_select"
  ON storage.objects FOR SELECT
  USING (
    bucket_id = 'tutor-documents'
    AND (
      auth.uid()::text = (storage.foldername(name))[1]
      OR is_admin()
    )
  );

-- Only admins can delete documents
CREATE POLICY "tutor_docs_admin_delete"
  ON storage.objects FOR DELETE
  USING (
    bucket_id = 'tutor-documents'
    AND is_admin()
  );
