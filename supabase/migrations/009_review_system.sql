-- ============================================================
-- TutorMeet — Verified Review System
-- Run AFTER 008_demo_system.sql
-- ============================================================

-- ─── Review status enum ───────────────────────────────────────────────────────

CREATE TYPE review_status AS ENUM (
  'pending',        -- Submitted, awaiting admin
  'published',      -- Approved and visible publicly
  'hidden',         -- Admin hidden (inappropriate / privacy)
  'reported',       -- Tutor reported it
  'investigating'   -- Admin reviewing report
);

-- ─── Extend the reviews table ─────────────────────────────────────────────────

-- Category ratings (1–5 each)
ALTER TABLE reviews
  ADD COLUMN IF NOT EXISTS rating_teaching_quality   SMALLINT
    CHECK (rating_teaching_quality  BETWEEN 1 AND 5),
  ADD COLUMN IF NOT EXISTS rating_subject_knowledge  SMALLINT
    CHECK (rating_subject_knowledge BETWEEN 1 AND 5),
  ADD COLUMN IF NOT EXISTS rating_punctuality        SMALLINT
    CHECK (rating_punctuality       BETWEEN 1 AND 5),
  ADD COLUMN IF NOT EXISTS rating_communication     SMALLINT
    CHECK (rating_communication     BETWEEN 1 AND 5),
  ADD COLUMN IF NOT EXISTS rating_professionalism   SMALLINT
    CHECK (rating_professionalism   BETWEEN 1 AND 5),

  -- Rename `rating` → `overall_rating` (keep old column for compat)
  ADD COLUMN IF NOT EXISTS overall_rating SMALLINT
    CHECK (overall_rating BETWEEN 1 AND 5),

  -- Verification proof
  ADD COLUMN IF NOT EXISTS enrollment_id   UUID REFERENCES enrollments(id),
  ADD COLUMN IF NOT EXISTS demo_class_id   UUID REFERENCES demo_classes(id),
  ADD COLUMN IF NOT EXISTS is_verified_review BOOLEAN NOT NULL DEFAULT FALSE,

  -- Status pipeline
  ADD COLUMN IF NOT EXISTS status         review_status NOT NULL DEFAULT 'pending',
  ADD COLUMN IF NOT EXISTS published_at   TIMESTAMPTZ,

  -- Admin moderation
  ADD COLUMN IF NOT EXISTS admin_notes    TEXT,      -- PRIVATE
  ADD COLUMN IF NOT EXISTS report_reason  TEXT,
  ADD COLUMN IF NOT EXISTS reported_at    TIMESTAMPTZ,
  ADD COLUMN IF NOT EXISTS moderated_by   UUID REFERENCES profiles(id),
  ADD COLUMN IF NOT EXISTS moderated_at   TIMESTAMPTZ,

  ADD COLUMN IF NOT EXISTS updated_at     TIMESTAMPTZ NOT NULL DEFAULT NOW();

-- Updated_at trigger
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_trigger WHERE tgname = 'trg_reviews_updated_at'
  ) THEN
    CREATE TRIGGER trg_reviews_updated_at
      BEFORE UPDATE ON reviews
      FOR EACH ROW EXECUTE FUNCTION trigger_set_updated_at();
  END IF;
END;
$$;

-- ─── Eligibility check function ───────────────────────────────────────────────
-- A parent can review a tutor ONLY if they have a completed enrollment
-- OR a completed demo class with wants_to_continue = true.
-- This is enforced at application layer AND here for defence-in-depth.

CREATE OR REPLACE FUNCTION parent_can_review_tutor(
  p_parent_id  UUID,
  p_tutor_id   UUID   -- tutor_profiles.id
)
RETURNS BOOLEAN LANGUAGE sql SECURITY DEFINER STABLE AS $$
  SELECT EXISTS (
    -- Via completed enrollment
    SELECT 1 FROM enrollments e
    WHERE e.parent_id = p_parent_id
      AND e.tutor_id  = p_tutor_id
      AND e.status    = 'active'   -- has/had active tuition

    UNION

    -- Via completed demo with positive decision
    SELECT 1 FROM demo_classes dc
    WHERE dc.parent_id         = p_parent_id
      AND dc.tutor_id          = p_tutor_id
      AND dc.status            = 'completed'
  );
$$;

