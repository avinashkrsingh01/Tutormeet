-- ============================================================
-- TutorMeet — Complete Normalized Database Schema
-- Version: 2.0  |  Run order: 010 (clean install)
--
-- This file is the single authoritative schema definition.
-- It replaces migrations 001–005 for a fresh database.
-- For existing databases, run 011_rls.sql, 012_indexes.sql,
-- and check 013_seed.sql for demo data.
--
-- Execution order:
--   1. Enable extensions
--   2. Create enums
--   3. Create tables (dependency order)
--   4. Create functions + triggers
-- ============================================================

-- ─── Extensions ──────────────────────────────────────────────────────────────

CREATE EXTENSION IF NOT EXISTS "uuid-ossp";       -- uuid_generate_v4()
CREATE EXTENSION IF NOT EXISTS "pg_trgm";          -- GIN trigram index for text search
CREATE EXTENSION IF NOT EXISTS "unaccent";         -- accent-insensitive search

-- ============================================================
-- SECTION 1 — ENUMS
-- Centralised type definitions used across multiple tables.
-- ============================================================

-- ─── User roles ───────────────────────────────────────────────────────────────

CREATE TYPE user_role AS ENUM ('parent', 'tutor', 'admin');

-- ─── Gender ───────────────────────────────────────────────────────────────────

CREATE TYPE gender_type AS ENUM ('male', 'female', 'other', 'prefer_not_to_say');

-- ─── Tutor verification pipeline ─────────────────────────────────────────────
-- Progression: draft → pending → profile_submitted → [documents_pending] →
--              under_review → assessment_pending → interview_pending →
--              verified  |  rejected  |  suspended

CREATE TYPE tutor_verification_status AS ENUM (
  'draft',              -- Registered, onboarding not started
  'pending',            -- Onboarding partially complete
  'profile_submitted',  -- All steps complete, awaiting admin
  'documents_pending',  -- Admin requested additional docs
  'under_review',       -- Admin actively reviewing
  'assessment_pending', -- Knowledge test not yet taken
  'interview_pending',  -- Assessment passed, interview due
  'verified',           -- Fully verified and active
  'rejected',           -- Failed verification
  'suspended'           -- Previously verified, now suspended
);

-- ─── Tutor onboarding wizard step ────────────────────────────────────────────

CREATE TYPE onboarding_step AS ENUM (
  'basic_profile',
  'education',
  'experience',
  'teaching_preferences',
  'documents',
  'submitted'
);

-- ─── Teaching mode ────────────────────────────────────────────────────────────

CREATE TYPE teaching_mode AS ENUM (
  'Home Visit',        -- Tutor goes to student's home
  'Student''s Home',   -- Alias kept for backwards compat
  'Online',            -- Remote sessions
  'Tutor''s Location', -- Student goes to tutor
  'Both'               -- Flexible
);

-- ─── Document types ───────────────────────────────────────────────────────────
-- SECURITY: document records are private by RLS; file_url is never in public API

CREATE TYPE document_type AS ENUM (
  'aadhaar',              -- Primary government ID (India)
  'pan',                  -- PAN card
  'passport',
  'driving_licence',
  'voter_id',
  'degree_certificate',
  'marksheet',
  'experience_letter',
  'teaching_certificate', -- B.Ed, D.El.Ed, etc.
  'profile_photo',
  'other'
);

CREATE TYPE document_status AS ENUM (
  'pending',    -- Uploaded, awaiting admin review
  'approved',   -- Verified by admin
  'rejected',   -- Rejected — tutor must re-upload
  'expired'     -- Document expired (future use)
);

-- ─── Assessment pipeline ──────────────────────────────────────────────────────

CREATE TYPE assessment_status AS ENUM (
  'not_started',
  'scheduled',
  'in_progress',
  'completed',
  'passed',
  'failed'
);

-- ─── Interview status ─────────────────────────────────────────────────────────

CREATE TYPE interview_status AS ENUM (
  'not_scheduled',
  'scheduled',
  'completed',
  'passed',
  'failed',
  'no_show',
  'rescheduled'
);

-- ─── Qualification level ──────────────────────────────────────────────────────

CREATE TYPE qualification_level AS ENUM (
  '10th_ssc',
  '12th_hsc',
  'diploma',
  'bachelors',
  'masters',
  'mphil',
  'phd',
  'b_ed',
  'm_ed',
  'other'
);

-- ─── Experience type ──────────────────────────────────────────────────────────

CREATE TYPE experience_type AS ENUM (
  'school_teacher',
  'coaching_institute',
  'home_tutor',
  'online_tutor',
  'college_lecturer',
  'other'
);

-- ─── Requirement (tuition request) status pipeline ───────────────────────────

CREATE TYPE requirement_status AS ENUM (
  'draft',           -- Parent saved but not submitted
  'submitted',       -- Submitted, awaiting admin
  'matching',        -- Admin finding tutors
  'shortlisted',     -- Tutors shortlisted
  'demo_scheduled',  -- Demo arranged
  'tutor_selected',  -- Parent chose a tutor
  'active',          -- Tuition ongoing
  'completed',       -- Tuition finished
  'cancelled'        -- Cancelled
);

-- ─── Tutor–requirement match status ──────────────────────────────────────────

