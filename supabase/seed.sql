-- ============================================================
-- TutorMeet — Seed Data (Development only)
-- Creates a default admin user + test data.
-- ============================================================

-- NOTE: The admin user must first be created via Supabase Auth
-- (Dashboard → Authentication → Users → Invite user)
-- then update their role here.

-- Update an existing user to admin role (replace the UUID)
-- UPDATE profiles SET role = 'admin' WHERE email = 'admin@tutormeet.in';

-- ─── Example: seed city data for initial launch ───────────────────────────────
-- TutorMeet launches in one city. Update constants.ts with the launch city.
-- No additional seed tables needed for MVP — all data comes from user registration.

SELECT 'Seed file ready. Create admin user via Supabase Dashboard first.' AS info;
