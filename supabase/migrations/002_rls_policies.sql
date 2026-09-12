-- ============================================================
-- TutorMeet — Row Level Security (RLS) Policies
-- Run AFTER 001_initial_schema.sql
-- ============================================================

-- Enable RLS on all tables
ALTER TABLE profiles              ENABLE ROW LEVEL SECURITY;
ALTER TABLE parent_profiles       ENABLE ROW LEVEL SECURITY;
ALTER TABLE students              ENABLE ROW LEVEL SECURITY;
ALTER TABLE tutor_profiles        ENABLE ROW LEVEL SECURITY;
ALTER TABLE tutor_documents       ENABLE ROW LEVEL SECURITY;
ALTER TABLE tutor_assessments     ENABLE ROW LEVEL SECURITY;
ALTER TABLE tuition_requirements  ENABLE ROW LEVEL SECURITY;
ALTER TABLE tutor_matches         ENABLE ROW LEVEL SECURITY;
ALTER TABLE demo_classes          ENABLE ROW LEVEL SECURITY;
ALTER TABLE attendance_records    ENABLE ROW LEVEL SECURITY;
ALTER TABLE reviews               ENABLE ROW LEVEL SECURITY;
ALTER TABLE admin_action_logs     ENABLE ROW LEVEL SECURITY;

-- ─── Helper: is the current user an admin? ────────────────────────────────────

CREATE OR REPLACE FUNCTION is_admin()
RETURNS BOOLEAN AS $$
  SELECT EXISTS (
    SELECT 1 FROM profiles
    WHERE id = auth.uid() AND role = 'admin'
  );
$$ LANGUAGE sql SECURITY DEFINER STABLE;

-- ─── Helper: is the current user a tutor? ────────────────────────────────────

CREATE OR REPLACE FUNCTION is_tutor()
RETURNS BOOLEAN AS $$
  SELECT EXISTS (
    SELECT 1 FROM profiles
    WHERE id = auth.uid() AND role = 'tutor'
  );
$$ LANGUAGE sql SECURITY DEFINER STABLE;

-- ─── Helper: is the current user a parent? ───────────────────────────────────

CREATE OR REPLACE FUNCTION is_parent()
RETURNS BOOLEAN AS $$
  SELECT EXISTS (
    SELECT 1 FROM profiles
    WHERE id = auth.uid() AND role = 'parent'
  );
$$ LANGUAGE sql SECURITY DEFINER STABLE;

-- ============================================================
-- profiles
-- ============================================================

-- Users can read their own profile; admins can read all
CREATE POLICY "profiles_select"
  ON profiles FOR SELECT
  USING (id = auth.uid() OR is_admin());

-- Users can update their own profile
CREATE POLICY "profiles_update"
  ON profiles FOR UPDATE
  USING (id = auth.uid())
  WITH CHECK (id = auth.uid());

-- Insert handled by the handle_new_user trigger (SECURITY DEFINER)

-- ============================================================
-- parent_profiles
-- ============================================================

CREATE POLICY "parent_profiles_select"
  ON parent_profiles FOR SELECT
  USING (user_id = auth.uid() OR is_admin());

CREATE POLICY "parent_profiles_update"
  ON parent_profiles FOR UPDATE
  USING (user_id = auth.uid());

-- ============================================================
-- students
-- ============================================================

CREATE POLICY "students_select"
  ON students FOR SELECT
  USING (parent_id = auth.uid() OR is_admin());

CREATE POLICY "students_insert"
  ON students FOR INSERT
  WITH CHECK (parent_id = auth.uid());

CREATE POLICY "students_update"
  ON students FOR UPDATE
  USING (parent_id = auth.uid());

CREATE POLICY "students_delete"
  ON students FOR DELETE
  USING (parent_id = auth.uid());

-- ============================================================
-- tutor_profiles
-- ============================================================

-- Verified tutors are visible to everyone (for browsing)
CREATE POLICY "tutor_profiles_select_public"
  ON tutor_profiles FOR SELECT
  USING (
    verification_status = 'verified'
    OR user_id = auth.uid()
    OR is_admin()
  );

CREATE POLICY "tutor_profiles_update"
  ON tutor_profiles FOR UPDATE
  USING (user_id = auth.uid() OR is_admin());

-- ============================================================
-- tutor_documents
-- ============================================================

CREATE POLICY "tutor_documents_select"
  ON tutor_documents FOR SELECT
  USING (
    tutor_id IN (SELECT id FROM tutor_profiles WHERE user_id = auth.uid())
    OR is_admin()
  );

