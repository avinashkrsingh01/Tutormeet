// ─── User roles ───────────────────────────────────────────────────────────────

export type UserRole = "parent" | "tutor" | "admin";

// ─── Core user record (mirrors `profiles` table) ─────────────────────────────

export type UserProfile = {
  id: string; // UUID — matches auth.users.id
  email: string;
  full_name: string;
  phone: string | null;
  role: UserRole;
  avatar_url: string | null;
  is_active: boolean;
  created_at: string;
  updated_at: string;
};

// ─── Auth session enriched with role ─────────────────────────────────────────

export type AuthUser = {
  id: string;
  email: string;
  role: UserRole;
  full_name: string;
};

// ─── Registration form payloads ───────────────────────────────────────────────

export type RegisterParentPayload = {
  full_name: string;
  email: string;
  phone: string;
  password: string;
};

export type RegisterTutorPayload = {
  full_name: string;
  email: string;
  phone: string;
  password: string;
};

export type LoginPayload = {
  email: string;
  password: string;
};
