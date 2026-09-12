import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { z } from "zod";
import { getAdminProfile } from "@/lib/admin-auth";
import { hasPermission } from "@/types/admin";

const verifySchema = z.object({
  verification_status: z.enum([
    "draft","pending","profile_submitted","documents_pending",
    "under_review","assessment_pending","interview_pending",
    "verified","rejected","suspended",
  ]),
  admin_notes:       z.string().optional(),
  identity_verified: z.boolean().optional(),
  education_verified: z.boolean().optional(),
  action_type:       z.string().optional(), // approve | reject | info_request | suspend | save_notes
});

interface RouteParams { params: Promise<{ id: string }> }

export async function PATCH(request: Request, { params }: RouteParams) {
  const { id } = await params;

  // ── Auth + role check ───────────────────────────────────────────────────────
  const admin = await getAdminProfile();
  if (!admin) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  // Base: must be able to verify tutors
  if (!hasPermission(admin.admin_role, "verify_tutors")) {
    return NextResponse.json({ error: "Forbidden — insufficient role" }, { status: 403 });
  }

  // Parse body
  let body: unknown;
  try { body = await request.json(); }
  catch { return NextResponse.json({ error: "Invalid JSON" }, { status: 400 }); }

  const parsed = verifySchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.errors[0].message }, { status: 422 });
  }

  const {
    verification_status,
    admin_notes,
    identity_verified,
    education_verified,
    action_type,
  } = parsed.data;

  // Suspend requires extra permission
  if (
    verification_status === "suspended" &&
    !hasPermission(admin.admin_role, "suspend_tutors")
  ) {
    return NextResponse.json(
      { error: "You don't have permission to suspend tutors." },
      { status: 403 }
    );
  }

  // ── Use service-role client to bypass RLS ────────────────────────────────────
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const adminDb = createAdminClient() as any;

  const updateFields: Record<string, unknown> = {
    verification_status,
    admin_notes: admin_notes ?? null,
  };
  if (identity_verified  !== undefined) updateFields.identity_verified  = identity_verified;
  if (education_verified !== undefined) updateFields.education_verified = education_verified;
  if (verification_status === "verified") {
    updateFields.verified_at = new Date().toISOString();
    updateFields.verified_by = admin.id;
  }

  const { error: updateError } = await adminDb
    .from("tutor_profiles")
    .update(updateFields)
    .eq("id", id);

  if (updateError) {
    console.error("[verify PATCH] update error:", updateError);
    return NextResponse.json({ error: "Update failed." }, { status: 500 });
  }

  // ── Determine canonical action type for audit log ─────────────────────────
  const canonicalAction =
    verification_status === "verified"          ? "tutor_approved"
    : verification_status === "rejected"        ? "tutor_rejected"
    : verification_status === "suspended"       ? "tutor_suspended"
    : verification_status === "documents_pending" ? "info_requested"
    : action_type === "save_notes"              ? "info_requested"
    :                                             "info_requested";

  // ── Audit log (try both old and new table names) ──────────────────────────
  await adminDb.from("admin_action_logs").insert([{
    admin_id:    admin.id,
    action_type: canonicalAction,
    target_id:   id,
    target_type: "tutor",
    notes:       admin_notes ?? null,
    metadata:    { verification_status, identity_verified, education_verified },
  }]).catch(() => {/* ignore if table doesn't exist */});

  return NextResponse.json({ success: true });
}
