"use server";

import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import {
  loginSchema,
  registerParentSchema,
  registerTutorSchema,
} from "@/lib/validations";
import type { UserRole } from "@/types/user";

// ─────────────────────────────────────────────────────────────────────────────
// LOGIN
// ─────────────────────────────────────────────────────────────────────────────

export async function loginAction(formData: FormData) {
  const raw = {
    email:    formData.get("email")    as string,
    password: formData.get("password") as string,
  };

  const parsed = loginSchema.safeParse(raw);
  if (!parsed.success) {
    return { error: parsed.error.errors[0].message };
  }

  const supabase = await createClient();
  const { error } = await supabase.auth.signInWithPassword(parsed.data);

  if (error) {
    return { error: "Invalid email or password. Please try again." };
  }

  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return { error: "Authentication failed. Please try again." };

  // Read role from JWT metadata first (fast, no network call).
  // Fall back to DB only if the metadata is missing (legacy accounts).
  let role: UserRole = (user.user_metadata?.role as UserRole) ?? null;
  if (!role) {
    const { data: profile } = await supabase
      .from("profiles")
      .select("role")
      .eq("id", user.id)
      .single();
    role = (profile?.role as UserRole) ?? "parent";
  }

  const dashboardMap: Record<UserRole, string> = {
    parent: "/parent/dashboard",
    tutor:  "/tutor/dashboard",
    admin:  "/admin/dashboard",
  };

  // Use the redirectTo from the form only if it is a safe relative path
  const rawRedirect = formData.get("redirectTo") as string | null;
  const safeRedirect =
    rawRedirect &&
    rawRedirect.startsWith("/") &&
    !rawRedirect.startsWith("//") &&
    !rawRedirect.includes("://")
      ? rawRedirect
      : null;

  redirect(safeRedirect ?? dashboardMap[role]);
}

// ─────────────────────────────────────────────────────────────────────────────
// REGISTER PARENT
// After sign-up → redirect to /parent/onboarding to collect profile details.
// ─────────────────────────────────────────────────────────────────────────────

export async function registerParentAction(formData: FormData) {
  const raw = {
    full_name:        formData.get("full_name")        as string,
    email:            formData.get("email")            as string,
    phone:            formData.get("phone")            as string,
    password:         formData.get("password")         as string,
    confirm_password: formData.get("confirm_password") as string,
  };

  const parsed = registerParentSchema.safeParse(raw);
  if (!parsed.success) {
    return { error: parsed.error.errors[0].message };
  }

  const supabase = await createClient();
  const { error } = await supabase.auth.signUp({
    email:    parsed.data.email,
    password: parsed.data.password,
    options: {
      data: {
        full_name: parsed.data.full_name,
        phone:     parsed.data.phone,
        role:      "parent",
      },
    },
  });

  if (error) {
    if (error.message.toLowerCase().includes("already registered")) {
      return { error: "An account with this email already exists." };
    }
    return { error: error.message };
  }

  // Redirect to onboarding — not directly to dashboard
  redirect("/parent/onboarding");
}

// ─────────────────────────────────────────────────────────────────────────────
// REGISTER TUTOR
// ─────────────────────────────────────────────────────────────────────────────

export async function registerTutorAction(formData: FormData) {
  const raw = {
    full_name:        formData.get("full_name")        as string,
    email:            formData.get("email")            as string,
    phone:            formData.get("phone")            as string,
    password:         formData.get("password")         as string,
    confirm_password: formData.get("confirm_password") as string,
  };

  const parsed = registerTutorSchema.safeParse(raw);
  if (!parsed.success) {
    return { error: parsed.error.errors[0].message };
  }

  const supabase = await createClient();
  const { error } = await supabase.auth.signUp({
    email:    parsed.data.email,
    password: parsed.data.password,
    options: {
      data: {
        full_name: parsed.data.full_name,
        phone:     parsed.data.phone,
        role:      "tutor",
      },
    },
  });

  if (error) {
    if (error.message.toLowerCase().includes("already registered")) {
      return { error: "An account with this email already exists." };
    }
    return { error: error.message };
  }

  redirect("/tutor/onboarding");
}

// ─────────────────────────────────────────────────────────────────────────────
// LOGOUT
// ─────────────────────────────────────────────────────────────────────────────

export async function logoutAction() {
  const supabase = await createClient();
  await supabase.auth.signOut();
  redirect("/");
}
