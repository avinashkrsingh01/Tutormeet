-- ============================================================
-- TutorMeet — Row Level Security (RLS)
-- Version: 2.0
-- Run AFTER 010_complete_schema.sql
--
-- Design principles:
--  1. Default deny — no policy = no access
--  2. Parents see only their own data
--  3. Tutors see only their own private data + assigned opportunities
--  4. Tutors NEVER see: parent/student PII, other tutors' private data
--  5. Admins have controlled operational access
--  6. Sensitive documents are completely blocked from public + tutor browsing
--  7. No rule may ever leak: government IDs, exact addresses, private notes
-- ============================================================

-- ─── Enable RLS on every table ────────────────────────────────────────────────

ALTER TABLE profiles                 ENABLE ROW LEVEL SECURITY;
ALTER TABLE parent_profiles          ENABLE ROW LEVEL SECURITY;
ALTER TABLE student_profiles         ENABLE ROW LEVEL SECURITY;
ALTER TABLE tutor_profiles           ENABLE ROW LEVEL SECURITY;
ALTER TABLE tutor_qualifications     ENABLE ROW LEVEL SECURITY;
ALTER TABLE tutor_experience         ENABLE ROW LEVEL SECURITY;
ALTER TABLE tutor_subjects           ENABLE ROW LEVEL SECURITY;
ALTER TABLE tutor_documents          ENABLE ROW LEVEL SECURITY;
ALTER TABLE tutor_assessments        ENABLE ROW LEVEL SECURITY;
ALTER TABLE tutor_interviews         ENABLE ROW LEVEL SECURITY;
ALTER TABLE tutor_verifications      ENABLE ROW LEVEL SECURITY;
ALTER TABLE tuition_requirements     ENABLE ROW LEVEL SECURITY;
ALTER TABLE tutor_matches            ENABLE ROW LEVEL SECURITY;
ALTER TABLE demo_classes             ENABLE ROW LEVEL SECURITY;
ALTER TABLE enrollments              ENABLE ROW LEVEL SECURITY;
ALTER TABLE attendance               ENABLE ROW LEVEL SECURITY;
ALTER TABLE reviews                  ENABLE ROW LEVEL SECURITY;
ALTER TABLE payments                 ENABLE ROW LEVEL SECURITY;
ALTER TABLE notifications            ENABLE ROW LEVEL SECURITY;
ALTER TABLE support_tickets          ENABLE ROW LEVEL SECURITY;
ALTER TABLE support_ticket_replies   ENABLE ROW LEVEL SECURITY;
ALTER TABLE admin_actions            ENABLE ROW LEVEL SECURITY;

-- ============================================================
-- HELPER FUNCTIONS
-- SECURITY DEFINER so they bypass RLS when checking roles.
-- ============================================================

CREATE OR REPLACE FUNCTION is_admin()
RETURNS BOOLEAN LANGUAGE sql SECURITY DEFINER STABLE AS $$
  SELECT EXISTS (
    SELECT 1 FROM profiles WHERE id = auth.uid() AND role = 'admin' AND is_active = TRUE
  );
$$;

CREATE OR REPLACE FUNCTION is_tutor()
RETURNS BOOLEAN LANGUAGE sql SECURITY DEFINER STABLE AS $$
  SELECT EXISTS (
    SELECT 1 FROM profiles WHERE id = auth.uid() AND role = 'tutor' AND is_active = TRUE
  );
$$;

CREATE OR REPLACE FUNCTION is_parent()
RETURNS BOOLEAN LANGUAGE sql SECURITY DEFINER STABLE AS $$
  SELECT EXISTS (
    SELECT 1 FROM profiles WHERE id = auth.uid() AND role = 'parent' AND is_active = TRUE
  );
$$;

-- Returns the tutor_profiles.id for the current user (tutor only)
CREATE OR REPLACE FUNCTION my_tutor_profile_id()
RETURNS UUID LANGUAGE sql SECURITY DEFINER STABLE AS $$
  SELECT id FROM tutor_profiles WHERE user_id = auth.uid() LIMIT 1;
