"use server";

import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import {
  tutorBasicProfileSchema,
  tutorEducationSchema,
  tutorExperienceSchema,
  tutorPreferencesSchema,
  type TutorBasicProfileInput,
  type TutorEducationInput,
  type TutorExperienceInput,
  type TutorPreferencesInput,
} from "@/lib/validations";
import type { OnboardingStep } from "@/types/tutor";

// ─── Shared helpers ───────────────────────────────────────────────────────────

async function getVerifiedTutor() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) return { user: null, supabase, tutorProfileId: null };

  const { data: profile } = await supabase
    .from("profiles")
    .select("role")
    .eq("id", user.id)
    .single();

  if (!profile || profile.role !== "tutor") {
    return { user: null, supabase, tutorProfileId: null };
  }

  const { data: tp } = await supabase
    .from("tutor_profiles")
    .select("id")
    .eq("user_id", user.id)
    .single();

  return { user, supabase, tutorProfileId: tp?.id ?? null };
}

function advanceStep(current: OnboardingStep): OnboardingStep {
  const order: OnboardingStep[] = [
    "basic_profile",
    "education",
    "experience",
    "teaching_preferences",
    "documents",
    "submitted",
  ];
  const idx = order.indexOf(current);
  return idx < order.length - 1 ? order[idx + 1] : "submitted";
}

// ─────────────────────────────────────────────────────────────────────────────
// STEP 1 — Save basic profile
// ─────────────────────────────────────────────────────────────────────────────

export async function saveTutorBasicProfileAction(
  formData: FormData
): Promise<{ error: string } | void> {
  const raw: TutorBasicProfileInput = {
    full_name:     formData.get("full_name")     as string,
    phone:         formData.get("phone")         as string,
    gender:        formData.get("gender")        as TutorBasicProfileInput["gender"],
    date_of_birth: formData.get("date_of_birth") as string,
    city:          formData.get("city")          as string,
    locality:      formData.get("locality")      as string,
    pincode:       formData.get("pincode")       as string,
    state:         formData.get("state")         as string,
    bio:           formData.get("bio")           as string,
  };

  const parsed = tutorBasicProfileSchema.safeParse(raw);
  if (!parsed.success) {
    return { error: parsed.error.errors[0].message };
  }

  const { user, supabase } = await getVerifiedTutor();
  if (!user) return { error: "Session expired. Please log in again." };

  // Update shared profiles row
  const { error: profileError } = await supabase
    .from("profiles")
    .update({
      full_name: parsed.data.full_name,
      phone:     parsed.data.phone,
    })
    .eq("id", user.id);

  if (profileError) return { error: "Could not save your profile." };

  // Upsert tutor_profiles
  const { error: tpError } = await supabase
    .from("tutor_profiles")
    .upsert(
      {
        user_id:             user.id,
        gender:              parsed.data.gender,
        date_of_birth:       parsed.data.date_of_birth,
        locality:            parsed.data.locality,
        city:                parsed.data.city,
        pincode:             parsed.data.pincode,
        state:               parsed.data.state,
        bio:                 parsed.data.bio,
        onboarding_step:     "education",
        verification_status: "pending",
      },
      { onConflict: "user_id" }
    );

  if (tpError) {
    console.error("Tutor profile upsert error:", tpError);
    return { error: "Could not save your profile. Please try again." };
  }

  redirect("/tutor/onboarding/education");
}

// ─────────────────────────────────────────────────────────────────────────────
// STEP 2 — Save education
// ─────────────────────────────────────────────────────────────────────────────

export async function saveTutorEducationAction(
  data: TutorEducationInput
): Promise<{ error: string } | void> {
  const parsed = tutorEducationSchema.safeParse(data);
  if (!parsed.success) {
    return { error: parsed.error.errors[0].message };
  }

  const { user, supabase } = await getVerifiedTutor();
  if (!user) return { error: "Session expired." };

  const { error } = await supabase
    .from("tutor_profiles")
    .update({
      education:       parsed.data.education,
      onboarding_step: "experience",
    })
    .eq("user_id", user.id);

  if (error) return { error: "Could not save education. Please try again." };

  redirect("/tutor/onboarding/experience");
}

// ─────────────────────────────────────────────────────────────────────────────
// STEP 3 — Save experience
// ─────────────────────────────────────────────────────────────────────────────

