-- ============================================================
-- TutorMeet — Safety Reports & User Suspension
-- Run AFTER 010_payment_system.sql
-- ============================================================

-- ─── Enums ───────────────────────────────────────────────────────────────────

CREATE TYPE report_target_type AS ENUM ('tutor', 'parent', 'incident');

CREATE TYPE report_category AS ENUM (
  'inappropriate_behaviour',
  'unprofessional_conduct',
  'no_show',
  'abusive_language',
  'privacy_concern',
  'fraud_misrepresentation',
  'payment_dispute',
  'abusive_language_parent',
  'false_information',
  'child_safety_concern',    -- URGENT: immediately escalated
  'harassment',
  'unsafe_environment',
  'other'
);

CREATE TYPE report_status AS ENUM (
  'submitted',
  'acknowledged',
  'investigating',
  'resolved',
  'closed'
);

-- ─── safety_reports ───────────────────────────────────────────────────────────
-- SECURITY: admin_notes and resolution are private — never returned to reporters.

CREATE TABLE safety_reports (
  id              UUID               PRIMARY KEY DEFAULT gen_random_uuid(),
  reporter_id     UUID               NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  target_type     report_target_type NOT NULL,
  target_user_id  UUID               REFERENCES profiles(id) ON DELETE SET NULL,

  category        report_category    NOT NULL,
  description     TEXT               NOT NULL
                    CHECK (length(description) >= 20 AND length(description) <= 2000),
  is_urgent       BOOLEAN            NOT NULL DEFAULT FALSE,

  -- Status pipeline
  status          report_status      NOT NULL DEFAULT 'submitted',

  -- Admin only — NEVER returned to reporter
  admin_notes     TEXT,
  assigned_to     UUID               REFERENCES profiles(id),
  resolved_at     TIMESTAMPTZ,
  resolution      TEXT,

  created_at      TIMESTAMPTZ        NOT NULL DEFAULT NOW(),
  updated_at      TIMESTAMPTZ        NOT NULL DEFAULT NOW(),

  -- Prevent spam: one report per (reporter, target, category) within 24 hours
  CONSTRAINT no_duplicate_reports UNIQUE NULLS NOT DISTINCT (
    reporter_id, target_user_id, category
  )
);

COMMENT ON COLUMN safety_reports.admin_notes IS
  'PRIVATE — visible to admins only. Never returned in reporter-facing API responses.';

-- Auto-mark child safety concerns as urgent
CREATE OR REPLACE FUNCTION fn_mark_urgent_reports()
RETURNS TRIGGER LANGUAGE plpgsql AS $$
BEGIN
  IF NEW.category = 'child_safety_concern' THEN
    NEW.is_urgent := TRUE;
  END IF;
  RETURN NEW;
END;
$$;

CREATE TRIGGER trg_safety_reports_urgent
  BEFORE INSERT ON safety_reports
  FOR EACH ROW EXECUTE FUNCTION fn_mark_urgent_reports();

CREATE TRIGGER trg_safety_reports_updated_at
  BEFORE UPDATE ON safety_reports
  FOR EACH ROW EXECUTE FUNCTION trigger_set_updated_at();

-- ─── User suspension extensions ───────────────────────────────────────────────
-- Extend profiles with suspension tracking.

ALTER TABLE profiles
  ADD COLUMN IF NOT EXISTS suspended_at     TIMESTAMPTZ,
  ADD COLUMN IF NOT EXISTS suspended_reason TEXT,
  ADD COLUMN IF NOT EXISTS suspended_by     UUID REFERENCES profiles(id);

-- ─── Audit log extension ──────────────────────────────────────────────────────
-- Add safety report actions to admin_action_logs.

-- (admin_action_type enum already has 'user_suspended' and 'user_reinstated')

-- ─── RLS ─────────────────────────────────────────────────────────────────────

ALTER TABLE safety_reports ENABLE ROW LEVEL SECURITY;

-- Reporters see only their own reports (status only — no admin_notes)
CREATE POLICY "safety_reports_own_select"
  ON safety_reports FOR SELECT
  USING (reporter_id = auth.uid());

-- Any authenticated user can file a report
CREATE POLICY "safety_reports_insert"
  ON safety_reports FOR INSERT
  WITH CHECK (reporter_id = auth.uid() AND auth.uid() IS NOT NULL);

-- Admins see and manage all reports (including admin_notes)
CREATE POLICY "safety_reports_admin"
  ON safety_reports FOR ALL
  USING (is_admin())
  WITH CHECK (is_admin());

-- ─── Indexes ─────────────────────────────────────────────────────────────────

CREATE INDEX idx_safety_reports_reporter ON safety_reports(reporter_id);
CREATE INDEX idx_safety_reports_target   ON safety_reports(target_user_id);
CREATE INDEX idx_safety_reports_status   ON safety_reports(status);
CREATE INDEX idx_safety_reports_urgent   ON safety_reports(is_urgent, created_at DESC)
  WHERE is_urgent = TRUE;
CREATE INDEX idx_safety_reports_category ON safety_reports(category);
