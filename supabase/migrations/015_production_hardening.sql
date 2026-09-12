-- ═══════════════════════════════════════════════════════════════════════════════
-- TutorMeet — Migration 015: Production Hardening
--
-- Fixes discovered during the production-readiness audit:
--   1.  Drop stale RLS policies on `reviews` (from 002, superseded by 009)
--   2.  Reconcile `tutor_documents` policies (002 vs 007)
--   3.  Fix duplicate `idx_tutor_profiles_city` index
--   4.  Drop duplicate `demo_classes` indexes
--   5.  Add ON DELETE CASCADE / SET NULL to foreign keys
--   6.  Add updated_at trigger to `enrollments`
--   7.  Drop deprecated `reviews.rating` column
--   8.  Update `update_tutor_rating()` to use `status = 'published'`
--   9.  Extend `admin_action_logs` CHECK constraint
--  10.  Create `notifications` table
-- ═══════════════════════════════════════════════════════════════════════════════

BEGIN;

-- ─────────────────────────────────────────────────────────────────────────────
-- 1. Drop stale RLS policies on `reviews`
--    002 created: reviews_select, reviews_insert, reviews_update_admin
--    009 superseded them with: reviews_public_published, reviews_parent_own,
--        reviews_tutor_own_select, reviews_admin_all
-- ─────────────────────────────────────────────────────────────────────────────

DROP POLICY IF EXISTS reviews_select       ON reviews;
DROP POLICY IF EXISTS reviews_insert       ON reviews;
DROP POLICY IF EXISTS reviews_update_admin ON reviews;

-- ─────────────────────────────────────────────────────────────────────────────
-- 2. Reconcile tutor_documents policies
--    002 created: tutor_documents_select, tutor_documents_insert,
--                 tutor_documents_update_admin
--    007 added:   tutor_documents_admin_restricted (FOR ALL for admins)
--    Drop the old 002 policies that overlap
-- ─────────────────────────────────────────────────────────────────────────────

DROP POLICY IF EXISTS tutor_documents_select       ON tutor_documents;
DROP POLICY IF EXISTS tutor_documents_insert       ON tutor_documents;
DROP POLICY IF EXISTS tutor_documents_update_admin ON tutor_documents;

-- Re-create non-admin policies cleanly
CREATE POLICY "tutor_documents_own_select"
  ON tutor_documents FOR SELECT
  USING (
    tutor_id IN (
      SELECT id FROM tutor_profiles WHERE user_id = auth.uid()
    )
  );

CREATE POLICY "tutor_documents_own_insert"
  ON tutor_documents FOR INSERT
  WITH CHECK (
    tutor_id IN (
      SELECT id FROM tutor_profiles WHERE user_id = auth.uid()
    )
  );

-- ─────────────────────────────────────────────────────────────────────────────
-- 3. Fix duplicate idx_tutor_profiles_city index
--    001 created GIN(address) as idx_tutor_profiles_city.
--    005 tried btree(city) with same name — silently skipped.
--    The GIN index on `address` JSONB is obsolete (flat columns replaced it).
-- ─────────────────────────────────────────────────────────────────────────────

DROP INDEX IF EXISTS idx_tutor_profiles_city;

-- Recreate as intended btree on the flat city column
CREATE INDEX IF NOT EXISTS idx_tutor_profiles_city
  ON tutor_profiles (city);

-- ─────────────────────────────────────────────────────────────────────────────
-- 4. Drop duplicate demo_classes indexes
--    001: idx_demo_classes_tutor, idx_demo_classes_parent
--    008: idx_demos_tutor, idx_demos_parent (same columns)
-- ─────────────────────────────────────────────────────────────────────────────

DROP INDEX IF EXISTS idx_demo_classes_tutor;
DROP INDEX IF EXISTS idx_demo_classes_parent;
-- Keep idx_demos_tutor and idx_demos_parent from 008

-- ─────────────────────────────────────────────────────────────────────────────
-- 5. Add ON DELETE CASCADE / SET NULL to foreign keys
--    Strategy: SET NULL for financial records (preserve audit trail),
--              CASCADE for operational records
-- ─────────────────────────────────────────────────────────────────────────────

-- demo_classes: operational → CASCADE
ALTER TABLE demo_classes
  DROP CONSTRAINT IF EXISTS demo_classes_requirement_id_fkey,
  ADD CONSTRAINT demo_classes_requirement_id_fkey
    FOREIGN KEY (requirement_id) REFERENCES tuition_requirements(id) ON DELETE CASCADE;

ALTER TABLE demo_classes
  DROP CONSTRAINT IF EXISTS demo_classes_tutor_id_fkey,
  ADD CONSTRAINT demo_classes_tutor_id_fkey
    FOREIGN KEY (tutor_id) REFERENCES tutor_profiles(id) ON DELETE CASCADE;