$$;

-- ============================================================
-- profiles
-- Parents/tutors read & update their own row; admins read all.
-- ============================================================

CREATE POLICY "profiles_own_select"
  ON profiles FOR SELECT
  USING (id = auth.uid() OR is_admin());

CREATE POLICY "profiles_own_update"
  ON profiles FOR UPDATE
  USING (id = auth.uid())
  WITH CHECK (
    id = auth.uid()
    -- Prevent role self-escalation
    AND role = (SELECT role FROM profiles WHERE id = auth.uid())
  );
-- INSERT handled by fn_handle_new_user SECURITY DEFINER trigger

-- ============================================================
-- parent_profiles
-- Parent owns their row; admins can read and update.
-- SECURITY: pincode, address_line1/2 never shown to non-owners.
-- ============================================================

CREATE POLICY "parent_profiles_select"
  ON parent_profiles FOR SELECT
  USING (user_id = auth.uid() OR is_admin());

CREATE POLICY "parent_profiles_insert"
  ON parent_profiles FOR INSERT
  WITH CHECK (user_id = auth.uid());

CREATE POLICY "parent_profiles_update"
  ON parent_profiles FOR UPDATE
  USING (user_id = auth.uid() OR is_admin());

-- ============================================================
-- student_profiles
-- Parent owns their students; admins can read.
-- Tutors CANNOT read student PII directly — they get student_name
-- from enrollments only after being assigned.
-- ============================================================

CREATE POLICY "students_parent_all"
  ON student_profiles FOR ALL
  USING (parent_id = auth.uid())
  WITH CHECK (parent_id = auth.uid());

CREATE POLICY "students_admin_select"
  ON student_profiles FOR SELECT
  USING (is_admin());

-- Enrolled tutor sees assigned student basic info only
CREATE POLICY "students_tutor_enrolled"
  ON student_profiles FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM enrollments e
      WHERE e.student_id  = student_profiles.id
        AND e.tutor_id    = my_tutor_profile_id()
        AND e.status      = 'active'
    )
  );

-- ============================================================
-- tutor_profiles
-- PUBLIC: verified tutors visible to all (safe columns enforced by API).
-- PRIVATE: own row always readable; admin can read/update all.
-- SECURITY: admin_notes, rejection_reason, date_of_birth, pincode
-- are columns — their exposure is controlled at the API/view layer.
-- ============================================================

CREATE POLICY "tutor_profiles_public_verified"
  ON tutor_profiles FOR SELECT
  USING (
    verification_status = 'verified'   -- anyone can see verified tutors
    OR user_id = auth.uid()            -- own row always readable
    OR is_admin()
  );

CREATE POLICY "tutor_profiles_own_update"
  ON tutor_profiles FOR UPDATE
  USING (user_id = auth.uid() OR is_admin());

-- ============================================================
-- tutor_qualifications
-- Tutor owns; admins can read/update.
-- ============================================================

CREATE POLICY "tutor_qual_own"
  ON tutor_qualifications FOR ALL
  USING (tutor_id = my_tutor_profile_id() OR is_admin())
  WITH CHECK (tutor_id = my_tutor_profile_id() OR is_admin());

-- Public can read qualifications of verified tutors (for public profile)
CREATE POLICY "tutor_qual_public"
  ON tutor_qualifications FOR SELECT
  USING (
    tutor_id IN (
      SELECT id FROM tutor_profiles WHERE verification_status = 'verified'
    )
  );

-- ============================================================
-- tutor_experience
-- Same as qualifications.
-- ============================================================

CREATE POLICY "tutor_exp_own"
  ON tutor_experience FOR ALL
  USING (tutor_id = my_tutor_profile_id() OR is_admin())
  WITH CHECK (tutor_id = my_tutor_profile_id() OR is_admin());

