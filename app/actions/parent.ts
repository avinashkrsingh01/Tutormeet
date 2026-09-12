"use server";

import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import {
  parentProfileSchema,
  requirementSchema,
  type ParentProfileInput,
  type RequirementInput,
} from "@/lib/validations";

// ─────────────────────────────────────────────────────────────────────────────
// COMPLETE PARENT PROFILE (onboarding step)
// Updates profiles + parent_profiles, marks onboarding_complete = true,
// then redirects to the requirement wizard.
// ─────────────────────────────────────────────────────────────────────────────

export async function completeParentProfileAction(
  formData: FormData
): Promise<{ error: string } | void> {
  const raw: ParentProfileInput = {
    full_name:                formData.get("full_name")                as string,
    phone:                    formData.get("phone")                    as string,
    city:                     formData.get("city")                     as string,
    locality:                 formData.get("locality")                 as string,
    communication_preference: formData.get(
      "communication_preference"
    ) as ParentProfileInput["communication_preference"],
  };

  const parsed = parentProfileSchema.safeParse(raw);
  if (!parsed.success) {
    return { error: parsed.error.errors[0].message };
  }

  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) return { error: "Session expired. Please log in again." };

  const { data: profileCheck } = await supabase
    .from("profiles")
    .select("role")
    .eq("id", user.id)
    .single();

  if (!profileCheck || profileCheck.role !== "parent") {
    return { error: "Unauthorized access." };
  }

  // 1 — Update the shared profile row (name + phone may have changed)
  const { error: profileError } = await supabase
    .from("profiles")
    .update({
      full_name: parsed.data.full_name,
      phone:     parsed.data.phone,
    })
    .eq("id", user.id);

  if (profileError) {
    console.error("Profile update error:", profileError);
    return { error: "Could not save your profile. Please try again." };
  }

  // 2 — Upsert parent_profiles row
  const { error: parentError } = await supabase
    .from("parent_profiles")
    .upsert(
      {
        user_id:                  user.id,
        city:                     parsed.data.city,
        locality:                 parsed.data.locality,
        communication_preference: parsed.data.communication_preference,
        onboarding_complete:      true,
      },
      { onConflict: "user_id" }
    );

  if (parentError) {
    console.error("Parent profile upsert error:", parentError);
    return { error: "Could not save your details. Please try again." };
  }

  // 3 — Send to requirement wizard
  redirect("/parent/requirements/new?onboarding=1");
}

// ─────────────────────────────────────────────────────────────────────────────
// POST TUITION REQUIREMENT
// Creates a student row inline (from student_name) then inserts the requirement.
// Returns the new requirement id for the confirmation screen.
// ─────────────────────────────────────────────────────────────────────────────

export async function postRequirementAction(
  data: RequirementInput
): Promise<{ error: string } | { id: string }> {
  // Server-side schema validation
  const parsed = requirementSchema.safeParse(data);
  if (!parsed.success) {
    return { error: parsed.error.errors[0].message };
  }

  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) return { error: "Session expired. Please log in again." };

  // Role check
  const { data: profile } = await supabase
    .from("profiles")
    .select("role")
    .eq("id", user.id)
    .single();

  if (!profile || profile.role !== "parent") {
    return { error: "Only parents can post tuition requirements." };
  }

  const {
    student_name,
    student_class,
    board,
    subjects,
    learning_goals,
    preferred_tutor_gender,
    teaching_mode,
    preferred_days,
    preferred_time_slots,
    sessions_per_week,
    session_duration_minutes,
    locality,
    pincode,
    city,
    budget_per_hour,
    special_requirements,
  } = parsed.data;

  // 1 — Create (or re-use) the student row
  //     We look for an existing student with the same name under this parent first.
  let studentId: string;

  const { data: existingStudent } = await supabase
    .from("students")
    .select("id")
    .eq("parent_id", user.id)
    .ilike("full_name", student_name.trim())
    .maybeSingle();

  if (existingStudent) {
    studentId = existingStudent.id;
  } else {
    const { data: newStudent, error: studentError } = await supabase
      .from("students")
      .insert({
        parent_id:     user.id,
        full_name:     student_name.trim(),
        current_grade: student_class,
      })
      .select("id")
      .single();

    if (studentError || !newStudent) {
      console.error("Student insert error:", studentError);
      return { error: "Could not save student details. Please try again." };
    }

    studentId = newStudent.id;
  }

  // 2 — Insert the requirement
  const { data: requirement, error: reqError } = await supabase
    .from("tuition_requirements")
    .insert({
      parent_id:                user.id,
      student_id:               studentId,
      student_name:             student_name.trim(),
      grade:                    student_class,
      board,
      subjects,
      learning_goals:           learning_goals ?? null,
      preferred_tutor_gender,
      teaching_mode,
      preferred_days,
      preferred_time_slots,
      sessions_per_week,
      session_duration_minutes,
      locality,
      pincode,
      city,
      budget_per_hour:          budget_per_hour ?? null,
      special_requirements:     special_requirements ?? null,
      status:                   "submitted",
    })
    .select("id")
    .single();

  if (reqError || !requirement) {
    console.error("Requirement insert error:", reqError);
    return { error: "Could not post your requirement. Please try again." };
  }

  return { id: requirement.id };
}