CREATE TYPE match_status AS ENUM (
  'suggested',       -- Admin added tutor to shortlist
  'sent',            -- Parent notified
  'viewed',          -- Parent viewed tutor profile
  'demo_requested',
  'demo_scheduled',
  'demo_completed',
  'selected',        -- Parent chose this tutor
  'rejected'         -- Parent declined
);

-- ─── Demo class status ────────────────────────────────────────────────────────

CREATE TYPE demo_status AS ENUM (
  'scheduled',
  'completed',
  'cancelled',
  'no_show'
);

-- ─── Enrollment status ────────────────────────────────────────────────────────

CREATE TYPE enrollment_status AS ENUM (
  'active',
  'paused',
  'completed',
  'terminated'
);

-- ─── Attendance ───────────────────────────────────────────────────────────────

CREATE TYPE attendance_status AS ENUM (
  'present',
  'absent',
  'cancelled',     -- Session cancelled
  'holiday'
);

-- ─── Payment status ───────────────────────────────────────────────────────────

CREATE TYPE payment_status AS ENUM (
  'pending',
  'completed',
  'failed',
  'refunded',
  'disputed'
);

-- ─── Notification channel ────────────────────────────────────────────────────

CREATE TYPE notification_channel AS ENUM (
  'in_app',
  'email',
  'sms',
  'whatsapp',
  'push'
);

-- ─── Support ticket status ────────────────────────────────────────────────────

CREATE TYPE ticket_status AS ENUM (
  'open',
  'in_progress',
  'waiting_on_user',
  'resolved',
  'closed'
);

CREATE TYPE ticket_priority AS ENUM ('low', 'medium', 'high', 'urgent');

-- ─── Admin action types ───────────────────────────────────────────────────────

CREATE TYPE admin_action_type AS ENUM (
  -- Tutor lifecycle
  'tutor_approved',
  'tutor_rejected',
  'tutor_suspended',
  'tutor_reinstated',
  -- Document review
  'document_approved',
  'document_rejected',
  -- Assessment & interview
  'assessment_scheduled',
  'assessment_scored',
  'interview_scheduled',
  'interview_scored',
  -- Matching
  'tutor_matched',
  'tutor_match_removed',
  -- Demo
  'demo_scheduled',
  'demo_cancelled',
  -- Requirements
  'requirement_closed',
  'requirement_matched',
  -- User management
  'user_suspended',
  'user_reinstated',
  'user_deleted',
  -- Reviews
  'review_approved',
  'review_rejected',
  -- Payments
  'payment_dispute_resolved'
);

-- ─── Communication preference ─────────────────────────────────────────────────

CREATE TYPE communication_preference AS ENUM (
  'whatsapp',
  'call',
  'email',
  'any'
);

-- ─── Preferred tutor gender ───────────────────────────────────────────────────

CREATE TYPE tutor_gender_preference AS ENUM (
  'male',
  'female',
  'no_preference'
);

-- ============================================================
-- SECTION 2 — CORE USER TABLES
-- ============================================================

-- ─── profiles ─────────────────────────────────────────────────────────────────
-- One row per auth.users entry. Thin shared identity record.
-- Phone is stored here for contact — never exposed via public API.

