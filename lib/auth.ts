/**
 * Server-side auth helpers.
 * Always call these from Server Components or Server Actions — never from client code.
 */
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import type { UserRole } from "@/types/user";

// ─── Get the current authenticated user (server) ──────────────────────────────

export async function getAuthUser() {
  const supabase = await createClient();
  const {
    data: { user },
    error,
  } = await supabase.auth.getUser();

  if (error || !user) return null;
  return user;
}

// ─── Get user profile with role ───────────────────────────────────────────────

export async function getUserProfile() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) return null;

  const { data: profile } = await supabase
    .from("profiles")
    .select("*")
    .eq("id", user.id)
    .single();

  return profile;
}

// ─── Require authentication — redirects to /login if not authenticated ────────

export async function requireAuth() {
  const user = await getAuthUser();
  if (!user) redirect("/login");
  return user;
}

// ─── Require a specific role — redirects to /unauthorized if role mismatch ───

export async function requireRole(role: UserRole) {
  const profile = await getUserProfile();

  if (!profile) redirect("/login");
  if (profile.role !== role) redirect("/unauthorized");

  return profile;
}

// ─── Require any of the given roles ──────────────────────────────────────────

export async function requireAnyRole(roles: UserRole[]) {
  const profile = await getUserProfile();

  if (!profile) redirect("/login");
  if (!roles.includes(profile.role)) redirect("/unauthorized");

  return profile;
}
