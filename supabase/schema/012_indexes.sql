-- ============================================================
-- TutorMeet — Indexes
-- Version: 2.0
-- Run AFTER 010_complete_schema.sql
--
-- Index strategy:
--  - B-tree for equality + range filters (status, city, etc.)
--  - GIN for array containment (@>, &&) and full-text search
--  - Partial indexes for high-selectivity filtered queries
--  - No index on low-cardinality booleans alone
-- ============================================================

-- ─── profiles ─────────────────────────────────────────────────────────────────

CREATE INDEX idx_profiles_role     ON profiles(role);
CREATE INDEX idx_profiles_is_active ON profiles(is_active) WHERE is_active = FALSE;

-- ─── parent_profiles ──────────────────────────────────────────────────────────

CREATE INDEX idx_parent_city       ON parent_profiles(city);
CREATE INDEX idx_parent_locality   ON parent_profiles(locality);
CREATE INDEX idx_parent_onboarding ON parent_profiles(onboarding_complete)
  WHERE onboarding_complete = FALSE;

-- ─── student_profiles ────────────────────────────────────────────────────────

CREATE INDEX idx_students_parent   ON student_profiles(parent_id);
CREATE INDEX idx_students_grade    ON student_profiles(current_grade);

-- ─── tutor_profiles — core search indexes ────────────────────────────────────

-- Verification status (most filtered on)
CREATE INDEX idx_tutor_status
  ON tutor_profiles(verification_status);

-- Partial: only active / verified tutors (hot path for public browsing)
CREATE INDEX idx_tutor_verified
  ON tutor_profiles(user_id, city, locality)
  WHERE verification_status = 'verified';

-- City + locality (location-based search)
CREATE INDEX idx_tutor_city        ON tutor_profiles(city);
CREATE INDEX idx_tutor_locality    ON tutor_profiles(locality);
CREATE INDEX idx_tutor_pincode     ON tutor_profiles(pincode);
CREATE INDEX idx_tutor_state       ON tutor_profiles(state);

-- Subjects array — GIN for @> and && operators
CREATE INDEX idx_tutor_subjects    ON tutor_profiles USING gin(subjects);
CREATE INDEX idx_tutor_grades      ON tutor_profiles USING gin(grades);
CREATE INDEX idx_tutor_boards      ON tutor_profiles USING gin(boards);

-- Teaching mode
CREATE INDEX idx_tutor_mode        ON tutor_profiles(teaching_mode);

-- Availability
CREATE INDEX idx_tutor_days        ON tutor_profiles USING gin(preferred_days);
CREATE INDEX idx_tutor_slots       ON tutor_profiles USING gin(preferred_time_slots);

-- Fee range queries
CREATE INDEX idx_tutor_fee         ON tutor_profiles(expected_fee_per_hour)
  WHERE expected_fee_per_hour IS NOT NULL;

-- Onboarding state (admin pipeline)
CREATE INDEX idx_tutor_onboarding  ON tutor_profiles(onboarding_step)
  WHERE onboarding_complete = FALSE;

-- Score queries (partial — only verified tutors have scores)
CREATE INDEX idx_tutor_scores
  ON tutor_profiles(knowledge_score, teaching_score)
  WHERE verification_status = 'verified'
    AND knowledge_score IS NOT NULL;

-- Trigram index for name search on public profiles
CREATE INDEX idx_tutor_name_trgm
  ON profiles USING gin(full_name gin_trgm_ops)
  WHERE role = 'tutor';

-- ─── tutor_qualifications ─────────────────────────────────────────────────────

CREATE INDEX idx_qual_tutor        ON tutor_qualifications(tutor_id);
CREATE INDEX idx_qual_level        ON tutor_qualifications(qualification_level);

-- ─── tutor_experience ────────────────────────────────────────────────────────

CREATE INDEX idx_exp_tutor         ON tutor_experience(tutor_id);
CREATE INDEX idx_exp_type          ON tutor_experience(experience_type);
CREATE INDEX idx_exp_subjects      ON tutor_experience USING gin(subjects_taught);

-- ─── tutor_subjects (normalised, most-filtered) ──────────────────────────────

CREATE INDEX idx_ts_tutor          ON tutor_subjects(tutor_id);
CREATE INDEX idx_ts_subject        ON tutor_subjects(subject);
CREATE INDEX idx_ts_grade          ON tutor_subjects(grade);
CREATE INDEX idx_ts_board          ON tutor_subjects(board);
-- Composite for precise matching
CREATE INDEX idx_ts_combo          ON tutor_subjects(subject, grade, board)
  WHERE is_verified = TRUE;

-- ─── tutor_documents (admin + owner access only) ─────────────────────────────

CREATE INDEX idx_docs_tutor        ON tutor_documents(tutor_id);
CREATE INDEX idx_docs_status       ON tutor_documents(status);
CREATE INDEX idx_docs_type         ON tutor_documents(document_type);

