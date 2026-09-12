-- ============================================================
-- Migration 013: Fix handle_new_user trigger and grants
-- ============================================================

-- Ensure grants for auth admin and service roles
GRANT USAGE ON SCHEMA public TO postgres, anon, authenticated, service_role, supabase_auth_admin;
GRANT ALL ON ALL TABLES IN SCHEMA public TO postgres, service_role, supabase_auth_admin;
GRANT ALL ON ALL SEQUENCES IN SCHEMA public TO postgres, service_role, supabase_auth_admin;
GRANT ALL ON ALL ROUTINES IN SCHEMA public TO postgres, service_role, supabase_auth_admin;

CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
DECLARE
  v_role public.user_role := 'parent'::public.user_role;
  v_full_name TEXT := '';
  v_phone TEXT := NULL;
  raw_role TEXT;
BEGIN
  -- Extract metadata safely
  IF NEW.raw_user_meta_data IS NOT NULL THEN
    v_full_name := COALESCE(NEW.raw_user_meta_data->>'full_name', '');
    v_phone     := COALESCE(NEW.raw_user_meta_data->>'phone', NULL);
    raw_role    := NEW.raw_user_meta_data->>'role';

    IF raw_role = 'tutor' THEN
      v_role := 'tutor'::public.user_role;
    ELSIF raw_role = 'admin' THEN
      v_role := 'admin'::public.user_role;
    ELSE
      v_role := 'parent'::public.user_role;
    END IF;
  END IF;

  -- 1. Insert into public.profiles
  INSERT INTO public.profiles (id, email, full_name, phone, role)
  VALUES (
    NEW.id,
    COALESCE(NEW.email, ''),
    v_full_name,
    v_phone,
    v_role
  )
  ON CONFLICT (id) DO UPDATE SET
    email = EXCLUDED.email,
    full_name = EXCLUDED.full_name,
    phone = EXCLUDED.phone,
    role = EXCLUDED.role;

  -- 2. Insert into role-specific profile table
  IF v_role = 'tutor'::public.user_role THEN
    INSERT INTO public.tutor_profiles (user_id)
    VALUES (NEW.id)
    ON CONFLICT (user_id) DO NOTHING;
  ELSIF v_role = 'parent'::public.user_role THEN
    INSERT INTO public.parent_profiles (user_id)
    VALUES (NEW.id)
    ON CONFLICT (user_id) DO NOTHING;
  END IF;

  RETURN NEW;
EXCEPTION WHEN OTHERS THEN
  -- Log warning so signup NEVER crashes due to trigger error
  RAISE WARNING 'handle_new_user exception: % %', SQLERRM, SQLSTATE;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public, pg_temp;

-- Ensure trigger is registered properly
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();
