"use server";

import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { z } from "zod";
import type { ReportCategory, ReportTargetType } from "@/types/safety";

// ─── Submit safety report ─────────────────────────────────────────────────────

const reportSchema = z.object({
  target_type:    z.enum(["tutor", "parent", "incident"]),
  target_user_id: z.string().uuid().optional(),
  category:       z.enum([
    "inappropriate_behaviour", "unprofessional_conduct", "no_show",
    "abusive_language", "privacy_concern", "fraud_misrepresentation",
    "payment_dispute", "abusive_language_parent", "false_information",
    "child_safety_concern", "harassment", "unsafe_environment", "other",
  ]),
  description: z
    .string()
    .min(20,   "Please provide more detail (minimum 20 characters).")
    .max(2000, "Description is too long (maximum 2000 characters)."),
});

export type SafetyReportResult =
  | { success: true;  reportId: string; isUrgent: boolean }
  | { success: false; error: string };

export async function submitSafetyReportAction(
  data: z.infer<typeof reportSchema>
): Promise<SafetyReportResult> {
  const parsed = reportSchema.safeParse(data);
  if (!parsed.success) {
    return { success: false, error: parsed.error.errors[0].message };
  }

  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return { success: false, error: "You must be signed in to submit a report." };

  // Anti-self-report
  if (parsed.data.target_user_id && parsed.data.target_user_id === user.id) {
    return { success: false, error: "You cannot report yourself." };
  }

  // Verify target user exists (if provided)
  if (parsed.data.target_user_id) {
    const { data: targetProfile } = await supabase
      .from("profiles")
      .select("id, is_active")
      .eq("id", parsed.data.target_user_id)
      .single();
    if (!targetProfile) {
      return { success: false, error: "The user you are reporting could not be found." };
    }
  }

  const isUrgent = parsed.data.category === "child_safety_concern";

  const { data: report, error } = await supabase
    .from("safety_reports")
    .insert({
      reporter_id:    user.id,
      target_type:    parsed.data.target_type,
      target_user_id: parsed.data.target_user_id ?? null,
      category:       parsed.data.category,
      description:    parsed.data.description,
      is_urgent:      isUrgent,
      status:         "submitted",
    })
    .select("id, is_urgent")
    .single();

  if (error) {
    // Unique constraint = duplicate report within 24h
    if (error.code === "23505") {
      return {
        success: false,
        error:   "You have already submitted a report for this user and category. Our team is reviewing it.",
      };
    }
    console.error("Safety report error:", error);
    return { success: false, error: "Could not submit report. Please try again." };
  }

  // Notify admins for urgent reports
  if (isUrgent) {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const adminDb = createAdminClient() as any;
    await adminDb.from("admin_action_logs").insert([{
      admin_id:    user.id,  // logged as from the reporter
      action_type: "user_suspended",
      target_id:   report.id,
      target_type: parsed.data.target_type === "tutor" ? "tutor" : "parent",
      notes:       `URGENT safety report filed: ${parsed.data.category}`,
      metadata:    { report_id: report.id, category: parsed.data.category, is_urgent: true },
    }]).catch(() => {});
  }

  return { success: true, reportId: report.id, isUrgent: report.is_urgent };
}

// ─── Admin: suspend user ──────────────────────────────────────────────────────

const suspendSchema = z.object({
  user_id: z.string().uuid(),
  reason:  z.string().min(10).max(500),
});

export type SuspendResult =
  | { success: true }
  | { success: false; error: string };

export async function suspendUserAction(
  userId: string,
  reason: string
): Promise<SuspendResult> {
  const parsed = suspendSchema.safeParse({ user_id: userId, reason });
  if (!parsed.success) {
    return { success: false, error: parsed.error.errors[0].message };
  }

  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return { success: false, error: "Unauthorized." };

  const { data: adminProfile } = await supabase
    .from("profiles").select("role").eq("id", user.id).single();
  if (!adminProfile || adminProfile.role !== "admin") {
    return { success: false, error: "Only admins can suspend users." };
  }

  // Cannot suspend another admin
  const { data: targetProfile } = await supabase
    .from("profiles").select("role").eq("id", parsed.data.user_id).single();
  if (!targetProfile) return { success: false, error: "User not found." };
  if (targetProfile.role === "admin") {
    return { success: false, error: "Admin accounts cannot be suspended this way." };
  }

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const adminDb = createAdminClient() as any;

  // Suspend the account
  const { error: suspendError } = await adminDb
    .from("profiles")
    .update({
      is_active:        false,
      suspended_at:     new Date().toISOString(),
      suspended_reason: parsed.data.reason,
      suspended_by:     user.id,
    })
    .eq("id", parsed.data.user_id);

  if (suspendError) {
    console.error("Suspend error:", suspendError);
    return { success: false, error: "Could not suspend user." };
  }

  // If tutor — also update verification_status to suspended
  if (targetProfile.role === "tutor") {
    await adminDb
      .from("tutor_profiles")
      .update({ verification_status: "suspended" })
      .eq("user_id", parsed.data.user_id);
  }

  // Audit log
  await adminDb.from("admin_action_logs").insert([{
    admin_id:    user.id,
    action_type: "user_suspended",
    target_id:   parsed.data.user_id,
    target_type: targetProfile.role === "tutor" ? "tutor" : "parent",
    notes:       parsed.data.reason,
  }]).catch(() => {});

  return { success: true };
}

// ─── Admin: reinstate user ────────────────────────────────────────────────────

export async function reinstateUserAction(
  userId: string,
  notes?: string
): Promise<SuspendResult> {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return { success: false, error: "Unauthorized." };

  const { data: adminProfile } = await supabase
    .from("profiles").select("role").eq("id", user.id).single();
  if (!adminProfile || adminProfile.role !== "admin") {
    return { success: false, error: "Only admins can reinstate users." };
  }

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const adminDb = createAdminClient() as any;

  // Look up the target user's role for proper audit logging
  const { data: targetProfile } = await supabase
    .from("profiles").select("role").eq("id", userId).single();
  if (!targetProfile) return { success: false, error: "User not found." };

  const { error } = await adminDb
    .from("profiles")
    .update({
      is_active:        true,
      suspended_at:     null,
      suspended_reason: null,
      suspended_by:     null,
    })
    .eq("id", userId);

  if (error) return { success: false, error: "Could not reinstate user." };

  // If tutor — also restore verification_status
  if (targetProfile.role === "tutor") {
    await adminDb
      .from("tutor_profiles")
      .update({ verification_status: "verified" })
      .eq("user_id", userId);
  }

  // Audit
  await adminDb.from("admin_action_logs").insert([{
    admin_id:    user.id,
    action_type: "user_reinstated",
    target_id:   userId,
    target_type: targetProfile.role === "tutor" ? "tutor" : "parent",
    notes:       notes ?? "Account reinstated.",
  }]).catch(() => {});

  return { success: true };
}
