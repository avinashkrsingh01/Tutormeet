-- ============================================================
-- TutorMeet — Demo / Seed Data
-- Version: 2.0
-- DEVELOPMENT AND STAGING ONLY — never run on production.
--
-- Creates clearly labelled demo accounts:
--   Parent:  parent@demo.tutormeet.in
--   Tutors:  tutor1@demo.tutormeet.in  (verified)
--             tutor2@demo.tutormeet.in  (pending)
--   Admin:   admin@demo.tutormeet.in
--
-- All demo passwords: Demo@12345
-- All demo government IDs use obviously-fake values.
-- ============================================================

-- ─── Guard — only run in non-production environments ─────────────────────────

DO $$
BEGIN
  IF current_database() ILIKE '%prod%' OR current_database() ILIKE '%production%' THEN
    RAISE EXCEPTION
      'BLOCKED: Seed data must never be run on a production database. Current DB: %',
      current_database();
  END IF;
END;
$$;

-- ─── UUIDs for demo data ──────────────────────────────────────────────────────
-- Hard-coded so seed is idempotent and references are stable.

DO $$
DECLARE
  -- User auth IDs (normally created by Supabase Auth — we simulate here)
  uid_admin   UUID := '00000000-0000-0000-0000-000000000001';
  uid_parent  UUID := '00000000-0000-0000-0000-000000000002';
  uid_tutor1  UUID := '00000000-0000-0000-0000-000000000003';
  uid_tutor2  UUID := '00000000-0000-0000-0000-000000000004';

  -- Profile IDs
  tp1_id UUID;
  tp2_id UUID;
  pp_id  UUID;
  sp_id  UUID;
  req_id UUID;
  match_id UUID;
  enroll_id UUID;