-- ─── tutor_assessments ────────────────────────────────────────────────────────

CREATE INDEX idx_assess_tutor      ON tutor_assessments(tutor_id);
CREATE INDEX idx_assess_status     ON tutor_assessments(status);

-- ─── tutor_interviews ────────────────────────────────────────────────────────

CREATE INDEX idx_interview_tutor   ON tutor_interviews(tutor_id);
CREATE INDEX idx_interview_status  ON tutor_interviews(status);

-- ─── tutor_verifications (audit log) ─────────────────────────────────────────

CREATE INDEX idx_verif_tutor       ON tutor_verifications(tutor_id);
CREATE INDEX idx_verif_status      ON tutor_verifications(to_status);

-- ─── tuition_requirements ────────────────────────────────────────────────────

CREATE INDEX idx_req_parent        ON tuition_requirements(parent_id);
CREATE INDEX idx_req_student       ON tuition_requirements(student_id);
CREATE INDEX idx_req_status        ON tuition_requirements(status);
CREATE INDEX idx_req_city          ON tuition_requirements(city);
CREATE INDEX idx_req_locality      ON tuition_requirements(locality);
CREATE INDEX idx_req_pincode       ON tuition_requirements(pincode);
CREATE INDEX idx_req_subjects      ON tuition_requirements USING gin(subjects);
CREATE INDEX idx_req_grade         ON tuition_requirements(grade);
CREATE INDEX idx_req_board         ON tuition_requirements(board);

-- Partial: open requirements for admin matching dashboard
CREATE INDEX idx_req_open
  ON tuition_requirements(city, status, created_at DESC)
  WHERE status IN ('submitted', 'matching');

-- ─── tutor_matches ────────────────────────────────────────────────────────────

CREATE INDEX idx_match_req         ON tutor_matches(requirement_id);
CREATE INDEX idx_match_tutor       ON tutor_matches(tutor_id);
CREATE INDEX idx_match_status      ON tutor_matches(match_status);

-- ─── demo_classes ────────────────────────────────────────────────────────────

CREATE INDEX idx_demo_tutor        ON demo_classes(tutor_id);
CREATE INDEX idx_demo_parent       ON demo_classes(parent_id);
CREATE INDEX idx_demo_req          ON demo_classes(requirement_id);
CREATE INDEX idx_demo_status       ON demo_classes(status);
CREATE INDEX idx_demo_scheduled    ON demo_classes(scheduled_at)
  WHERE status = 'scheduled';

-- ─── enrollments ──────────────────────────────────────────────────────────────

CREATE INDEX idx_enroll_tutor      ON enrollments(tutor_id);
CREATE INDEX idx_enroll_parent     ON enrollments(parent_id);
CREATE INDEX idx_enroll_student    ON enrollments(student_id);
CREATE INDEX idx_enroll_status     ON enrollments(status);

-- ─── attendance ───────────────────────────────────────────────────────────────

CREATE INDEX idx_att_enrollment    ON attendance(enrollment_id);
CREATE INDEX idx_att_tutor         ON attendance(tutor_id);
CREATE INDEX idx_att_student       ON attendance(student_id);
CREATE INDEX idx_att_date          ON attendance(session_date);
CREATE INDEX idx_att_status        ON attendance(status);

-- ─── reviews ──────────────────────────────────────────────────────────────────

CREATE INDEX idx_reviews_tutor     ON reviews(tutor_id)
  WHERE is_published = TRUE;
CREATE INDEX idx_reviews_parent    ON reviews(parent_id);
CREATE INDEX idx_reviews_published ON reviews(is_published);

-- ─── payments ────────────────────────────────────────────────────────────────

CREATE INDEX idx_pay_parent        ON payments(parent_id);
CREATE INDEX idx_pay_tutor         ON payments(tutor_id);
CREATE INDEX idx_pay_enrollment    ON payments(enrollment_id);
CREATE INDEX idx_pay_status        ON payments(status);

-- ─── notifications ────────────────────────────────────────────────────────────

CREATE INDEX idx_notif_user        ON notifications(user_id);
CREATE INDEX idx_notif_unread      ON notifications(user_id, created_at DESC)
  WHERE is_read = FALSE;

-- ─── support_tickets ──────────────────────────────────────────────────────────

CREATE INDEX idx_ticket_raised_by  ON support_tickets(raised_by);
CREATE INDEX idx_ticket_status     ON support_tickets(status);
CREATE INDEX idx_ticket_priority   ON support_tickets(priority)
  WHERE status IN ('open', 'in_progress');

-- ─── admin_actions (audit log) ───────────────────────────────────────────────

CREATE INDEX idx_admin_act_admin   ON admin_actions(admin_id);
CREATE INDEX idx_admin_act_target  ON admin_actions(target_type, target_id);
CREATE INDEX idx_admin_act_type    ON admin_actions(action_type);
CREATE INDEX idx_admin_act_created ON admin_actions(created_at DESC);