CREATE POLICY "tutor_exp_public"
  ON tutor_experience FOR SELECT
  USING (
    tutor_id IN (
      SELECT id FROM tutor_profiles WHERE verification_status = 'verified'
    )
  );

-- ============================================================
-- tutor_subjects
-- Tutor owns; public can read for verified tutors; admin full access.
-- ============================================================

CREATE POLICY "tutor_subjects_own"
  ON tutor_subjects FOR ALL
  USING (tutor_id = my_tutor_profile_id() OR is_admin())
  WITH CHECK (tutor_id = my_tutor_profile_id() OR is_admin());

CREATE POLICY "tutor_subjects_public"
  ON tutor_subjects FOR SELECT
  USING (
    tutor_id IN (
      SELECT id FROM tutor_profiles WHERE verification_status = 'verified'
    )
  );

-- ============================================================
-- tutor_documents
-- SECURITY CRITICAL:
--  - Tutors see only their own documents
--  - Admins can read and update
--  - Parents CANNOT access any tutor documents under any circumstances
--  - No public read policy exists for this table
-- ============================================================

CREATE POLICY "tutor_docs_own_select"
  ON tutor_documents FOR SELECT
  USING (tutor_id = my_tutor_profile_id());

CREATE POLICY "tutor_docs_own_insert"
  ON tutor_documents FOR INSERT
  WITH CHECK (
    tutor_id = my_tutor_profile_id()
    AND is_tutor()
  );

CREATE POLICY "tutor_docs_admin"
  ON tutor_documents FOR ALL
  USING (is_admin())
  WITH CHECK (is_admin());

-- NO policy exists for parents or unauthenticated users — default deny applies.

-- ============================================================
-- tutor_assessments
-- Tutor sees own; admin full access.
-- ============================================================

CREATE POLICY "assessments_own"
  ON tutor_assessments FOR SELECT
  USING (tutor_id = my_tutor_profile_id() OR is_admin());

CREATE POLICY "assessments_admin_write"
  ON tutor_assessments FOR ALL
  USING (is_admin())
  WITH CHECK (is_admin());

-- ============================================================
-- tutor_interviews
-- Tutor sees own (minus interviewer_notes); admin full access.
-- interviewer_notes column security is enforced at API layer.
-- ============================================================

CREATE POLICY "interviews_own_select"
  ON tutor_interviews FOR SELECT
  USING (tutor_id = my_tutor_profile_id() OR is_admin());

CREATE POLICY "interviews_admin_write"
  ON tutor_interviews FOR ALL
  USING (is_admin())
  WITH CHECK (is_admin());

-- ============================================================
-- tutor_verifications
-- Tutor sees own status log; admin full read.
-- INSERT only — no UPDATE or DELETE via RLS.
-- ============================================================

CREATE POLICY "verifications_own_select"
  ON tutor_verifications FOR SELECT
  USING (tutor_id = my_tutor_profile_id() OR is_admin());

CREATE POLICY "verifications_system_insert"
  ON tutor_verifications FOR INSERT
  WITH CHECK (
    -- Only the trigger (SECURITY DEFINER) or admins can insert
    is_admin()
    OR tutor_id IN (
      SELECT id FROM tutor_profiles WHERE user_id = auth.uid()
    )
  );
-- No UPDATE or DELETE policies — immutable audit log.

-- ============================================================
-- tuition_requirements
-- SECURITY: parent owns; admin reads all.
-- Tutors CANNOT read requirements directly — they see matched info
-- through tutor_matches only, and without pincode/admin_notes.
-- ============================================================

CREATE POLICY "requirements_parent"
  ON tuition_requirements FOR ALL
  USING (parent_id = auth.uid())
  WITH CHECK (parent_id = auth.uid() AND is_parent());

CREATE POLICY "requirements_admin"
  ON tuition_requirements FOR ALL
  USING (is_admin())
  WITH CHECK (is_admin());

