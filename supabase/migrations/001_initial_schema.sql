-- ============================================================
-- TutorMeet — Initial Database Schema
-- Run this in the Supabase SQL editor or via the CLI:
--   supabase db push
-- ============================================================

-- ─── Extensions ──────────────────────────────────────────────────────────────
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS "pg_trgm"; -- for fuzzy text search on tutors

-- ─── Enums ───────────────────────────────────────────────────────────────────

CREATE TYPE user_role AS ENUM ('parent', 'tutor', 'admin');

CREATE TYPE tutor_verification_status AS ENUM (
  'pending',
  'profile_submitted',
  'under_review',
  'assessment_pending',
  'interview_pending',
  'verified',
  'rejected',
  'suspended'
);

CREATE TYPE document_type AS ENUM (
  'aadhaar',
  'pan',
  'degree_certificate',
  'marksheet',
  'experience_letter',
  'other'
);

CREATE TYPE document_status AS ENUM ('pending', 'approved', 'rejected');

CREATE TYPE assessment_status AS ENUM (
  'not_started',
  'in_progress',
  'completed',
  'passed',
  'failed'
);

CREATE TYPE requirement_status AS ENUM (
  'draft',
  'submitted',
  'matching',
  'shortlisted',
  'demo_scheduled',
  'tutor_selected',
  'active',
  'completed',
  'cancelled'
);

CREATE TYPE match_status AS ENUM (
  'suggested',
  'sent',
  'viewed',
  'demo_requested',
  'demo_scheduled',
  'demo_completed',
  'selected',
  'rejected'
);

CREATE TYPE demo_status AS ENUM (
  'scheduled',
  'completed',
  'cancelled',
  'no_show'
);

CREATE TYPE attendance_status AS ENUM ('present', 'absent', 'cancelled');

CREATE TYPE teaching_mode AS ENUM (
  'Home Visit',
  'Student''s Home',
  'Both'
);

CREATE TYPE gender_type AS ENUM ('male', 'female', 'other');

CREATE TYPE admin_action_type AS ENUM (
  'tutor_approved',
  'tutor_rejected',
  'document_approved',
  'document_rejected',
  'tutor_matched',
  'demo_scheduled',
  'requirement_closed',
  'user_suspended'
);

