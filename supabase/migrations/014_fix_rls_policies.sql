-- ============================================================
-- Migration 014: Fix missing RLS INSERT policies
-- The onboarding upsert was failing because parent_profiles
-- and tutor_profiles had no INSERT policy for authenticated users.
-- The trigger (SECURITY DEFINER) creates the initial row, but the
-- onboarding form action runs as the authenticated user and needs
-- INSERT rights for the upsert ON CONFLICT path.
-- ============================================================

-- Allow a parent to insert their own parent_profiles row
-- (needed by upsert in completeParentProfileAction)
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies
    WHERE tablename = 'parent_profiles' AND policyname = 'parent_profiles_insert'
  ) THEN
    CREATE POLICY "parent_profiles_insert"
      ON parent_profiles FOR INSERT
      WITH CHECK (user_id = auth.uid());
  END IF;
END;
$$;

-- Allow a tutor to insert their own tutor_profiles row
-- (needed by upsert in tutor onboarding actions)
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies
    WHERE tablename = 'tutor_profiles' AND policyname = 'tutor_profiles_insert'
  ) THEN
    CREATE POLICY "tutor_profiles_insert"
      ON tutor_profiles FOR INSERT
      WITH CHECK (user_id = auth.uid());
  END IF;
END;
$$;

-- Also ensure the UPDATE policy for parent_profiles has a WITH CHECK clause
-- (some Postgres versions require it for the upsert to succeed cleanly)
DROP POLICY IF EXISTS "parent_profiles_update" ON parent_profiles;
CREATE POLICY "parent_profiles_update"
  ON parent_profiles FOR UPDATE
  USING  (user_id = auth.uid() OR is_admin())
  WITH CHECK (user_id = auth.uid() OR is_admin());

-- Same for tutor_profiles update
DROP POLICY IF EXISTS "tutor_profiles_update" ON tutor_profiles;
CREATE POLICY "tutor_profiles_update"
  ON tutor_profiles FOR UPDATE
  USING  (user_id = auth.uid() OR is_admin())
  WITH CHECK (user_id = auth.uid() OR is_admin());