-- ─── Prevent multiple reviews for same enrollment ─────────────────────────────
-- Remove old unique constraint if it exists, add new one
ALTER TABLE reviews
  DROP CONSTRAINT IF EXISTS reviews_requirement_id_parent_id_key;

-- New: one review per (parent, tutor_profile_id) — prevents duplicate reviews
-- The tutor_id here is tutor_profiles.id (not user_id)
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint
    WHERE conname = 'reviews_tutor_parent_unique'
  ) THEN
    ALTER TABLE reviews
      ADD CONSTRAINT reviews_tutor_parent_unique
      UNIQUE (tutor_id, parent_id);
  END IF;
END;
$$;

-- ─── Trigger: auto-publish if tutor has 0 published reviews ──────────────────
-- First review auto-publishes to avoid cold-start. Subsequent reviews
-- are manually approved by admin.
CREATE OR REPLACE FUNCTION fn_auto_publish_first_review()
RETURNS TRIGGER LANGUAGE plpgsql AS $$
DECLARE
  existing_published INTEGER;
BEGIN
  SELECT COUNT(*) INTO existing_published
  FROM reviews
  WHERE tutor_id    = NEW.tutor_id
    AND status      = 'published'
    AND id          != NEW.id;

  -- Auto-publish the very first verified review
  IF existing_published = 0 AND NEW.is_verified_review = TRUE THEN
    NEW.status       := 'published';
    NEW.is_published := TRUE;
    NEW.published_at := NOW();
  END IF;

  RETURN NEW;
END;
$$;

CREATE TRIGGER trg_reviews_auto_publish
  BEFORE INSERT ON reviews
  FOR EACH ROW EXECUTE FUNCTION fn_auto_publish_first_review();

-- ─── Trigger: stamp published_at on status → published ───────────────────────
CREATE OR REPLACE FUNCTION fn_stamp_review_published()
RETURNS TRIGGER LANGUAGE plpgsql AS $$
BEGIN
  IF NEW.status = 'published' AND (OLD.status IS NULL OR OLD.status != 'published') THEN
    NEW.published_at := NOW();
    NEW.is_published := TRUE;
  ELSIF NEW.status != 'published' THEN
    NEW.is_published := FALSE;
  END IF;
  RETURN NEW;
END;
$$;

CREATE TRIGGER trg_reviews_stamp_published
  BEFORE UPDATE OF status ON reviews
  FOR EACH ROW EXECUTE FUNCTION fn_stamp_review_published();

-- ─── RLS update ───────────────────────────────────────────────────────────────

-- Drop old policies
DROP POLICY IF EXISTS "reviews_public_published"  ON reviews;
DROP POLICY IF EXISTS "reviews_parent_own"        ON reviews;
DROP POLICY IF EXISTS "reviews_tutor_own"         ON reviews;
DROP POLICY IF EXISTS "reviews_admin"             ON reviews;

-- Public: only published, non-hidden reviews
-- SECURITY: admin_notes, report_reason never in this policy scope
CREATE POLICY "reviews_public_published"
  ON reviews FOR SELECT
  USING (status = 'published' AND is_published = TRUE);

-- Parents see and manage their own reviews
CREATE POLICY "reviews_parent_own"
  ON reviews FOR ALL
  USING  (parent_id = auth.uid())
  WITH CHECK (parent_id = auth.uid() AND is_parent());

-- Tutors see their own published reviews (NOT admin_notes or report details)
CREATE POLICY "reviews_tutor_own_select"
  ON reviews FOR SELECT
  USING (
    tutor_id IN (SELECT id FROM tutor_profiles WHERE user_id = auth.uid())
    AND status = 'published'
  );

-- Admin full access
CREATE POLICY "reviews_admin_all"
  ON reviews FOR ALL
  USING  (is_admin())
  WITH CHECK (is_admin());

-- ─── Indexes ──────────────────────────────────────────────────────────────────

CREATE INDEX IF NOT EXISTS idx_reviews_status      ON reviews(status);
CREATE INDEX IF NOT EXISTS idx_reviews_tutor_pub   ON reviews(tutor_id, overall_rating)
  WHERE status = 'published';
CREATE INDEX IF NOT EXISTS idx_reviews_reported    ON reviews(status)
  WHERE status IN ('reported','investigating');
CREATE INDEX IF NOT EXISTS idx_reviews_pending     ON reviews(created_at DESC)
  WHERE status = 'pending';