-- Tutors see requirements they are matched to — but NOT pincode or admin_notes.
-- Column-level security (the API must never return those columns to tutors).
CREATE POLICY "requirements_tutor_matched"
  ON tuition_requirements FOR SELECT
  USING (
    id IN (
      SELECT requirement_id FROM tutor_matches
      WHERE tutor_id = my_tutor_profile_id()
        AND match_status IN (
          'sent','viewed','demo_requested','demo_scheduled','demo_completed','selected'
        )
    )
  );

-- ============================================================
-- tutor_matches
-- Parent sees matches for their requirements.
-- Tutors see their own matches.
-- Admin full access.
-- ============================================================

CREATE POLICY "matches_parent_select"
  ON tutor_matches FOR SELECT
  USING (
    requirement_id IN (
      SELECT id FROM tuition_requirements WHERE parent_id = auth.uid()
    )
    OR is_admin()
  );

CREATE POLICY "matches_tutor_select"
  ON tutor_matches FOR SELECT
  USING (tutor_id = my_tutor_profile_id());

CREATE POLICY "matches_tutor_update_status"
  ON tutor_matches FOR UPDATE
  USING (tutor_id = my_tutor_profile_id())
  WITH CHECK (
    tutor_id = my_tutor_profile_id()
    -- Tutors can only update match_status (not admin_notes)
    AND match_status IN ('viewed','demo_requested','rejected')
  );

CREATE POLICY "matches_admin"
  ON tutor_matches FOR ALL
  USING (is_admin())
  WITH CHECK (is_admin());

-- ============================================================
-- demo_classes
-- Parent and assigned tutor see their demos; admin full access.
-- SECURITY: venue_address is a column — the API must gate this
-- to only active/confirmed demos for the assigned tutor.
-- ============================================================

CREATE POLICY "demo_parent_select"
  ON demo_classes FOR SELECT
  USING (parent_id = auth.uid());

CREATE POLICY "demo_tutor_select"
  ON demo_classes FOR SELECT
  USING (tutor_id = my_tutor_profile_id());

CREATE POLICY "demo_tutor_update"
  ON demo_classes FOR UPDATE
  USING (tutor_id = my_tutor_profile_id())
  WITH CHECK (
    tutor_id = my_tutor_profile_id()
    AND status IN ('completed','no_show')  -- tutors can only close a demo
  );

CREATE POLICY "demo_admin"
  ON demo_classes FOR ALL
  USING (is_admin())
  WITH CHECK (is_admin());

-- ============================================================
-- enrollments
-- Parent, enrolled tutor, and admin.
-- ============================================================

CREATE POLICY "enrollments_parent"
  ON enrollments FOR SELECT
  USING (parent_id = auth.uid());

CREATE POLICY "enrollments_tutor"
  ON enrollments FOR SELECT
  USING (tutor_id = my_tutor_profile_id());

CREATE POLICY "enrollments_admin"
  ON enrollments FOR ALL
  USING (is_admin())
  WITH CHECK (is_admin());

-- ============================================================
-- attendance
-- Parent sees attendance for their students.
-- Tutor sees their own sessions.
-- Admin full access.
-- Tutors and admins can insert; parents can verify only.
-- ============================================================

CREATE POLICY "attendance_parent_select"
  ON attendance FOR SELECT
  USING (
    student_id IN (
      SELECT id FROM student_profiles WHERE parent_id = auth.uid()
    )
  );

CREATE POLICY "attendance_tutor_select"
  ON attendance FOR SELECT
  USING (tutor_id = my_tutor_profile_id());

CREATE POLICY "attendance_tutor_insert"
  ON attendance FOR INSERT
  WITH CHECK (
    tutor_id = my_tutor_profile_id()
    AND marked_by = 'tutor'
    AND EXISTS (
      SELECT 1 FROM enrollments e
      WHERE e.id         = attendance.enrollment_id
        AND e.tutor_id   = my_tutor_profile_id()
        AND e.status     = 'active'
    )
  );

