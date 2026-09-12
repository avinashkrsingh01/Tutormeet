-- ============================================================
-- Migration 016: Security Hardening Part 2
-- Fixes Privilege Escalation (BOLA) in tutor_profiles,
-- Role Forgery in insert policies, and
-- Arbitrary file upload in storage buckets.
-- ============================================================

-- ─── 1. Prevent Tutors from modifying restricted columns ───────────────────
-- Tutors are allowed to UPDATE their own tutor_profiles row, but they MUST NOT
-- be able to modify verification_status, admin_notes, or rejection_reason.
-- We enforce this using a BEFORE UPDATE trigger.

CREATE OR REPLACE FUNCTION fn_enforce_tutor_profile_security()
RETURNS TRIGGER LANGUAGE plpgsql AS $$
BEGIN
  -- If the user is NOT an admin, they cannot change restricted columns.
  -- is_admin() is our secure SECURITY DEFINER helper.
  IF NOT is_admin() THEN
    -- Prevent modification of verification_status
    IF NEW.verification_status IS DISTINCT FROM OLD.verification_status THEN
      RAISE EXCEPTION 'Unauthorized: You cannot modify your verification status.';
    END IF;

    -- Prevent modification of admin_notes
    IF NEW.admin_notes IS DISTINCT FROM OLD.admin_notes THEN
      RAISE EXCEPTION 'Unauthorized: You cannot modify admin notes.';
    END IF;

    -- Prevent modification of rejection_reason
    IF NEW.rejection_reason IS DISTINCT FROM OLD.rejection_reason THEN
      RAISE EXCEPTION 'Unauthorized: You cannot modify rejection reason.';
    END IF;
  END IF;

  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS trg_tutor_profile_security ON tutor_profiles;
CREATE TRIGGER trg_tutor_profile_security
  BEFORE UPDATE ON tutor_profiles
  FOR EACH ROW EXECUTE FUNCTION fn_enforce_tutor_profile_security();

-- ─── 2. Fix Role Forgery in INSERT policies ──────────────────────────────────
-- Ensure that users cannot insert parent or tutor profiles unless their
-- base role in the profiles table actually matches.

-- parent_profiles
DROP POLICY IF EXISTS "parent_profiles_insert" ON parent_profiles;
CREATE POLICY "parent_profiles_insert"
  ON parent_profiles FOR INSERT
  WITH CHECK (user_id = auth.uid() AND is_parent());

-- tutor_profiles
DROP POLICY IF EXISTS "tutor_profiles_insert" ON tutor_profiles;
CREATE POLICY "tutor_profiles_insert"
  ON tutor_profiles FOR INSERT
  WITH CHECK (user_id = auth.uid() AND is_tutor());


-- ─── 3. Storage Bucket Security: Restrict File Extensions ──────────────────
-- The tutor-documents bucket should only accept PDFs and images.
-- (This requires the storage.extension() helper provided by Supabase Storage).

DROP POLICY IF EXISTS "tutor_docs_upload" ON storage.objects;
CREATE POLICY "tutor_docs_upload"
  ON storage.objects FOR INSERT
  WITH CHECK (
    bucket_id = 'tutor-documents'
    AND auth.uid()::text = (storage.foldername(name))[1]
    AND is_tutor()
    -- Enforce file extensions
    AND (lower(storage.extension(name)) IN ('pdf', 'jpg', 'jpeg', 'png'))
  );
