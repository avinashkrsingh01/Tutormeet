"use server";

import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { z } from "zod";

// ─────────────────────────────────────────────────────────────────────────────
// REQUEST DEMO (parent → triggers admin notification)
// ─────────────────────────────────────────────────────────────────────────────

const demoRequestSchema = z.object({
  tutor_user_id:  z.string().uuid(),
  requirement_id: z.string().uuid().optional(),
  message:        z.string().max(500).optional(),
});

export type DemoRequestResult =
  | { success: true;  demoId?: string; redirectTo: string }
  | { success: false; error: string; requiresLogin?: boolean };

export async function requestDemoAction(
  tutorUserId:   string,
  requirementId?: string,
  message?:       string
): Promise<DemoRequestResult> {
  const parsed = demoRequestSchema.safeParse({
    tutor_user_id:  tutorUserId,
    requirement_id: requirementId,
    message,
  });
  if (!parsed.success) {
    return { success: false, error: parsed.error.errors[0].message };
  }

  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return { success: false, error: "Please create a parent account to request a demo class.", requiresLogin: true };
  }

  const { data: profile } = await supabase
    .from("profiles")
    .select("role, full_name")
    .eq("id", user.id)
    .single();

  if (!profile || profile.role !== "parent") {
    return { success: false, error: "Only parents can request demo classes." };
  }

  const { data: tp } = await supabase
    .from("tutor_profiles")
    .select("id")
    .eq("user_id", parsed.data.tutor_user_id)
    .eq("verification_status", "verified")
    .single();

  if (!tp) {
    return { success: false, error: "Tutor not found or not currently verified." };
  }

  // Resolve requirement — use provided or find latest open
  let resolvedReqId = parsed.data.requirement_id ?? null;
  if (!resolvedReqId) {
    const { data: req } = await supabase
      .from("tuition_requirements")
      .select("id")
      .eq("parent_id", user.id)
      .in("status", ["shortlisted","matching","submitted"])
      .order("created_at", { ascending: false })
      .limit(1)
      .single();
    resolvedReqId = req?.id ?? null;
  }

  if (!resolvedReqId) {
    return { success: false, error: "No active requirement found. Please post a requirement first." };
  }

  // Find the match row (if exists)
  const { data: matchRow } = await supabase
    .from("tutor_matches")
    .select("id")
    .eq("requirement_id", resolvedReqId)
    .eq("tutor_id", tp.id)
    .maybeSingle();

  // Get student for this requirement
  const { data: req } = await supabase
    .from("tuition_requirements")
    .select("student_id, student_name, grade")
    .eq("id", resolvedReqId)
    .single();

  // Create demo_classes row with status "requested"
  const { data: demo, error: demoError } = await supabase
    .from("demo_classes")
    .insert({
      match_id:        matchRow?.id ?? null,
      requirement_id:  resolvedReqId,
      tutor_id:        tp.id,
      parent_id:       user.id,
      student_id:      req?.student_id ?? null,
      student_name:    req?.student_name ?? null,
      status:          "requested",
      duration_minutes: 60,
    })
    .select("id")
    .single();

  if (demoError || !demo) {
    console.error("Demo insert error:", demoError);
    return { success: false, error: "Could not create demo request. Please try again." };
  }

  // Update match status if match exists
  if (matchRow?.id) {
    await supabase
      .from("tutor_matches")
      .update({ match_status: "demo_requested" })
      .eq("id", matchRow.id);
  }

  // Notify parent
  await supabase.from("notifications").insert({
    user_id:     user.id,
    channel:     "in_app",
    title:       "Demo class requested",
    body:        "Your demo class request has been received. TutorMeet will confirm the schedule within 24 hours.",
    action_url:  `/parent/demos/${demo.id}`,
    entity_type: "demo_class",
    entity_id:   demo.id,
  });

  return {
    success:    true,
    demoId:     demo.id,
    redirectTo: `/parent/demos/${demo.id}`,
  };
}

// ─────────────────────────────────────────────────────────────────────────────
// SUBMIT DEMO FEEDBACK (parent post-demo)
// ─────────────────────────────────────────────────────────────────────────────

const feedbackSchema = z.object({
  demo_id:                z.string().uuid(),
  rating:                 z.number().int().min(1).max(5),
  was_tutor_punctual:     z.boolean(),
  was_explanation_clear:  z.boolean(),
  wants_to_continue:      z.boolean(),
  comment:                z.string().max(500).optional(),
});

export type FeedbackResult =
  | { success: true;  wants_to_continue: boolean; demo_id: string }
  | { success: false; error: string };