BEGIN

  -- ── Profiles ───────────────────────────────────────────────────────────────

  INSERT INTO profiles (id, email, full_name, phone, role, is_active)
  VALUES
    (uid_admin,  'admin@demo.tutormeet.in',  'Demo Admin',        '9000000001', 'admin',  TRUE),
    (uid_parent, 'parent@demo.tutormeet.in', 'Priya Sharma',      '9000000002', 'parent', TRUE),
    (uid_tutor1, 'tutor1@demo.tutormeet.in', 'Rahul Verma',       '9000000003', 'tutor',  TRUE),
    (uid_tutor2, 'tutor2@demo.tutormeet.in', 'Ananya Krishnamurthy','9000000004','tutor', TRUE)
  ON CONFLICT (id) DO NOTHING;

  -- ── Parent profile ─────────────────────────────────────────────────────────

  INSERT INTO parent_profiles (
    user_id, city, locality, state, pincode,
    communication_preference, onboarding_complete
  ) VALUES (
    uid_parent, 'Bengaluru', 'Koramangala', 'Karnataka', '560034',
    'whatsapp', TRUE
  ) ON CONFLICT (user_id) DO NOTHING
  RETURNING id INTO pp_id;

  -- ── Student ────────────────────────────────────────────────────────────────

  INSERT INTO student_profiles (
    parent_id, full_name, current_grade, board, school_name
  ) VALUES (
    uid_parent, 'Arjun Sharma', 'Class 9', 'CBSE', 'Delhi Public School, Bengaluru'
  ) ON CONFLICT DO NOTHING
  RETURNING id INTO sp_id;

  IF sp_id IS NULL THEN
    SELECT id INTO sp_id FROM student_profiles WHERE parent_id = uid_parent LIMIT 1;
  END IF;

  -- ── Verified tutor (Rahul Verma) ───────────────────────────────────────────

  INSERT INTO tutor_profiles (
    user_id,
    verification_status,
    onboarding_step,
    onboarding_complete,
    gender,
    locality,
    city,
    state,
    pincode,
    bio,
    years_of_experience,
    subjects,
    grades,
    boards,
    teaching_mode,
    preferred_days,
    preferred_time_slots,
    expected_fee_per_hour,
    demo_class_available,
    max_travel_distance_km,
    knowledge_score,
    teaching_score,
    identity_verified,
    education_verified,
    verified_at,
    verified_by,
    average_rating,
    total_reviews,
    total_students
  ) VALUES (
    uid_tutor1,
    'verified',
    'submitted',
    TRUE,
    'male',
    'Indiranagar',
    'Bengaluru',
    'Karnataka',
    '560038',
    'Passionate Mathematics and Physics teacher with 6+ years of experience. I specialize in building strong fundamentals and helping students gain confidence in problem-solving. I have helped over 30 students improve their board exam scores significantly.',
    6,
    ARRAY['Mathematics', 'Physics'],
    ARRAY['Class 8', 'Class 9', 'Class 10', 'Class 11', 'Class 12'],
    ARRAY['CBSE', 'ICSE'],
    'Home Visit',
    ARRAY['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday'],
    ARRAY['4:00 PM – 6:00 PM', '6:00 PM – 8:00 PM'],
    600.00,
    TRUE,
    10,
    92,
    89,
    TRUE,
    TRUE,
    NOW() - INTERVAL '30 days',
    uid_admin,
    4.9,
    12,
    5
  )
  ON CONFLICT (user_id) DO NOTHING
  RETURNING id INTO tp1_id;

  IF tp1_id IS NULL THEN
    SELECT id INTO tp1_id FROM tutor_profiles WHERE user_id = uid_tutor1;
  END IF;

  -- Tutor 1 qualifications
  INSERT INTO tutor_qualifications (
    tutor_id, qualification_level, degree_name, institution,
    board_or_university, year_of_passing, percentage_or_grade,
    subject_specialisation, is_highest
  ) VALUES
    (tp1_id, 'masters', 'M.Sc Mathematics', 'IIT Bombay',
     'IIT Bombay', 2018, '8.7 CGPA', 'Pure Mathematics', TRUE),
    (tp1_id, 'bachelors', 'B.Sc Mathematics (Hons)', 'St. Stephen''s College, Delhi',
     'University of Delhi', 2016, '82%', 'Mathematics, Physics', FALSE)
  ON CONFLICT DO NOTHING;

  -- Tutor 1 experience
  INSERT INTO tutor_experience (
    tutor_id, experience_type, institution_name, role,
    start_year, is_current, subjects_taught, grades_taught
  ) VALUES
    (tp1_id, 'home_tutor', 'Self-employed', 'Home Tutor',
     2018, TRUE, ARRAY['Mathematics','Physics'], ARRAY['Class 9','Class 10','Class 11','Class 12']),
    (tp1_id, 'coaching_institute', 'FIITJEE Bengaluru', 'Faculty – Mathematics',
     2018, FALSE, ARRAY['Mathematics'], ARRAY['Class 11','Class 12'])
  ON CONFLICT DO NOTHING;

  -- Tutor 1 subjects (normalised)
  INSERT INTO tutor_subjects (tutor_id, subject, grade, board, is_verified)
  VALUES
    (tp1_id, 'Mathematics', 'Class 9',  'CBSE', TRUE),
    (tp1_id, 'Mathematics', 'Class 10', 'CBSE', TRUE),
    (tp1_id, 'Mathematics', 'Class 11', 'CBSE', TRUE),
    (tp1_id, 'Mathematics', 'Class 12', 'CBSE', TRUE),
    (tp1_id, 'Physics',     'Class 11', 'CBSE', TRUE),
    (tp1_id, 'Physics',     'Class 12', 'CBSE', TRUE),
    (tp1_id, 'Mathematics', 'Class 9',  'ICSE', TRUE),
    (tp1_id, 'Mathematics', 'Class 10', 'ICSE', TRUE)
  ON CONFLICT (tutor_id, subject, grade, board) DO NOTHING;

  -- Tutor 1 assessment
  INSERT INTO tutor_assessments (
    tutor_id, subject, status, score, max_score,
    scheduled_at, completed_at, scored_by
  ) VALUES
    (tp1_id, 'Mathematics', 'passed', 92, 100,
     NOW() - INTERVAL '35 days', NOW() - INTERVAL '34 days', uid_admin),
    (tp1_id, 'Physics', 'passed', 88, 100,
     NOW() - INTERVAL '35 days', NOW() - INTERVAL '34 days', uid_admin)
  ON CONFLICT (tutor_id, subject) DO NOTHING;

  -- Tutor 1 interview
  INSERT INTO tutor_interviews (
    tutor_id, status, scheduled_at, completed_at,
    interview_type, teaching_score, interviewer_id
  ) VALUES (
    tp1_id, 'passed',
    NOW() - INTERVAL '32 days', NOW() - INTERVAL '31 days',
    'video', 89, uid_admin
  ) ON CONFLICT DO NOTHING;

  -- ── Pending tutor (Ananya Krishnamurthy) ──────────────────────────────────

  INSERT INTO tutor_profiles (
    user_id,
    verification_status,
    onboarding_step,
    onboarding_complete,
    gender,
    locality,
    city,
    state,
    pincode,
    bio,
    years_of_experience,
    subjects,
    grades,
    boards,
    teaching_mode,
    preferred_days,
    preferred_time_slots,
    expected_fee_per_hour,
    demo_class_available,
    identity_verified,
    education_verified
  ) VALUES (
    uid_tutor2,
    'profile_submitted',
    'submitted',
    TRUE,
    'female',
    'HSR Layout',
    'Bengaluru',
    'Karnataka',
    '560102',
    'Experienced Chemistry and Biology teacher specialising in CBSE Class 11–12 and NEET preparation.',
    8,
    ARRAY['Chemistry', 'Biology'],
    ARRAY['Class 11', 'Class 12'],
    ARRAY['CBSE'],
    'Home Visit',
    ARRAY['Monday', 'Wednesday', 'Friday', 'Saturday'],
    ARRAY['2:00 PM – 4:00 PM', '4:00 PM – 6:00 PM'],
    750.00,
    TRUE,
    FALSE,
    FALSE
  ) ON CONFLICT (user_id) DO NOTHING
  RETURNING id INTO tp2_id;

  IF tp2_id IS NULL THEN
    SELECT id INTO tp2_id FROM tutor_profiles WHERE user_id = uid_tutor2;
  END IF;

  -- ── Tuition requirement ────────────────────────────────────────────────────

  INSERT INTO tuition_requirements (
    parent_id, student_id, student_name,
    subjects, grade, board,
    teaching_mode, preferred_tutor_gender,
    preferred_days, preferred_time_slots,
    sessions_per_week, session_duration_minutes,
    locality, city, pincode,
    budget_per_hour, status
  ) VALUES (
    uid_parent, sp_id, 'Arjun',
    ARRAY['Mathematics', 'Physics'], 'Class 9', 'CBSE',
    'Home Visit', 'no_preference',
    ARRAY['Monday','Wednesday','Friday'],
    ARRAY['4:00 PM – 6:00 PM', '6:00 PM – 8:00 PM'],
    3, 60,
    'Koramangala', 'Bengaluru', '560034',
    650.00, 'shortlisted'
  ) ON CONFLICT DO NOTHING
  RETURNING id INTO req_id;

  IF req_id IS NULL THEN
    SELECT id INTO req_id
    FROM tuition_requirements WHERE parent_id = uid_parent LIMIT 1;
  END IF;

  -- ── Match ──────────────────────────────────────────────────────────────────

  INSERT INTO tutor_matches (
    requirement_id, tutor_id, match_status
  ) VALUES (
    req_id, tp1_id, 'selected'
  ) ON CONFLICT (requirement_id, tutor_id) DO NOTHING
  RETURNING id INTO match_id;

  -- ── Enrollment ─────────────────────────────────────────────────────────────

  INSERT INTO enrollments (
    requirement_id, tutor_id, parent_id, student_id,
    status, agreed_fee_per_hour,
    sessions_per_week, session_duration_minutes,
    started_on
  ) VALUES (
    req_id, tp1_id, uid_parent, sp_id,
    'active', 600.00,
    3, 60,
    CURRENT_DATE - INTERVAL '14 days'
  ) ON CONFLICT (requirement_id, tutor_id) DO NOTHING
  RETURNING id INTO enroll_id;

  IF enroll_id IS NULL THEN
    SELECT id INTO enroll_id FROM enrollments
    WHERE requirement_id = req_id AND tutor_id = tp1_id;
  END IF;

  -- ── Sample attendance (last 2 weeks) ──────────────────────────────────────

  INSERT INTO attendance (
    enrollment_id, tutor_id, student_id,
    session_date, status, session_duration_minutes, marked_by
  )
  SELECT
    enroll_id, tp1_id, sp_id,
    d::DATE, 'present', 60, 'tutor'
  FROM generate_series(
    CURRENT_DATE - INTERVAL '12 days',
    CURRENT_DATE - INTERVAL '2 days',
    INTERVAL '4 days'
  ) AS d
  ON CONFLICT (enrollment_id, session_date) DO NOTHING;

  -- ── Demo class ─────────────────────────────────────────────────────────────

  IF match_id IS NOT NULL THEN
    INSERT INTO demo_classes (
      match_id, requirement_id, tutor_id, parent_id,
      scheduled_at, duration_minutes, status,
      parent_feedback, parent_rating
    ) VALUES (
      match_id, req_id, tp1_id, uid_parent,
      NOW() - INTERVAL '18 days', 60, 'completed',
      'Rahul was excellent — clear explanation, patient with questions. We chose him immediately.',
      5
    ) ON CONFLICT DO NOTHING;
  END IF;

  -- ── Review ─────────────────────────────────────────────────────────────────

  IF enroll_id IS NOT NULL THEN
    INSERT INTO reviews (
      tutor_id, parent_id, student_id, enrollment_id,
      rating, comment, is_published, published_at
    ) VALUES (
      tp1_id, uid_parent, sp_id, enroll_id,
      5,
      'Rahul has been fantastic for Arjun. He explains concepts in a way that makes them intuitive. Arjun''s confidence in Mathematics has improved significantly in just two weeks.',
      TRUE,
      NOW() - INTERVAL '5 days'
    ) ON CONFLICT (enrollment_id, parent_id) DO NOTHING;
  END IF;

END;
$$;

-- ─── Verification log for demo tutor 1 ───────────────────────────────────────

INSERT INTO tutor_verifications (tutor_id, from_status, to_status, changed_by, reason)
SELECT
  id,
  NULL,
  'draft',
  '00000000-0000-0000-0000-000000000001',
  'Demo seed: initial registration'
FROM tutor_profiles WHERE user_id = '00000000-0000-0000-0000-000000000003'
ON CONFLICT DO NOTHING;

-- ─── Completion note ──────────────────────────────────────────────────────────

DO $$
BEGIN
  RAISE NOTICE '
============================================
TutorMeet Demo Seed Data Inserted
============================================
Admin:   admin@demo.tutormeet.in
Parent:  parent@demo.tutormeet.in
Tutor 1: tutor1@demo.tutormeet.in (verified, Rahul Verma)
Tutor 2: tutor2@demo.tutormeet.in (profile_submitted, Ananya Krishnamurthy)
Password for all demo accounts: Demo@12345
--------------------------------------------
NOTE: Auth users must be created separately
in Supabase Dashboard or via Auth API.
These profile rows will be complete once the
corresponding auth.users rows exist.
============================================
';
END;
$$;