ALTER TABLE demo_classes
  DROP CONSTRAINT IF EXISTS demo_classes_parent_id_fkey,
  ADD CONSTRAINT demo_classes_parent_id_fkey
    FOREIGN KEY (parent_id) REFERENCES profiles(id) ON DELETE CASCADE;

-- attendance_records: operational → CASCADE
ALTER TABLE attendance_records
  DROP CONSTRAINT IF EXISTS attendance_records_tutor_id_fkey,
  ADD CONSTRAINT attendance_records_tutor_id_fkey
    FOREIGN KEY (tutor_id) REFERENCES tutor_profiles(id) ON DELETE CASCADE;

ALTER TABLE attendance_records
  DROP CONSTRAINT IF EXISTS attendance_records_student_id_fkey,
  ADD CONSTRAINT attendance_records_student_id_fkey
    FOREIGN KEY (student_id) REFERENCES students(id) ON DELETE CASCADE;

-- reviews: SET NULL (preserve reviews for public trust/SEO)
ALTER TABLE reviews
  DROP CONSTRAINT IF EXISTS reviews_parent_id_fkey,
  ADD CONSTRAINT reviews_parent_id_fkey
    FOREIGN KEY (parent_id) REFERENCES profiles(id) ON DELETE SET NULL;

ALTER TABLE reviews
  DROP CONSTRAINT IF EXISTS reviews_student_id_fkey,
  ADD CONSTRAINT reviews_student_id_fkey
    FOREIGN KEY (student_id) REFERENCES students(id) ON DELETE SET NULL;

ALTER TABLE reviews
  DROP CONSTRAINT IF EXISTS reviews_requirement_id_fkey,
  ADD CONSTRAINT reviews_requirement_id_fkey
    FOREIGN KEY (requirement_id) REFERENCES tuition_requirements(id) ON DELETE SET NULL;

-- enrollments: SET NULL (financial record preservation)
ALTER TABLE enrollments
  DROP CONSTRAINT IF EXISTS enrollments_requirement_id_fkey,
  ADD CONSTRAINT enrollments_requirement_id_fkey
    FOREIGN KEY (requirement_id) REFERENCES tuition_requirements(id) ON DELETE SET NULL;

ALTER TABLE enrollments
  DROP CONSTRAINT IF EXISTS enrollments_tutor_id_fkey,
  ADD CONSTRAINT enrollments_tutor_id_fkey
    FOREIGN KEY (tutor_id) REFERENCES tutor_profiles(id) ON DELETE SET NULL;

ALTER TABLE enrollments
  DROP CONSTRAINT IF EXISTS enrollments_parent_id_fkey,
  ADD CONSTRAINT enrollments_parent_id_fkey
    FOREIGN KEY (parent_id) REFERENCES profiles(id) ON DELETE SET NULL;

ALTER TABLE enrollments
  DROP CONSTRAINT IF EXISTS enrollments_student_id_fkey,
  ADD CONSTRAINT enrollments_student_id_fkey
    FOREIGN KEY (student_id) REFERENCES students(id) ON DELETE SET NULL;

-- invoices: SET NULL (financial records — must never lose)
ALTER TABLE invoices
  DROP CONSTRAINT IF EXISTS invoices_enrollment_id_fkey,
  ADD CONSTRAINT invoices_enrollment_id_fkey
    FOREIGN KEY (enrollment_id) REFERENCES enrollments(id) ON DELETE SET NULL;

ALTER TABLE invoices
  DROP CONSTRAINT IF EXISTS invoices_parent_id_fkey,
  ADD CONSTRAINT invoices_parent_id_fkey
    FOREIGN KEY (parent_id) REFERENCES profiles(id) ON DELETE SET NULL;

ALTER TABLE invoices
  DROP CONSTRAINT IF EXISTS invoices_tutor_id_fkey,
  ADD CONSTRAINT invoices_tutor_id_fkey
    FOREIGN KEY (tutor_id) REFERENCES tutor_profiles(id) ON DELETE SET NULL;

-- payments: SET NULL (financial records)
ALTER TABLE payments
  DROP CONSTRAINT IF EXISTS payments_parent_id_fkey,
  ADD CONSTRAINT payments_parent_id_fkey
    FOREIGN KEY (parent_id) REFERENCES profiles(id) ON DELETE SET NULL;

ALTER TABLE payments
  DROP CONSTRAINT IF EXISTS payments_tutor_id_fkey,
  ADD CONSTRAINT payments_tutor_id_fkey
    FOREIGN KEY (tutor_id) REFERENCES tutor_profiles(id) ON DELETE SET NULL;

ALTER TABLE payments
  DROP CONSTRAINT IF EXISTS payments_enrollment_id_fkey,
  ADD CONSTRAINT payments_enrollment_id_fkey
    FOREIGN KEY (enrollment_id) REFERENCES enrollments(id) ON DELETE SET NULL;

-- admin_action_logs: SET NULL (audit trail)
ALTER TABLE admin_action_logs
  DROP CONSTRAINT IF EXISTS admin_action_logs_admin_id_fkey,
  ADD CONSTRAINT admin_action_logs_admin_id_fkey
    FOREIGN KEY (admin_id) REFERENCES profiles(id) ON DELETE SET NULL;