export async function submitDemoFeedbackAction(
  data: z.infer<typeof feedbackSchema>
): Promise<FeedbackResult> {
  const parsed = feedbackSchema.safeParse(data);
  if (!parsed.success) {
    return { success: false, error: parsed.error.errors[0].message };
  }

  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return { success: false, error: "Session expired." };

  const { data: profileCheck } = await supabase
    .from("profiles")
    .select("role")
    .eq("id", user.id)
    .single();

  if (!profileCheck || profileCheck.role !== "parent") {
    return { success: false, error: "Unauthorized access." };
  }

  // Verify this demo belongs to this parent
  const { data: demo } = await supabase
    .from("demo_classes")
    .select("id, match_id, requirement_id, tutor_id, status")
    .eq("id", parsed.data.demo_id)
    .eq("parent_id", user.id)
    .single();

  if (!demo) return { success: false, error: "Demo not found." };
  if (demo.status !== "completed") {
    return { success: false, error: "Feedback can only be submitted for completed demos." };
  }

  const { error } = await supabase
    .from("demo_classes")
    .update({
      parent_rating:            parsed.data.rating,
      parent_feedback:          parsed.data.comment ?? null,
      was_tutor_punctual:       parsed.data.was_tutor_punctual,
      was_explanation_clear:    parsed.data.was_explanation_clear,
      wants_to_continue:        parsed.data.wants_to_continue,
    })
    .eq("id", parsed.data.demo_id);

  if (error) {
    console.error("Feedback update error:", error);
    return { success: false, error: "Could not save feedback. Please try again." };
  }

  // Update match status
  if (demo.match_id) {
    await supabase
      .from("tutor_matches")
      .update({
        match_status: parsed.data.wants_to_continue ? "selected" : "demo_completed",
      })
      .eq("id", demo.match_id);
  }

  return {
    success:          true,
    wants_to_continue: parsed.data.wants_to_continue,
    demo_id:          parsed.data.demo_id,
  };
}

// ─────────────────────────────────────────────────────────────────────────────
// CREATE ENROLLMENT (parent confirms tutor)
// ─────────────────────────────────────────────────────────────────────────────

const enrollmentSchema = z.object({
  demo_id:              z.string().uuid(),
  agreed_fee_per_hour:  z.number().min(0),
});

export type EnrollmentResult =
  | { success: true;  enrollment_id: string }
  | { success: false; error: string };

export async function createEnrollmentAction(
  data: z.infer<typeof enrollmentSchema>
): Promise<EnrollmentResult> {
  const parsed = enrollmentSchema.safeParse(data);
  if (!parsed.success) {
    return { success: false, error: parsed.error.errors[0].message };
  }

  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return { success: false, error: "Session expired." };

  const { data: profileCheck } = await supabase
    .from("profiles")
    .select("role")
    .eq("id", user.id)
    .single();

  if (!profileCheck || profileCheck.role !== "parent") {
    return { success: false, error: "Unauthorized access." };
  }

  // Fetch demo details
  const { data: demo } = await supabase
    .from("demo_classes")
    .select("id, requirement_id, tutor_id, student_id, match_id, wants_to_continue")
    .eq("id", parsed.data.demo_id)
    .eq("parent_id", user.id)
    .single();

  if (!demo) return { success: false, error: "Demo not found." };
  if (!demo.wants_to_continue) {
    return { success: false, error: "Enrollment can only be created when parent chose to continue." };
  }

  // Fetch requirement for session details
  const { data: req } = await supabase
    .from("tuition_requirements")
    .select("sessions_per_week, session_duration_minutes")
    .eq("id", demo.requirement_id)
    .single();

  // Create enrollment
  const { data: enrollment, error: enrollError } = await supabase
    .from("enrollments")
    .insert({
      requirement_id:          demo.requirement_id,
      demo_class_id:           demo.id,
      tutor_id:                demo.tutor_id,
      parent_id:               user.id,
      student_id:              demo.student_id,
      agreed_fee_per_hour:     parsed.data.agreed_fee_per_hour,
      sessions_per_week:       req?.sessions_per_week       ?? 3,
      session_duration_minutes: req?.session_duration_minutes ?? 60,
      started_on:              new Date().toISOString().split("T")[0],
      status:                  "active",
    })
    .select("id")
    .single();

  if (enrollError || !enrollment) {
    // Unique conflict = already enrolled
    if (enrollError?.code === "23505") {
      return { success: false, error: "An enrollment already exists for this requirement and tutor." };
    }
    console.error("Enrollment error:", enrollError);
    return { success: false, error: "Could not create enrollment. Please try again." };
  }

  // Advance requirement status to tutor_selected → active
  await supabase
    .from("tuition_requirements")
    .update({ status: "active" })
    .eq("id", demo.requirement_id);

  // Update match to selected
  if (demo.match_id) {
    await supabase
      .from("tutor_matches")
      .update({ match_status: "selected" })
      .eq("id", demo.match_id);
  }

  // Notify parent
  await supabase.from("notifications").insert({
    user_id:     user.id,
    channel:     "in_app",
    title:       "Tuition started",
    body:        "Your enrollment has been confirmed. You can now track attendance and sessions.",
    action_url:  "/parent/attendance",
    entity_type: "enrollment",
    entity_id:   enrollment.id,
  });

  return { success: true, enrollment_id: enrollment.id };
}
