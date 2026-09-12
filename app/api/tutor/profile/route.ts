import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { tutorProfileSchema } from "@/lib/validations";

// ── GET — fetch own tutor profile (private fields for dashboard) ──────────────

export async function GET() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const [{ data: profile }, { data: tp }] = await Promise.all([
    supabase
      .from("profiles")
      .select("full_name, email, phone, avatar_url, created_at")
      .eq("id", user.id)
      .single(),
    supabase
      .from("tutor_profiles")
      .select(
        // Private fields returned only to the tutor themselves.
        // SECURITY: admin_notes is intentionally excluded — it contains internal
        // review comments that must never be visible to the tutor.
        `id, verification_status, onboarding_step, onboarding_complete,
         gender, date_of_birth, locality, city, pincode, state,
         subjects, grades, boards, teaching_mode, preferred_days,
         preferred_time_slots, expected_fee_per_hour, demo_class_available,
         max_travel_distance_km, bio, years_of_experience,
         education, experience, knowledge_score, teaching_score,
         identity_verified, education_verified,
         average_rating, total_reviews, total_students, verified_at`
      )
      .eq("user_id", user.id)
      .single(),
  ]);

  if (!tp) return NextResponse.json({ error: "Profile not found" }, { status: 404 });

  return NextResponse.json({ data: { ...profile, ...tp } });
}

// ── PUT — update tutor profile (legacy single-page form support) ──────────────

export async function PUT(request: Request) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { data: profileRow } = await supabase
    .from("profiles")
    .select("role")
    .eq("id", user.id)
    .single();

  if (!profileRow || profileRow.role !== "tutor") {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON" }, { status: 400 });
  }

  const parsed = tutorProfileSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json(
      { error: parsed.error.errors[0].message },
      { status: 422 }
    );
  }

  const {
    date_of_birth, gender, subjects, grades, boards,
    teaching_mode, preferred_days, preferred_time_slots,
    expected_fee_per_hour, years_of_experience, bio,
    demo_class_available, locality, city, pincode,
  } = parsed.data;

  const { error } = await supabase
    .from("tutor_profiles")
    .update({
      date_of_birth,
      gender,
      subjects,
      grades,
      boards,
      teaching_mode,
      preferred_days,
      preferred_time_slots,
      expected_fee_per_hour,
      years_of_experience,
      bio,
      demo_class_available,
      locality,
      city,
      pincode,
      verification_status:  "profile_submitted",
      onboarding_complete:  true,
    })
    .eq("user_id", user.id);

  if (error) {
    console.error("Tutor profile PUT error:", error);
    return NextResponse.json(
      { error: "Failed to save profile." },
      { status: 500 }
    );
  }

  return NextResponse.json({ success: true });
}
