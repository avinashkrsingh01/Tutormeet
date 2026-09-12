/**
 * Admin authentication helpers.
 * Fetches the admin's sub-role and checks permissions server-side.
 * Use in Server Components and Server Actions.
 */
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import type { AdminRole, AdminPermission, AdminProfile } from "@/types/admin";
import { hasPermission, ROLE_PERMISSIONS } from "@/types/admin";

export type { AdminRole, AdminPermission };

// ─── Get current admin profile + role ────────────────────────────────────────

export async function getAdminProfile(): Promise<AdminProfile | null> {
  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return null;

  const { data: profile } = await supabase
    .from("profiles")
    .select("id, full_name, email, avatar_url, role")
    .eq("id", user.id)
    .single();

  if (!profile || profile.role !== "admin") return null;

  // Fetch sub-role from admin_profiles
  const { data: adminProfile } = await supabase
    .from("admin_profiles")
    .select("admin_role")
    .eq("user_id", user.id)
    .maybeSingle();

  // Default to super_admin for legacy admins without a sub-role row
  const adminRole: AdminRole = (adminProfile?.admin_role as AdminRole) ?? "super_admin";

  return {
    id:         profile.id,
    full_name:  profile.full_name,
    email:      profile.email,
    avatar_url: profile.avatar_url,
    role:       "admin",
    admin_role: adminRole,
  };
}

// ─── Require admin + specific permission (use in page Server Components) ──────

export async function requireAdminPermission(
  permission: AdminPermission
): Promise<AdminProfile> {
  const admin = await getAdminProfile();

  if (!admin) redirect("/login");

  if (!hasPermission(admin.admin_role, permission)) {
    redirect("/admin/unauthorized");
  }

  return admin;
}

// ─── Require admin (any role) ─────────────────────────────────────────────────

export async function requireAdmin(): Promise<AdminProfile> {
  const admin = await getAdminProfile();
  if (!admin) redirect("/login");
  return admin;
}

// ─── Check permission without redirecting ────────────────────────────────────

export function can(role: AdminRole, permission: AdminPermission): boolean {
  return hasPermission(role, permission);
}

// ─── Get all permissions for a role ──────────────────────────────────────────

export function getPermissions(role: AdminRole): AdminPermission[] {
  return ROLE_PERMISSIONS[role] ?? [];
}
