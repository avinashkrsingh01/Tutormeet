import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { getAdminProfile } from "@/lib/admin-auth";
import { hasPermission } from "@/types/admin";
import { z } from "zod";

const matchSchema = z.object({
  requirement_id: z.string().uuid(),
  tutor_id:       z.string().uuid(),
});

export async function POST(request: Request) {
  // ── Auth: require admin with shortlist permission ──────────────────────────
  const admin = await getAdminProfile();
  if (!admin) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
  if (!hasPermission(admin.admin_role, "shortlist_tutors")) {
    return NextResponse.json({ error: "Forbidden — insufficient role" }, { status: 403 });
  }

  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON" }, { status: 400 });
  }

  const parsed = matchSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.errors[0].message }, { status: 422 });
  }

  const { requirement_id, tutor_id } = parsed.data;

  const supabase = await createClient();

  // Verify the tutor is verified before shortlisting
  const { data: tp } = await supabase
    .from("tutor_profiles")
    .select("id, verification_status")
    .eq("user_id", tutor_id)
    .single();

  if (!tp) {
    return NextResponse.json({ error: "Tutor not found." }, { status: 404 });
  }
  if (tp.verification_status !== "verified") {
    return NextResponse.json(
      { error: "Only verified tutors can be shortlisted." },
      { status: 422 }
    );
  }

  // Verify the requirement exists and belongs to a parent
  const { data: req } = await supabase
    .from("tuition_requirements")
    .select("id, status")
    .eq("id", requirement_id)
    .single();

  if (!req) {
    return NextResponse.json({ error: "Requirement not found." }, { status: 404 });
  }

  const { error } = await supabase.from("tutor_matches").insert({
    requirement_id,
    tutor_id:    tp.id,
    match_status: "suggested",
  });

  if (error) {
    if (error.code === "23505") {
      return NextResponse.json({ error: "This tutor is already shortlisted." }, { status: 409 });
    }
    return NextResponse.json({ error: "Failed to create match." }, { status: 500 });
  }

  // Advance requirement to "matching" only if still at "submitted"
  await supabase
    .from("tuition_requirements")
    .update({ status: "matching" })
    .eq("id", requirement_id)
    .eq("status", "submitted");

  // Audit log
  try {
    await supabase.from("admin_action_logs").insert({
      admin_id:    admin.id,
      action_type: "tutor_matched",
      target_id:   requirement_id,
      target_type: "requirement",
      notes:       `Tutor shortlisted for requirement`,
      metadata:    { tutor_profile_id: tp.id, requirement_id },
    });
  } catch {
    // Non-critical — log failure silently
  }

  return NextResponse.json({ success: true }, { status: 201 });
}