CREATE TABLE profiles (
  id          UUID        PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  email       TEXT        NOT NULL UNIQUE,
  full_name   TEXT        NOT NULL,
  -- SECURITY: phone is private; never returned in public-facing queries
  phone       TEXT,
  role        user_role   NOT NULL DEFAULT 'parent',
  avatar_url  TEXT,       -- public CDN URL (avatars bucket)
  is_active   BOOLEAN     NOT NULL DEFAULT TRUE,
  created_at  TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at  TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

COMMENT ON COLUMN profiles.phone IS
  'PRIVATE — Indian mobile number. Never returned in public API.';

-- ─── parent_profiles ──────────────────────────────────────────────────────────
-- Extended details for parents. One-to-one with profiles.

CREATE TABLE parent_profiles (
  id                       UUID        PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id                  UUID        NOT NULL UNIQUE
                             REFERENCES profiles(id) ON DELETE CASCADE,
  city                     TEXT,
  locality                 TEXT,
  -- SECURITY: full address stays private — only locality shown to tutors
  address_line1            TEXT,
  address_line2            TEXT,
  state                    TEXT,
  -- SECURITY: pincode is private
  pincode                  CHAR(6),
  communication_preference communication_preference DEFAULT 'whatsapp',
  onboarding_complete      BOOLEAN     NOT NULL DEFAULT FALSE,
  created_at               TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at               TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

COMMENT ON COLUMN parent_profiles.address_line1 IS
  'PRIVATE — full street address. Never shared with tutors until enrollment confirmed.';
COMMENT ON COLUMN parent_profiles.pincode IS
  'PRIVATE — used for matching only, not shown publicly.';

-- ─── student_profiles ────────────────────────────────────────────────────────
-- Children of parents. Each student can have multiple requirements.

CREATE TABLE student_profiles (
  id             UUID        PRIMARY KEY DEFAULT uuid_generate_v4(),
  parent_id      UUID        NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  full_name      TEXT        NOT NULL,
  date_of_birth  DATE,
  gender         gender_type,
  current_grade  TEXT,
  school_name    TEXT,
  board          TEXT,                  -- current school board (CBSE, ICSE, etc.)
  special_needs  TEXT,                  -- learning differences, medical notes
  notes          TEXT,                  -- parent notes visible only to assigned tutor
  created_at     TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at     TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

COMMENT ON COLUMN student_profiles.special_needs IS
  'PRIVATE — shared only with assigned tutor after enrollment.';

-- ============================================================
-- SECTION 3 — TUTOR TABLES (fully normalised)
-- ============================================================

-- ─── tutor_profiles ───────────────────────────────────────────────────────────
-- Core tutor identity + verification state + aggregated stats.
-- Teaching preferences and credentials are in separate normalised tables.

CREATE TABLE tutor_profiles (
  id                       UUID                     PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id                  UUID                     NOT NULL UNIQUE
                             REFERENCES profiles(id) ON DELETE CASCADE,
  verification_status      tutor_verification_status NOT NULL DEFAULT 'draft',
  onboarding_step          onboarding_step           NOT NULL DEFAULT 'basic_profile',
  onboarding_complete      BOOLEAN                  NOT NULL DEFAULT FALSE,

  -- Personal info
  -- SECURITY: date_of_birth is private — never returned in public API
  date_of_birth            DATE,
  gender                   gender_type,

  -- Location — locality+city are public; pincode+state+address are private
  locality                 TEXT,
  city                     TEXT,
  state                    TEXT,
  -- SECURITY: pincode is private
  pincode                  CHAR(6),

  -- Public bio
  bio                      TEXT,
  years_of_experience      SMALLINT     NOT NULL DEFAULT 0
                             CHECK (years_of_experience BETWEEN 0 AND 60),

  -- Teaching preferences (denormalised arrays for fast filtering)
  -- Normalised detail is in tutor_subjects / tutor_qualifications / tutor_experience
  subjects                 TEXT[]       NOT NULL DEFAULT '{}',
  grades                   TEXT[]       NOT NULL DEFAULT '{}',
  boards                   TEXT[]       NOT NULL DEFAULT '{}',
  teaching_mode            teaching_mode,
  preferred_days           TEXT[]       NOT NULL DEFAULT '{}',
  preferred_time_slots     TEXT[]       NOT NULL DEFAULT '{}',
  expected_fee_per_hour    NUMERIC(10,2)
                             CHECK (expected_fee_per_hour >= 0),
  demo_class_available     BOOLEAN      NOT NULL DEFAULT TRUE,
  max_travel_distance_km   SMALLINT     DEFAULT 10
                             CHECK (max_travel_distance_km BETWEEN 1 AND 200),

  -- Admin-assigned scores (public after verification)
  knowledge_score          SMALLINT
                             CHECK (knowledge_score BETWEEN 0 AND 100),
  teaching_score           SMALLINT
                             CHECK (teaching_score BETWEEN 0 AND 100),

  -- Verification metadata (private — admin only)
  identity_verified        BOOLEAN      NOT NULL DEFAULT FALSE,
  education_verified       BOOLEAN      NOT NULL DEFAULT FALSE,
  -- SECURITY: admin_notes is private — never returned in public API
  admin_notes              TEXT,
  verified_at              TIMESTAMPTZ,
  verified_by              UUID         REFERENCES profiles(id),
  rejection_reason         TEXT,        -- PRIVATE

  -- Aggregated stats (updated via trigger)
  average_rating           NUMERIC(3,2),
  total_reviews            INTEGER      NOT NULL DEFAULT 0,
  total_students           INTEGER      NOT NULL DEFAULT 0,
  total_sessions           INTEGER      NOT NULL DEFAULT 0,

  created_at               TIMESTAMPTZ  NOT NULL DEFAULT NOW(),
  updated_at               TIMESTAMPTZ  NOT NULL DEFAULT NOW()
);

COMMENT ON COLUMN tutor_profiles.date_of_birth   IS 'PRIVATE — not shown publicly.';
COMMENT ON COLUMN tutor_profiles.pincode         IS 'PRIVATE — used for matching only.';
COMMENT ON COLUMN tutor_profiles.admin_notes     IS 'PRIVATE — visible only to admins.';
COMMENT ON COLUMN tutor_profiles.rejection_reason IS 'PRIVATE — shared with tutor only.';

-- ─── tutor_qualifications ─────────────────────────────────────────────────────
-- Normalised education history. Each row = one degree.

CREATE TABLE tutor_qualifications (
  id                    UUID              PRIMARY KEY DEFAULT uuid_generate_v4(),
  tutor_id              UUID              NOT NULL
                          REFERENCES tutor_profiles(id) ON DELETE CASCADE,
  qualification_level   qualification_level NOT NULL,
  degree_name           TEXT              NOT NULL,  -- "B.Sc Mathematics"
  institution           TEXT              NOT NULL,  -- "Delhi University"
  board_or_university   TEXT              NOT NULL,
  year_of_passing       SMALLINT          NOT NULL
                          CHECK (year_of_passing BETWEEN 1960 AND 2100),
  percentage_or_grade   TEXT,
  subject_specialisation TEXT,
  is_highest            BOOLEAN           NOT NULL DEFAULT FALSE,
  sort_order            SMALLINT          NOT NULL DEFAULT 0,
  created_at            TIMESTAMPTZ       NOT NULL DEFAULT NOW()
);

-- ─── tutor_experience ─────────────────────────────────────────────────────────
-- Normalised teaching history. Each row = one employer / role.

CREATE TABLE tutor_experience (
  id               UUID              PRIMARY KEY DEFAULT uuid_generate_v4(),
  tutor_id         UUID              NOT NULL
                     REFERENCES tutor_profiles(id) ON DELETE CASCADE,
  experience_type  experience_type   NOT NULL,
  institution_name TEXT              NOT NULL,
  role             TEXT              NOT NULL,
  start_year       SMALLINT          NOT NULL
                     CHECK (start_year BETWEEN 1980 AND 2100),
  end_year         SMALLINT
                     CHECK (end_year IS NULL OR end_year >= start_year),
  is_current       BOOLEAN           NOT NULL DEFAULT FALSE,
  description      TEXT,
  subjects_taught  TEXT[]            NOT NULL DEFAULT '{}',
  grades_taught    TEXT[]            NOT NULL DEFAULT '{}',
  sort_order       SMALLINT          NOT NULL DEFAULT 0,
  created_at       TIMESTAMPTZ       NOT NULL DEFAULT NOW(),

  CONSTRAINT chk_end_year CHECK (
    (is_current = TRUE AND end_year IS NULL)
    OR (is_current = FALSE AND end_year IS NOT NULL)
    OR (is_current = FALSE AND end_year IS NULL)  -- historical with unknown end
  )
);

-- ─── tutor_subjects ───────────────────────────────────────────────────────────
-- Fine-grained subject+grade+board combinations a tutor can teach.
-- Drives precise matching.

CREATE TABLE tutor_subjects (
  id         UUID        PRIMARY KEY DEFAULT uuid_generate_v4(),
  tutor_id   UUID        NOT NULL
               REFERENCES tutor_profiles(id) ON DELETE CASCADE,
  subject    TEXT        NOT NULL,
  grade      TEXT        NOT NULL,
  board      TEXT        NOT NULL,
  -- Admin-assessed competency for this combination
  is_verified BOOLEAN    NOT NULL DEFAULT FALSE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),

  UNIQUE (tutor_id, subject, grade, board)
);

-- ─── tutor_documents ──────────────────────────────────────────────────────────
-- SECURITY CRITICAL: file_url is NEVER exposed via public API.
-- RLS: visible only to the tutor themselves and admins.

CREATE TABLE tutor_documents (
  id            UUID            PRIMARY KEY DEFAULT uuid_generate_v4(),
  tutor_id      UUID            NOT NULL
                  REFERENCES tutor_profiles(id) ON DELETE CASCADE,
  document_type document_type   NOT NULL,
  -- SECURITY: file_url stored in private Supabase Storage bucket (tutor-documents)
  -- Never returned via public-facing API routes
  file_url      TEXT            NOT NULL,
  file_name     TEXT            NOT NULL,
  file_size_kb  INTEGER,
  mime_type     TEXT,
  status        document_status NOT NULL DEFAULT 'pending',
  -- SECURITY: admin_notes may contain sensitive review context
  admin_notes   TEXT,
  uploaded_at   TIMESTAMPTZ     NOT NULL DEFAULT NOW(),
  reviewed_at   TIMESTAMPTZ,
  reviewed_by   UUID            REFERENCES profiles(id),
  expires_at    TIMESTAMPTZ     -- for time-limited documents (future)
);

COMMENT ON TABLE  tutor_documents IS
  'SECURITY: file_url and admin_notes must NEVER appear in public API responses. RLS enforced.';
COMMENT ON COLUMN tutor_documents.file_url IS
  'PRIVATE — stored in private storage bucket. Admin + document owner only.';

-- ─── tutor_assessments ────────────────────────────────────────────────────────
-- One row per subject assessed. Scheduled and scored by admins.

CREATE TABLE tutor_assessments (
  id            UUID              PRIMARY KEY DEFAULT uuid_generate_v4(),
  tutor_id      UUID              NOT NULL
                  REFERENCES tutor_profiles(id) ON DELETE CASCADE,
  subject       TEXT              NOT NULL,
  status        assessment_status NOT NULL DEFAULT 'not_started',
  scheduled_at  TIMESTAMPTZ,
  started_at    TIMESTAMPTZ,
  completed_at  TIMESTAMPTZ,
  score         SMALLINT          CHECK (score BETWEEN 0 AND 100),
  max_score     SMALLINT          NOT NULL DEFAULT 100,
  -- SECURITY: assessment_notes is private admin feedback
  assessment_notes TEXT,          -- PRIVATE
  scheduled_by  UUID              REFERENCES profiles(id),
  scored_by     UUID              REFERENCES profiles(id),
  created_at    TIMESTAMPTZ       NOT NULL DEFAULT NOW(),
  updated_at    TIMESTAMPTZ       NOT NULL DEFAULT NOW(),

  UNIQUE (tutor_id, subject)
);

-- ─── tutor_interviews ─────────────────────────────────────────────────────────
-- Teaching ability interview — one record per interview session.

CREATE TABLE tutor_interviews (
  id               UUID             PRIMARY KEY DEFAULT uuid_generate_v4(),
  tutor_id         UUID             NOT NULL
                     REFERENCES tutor_profiles(id) ON DELETE CASCADE,
  status           interview_status NOT NULL DEFAULT 'not_scheduled',
  scheduled_at     TIMESTAMPTZ,
  completed_at     TIMESTAMPTZ,
  interview_type   TEXT             DEFAULT 'video',  -- video, phone, in_person
  meeting_link     TEXT,
  duration_minutes SMALLINT,
  teaching_score   SMALLINT         CHECK (teaching_score BETWEEN 0 AND 100),
  -- SECURITY: interviewer notes are private admin feedback
  interviewer_notes TEXT,           -- PRIVATE
  interviewer_id   UUID             REFERENCES profiles(id),
  created_at       TIMESTAMPTZ      NOT NULL DEFAULT NOW(),
  updated_at       TIMESTAMPTZ      NOT NULL DEFAULT NOW()
);

COMMENT ON COLUMN tutor_interviews.interviewer_notes IS
  'PRIVATE — visible only to admins.';

-- ─── tutor_verifications ──────────────────────────────────────────────────────
-- Audit log of every verification state change.

CREATE TABLE tutor_verifications (
  id               UUID                     PRIMARY KEY DEFAULT uuid_generate_v4(),
  tutor_id         UUID                     NOT NULL
                     REFERENCES tutor_profiles(id) ON DELETE CASCADE,
  from_status      tutor_verification_status,
  to_status        tutor_verification_status NOT NULL,
  changed_by       UUID                     NOT NULL REFERENCES profiles(id),
  reason           TEXT,
  -- SECURITY: internal_notes is private
  internal_notes   TEXT,           -- PRIVATE
  created_at       TIMESTAMPTZ     NOT NULL DEFAULT NOW()
);

COMMENT ON TABLE tutor_verifications IS
  'Immutable audit log. INSERT only — no UPDATE or DELETE.';

-- ============================================================
-- SECTION 4 — TUITION MATCHING TABLES
-- ============================================================

-- ─── tuition_requirements ────────────────────────────────────────────────────
-- Parent's formal request for a tutor.
-- SECURITY: only locality+city shown to tutors; full address only after enrollment.

CREATE TABLE tuition_requirements (
  id                       UUID                   PRIMARY KEY DEFAULT uuid_generate_v4(),
  parent_id                UUID                   NOT NULL
                             REFERENCES profiles(id) ON DELETE CASCADE,
  student_id               UUID                   NOT NULL
                             REFERENCES student_profiles(id) ON DELETE CASCADE,
  -- Denormalised for display speed (student may be renamed)
  student_name             TEXT,

  -- Academic
  subjects                 TEXT[]                 NOT NULL DEFAULT '{}',
  grade                    TEXT                   NOT NULL,
  board                    TEXT                   NOT NULL,
  learning_goals           TEXT,

  -- Teaching preferences
  teaching_mode            teaching_mode          NOT NULL,
  preferred_tutor_gender   tutor_gender_preference NOT NULL DEFAULT 'no_preference',

  -- Schedule
  preferred_days           TEXT[]                 NOT NULL DEFAULT '{}',
  preferred_time_slots     TEXT[]                 NOT NULL DEFAULT '{}',
  sessions_per_week        SMALLINT               NOT NULL DEFAULT 3
                             CHECK (sessions_per_week BETWEEN 1 AND 7),
  session_duration_minutes SMALLINT               NOT NULL DEFAULT 60
                             CHECK (session_duration_minutes BETWEEN 30 AND 240),

  -- Location — locality+city shown to tutors; full address is private
  locality                 TEXT                   NOT NULL,
  city                     TEXT                   NOT NULL,
  -- SECURITY: pincode used only for matching, not shown to tutors
  pincode                  CHAR(6)                NOT NULL,

  -- Budget
  budget_per_hour          NUMERIC(10,2)
                             CHECK (budget_per_hour >= 0),
  special_requirements     TEXT,

  -- Status pipeline
  status                   requirement_status     NOT NULL DEFAULT 'submitted',
  -- SECURITY: admin_notes is private
  admin_notes              TEXT,           -- PRIVATE

  created_at               TIMESTAMPTZ            NOT NULL DEFAULT NOW(),
  updated_at               TIMESTAMPTZ            NOT NULL DEFAULT NOW()
);

COMMENT ON COLUMN tuition_requirements.pincode IS
  'PRIVATE — used for geo-matching. Never shown to tutors before enrollment.';
COMMENT ON COLUMN tuition_requirements.admin_notes IS
  'PRIVATE — internal operational notes. Never in parent or tutor API responses.';

-- ─── tutor_matches ────────────────────────────────────────────────────────────
-- Admin-curated shortlist of tutors per requirement.
-- Tutors only see opportunity info — NOT the parent's full details.

CREATE TABLE tutor_matches (
  id               UUID         PRIMARY KEY DEFAULT uuid_generate_v4(),
  requirement_id   UUID         NOT NULL
                     REFERENCES tuition_requirements(id) ON DELETE CASCADE,
  tutor_id         UUID         NOT NULL
                     REFERENCES tutor_profiles(id) ON DELETE CASCADE,
  match_status     match_status NOT NULL DEFAULT 'suggested',
  -- SECURITY: admin_notes is private
  admin_notes      TEXT,        -- PRIVATE
  matched_at       TIMESTAMPTZ  NOT NULL DEFAULT NOW(),
  created_at       TIMESTAMPTZ  NOT NULL DEFAULT NOW(),
  updated_at       TIMESTAMPTZ  NOT NULL DEFAULT NOW(),

  UNIQUE (requirement_id, tutor_id)
);

-- ─── demo_classes ─────────────────────────────────────────────────────────────
-- Scheduled demo session. Address revealed to tutor only after scheduling.

CREATE TABLE demo_classes (
  id                UUID        PRIMARY KEY DEFAULT uuid_generate_v4(),
  match_id          UUID        NOT NULL REFERENCES tutor_matches(id) ON DELETE CASCADE,
  requirement_id    UUID        NOT NULL REFERENCES tuition_requirements(id),
  tutor_id          UUID        NOT NULL REFERENCES tutor_profiles(id),
  parent_id         UUID        NOT NULL REFERENCES profiles(id),
  scheduled_at      TIMESTAMPTZ NOT NULL,
  duration_minutes  SMALLINT    NOT NULL DEFAULT 60,
  meeting_link      TEXT,       -- for online demos
  -- SECURITY: address shared with tutor only for confirmed demos
  venue_address     TEXT,       -- tutor sees this only after demo is confirmed
  status            demo_status NOT NULL DEFAULT 'scheduled',
  parent_feedback   TEXT,
  tutor_feedback    TEXT,
  parent_rating     SMALLINT    CHECK (parent_rating BETWEEN 1 AND 5),
  created_at        TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at        TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- ─── enrollments ──────────────────────────────────────────────────────────────
-- Formal ongoing tuition relationship after parent selects a tutor.

CREATE TABLE enrollments (
  id                       UUID              PRIMARY KEY DEFAULT uuid_generate_v4(),
  requirement_id           UUID              NOT NULL REFERENCES tuition_requirements(id),
  tutor_id                 UUID              NOT NULL REFERENCES tutor_profiles(id),
  parent_id                UUID              NOT NULL REFERENCES profiles(id),
  student_id               UUID              NOT NULL REFERENCES student_profiles(id),
  status                   enrollment_status NOT NULL DEFAULT 'active',
  agreed_fee_per_hour      NUMERIC(10,2)     NOT NULL
                             CHECK (agreed_fee_per_hour > 0),
  sessions_per_week        SMALLINT          NOT NULL,
  session_duration_minutes SMALLINT          NOT NULL,
  started_on               DATE              NOT NULL,
  ended_on                 DATE,
  end_reason               TEXT,
  -- SECURITY: home_address revealed to tutor only after enrollment
  home_address             TEXT,             -- PRIVATE
  created_at               TIMESTAMPTZ       NOT NULL DEFAULT NOW(),
  updated_at               TIMESTAMPTZ       NOT NULL DEFAULT NOW(),

  UNIQUE (requirement_id, tutor_id)
);

COMMENT ON COLUMN enrollments.home_address IS
  'PRIVATE — full address revealed to tutor only after enrollment is active.';

-- ============================================================
-- SECTION 5 — OPERATIONAL TABLES
-- ============================================================

-- ─── attendance ───────────────────────────────────────────────────────────────
-- Per-session attendance log.

CREATE TABLE attendance (
  id                       UUID              PRIMARY KEY DEFAULT uuid_generate_v4(),
  enrollment_id            UUID              NOT NULL
                             REFERENCES enrollments(id) ON DELETE CASCADE,
  tutor_id                 UUID              NOT NULL REFERENCES tutor_profiles(id),
  student_id               UUID              NOT NULL REFERENCES student_profiles(id),
  session_date             DATE              NOT NULL,
  status                   attendance_status NOT NULL,
  session_duration_minutes SMALLINT          NOT NULL DEFAULT 60,
  marked_by                user_role         NOT NULL,
  tutor_notes              TEXT,
  parent_notes             TEXT,
  created_at               TIMESTAMPTZ       NOT NULL DEFAULT NOW(),

  UNIQUE (enrollment_id, session_date)
);

-- ─── reviews ──────────────────────────────────────────────────────────────────
-- Parent reviews. Published only after admin approval.

CREATE TABLE reviews (
  id             UUID        PRIMARY KEY DEFAULT uuid_generate_v4(),
  tutor_id       UUID        NOT NULL REFERENCES tutor_profiles(id) ON DELETE CASCADE,
  parent_id      UUID        NOT NULL REFERENCES profiles(id),
  student_id     UUID        NOT NULL REFERENCES student_profiles(id),
  enrollment_id  UUID        NOT NULL REFERENCES enrollments(id),
  rating         SMALLINT    NOT NULL CHECK (rating BETWEEN 1 AND 5),
  comment        TEXT,
  is_published   BOOLEAN     NOT NULL DEFAULT FALSE,
  published_at   TIMESTAMPTZ,
  -- SECURITY: admin_notes is private (moderation context)
  admin_notes    TEXT,       -- PRIVATE
  created_at     TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at     TIMESTAMPTZ NOT NULL DEFAULT NOW(),

  UNIQUE (enrollment_id, parent_id)
);

-- ─── payments ─────────────────────────────────────────────────────────────────
-- Payment tracking. Phase 1: direct payments (no gateway integration yet).

CREATE TABLE payments (
  id                UUID           PRIMARY KEY DEFAULT uuid_generate_v4(),
  enrollment_id     UUID           NOT NULL REFERENCES enrollments(id),
  parent_id         UUID           NOT NULL REFERENCES profiles(id),
  tutor_id          UUID           NOT NULL REFERENCES tutor_profiles(id),
  amount            NUMERIC(12,2)  NOT NULL CHECK (amount > 0),
  currency          CHAR(3)        NOT NULL DEFAULT 'INR',
  status            payment_status NOT NULL DEFAULT 'pending',
  payment_method    TEXT,          -- upi, cash, bank_transfer
  reference_number  TEXT,          -- parent-provided payment reference
  period_start      DATE           NOT NULL,
  period_end        DATE           NOT NULL,
  sessions_covered  SMALLINT,
  notes             TEXT,
  -- Future: Razorpay integration fields
  gateway           TEXT,
  gateway_order_id  TEXT,
  gateway_payment_id TEXT,
  created_at        TIMESTAMPTZ    NOT NULL DEFAULT NOW(),
  updated_at        TIMESTAMPTZ    NOT NULL DEFAULT NOW()
);

-- ─── notifications ────────────────────────────────────────────────────────────
-- In-app and out-of-band notification log.

CREATE TABLE notifications (
  id           UUID                  PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id      UUID                  NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  channel      notification_channel  NOT NULL DEFAULT 'in_app',
  title        TEXT                  NOT NULL,
  body         TEXT                  NOT NULL,
  action_url   TEXT,
  -- Typed context for the notification
  entity_type  TEXT,                 -- 'requirement', 'match', 'demo', etc.
  entity_id    UUID,
  is_read      BOOLEAN               NOT NULL DEFAULT FALSE,
  read_at      TIMESTAMPTZ,
  sent_at      TIMESTAMPTZ,
  created_at   TIMESTAMPTZ           NOT NULL DEFAULT NOW()
);

-- ─── support_tickets ──────────────────────────────────────────────────────────
-- Parent and tutor support requests.

CREATE TABLE support_tickets (
  id              UUID            PRIMARY KEY DEFAULT uuid_generate_v4(),
  raised_by       UUID            NOT NULL REFERENCES profiles(id),
  assigned_to     UUID            REFERENCES profiles(id),  -- admin
  subject         TEXT            NOT NULL,
  description     TEXT            NOT NULL,
  status          ticket_status   NOT NULL DEFAULT 'open',
  priority        ticket_priority NOT NULL DEFAULT 'medium',
  category        TEXT,           -- 'verification', 'payment', 'tutor_issue', etc.
  entity_type     TEXT,           -- related entity context
  entity_id       UUID,
  resolved_at     TIMESTAMPTZ,
  created_at      TIMESTAMPTZ     NOT NULL DEFAULT NOW(),
  updated_at      TIMESTAMPTZ     NOT NULL DEFAULT NOW()
);

-- Support ticket replies
CREATE TABLE support_ticket_replies (
  id         UUID        PRIMARY KEY DEFAULT uuid_generate_v4(),
  ticket_id  UUID        NOT NULL REFERENCES support_tickets(id) ON DELETE CASCADE,
  author_id  UUID        NOT NULL REFERENCES profiles(id),
  message    TEXT        NOT NULL,
  -- SECURITY: is_internal marks admin-only notes not visible to ticket raiser
  is_internal BOOLEAN    NOT NULL DEFAULT FALSE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

COMMENT ON COLUMN support_ticket_replies.is_internal IS
  'PRIVATE — admin-only internal notes. Never shown to ticket raiser.';

-- ─── admin_actions ────────────────────────────────────────────────────────────
-- Immutable audit trail for all admin operations.

CREATE TABLE admin_actions (
  id           UUID              PRIMARY KEY DEFAULT uuid_generate_v4(),
  admin_id     UUID              NOT NULL REFERENCES profiles(id),
  action_type  admin_action_type NOT NULL,
  -- Polymorphic target
  target_type  TEXT              NOT NULL
                 CHECK (target_type IN (
                   'tutor','parent','student','requirement','document',
                   'match','demo','enrollment','review','payment','ticket'
                 )),
  target_id    UUID              NOT NULL,
  -- SECURITY: notes may contain sensitive operational context
  notes        TEXT,             -- PRIVATE
  metadata     JSONB             DEFAULT '{}',
  ip_address   INET,
  created_at   TIMESTAMPTZ       NOT NULL DEFAULT NOW()
);

COMMENT ON TABLE admin_actions IS
  'Immutable audit log. No UPDATE or DELETE permitted via RLS.';

-- ============================================================
-- SECTION 6 — FUNCTIONS & TRIGGERS
-- ============================================================

-- ─── updated_at auto-stamp ────────────────────────────────────────────────────

CREATE OR REPLACE FUNCTION fn_set_updated_at()
RETURNS TRIGGER LANGUAGE plpgsql AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$;

-- Apply to all tables with updated_at
DO $$
DECLARE
  t TEXT;
BEGIN
  FOREACH t IN ARRAY ARRAY[
    'profiles','parent_profiles','student_profiles',
    'tutor_profiles','tutor_assessments','tutor_interviews',
    'tuition_requirements','tutor_matches','demo_classes',
    'enrollments','reviews','payments','support_tickets','support_ticket_replies'
  ] LOOP
    EXECUTE format(
      'CREATE TRIGGER trg_%I_updated_at
         BEFORE UPDATE ON %I
         FOR EACH ROW EXECUTE FUNCTION fn_set_updated_at()',
      t, t
    );
  END LOOP;
END;
$$;

-- ─── Auto-create profile + role-specific row on signup ───────────────────────

CREATE OR REPLACE FUNCTION fn_handle_new_user()
RETURNS TRIGGER LANGUAGE plpgsql SECURITY DEFINER AS $$
BEGIN
  -- Core profile
  INSERT INTO public.profiles (id, email, full_name, phone, role)
  VALUES (
    NEW.id,
    NEW.email,
    COALESCE(NEW.raw_user_meta_data->>'full_name', ''),
    NEW.raw_user_meta_data->>'phone',
    COALESCE(
      (NEW.raw_user_meta_data->>'role')::user_role,
      'parent'
    )
  );

  -- Role-specific row
  CASE COALESCE(NEW.raw_user_meta_data->>'role', 'parent')
    WHEN 'parent' THEN
      INSERT INTO public.parent_profiles (user_id) VALUES (NEW.id);
    WHEN 'tutor' THEN
      INSERT INTO public.tutor_profiles (
        user_id,
        verification_status,
        onboarding_step
      ) VALUES (NEW.id, 'draft', 'basic_profile');
    ELSE NULL;
  END CASE;

  RETURN NEW;
END;
$$;

CREATE TRIGGER trg_on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION fn_handle_new_user();

-- ─── Update tutor average_rating on review publish ───────────────────────────

CREATE OR REPLACE FUNCTION fn_update_tutor_rating()
RETURNS TRIGGER LANGUAGE plpgsql AS $$
BEGIN
  UPDATE tutor_profiles
  SET
    average_rating = (
      SELECT ROUND(AVG(rating)::NUMERIC, 2)
      FROM reviews
      WHERE tutor_id = NEW.tutor_id AND is_published = TRUE
    ),
    total_reviews = (
      SELECT COUNT(*)
      FROM reviews
      WHERE tutor_id = NEW.tutor_id AND is_published = TRUE
    )
  WHERE id = NEW.tutor_id;
  RETURN NEW;
END;
$$;

CREATE TRIGGER trg_reviews_update_rating
  AFTER INSERT OR UPDATE OF is_published ON reviews
  FOR EACH ROW EXECUTE FUNCTION fn_update_tutor_rating();

-- ─── Increment total_students on enrollment activation ───────────────────────

CREATE OR REPLACE FUNCTION fn_update_tutor_student_count()
RETURNS TRIGGER LANGUAGE plpgsql AS $$
BEGIN
  -- Increment on new active enrollment
  IF (TG_OP = 'INSERT' AND NEW.status = 'active') OR
     (TG_OP = 'UPDATE' AND OLD.status <> 'active' AND NEW.status = 'active') THEN
    UPDATE tutor_profiles
    SET total_students = total_students + 1
    WHERE id = NEW.tutor_id;
  END IF;
  -- Decrement on deactivation
  IF TG_OP = 'UPDATE' AND OLD.status = 'active' AND NEW.status <> 'active' THEN
    UPDATE tutor_profiles
    SET total_students = GREATEST(total_students - 1, 0)
    WHERE id = NEW.tutor_id;
  END IF;
  RETURN NEW;
END;
$$;

CREATE TRIGGER trg_enrollment_student_count
  AFTER INSERT OR UPDATE OF status ON enrollments
  FOR EACH ROW EXECUTE FUNCTION fn_update_tutor_student_count();

-- ─── Increment total_sessions on attendance marked present ───────────────────

CREATE OR REPLACE FUNCTION fn_increment_tutor_sessions()
RETURNS TRIGGER LANGUAGE plpgsql AS $$
BEGIN
  IF NEW.status = 'present' AND
     (TG_OP = 'INSERT' OR OLD.status <> 'present') THEN
    UPDATE tutor_profiles
    SET total_sessions = total_sessions + 1
    WHERE id = NEW.tutor_id;
  END IF;
  RETURN NEW;
END;
$$;

CREATE TRIGGER trg_attendance_session_count
  AFTER INSERT OR UPDATE OF status ON attendance
  FOR EACH ROW EXECUTE FUNCTION fn_increment_tutor_sessions();

-- ─── Stamp published_at on review publish ────────────────────────────────────

CREATE OR REPLACE FUNCTION fn_stamp_review_published_at()
RETURNS TRIGGER LANGUAGE plpgsql AS $$
BEGIN
  IF NEW.is_published = TRUE AND
     (OLD.is_published = FALSE OR OLD.is_published IS NULL) THEN
    NEW.published_at = NOW();
  END IF;
  RETURN NEW;
END;
$$;

CREATE TRIGGER trg_reviews_published_at
  BEFORE UPDATE OF is_published ON reviews
  FOR EACH ROW EXECUTE FUNCTION fn_stamp_review_published_at();

-- ─── Log tutor verification status changes ────────────────────────────────────

CREATE OR REPLACE FUNCTION fn_log_verification_change()
RETURNS TRIGGER LANGUAGE plpgsql SECURITY DEFINER AS $$
BEGIN
  IF OLD.verification_status IS DISTINCT FROM NEW.verification_status THEN
    INSERT INTO tutor_verifications (
      tutor_id, from_status, to_status, changed_by
    ) VALUES (
      NEW.id,
      OLD.verification_status,
      NEW.verification_status,
      COALESCE(auth.uid(), NEW.verified_by, NEW.user_id)
    );
  END IF;
  RETURN NEW;
END;
$$;

CREATE TRIGGER trg_tutor_verification_log
  AFTER UPDATE OF verification_status ON tutor_profiles
  FOR EACH ROW EXECUTE FUNCTION fn_log_verification_change();