-- ============================================================
-- TABLE: profiles
-- One row per auth.users entry. Stores role + basic info.
-- ============================================================
CREATE TABLE profiles (
  id            UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  email         TEXT NOT NULL UNIQUE,
  full_name     TEXT NOT NULL,
  phone         TEXT,
  role          user_role NOT NULL DEFAULT 'parent',
  avatar_url    TEXT,
  is_active     BOOLEAN NOT NULL DEFAULT TRUE,
  created_at    TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at    TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- ============================================================
-- TABLE: parent_profiles
-- Additional details for parents.
-- ============================================================
CREATE TABLE parent_profiles (
  id            UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id       UUID NOT NULL UNIQUE REFERENCES profiles(id) ON DELETE CASCADE,
  address       JSONB,
  created_at    TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at    TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- ============================================================
-- TABLE: students
-- Children registered under a parent.
-- ============================================================
CREATE TABLE students (
  id            UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  parent_id     UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  full_name     TEXT NOT NULL,
  date_of_birth DATE,
  gender        gender_type,
  current_grade TEXT,
  school_name   TEXT,
  created_at    TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- ============================================================
-- TABLE: tutor_profiles
-- Core tutor profile — all verification and teaching metadata.
-- ============================================================
CREATE TABLE tutor_profiles (
  id                       UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id                  UUID NOT NULL UNIQUE REFERENCES profiles(id) ON DELETE CASCADE,
  verification_status      tutor_verification_status NOT NULL DEFAULT 'pending',

  -- Personal
  date_of_birth            DATE,
  gender                   gender_type,
  address                  JSONB,

  -- Teaching preferences
  subjects                 TEXT[]   NOT NULL DEFAULT '{}',
  grades                   TEXT[]   NOT NULL DEFAULT '{}',
  boards                   TEXT[]   NOT NULL DEFAULT '{}',
  teaching_mode            teaching_mode,
  preferred_days           TEXT[]   NOT NULL DEFAULT '{}',
  preferred_time_slots     TEXT[]   NOT NULL DEFAULT '{}',
  expected_fee_per_hour    NUMERIC(10, 2),
  demo_class_available     BOOLEAN  NOT NULL DEFAULT TRUE,

  -- Bio & experience
  bio                      TEXT,
  years_of_experience      SMALLINT DEFAULT 0,
  education                JSONB    NOT NULL DEFAULT '[]',
  experience               JSONB    NOT NULL DEFAULT '[]',

  -- Verification flags
  identity_verified        BOOLEAN  NOT NULL DEFAULT FALSE,
  education_verified       BOOLEAN  NOT NULL DEFAULT FALSE,
  admin_notes              TEXT,
  verified_at              TIMESTAMPTZ,
  verified_by              UUID REFERENCES profiles(id),

  -- Aggregated ratings (updated via trigger)
  average_rating           NUMERIC(3, 2),
  total_reviews            INTEGER  NOT NULL DEFAULT 0,
  total_students           INTEGER  NOT NULL DEFAULT 0,

  created_at               TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at               TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- ============================================================
-- TABLE: tutor_documents
-- Identity + education documents uploaded by tutors.
-- ============================================================
CREATE TABLE tutor_documents (
  id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tutor_id        UUID NOT NULL REFERENCES tutor_profiles(id) ON DELETE CASCADE,
  document_type   document_type NOT NULL,
  file_url        TEXT NOT NULL,
  file_name       TEXT NOT NULL,
  status          document_status NOT NULL DEFAULT 'pending',
  admin_notes     TEXT,
  uploaded_at     TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  reviewed_at     TIMESTAMPTZ,
  reviewed_by     UUID REFERENCES profiles(id)
);

-- ============================================================
-- TABLE: tutor_assessments
-- Subject knowledge assessments.
-- ============================================================
CREATE TABLE tutor_assessments (
  id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tutor_id        UUID NOT NULL REFERENCES tutor_profiles(id) ON DELETE CASCADE,
  subject         TEXT NOT NULL,
  score           SMALLINT,
  max_score       SMALLINT NOT NULL DEFAULT 100,
  status          assessment_status NOT NULL DEFAULT 'not_started',
  started_at      TIMESTAMPTZ,
  completed_at    TIMESTAMPTZ,
  UNIQUE (tutor_id, subject)
);

-- ============================================================
-- TABLE: tuition_requirements
-- A parent's tutor request — the core matching unit.
-- ============================================================
CREATE TABLE tuition_requirements (
  id                         UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  parent_id                  UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  student_id                 UUID NOT NULL REFERENCES students(id) ON DELETE CASCADE,

  subjects                   TEXT[]      NOT NULL DEFAULT '{}',
  grade                      TEXT        NOT NULL,
  board                      TEXT        NOT NULL,
  teaching_mode              teaching_mode NOT NULL,

  preferred_days             TEXT[]      NOT NULL DEFAULT '{}',
  preferred_time_slots       TEXT[]      NOT NULL DEFAULT '{}',
  sessions_per_week          SMALLINT    NOT NULL DEFAULT 3,
  session_duration_minutes   SMALLINT    NOT NULL DEFAULT 60,

  locality                   TEXT        NOT NULL,
  city                       TEXT        NOT NULL,
  pincode                    CHAR(6)     NOT NULL,

  budget_per_hour            NUMERIC(10, 2),
  special_requirements       TEXT,

  status                     requirement_status NOT NULL DEFAULT 'submitted',
  admin_notes                TEXT,

  created_at                 TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at                 TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- ============================================================
-- TABLE: tutor_matches
-- Admin-curated shortlist of tutors per requirement.
-- ============================================================
CREATE TABLE tutor_matches (
  id                UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  requirement_id    UUID NOT NULL REFERENCES tuition_requirements(id) ON DELETE CASCADE,
  tutor_id          UUID NOT NULL REFERENCES tutor_profiles(id) ON DELETE CASCADE,
  match_status      match_status NOT NULL DEFAULT 'suggested',
  admin_notes       TEXT,
  created_at        TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at        TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE (requirement_id, tutor_id)
);

-- ============================================================
-- TABLE: demo_classes
-- Scheduled demo sessions between tutor and parent.
-- ============================================================
CREATE TABLE demo_classes (
  id                UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  match_id          UUID NOT NULL REFERENCES tutor_matches(id) ON DELETE CASCADE,
  requirement_id    UUID NOT NULL REFERENCES tuition_requirements(id),
  tutor_id          UUID NOT NULL REFERENCES tutor_profiles(id),
  parent_id         UUID NOT NULL REFERENCES profiles(id),
  scheduled_at      TIMESTAMPTZ NOT NULL,
  duration_minutes  SMALLINT NOT NULL DEFAULT 60,
  meeting_link      TEXT,
  address           TEXT,
  status            demo_status NOT NULL DEFAULT 'scheduled',
  parent_feedback   TEXT,
  tutor_feedback    TEXT,
  created_at        TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- ============================================================
-- TABLE: attendance_records
-- Per-session attendance once tuition is active.
-- ============================================================
CREATE TABLE attendance_records (
  id                        UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  requirement_id            UUID NOT NULL REFERENCES tuition_requirements(id) ON DELETE CASCADE,
  tutor_id                  UUID NOT NULL REFERENCES tutor_profiles(id),
  student_id                UUID NOT NULL REFERENCES students(id),
  date                      DATE NOT NULL,
  status                    attendance_status NOT NULL,
  session_duration_minutes  SMALLINT NOT NULL DEFAULT 60,
  marked_by                 TEXT NOT NULL CHECK (marked_by IN ('tutor', 'parent', 'admin')),
  notes                     TEXT,
  created_at                TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE (requirement_id, tutor_id, date)
);

-- ============================================================
-- TABLE: reviews
-- Parent reviews for tutors after tuition.
-- ============================================================
CREATE TABLE reviews (
  id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tutor_id        UUID NOT NULL REFERENCES tutor_profiles(id) ON DELETE CASCADE,
  parent_id       UUID NOT NULL REFERENCES profiles(id),
  student_id      UUID NOT NULL REFERENCES students(id),
  requirement_id  UUID NOT NULL REFERENCES tuition_requirements(id),
  rating          SMALLINT NOT NULL CHECK (rating BETWEEN 1 AND 5),
  comment         TEXT,
  is_published    BOOLEAN NOT NULL DEFAULT FALSE,
  created_at      TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE (requirement_id, parent_id)
);

-- ============================================================
-- TABLE: admin_action_logs
-- Audit trail for all admin actions.
-- ============================================================
CREATE TABLE admin_action_logs (
  id            UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  admin_id      UUID NOT NULL REFERENCES profiles(id),
  action_type   admin_action_type NOT NULL,
  target_id     UUID NOT NULL,
  target_type   TEXT NOT NULL CHECK (target_type IN ('tutor', 'parent', 'requirement', 'document')),
  notes         TEXT,
  created_at    TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- ============================================================
-- INDEXES
-- ============================================================

CREATE INDEX idx_profiles_role ON profiles(role);
CREATE INDEX idx_tutor_profiles_status ON tutor_profiles(verification_status);
CREATE INDEX idx_tutor_profiles_city ON tutor_profiles USING gin (address);
CREATE INDEX idx_tutor_profiles_subjects ON tutor_profiles USING gin (subjects);
CREATE INDEX idx_tuition_requirements_parent ON tuition_requirements(parent_id);
CREATE INDEX idx_tuition_requirements_status ON tuition_requirements(status);
CREATE INDEX idx_tuition_requirements_city ON tuition_requirements(city);
CREATE INDEX idx_tutor_matches_requirement ON tutor_matches(requirement_id);
CREATE INDEX idx_tutor_matches_tutor ON tutor_matches(tutor_id);
CREATE INDEX idx_demo_classes_tutor ON demo_classes(tutor_id);
CREATE INDEX idx_demo_classes_parent ON demo_classes(parent_id);
CREATE INDEX idx_attendance_requirement ON attendance_records(requirement_id);
CREATE INDEX idx_reviews_tutor ON reviews(tutor_id);
CREATE INDEX idx_admin_logs_admin ON admin_action_logs(admin_id);

-- ============================================================
-- TRIGGERS — updated_at auto-update
-- ============================================================

CREATE OR REPLACE FUNCTION trigger_set_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER set_updated_at_profiles
  BEFORE UPDATE ON profiles
  FOR EACH ROW EXECUTE FUNCTION trigger_set_updated_at();

CREATE TRIGGER set_updated_at_parent_profiles
  BEFORE UPDATE ON parent_profiles
  FOR EACH ROW EXECUTE FUNCTION trigger_set_updated_at();

CREATE TRIGGER set_updated_at_tutor_profiles
  BEFORE UPDATE ON tutor_profiles
  FOR EACH ROW EXECUTE FUNCTION trigger_set_updated_at();

CREATE TRIGGER set_updated_at_tuition_requirements
  BEFORE UPDATE ON tuition_requirements
  FOR EACH ROW EXECUTE FUNCTION trigger_set_updated_at();

CREATE TRIGGER set_updated_at_tutor_matches
  BEFORE UPDATE ON tutor_matches
  FOR EACH ROW EXECUTE FUNCTION trigger_set_updated_at();

-- ============================================================
-- TRIGGER — create profile on new user signup
-- Fires automatically when a user registers via Supabase Auth.
-- The role and full_name are passed via raw_user_meta_data.
-- ============================================================

CREATE OR REPLACE FUNCTION handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO public.profiles (id, email, full_name, phone, role)
  VALUES (
    NEW.id,
    NEW.email,
    COALESCE(NEW.raw_user_meta_data->>'full_name', ''),
    COALESCE(NEW.raw_user_meta_data->>'phone', NULL),
    COALESCE((NEW.raw_user_meta_data->>'role')::user_role, 'parent')
  );

  -- Create role-specific profile row
  IF (NEW.raw_user_meta_data->>'role') = 'tutor' THEN
    INSERT INTO public.tutor_profiles (user_id)
    VALUES (NEW.id);
  ELSIF (NEW.raw_user_meta_data->>'role') = 'parent' THEN
    INSERT INTO public.parent_profiles (user_id)
    VALUES (NEW.id);
  END IF;

  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION handle_new_user();

-- ============================================================
-- TRIGGER — update tutor average_rating when a review is added
-- ============================================================

CREATE OR REPLACE FUNCTION update_tutor_rating()
RETURNS TRIGGER AS $$
BEGIN
  UPDATE tutor_profiles
  SET
    average_rating = (
      SELECT ROUND(AVG(rating)::NUMERIC, 2)
      FROM reviews
      WHERE tutor_id = NEW.tutor_id
        AND is_published = TRUE
    ),
    total_reviews = (
      SELECT COUNT(*)
      FROM reviews
      WHERE tutor_id = NEW.tutor_id
        AND is_published = TRUE
    )
  WHERE id = NEW.tutor_id;

  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER on_review_upsert
  AFTER INSERT OR UPDATE ON reviews
  FOR EACH ROW EXECUTE FUNCTION update_tutor_rating();