-- tutor_profiles.verified_by: SET NULL
ALTER TABLE tutor_profiles
  DROP CONSTRAINT IF EXISTS tutor_profiles_verified_by_fkey,
  ADD CONSTRAINT tutor_profiles_verified_by_fkey
    FOREIGN KEY (verified_by) REFERENCES profiles(id) ON DELETE SET NULL;

-- tutor_documents.reviewed_by: SET NULL
ALTER TABLE tutor_documents
  DROP CONSTRAINT IF EXISTS tutor_documents_reviewed_by_fkey,
  ADD CONSTRAINT tutor_documents_reviewed_by_fkey
    FOREIGN KEY (reviewed_by) REFERENCES profiles(id) ON DELETE SET NULL;

-- ─────────────────────────────────────────────────────────────────────────────
-- 6. Add updated_at trigger to enrollments
-- ─────────────────────────────────────────────────────────────────────────────

CREATE TRIGGER IF NOT EXISTS set_updated_at_enrollments
  BEFORE UPDATE ON enrollments
  FOR EACH ROW
  EXECUTE FUNCTION trigger_set_updated_at();

-- ─────────────────────────────────────────────────────────────────────────────
-- 7. Drop deprecated reviews.rating column
--    Replaced by overall_rating in migration 009.
-- ─────────────────────────────────────────────────────────────────────────────

ALTER TABLE reviews DROP COLUMN IF EXISTS rating;

-- ─────────────────────────────────────────────────────────────────────────────
-- 8. Update update_tutor_rating() to use status = 'published'
--    instead of is_published = TRUE (the 009 canonical way)
-- ─────────────────────────────────────────────────────────────────────────────

CREATE OR REPLACE FUNCTION update_tutor_rating()
RETURNS TRIGGER AS $$
BEGIN
  UPDATE tutor_profiles
  SET
    average_rating = sub.avg_rating,
    total_reviews  = sub.cnt
  FROM (
    SELECT
      tutor_id,
      ROUND(AVG(overall_rating), 2) AS avg_rating,
      COUNT(*)                      AS cnt
    FROM reviews
    WHERE tutor_id = COALESCE(NEW.tutor_id, OLD.tutor_id)
      AND status = 'published'
    GROUP BY tutor_id
  ) sub
  WHERE tutor_profiles.id = sub.tutor_id;

  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- ─────────────────────────────────────────────────────────────────────────────
-- 9. Extend admin_action_logs CHECK constraint
--    Add 'ticket' as a valid target_type
-- ─────────────────────────────────────────────────────────────────────────────

ALTER TABLE admin_action_logs
  DROP CONSTRAINT IF EXISTS admin_action_logs_target_type_check;

ALTER TABLE admin_action_logs
  ADD CONSTRAINT admin_action_logs_target_type_check
    CHECK (target_type IN ('tutor', 'parent', 'requirement', 'document', 'ticket'));

-- ─────────────────────────────────────────────────────────────────────────────
-- 10. Create notifications table
--     Referenced by: demo actions, payment webhook, enrollment actions
-- ─────────────────────────────────────────────────────────────────────────────

CREATE TABLE IF NOT EXISTS notifications (
  id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id     UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  channel     TEXT NOT NULL DEFAULT 'in_app'
              CHECK (channel IN ('in_app', 'email', 'sms', 'push')),
  title       TEXT NOT NULL,
  body        TEXT NOT NULL,
  action_url  TEXT,
  entity_type TEXT,
  entity_id   UUID,
  is_read     BOOLEAN NOT NULL DEFAULT FALSE,
  read_at     TIMESTAMPTZ,
  created_at  TIMESTAMPTZ NOT NULL DEFAULT now()
);

ALTER TABLE notifications ENABLE ROW LEVEL SECURITY;

-- Users can only see their own notifications
CREATE POLICY "notifications_own_select"
  ON notifications FOR SELECT
  USING (user_id = auth.uid());

-- Users can mark their own notifications as read
CREATE POLICY "notifications_own_update"
  ON notifications FOR UPDATE
  USING (user_id = auth.uid())
  WITH CHECK (user_id = auth.uid());

-- System (service_role) and admins can insert notifications for any user
CREATE POLICY "notifications_system_insert"
  ON notifications FOR INSERT
  WITH CHECK (TRUE);  -- Inserts are controlled at application layer

-- Admins can manage all notifications
CREATE POLICY "notifications_admin_all"
  ON notifications FOR ALL
  USING (
    EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role = 'admin')
  );

-- Performance indexes
CREATE INDEX IF NOT EXISTS idx_notifications_user_unread
  ON notifications (user_id, is_read)
  WHERE is_read = FALSE;

CREATE INDEX IF NOT EXISTS idx_notifications_user_created
  ON notifications (user_id, created_at DESC);

COMMIT;