CREATE POLICY "tutor_documents_insert"
  ON tutor_documents FOR INSERT
  WITH CHECK (
    tutor_id IN (SELECT id FROM tutor_profiles WHERE user_id = auth.uid())
  );

CREATE POLICY "tutor_documents_update_admin"
  ON tutor_documents FOR UPDATE
  USING (is_admin());

-- ============================================================
-- tutor_assessments
-- ============================================================

CREATE POLICY "tutor_assessments_select"
  ON tutor_assessments FOR SELECT
  USING (
    tutor_id IN (SELECT id FROM tutor_profiles WHERE user_id = auth.uid())
    OR is_admin()
  );

CREATE POLICY "tutor_assessments_update"
  ON tutor_assessments FOR UPDATE
  USING (
    tutor_id IN (SELECT id FROM tutor_profiles WHERE user_id = auth.uid())
    OR is_admin()
  );

-- ============================================================
-- tuition_requirements
-- ============================================================

CREATE POLICY "requirements_select"
  ON tuition_requirements FOR SELECT
  USING (parent_id = auth.uid() OR is_admin());

CREATE POLICY "requirements_insert"
  ON tuition_requirements FOR INSERT
  WITH CHECK (parent_id = auth.uid() AND is_parent());

CREATE POLICY "requirements_update"
  ON tuition_requirements FOR UPDATE
  USING (parent_id = auth.uid() OR is_admin());

-- ============================================================
-- tutor_matches
-- ============================================================

-- Parents see matches for their requirements; tutors see their own matches
CREATE POLICY "matches_select"
  ON tutor_matches FOR SELECT
  USING (
    requirement_id IN (SELECT id FROM tuition_requirements WHERE parent_id = auth.uid())
    OR tutor_id IN (SELECT id FROM tutor_profiles WHERE user_id = auth.uid())
    OR is_admin()
  );

CREATE POLICY "matches_insert_admin"
  ON tutor_matches FOR INSERT
  WITH CHECK (is_admin());

CREATE POLICY "matches_update"
  ON tutor_matches FOR UPDATE
  USING (
    requirement_id IN (SELECT id FROM tuition_requirements WHERE parent_id = auth.uid())
    OR is_admin()
  );

-- ============================================================
-- demo_classes
-- ============================================================

CREATE POLICY "demo_select"
  ON demo_classes FOR SELECT
  USING (
    parent_id = auth.uid()
    OR tutor_id IN (SELECT id FROM tutor_profiles WHERE user_id = auth.uid())
    OR is_admin()
  );

CREATE POLICY "demo_insert_admin"
  ON demo_classes FOR INSERT
  WITH CHECK (is_admin());

CREATE POLICY "demo_update"
  ON demo_classes FOR UPDATE
  USING (
    parent_id = auth.uid()
    OR tutor_id IN (SELECT id FROM tutor_profiles WHERE user_id = auth.uid())
    OR is_admin()
  );

-- ============================================================
-- attendance_records
-- ============================================================

CREATE POLICY "attendance_select"
  ON attendance_records FOR SELECT
  USING (
    requirement_id IN (SELECT id FROM tuition_requirements WHERE parent_id = auth.uid())
    OR tutor_id IN (SELECT id FROM tutor_profiles WHERE user_id = auth.uid())
    OR is_admin()
  );

CREATE POLICY "attendance_insert"
  ON attendance_records FOR INSERT
  WITH CHECK (
    tutor_id IN (SELECT id FROM tutor_profiles WHERE user_id = auth.uid())
    OR is_admin()
  );

-- ============================================================
-- reviews
-- ============================================================

CREATE POLICY "reviews_select"
  ON reviews FOR SELECT
  USING (
    is_published = TRUE
    OR parent_id = auth.uid()
    OR tutor_id IN (SELECT id FROM tutor_profiles WHERE user_id = auth.uid())
    OR is_admin()
  );

CREATE POLICY "reviews_insert"
  ON reviews FOR INSERT
  WITH CHECK (parent_id = auth.uid() AND is_parent());

CREATE POLICY "reviews_update_admin"
  ON reviews FOR UPDATE
  USING (is_admin());

-- ============================================================
-- admin_action_logs
-- ============================================================

CREATE POLICY "admin_logs_select"
  ON admin_action_logs FOR SELECT
  USING (is_admin());

CREATE POLICY "admin_logs_insert"
  ON admin_action_logs FOR INSERT
  WITH CHECK (is_admin());
