-- ============================================================
-- TutorMeet — Parent Onboarding Schema Extensions
-- Run AFTER 003_storage_buckets.sql
-- ============================================================

-- Add onboarding fields to parent_profiles
ALTER TABLE parent_profiles
  ADD COLUMN IF NOT EXISTS city                     TEXT,
  ADD COLUMN IF NOT EXISTS locality                 TEXT,
  ADD COLUMN IF NOT EXISTS communication_preference TEXT
    CHECK (communication_preference IN ('whatsapp','call','email','any')),
  ADD COLUMN IF NOT EXISTS onboarding_complete      BOOLEAN NOT NULL DEFAULT FALSE;

-- Add new fields to tuition_requirements
ALTER TABLE tuition_requirements
  ADD COLUMN IF NOT EXISTS preferred_tutor_gender TEXT NOT NULL DEFAULT 'no_preference'
    CHECK (preferred_tutor_gender IN ('male','female','no_preference')),
  ADD COLUMN IF NOT EXISTS learning_goals TEXT;

-- Add student_name directly on requirements (denormalised for display without joins)
-- The student_id FK still exists for full data; this just speeds up list views
ALTER TABLE tuition_requirements
  ADD COLUMN IF NOT EXISTS student_name TEXT;

-- Index for onboarding state
CREATE INDEX IF NOT EXISTS idx_parent_profiles_onboarding
  ON parent_profiles(onboarding_complete);
