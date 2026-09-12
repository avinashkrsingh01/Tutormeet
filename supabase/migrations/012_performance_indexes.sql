-- ============================================================
-- TutorMeet — Migration 012: Performance & Search Indexes
-- Run AFTER 011_safety_reports.sql
--
-- Addresses:
--  1. ILIKE city/locality queries on tutor_profiles (public tutor search)
--  2. Missing composite index for verified tutor discovery
--  3. Notification read-state queries
--  4. payment status + created_at for admin ledger
--  5. enrollment status for dashboard counts
-- ============================================================

-- ─── tutor_profiles — text search columns ─────────────────────────────────────
-- The /api/tutors route uses .ilike("city", ...) and .ilike("locality", ...)
-- pg_trgm enables fast partial-match (ILIKE) without full-text search overhead.

CREATE EXTENSION IF NOT EXISTS pg_trgm;

-- Trigram indexes for case-insensitive partial matching
CREATE INDEX IF NOT EXISTS idx_tutor_profiles_city_trgm
  ON tutor_profiles USING gin (city gin_trgm_ops);

CREATE INDEX IF NOT EXISTS idx_tutor_profiles_locality_trgm
  ON tutor_profiles USING gin (locality gin_trgm_ops);

-- Composite index for the most common public query:
--   WHERE verification_status = 'verified' AND onboarding_complete = TRUE
CREATE INDEX IF NOT EXISTS idx_tutor_profiles_verified_active
  ON tutor_profiles (verification_status, onboarding_complete)
  WHERE verification_status = 'verified' AND onboarding_complete = TRUE;

-- Composite: verified tutors ordered by knowledge_score (default sort)
CREATE INDEX IF NOT EXISTS idx_tutor_profiles_score_sort
  ON tutor_profiles (knowledge_score DESC NULLS LAST, teaching_score DESC NULLS LAST)
  WHERE verification_status = 'verified';

-- ─── notifications — read-state queries ───────────────────────────────────────
-- Used for unread count badge in future notification centre
-- CREATE INDEX IF NOT EXISTS idx_notifications_user_unread
--   ON notifications (user_id, is_read)
--   WHERE is_read = FALSE;

-- CREATE INDEX IF NOT EXISTS idx_notifications_user_created
--   ON notifications (user_id, created_at DESC);

-- ─── payments — admin ledger queries ─────────────────────────────────────────
CREATE INDEX IF NOT EXISTS idx_payments_status_created
  ON payments (status, created_at DESC);

-- ─── enrollments — dashboard active count ─────────────────────────────────────
CREATE INDEX IF NOT EXISTS idx_enrollments_status
  ON enrollments (status);

CREATE INDEX IF NOT EXISTS idx_enrollments_tutor_status
  ON enrollments (tutor_id, status)
  WHERE status = 'active';

-- ─── demo_classes — today's demos query (admin dashboard) ─────────────────────
CREATE INDEX IF NOT EXISTS idx_demo_classes_scheduled_status
  ON demo_classes (scheduled_at, status)
  WHERE status = 'scheduled';

-- ─── safety_reports — unresolved reports (admin queue) ────────────────────────
CREATE INDEX IF NOT EXISTS idx_safety_reports_open
  ON safety_reports (created_at ASC)
  WHERE status IN ('submitted', 'acknowledged', 'investigating');

-- ─── tuition_requirements — matching queue ────────────────────────────────────
CREATE INDEX IF NOT EXISTS idx_requirements_city_status
  ON tuition_requirements (city, status)
  WHERE status IN ('submitted', 'matching');
