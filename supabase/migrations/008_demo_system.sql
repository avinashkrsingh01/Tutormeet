-- ============================================================
-- TutorMeet — Demo Class System
-- Run AFTER 007_admin_roles.sql
-- ============================================================

-- ─── Extend demo_status enum ───────────────────────────────────────────────────

ALTER TYPE demo_status ADD VALUE IF NOT EXISTS 'requested'       BEFORE 'scheduled';
ALTER TYPE demo_status ADD VALUE IF NOT EXISTS 'tutor_accepted'  BEFORE 'scheduled';

-- ─── Extend demo_classes table ────────────────────────────────────────────────

ALTER TABLE demo_classes
  -- Link to student
  ADD COLUMN IF NOT EXISTS student_id    UUID REFERENCES students(id),
  ADD COLUMN IF NOT EXISTS student_name  TEXT,

  -- Delivery method
  ADD COLUMN IF NOT EXISTS delivery_method TEXT
    CHECK (delivery_method IN ('home_visit','online','tutor_location')),

  -- Venue address (PRIVATE — only shown to confirmed parties)
  ADD COLUMN IF NOT EXISTS venue_address  TEXT,

  -- Parent feedback (structured)
  ADD COLUMN IF NOT EXISTS parent_rating            SMALLINT
    CHECK (parent_rating BETWEEN 1 AND 5),
  ADD COLUMN IF NOT EXISTS was_tutor_punctual       BOOLEAN,
  ADD COLUMN IF NOT EXISTS was_explanation_clear    BOOLEAN,
  ADD COLUMN IF NOT EXISTS wants_to_continue        BOOLEAN,

  -- Admin
  ADD COLUMN IF NOT EXISTS admin_notes   TEXT,
  ADD COLUMN IF NOT EXISTS scheduled_by  UUID REFERENCES profiles(id),
  ADD COLUMN IF NOT EXISTS updated_at    TIMESTAMPTZ NOT NULL DEFAULT NOW();

-- updated_at trigger (in case schema/010 trigger doesn't cover it)
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_trigger WHERE tgname = 'trg_demo_classes_updated_at'
  ) THEN
    CREATE TRIGGER trg_demo_classes_updated_at
      BEFORE UPDATE ON demo_classes
      FOR EACH ROW EXECUTE FUNCTION trigger_set_updated_at();
  END IF;
END;
$$;

-- ─── Status flow constraint ───────────────────────────────────────────────────
-- Valid transitions enforced at application layer; DB stores final state.

-- ─── Indexes ──────────────────────────────────────────────────────────────────

CREATE INDEX IF NOT EXISTS idx_demos_status      ON demo_classes(status);
CREATE INDEX IF NOT EXISTS idx_demos_tutor       ON demo_classes(tutor_id);
CREATE INDEX IF NOT EXISTS idx_demos_parent      ON demo_classes(parent_id);
CREATE INDEX IF NOT EXISTS idx_demos_scheduled   ON demo_classes(scheduled_at);
CREATE INDEX IF NOT EXISTS idx_demos_feedback    ON demo_classes(wants_to_continue)
  WHERE status = 'completed';

-- ─── RLS update for new columns ───────────────────────────────────────────────
-- venue_address is private — only shown after demo is confirmed (status >= scheduled)
-- The API layer enforces this; RLS protects the row itself.

-- ─── Enrollments table (created from accepted demos) ─────────────────────────
-- Using the existing enrollments table from schema/010; if running old migrations
-- add it here:

CREATE TABLE IF NOT EXISTS enrollments (
  id                       UUID              PRIMARY KEY DEFAULT gen_random_uuid(),
  requirement_id           UUID              NOT NULL REFERENCES tuition_requirements(id),
  demo_class_id            UUID              REFERENCES demo_classes(id),
  tutor_id                 UUID              NOT NULL REFERENCES tutor_profiles(id),
  parent_id                UUID              NOT NULL REFERENCES profiles(id),
  student_id               UUID              REFERENCES students(id),
  status                   TEXT              NOT NULL DEFAULT 'active'
    CHECK (status IN ('active','paused','completed','terminated')),
  agreed_fee_per_hour      NUMERIC(10,2)     NOT NULL DEFAULT 0,
  sessions_per_week        SMALLINT          NOT NULL DEFAULT 3,
  session_duration_minutes SMALLINT          NOT NULL DEFAULT 60,
  started_on               DATE              NOT NULL DEFAULT CURRENT_DATE,
  ended_on                 DATE,
  end_reason               TEXT,
  created_at               TIMESTAMPTZ       NOT NULL DEFAULT NOW(),
  updated_at               TIMESTAMPTZ       NOT NULL DEFAULT NOW(),
  UNIQUE (requirement_id, tutor_id)
);

-- Enable RLS if not already enabled
ALTER TABLE enrollments ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "enrollments_parent" ON enrollments;
CREATE POLICY "enrollments_parent"
  ON enrollments FOR SELECT
  USING (parent_id = auth.uid());

DROP POLICY IF EXISTS "enrollments_tutor" ON enrollments;
CREATE POLICY "enrollments_tutor"
  ON enrollments FOR SELECT
  USING (tutor_id IN (SELECT id FROM tutor_profiles WHERE user_id = auth.uid()));

DROP POLICY IF EXISTS "enrollments_admin" ON enrollments;
CREATE POLICY "enrollments_admin"
  ON enrollments FOR ALL
  USING (is_admin())
  WITH CHECK (is_admin());

CREATE INDEX IF NOT EXISTS idx_enrollments_parent ON enrollments(parent_id);
CREATE INDEX IF NOT EXISTS idx_enrollments_tutor  ON enrollments(tutor_id);
CREATE INDEX IF NOT EXISTS idx_enrollments_status ON enrollments(status);
