-- ============================================================
-- TutorMeet — Admin Role System
-- Run AFTER 006_matching_engine.sql
-- ============================================================

-- ─── Admin sub-roles ──────────────────────────────────────────────────────────

CREATE TYPE admin_role AS ENUM (
  'super_admin',
  'verification_admin',
  'operations_admin',
  'support_admin'
);

-- ─── Admin profiles table ─────────────────────────────────────────────────────
-- Extends the profiles table for users with role='admin'.

CREATE TABLE IF NOT EXISTS admin_profiles (
  id          UUID        PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id     UUID        NOT NULL UNIQUE REFERENCES profiles(id) ON DELETE CASCADE,
  admin_role  admin_role  NOT NULL DEFAULT 'support_admin',
  department  TEXT,
  can_view_documents BOOLEAN NOT NULL DEFAULT FALSE,
  can_view_pii       BOOLEAN NOT NULL DEFAULT FALSE,
  created_at  TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at  TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Set document/PII access based on role via trigger
CREATE OR REPLACE FUNCTION fn_set_admin_permissions()
RETURNS TRIGGER LANGUAGE plpgsql AS $$
BEGIN
  NEW.can_view_documents := NEW.admin_role IN ('super_admin', 'verification_admin');
  NEW.can_view_pii       := NEW.admin_role IN ('super_admin', 'operations_admin');
  RETURN NEW;
END;
$$;

CREATE TRIGGER trg_admin_permissions
  BEFORE INSERT OR UPDATE OF admin_role ON admin_profiles
  FOR EACH ROW EXECUTE FUNCTION fn_set_admin_permissions();

-- RLS
ALTER TABLE admin_profiles ENABLE ROW LEVEL SECURITY;

CREATE POLICY "admin_profiles_self"
  ON admin_profiles FOR SELECT
  USING (user_id = auth.uid() OR is_admin());

CREATE POLICY "admin_profiles_super_update"
  ON admin_profiles FOR ALL
  USING (is_admin())
  WITH CHECK (is_admin());

-- ─── Extend admin_action_logs with metadata column ────────────────────────────
-- (if using the old table from 001; schema/010 already has admin_actions)

ALTER TABLE admin_action_logs
  ADD COLUMN IF NOT EXISTS metadata JSONB DEFAULT '{}';

-- ─── Index ────────────────────────────────────────────────────────────────────

CREATE INDEX IF NOT EXISTS idx_admin_profiles_role
  ON admin_profiles(admin_role);

CREATE INDEX IF NOT EXISTS idx_admin_profiles_user
  ON admin_profiles(user_id);

-- ─── Helper function: get current admin role ──────────────────────────────────

CREATE OR REPLACE FUNCTION get_admin_role()
RETURNS admin_role LANGUAGE sql SECURITY DEFINER STABLE AS $$
  SELECT ap.admin_role
  FROM admin_profiles ap
  WHERE ap.user_id = auth.uid()
  LIMIT 1;
$$;

-- ─── Helper: can current admin view documents ─────────────────────────────────

CREATE OR REPLACE FUNCTION admin_can_view_documents()
RETURNS BOOLEAN LANGUAGE sql SECURITY DEFINER STABLE AS $$
  SELECT COALESCE(
    (SELECT can_view_documents FROM admin_profiles WHERE user_id = auth.uid()),
    FALSE
  );
$$;

-- ─── Update tutor_documents RLS to respect admin sub-roles ───────────────────

DROP POLICY IF EXISTS "tutor_documents_admin" ON tutor_documents;

CREATE POLICY "tutor_documents_admin_restricted"
  ON tutor_documents FOR ALL
  USING (
    -- Only admins with can_view_documents = true can read sensitive docs
    (is_admin() AND admin_can_view_documents())
    OR tutor_id IN (SELECT id FROM tutor_profiles WHERE user_id = auth.uid())  -- own docs always accessible
  )
  WITH CHECK (
    is_admin() AND admin_can_view_documents()
  );
