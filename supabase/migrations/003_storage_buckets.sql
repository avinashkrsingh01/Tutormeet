-- ============================================================
-- TutorMeet — Supabase Storage Buckets + Policies
-- Run AFTER 002_rls_policies.sql
-- ============================================================

-- ─── Avatars bucket (public read) ─────────────────────────────────────────────
INSERT INTO storage.buckets (id, name, public)
VALUES ('avatars', 'avatars', TRUE)
ON CONFLICT (id) DO NOTHING;

-- Users can upload/update their own avatar
DROP POLICY IF EXISTS "avatars_upload" ON storage.objects;
CREATE POLICY "avatars_upload"
  ON storage.objects FOR INSERT
  WITH CHECK (
    bucket_id = 'avatars'
    AND auth.uid()::text = (storage.foldername(name))[1]
  );

DROP POLICY IF EXISTS "avatars_update" ON storage.objects;
CREATE POLICY "avatars_update"
  ON storage.objects FOR UPDATE
  USING (
    bucket_id = 'avatars'
    AND auth.uid()::text = (storage.foldername(name))[1]
  );

-- Public read for avatars
DROP POLICY IF EXISTS "avatars_select" ON storage.objects;
CREATE POLICY "avatars_select"
  ON storage.objects FOR SELECT
  USING (bucket_id = 'avatars');

-- ─── Tutor documents bucket (private) ────────────────────────────────────────
INSERT INTO storage.buckets (id, name, public)
VALUES ('tutor-documents', 'tutor-documents', FALSE)
ON CONFLICT (id) DO NOTHING;

-- Tutors can upload their own documents
DROP POLICY IF EXISTS "tutor_docs_upload" ON storage.objects;
CREATE POLICY "tutor_docs_upload"
  ON storage.objects FOR INSERT
  WITH CHECK (
    bucket_id = 'tutor-documents'
    AND auth.uid()::text = (storage.foldername(name))[1]
    AND EXISTS (
      SELECT 1 FROM profiles WHERE id = auth.uid() AND role = 'tutor'
    )
  );

-- Tutors can read their own documents; admins can read all
DROP POLICY IF EXISTS "tutor_docs_select" ON storage.objects;
CREATE POLICY "tutor_docs_select"
  ON storage.objects FOR SELECT
  USING (
    bucket_id = 'tutor-documents'
    AND (
      auth.uid()::text = (storage.foldername(name))[1]
      OR is_admin()
    )
  );

-- Admins can delete documents
DROP POLICY IF EXISTS "tutor_docs_delete" ON storage.objects;
CREATE POLICY "tutor_docs_delete"
  ON storage.objects FOR DELETE
  USING (
    bucket_id = 'tutor-documents'
    AND is_admin()
  );
