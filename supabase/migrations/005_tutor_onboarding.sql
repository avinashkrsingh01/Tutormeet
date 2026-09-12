-- ============================================================
-- TutorMeet — Tutor Onboarding Schema Extensions
-- Run AFTER 004_parent_onboarding.sql
-- ============================================================

-- ─── Extend tutor_verification_status enum ────────────────────────────────────
-- Add new statuses: "draft", "documents_pending"
-- Note: in PostgreSQL, ADD VALUE is non-transactional and idempotent via IF NOT EXISTS

ALTER TYPE tutor_verification_status ADD VALUE IF NOT EXISTS 'draft'              BEFORE 'pending';
ALTER TYPE tutor_verification_status ADD VALUE IF NOT EXISTS 'documents_pending'  BEFORE 'under_review';

-- ─── Extend tutor_profiles table ──────────────────────────────────────────────

ALTER TABLE tutor_profiles
  -- Location fields (flattened from address JSONB for easier querying)
  ADD COLUMN IF NOT EXISTS locality  TEXT,
  ADD COLUMN IF NOT EXISTS city      TEXT,
  ADD COLUMN IF NOT EXISTS pincode   CHAR(6),
  ADD COLUMN IF NOT EXISTS state     TEXT,

  -- Scores (admin-assigned after assessment/interview)
  ADD COLUMN IF NOT EXISTS knowledge_score  SMALLINT
    CHECK (knowledge_score  BETWEEN 0 AND 100),
  ADD COLUMN IF NOT EXISTS teaching_score   SMALLINT
    CHECK (teaching_score   BETWEEN 0 AND 100),

  -- Extended teaching preferences
  ADD COLUMN IF NOT EXISTS max_travel_distance_km SMALLINT DEFAULT 10,

  -- Onboarding step tracker
  ADD COLUMN IF NOT EXISTS onboarding_step TEXT DEFAULT 'basic_profile'
    CHECK (onboarding_step IN (
      'basic_profile','education','experience',
      'teaching_preferences','documents','submitted'
    )),

  -- Onboarding completion flag
  ADD COLUMN IF NOT EXISTS onboarding_complete BOOLEAN NOT NULL DEFAULT FALSE;

-- ─── Update default verification_status for new tutors ────────────────────────
-- New tutors start at 'draft' (not 'pending') to make status flow clearer.
-- Existing rows keep 'pending'.

-- ─── Document type enum — add new types ───────────────────────────────────────

ALTER TYPE document_type ADD VALUE IF NOT EXISTS 'passport'              AFTER 'pan';
ALTER TYPE document_type ADD VALUE IF NOT EXISTS 'driving_licence'       AFTER 'passport';
ALTER TYPE document_type ADD VALUE IF NOT EXISTS 'teaching_certificate'  AFTER 'experience_letter';
ALTER TYPE document_type ADD VALUE IF NOT EXISTS 'profile_photo'         AFTER 'teaching_certificate';

-- ─── Assessment status — add 'scheduled' ──────────────────────────────────────

ALTER TYPE assessment_status ADD VALUE IF NOT EXISTS 'scheduled' BEFORE 'in_progress';

-- ─── Indexes ──────────────────────────────────────────────────────────────────

CREATE INDEX IF NOT EXISTS idx_tutor_profiles_city     ON tutor_profiles(city);
CREATE INDEX IF NOT EXISTS idx_tutor_profiles_locality ON tutor_profiles(locality);
CREATE INDEX IF NOT EXISTS idx_tutor_profiles_onboarding ON tutor_profiles(onboarding_complete);
CREATE INDEX IF NOT EXISTS idx_tutor_profiles_scores
  ON tutor_profiles(knowledge_score, teaching_score)
  WHERE verification_status = 'verified';

-- ─── RLS helper update ────────────────────────────────────────────────────────
-- Update the public visibility rule to use flattened location columns

-- Drop and recreate the public select policy to include score display
DROP POLICY IF EXISTS "tutor_profiles_select_public" ON tutor_profiles;

CREATE POLICY "tutor_profiles_select_public"
  ON tutor_profiles FOR SELECT
  USING (
    verification_status = 'verified'
    OR user_id = auth.uid()
    OR is_admin()
  );