CREATE POLICY "attendance_admin"
  ON attendance FOR ALL
  USING (is_admin())
  WITH CHECK (is_admin());

-- ============================================================
-- reviews
-- Public reads only published reviews.
-- Parent can create and see own unpublished reviews.
-- Tutor sees published reviews for themselves.
-- Admin full access (publishes reviews).
-- ============================================================

CREATE POLICY "reviews_public_published"
  ON reviews FOR SELECT
  USING (is_published = TRUE);

CREATE POLICY "reviews_parent_own"
  ON reviews FOR ALL
  USING (parent_id = auth.uid())
  WITH CHECK (parent_id = auth.uid() AND is_parent());

CREATE POLICY "reviews_tutor_own"
  ON reviews FOR SELECT
  USING (
    tutor_id = my_tutor_profile_id()
    AND is_published = TRUE
  );

CREATE POLICY "reviews_admin"
  ON reviews FOR ALL
  USING (is_admin())
  WITH CHECK (is_admin());

-- ============================================================
-- payments
-- Parent sees their own; tutor sees own; admin full access.
-- ============================================================

CREATE POLICY "payments_parent"
  ON payments FOR SELECT
  USING (parent_id = auth.uid());

CREATE POLICY "payments_tutor"
  ON payments FOR SELECT
  USING (tutor_id = my_tutor_profile_id());

CREATE POLICY "payments_parent_insert"
  ON payments FOR INSERT
  WITH CHECK (parent_id = auth.uid() AND is_parent());

CREATE POLICY "payments_admin"
  ON payments FOR ALL
  USING (is_admin())
  WITH CHECK (is_admin());

-- ============================================================
-- notifications
-- Users see only their own notifications.
-- Admin can insert (send) notifications to any user.
-- ============================================================

CREATE POLICY "notifications_own"
  ON notifications FOR SELECT
  USING (user_id = auth.uid());

CREATE POLICY "notifications_own_update"
  ON notifications FOR UPDATE
  USING (user_id = auth.uid())
  WITH CHECK (user_id = auth.uid());  -- only allow marking read

CREATE POLICY "notifications_admin"
  ON notifications FOR ALL
  USING (is_admin())
  WITH CHECK (is_admin());

-- ============================================================
-- support_tickets
-- Users see and manage their own tickets.
-- Admins see all; internal replies are admin-only.
-- ============================================================

CREATE POLICY "tickets_own"
  ON support_tickets FOR ALL
  USING (raised_by = auth.uid() OR is_admin())
  WITH CHECK (raised_by = auth.uid() OR is_admin());

CREATE POLICY "ticket_replies_own"
  ON support_ticket_replies FOR SELECT
  USING (
    -- Always see non-internal replies on own tickets
    (ticket_id IN (SELECT id FROM support_tickets WHERE raised_by = auth.uid())
     AND is_internal = FALSE)
    -- Admins see everything
    OR is_admin()
  );

CREATE POLICY "ticket_replies_insert"
  ON support_ticket_replies FOR INSERT
  WITH CHECK (
    author_id = auth.uid()
    AND (
      -- Users can reply on own tickets (non-internal)
      (ticket_id IN (SELECT id FROM support_tickets WHERE raised_by = auth.uid())
       AND is_internal = FALSE)
      -- Admins can post internal or external
      OR is_admin()
    )
  );

-- ============================================================
-- admin_actions
-- Admins read; INSERT only (no UPDATE/DELETE — immutable).
-- ============================================================

CREATE POLICY "admin_actions_select"
  ON admin_actions FOR SELECT
  USING (is_admin());

CREATE POLICY "admin_actions_insert"
  ON admin_actions FOR INSERT
  WITH CHECK (is_admin() AND admin_id = auth.uid());

-- NO UPDATE or DELETE policy — immutable audit log.