export async function saveTutorExperienceAction(
  data: TutorExperienceInput
): Promise<{ error: string } | void> {
  const parsed = tutorExperienceSchema.safeParse(data);
  if (!parsed.success) {
    return { error: parsed.error.errors[0].message };
  }

  const { user, supabase } = await getVerifiedTutor();
  if (!user) return { error: "Session expired." };

  const { error } = await supabase
    .from("tutor_profiles")
    .update({
      years_of_experience: parsed.data.years_of_experience,
      experience:          parsed.data.is_fresher ? [] : parsed.data.experience,
      onboarding_step:     "teaching_preferences",
    })
    .eq("user_id", user.id);

  if (error) return { error: "Could not save experience. Please try again." };

  redirect("/tutor/onboarding/preferences");
}

// ─────────────────────────────────────────────────────────────────────────────
// STEP 4 — Save teaching preferences
// ─────────────────────────────────────────────────────────────────────────────

export async function saveTutorPreferencesAction(
  data: TutorPreferencesInput
): Promise<{ error: string } | void> {
  const parsed = tutorPreferencesSchema.safeParse(data);
  if (!parsed.success) {
    return { error: parsed.error.errors[0].message };
  }

  const { user, supabase } = await getVerifiedTutor();
  if (!user) return { error: "Session expired." };

  const { error } = await supabase
    .from("tutor_profiles")
    .update({
      subjects:                parsed.data.subjects,
      grades:                  parsed.data.grades,
      boards:                  parsed.data.boards,
      teaching_mode:           parsed.data.teaching_mode,
      preferred_days:          parsed.data.preferred_days,
      preferred_time_slots:    parsed.data.preferred_time_slots,
      expected_fee_per_hour:   parsed.data.expected_fee_per_hour,
      demo_class_available:    parsed.data.demo_class_available,
      max_travel_distance_km:  parsed.data.max_travel_distance_km ?? null,
      onboarding_step:         "documents",
    })
    .eq("user_id", user.id);

  if (error) return { error: "Could not save preferences. Please try again." };

  redirect("/tutor/onboarding/documents");
}

// ─────────────────────────────────────────────────────────────────────────────
// STEP 5 — Advance to submission (called after document upload step)
// ─────────────────────────────────────────────────────────────────────────────

export async function advanceTutorToSubmissionAction(): Promise<
  { error: string } | void
> {
  const { user, supabase } = await getVerifiedTutor();
  if (!user) return { error: "Session expired." };

  const { error } = await supabase
    .from("tutor_profiles")
    .update({
      onboarding_step: "submitted",
    })
    .eq("user_id", user.id);

  if (error) return { error: "Could not proceed. Please try again." };

  redirect("/tutor/onboarding/submit");
}

// ─────────────────────────────────────────────────────────────────────────────
// STEP 6 — Final submission
// Marks onboarding complete and advances verification_status to profile_submitted
// ─────────────────────────────────────────────────────────────────────────────

export async function submitTutorApplicationAction(): Promise<
  { error: string } | void
> {
  const { user, supabase } = await getVerifiedTutor();
  if (!user) return { error: "Session expired." };

  // Verify at least one identity doc and one education doc exist
  const { data: tp } = await supabase
    .from("tutor_profiles")
    .select("id")
    .eq("user_id", user.id)
    .single();

  if (!tp) return { error: "Profile not found." };

  const { data: docs } = await supabase
    .from("tutor_documents")
    .select("document_type")
    .eq("tutor_id", tp.id);

  const docTypes = docs?.map((d) => d.document_type) ?? [];
  const hasId    = docTypes.some((t) =>
    ["aadhaar", "pan", "passport", "driving_licence"].includes(t)
  );
  const hasEdu   = docTypes.some((t) =>
    ["degree_certificate", "marksheet"].includes(t)
  );

  if (!hasId) {
    return { error: "Please upload at least one identity document (Aadhaar, PAN, or Passport) before submitting." };
  }
  if (!hasEdu) {
    return { error: "Please upload your degree certificate or marksheet before submitting." };
  }

  const { error } = await supabase
    .from("tutor_profiles")
    .update({
      onboarding_complete:  true,
      onboarding_step:      "submitted",
      verification_status:  "profile_submitted",
    })
    .eq("user_id", user.id);

  if (error) {
    console.error("Submission error:", error);
    return { error: "Could not submit your application. Please try again." };
  }

  redirect("/tutor/dashboard?applied=1");
}
