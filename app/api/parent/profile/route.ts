import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { parentProfileSchema } from "@/lib/validations";

// ── GET — fetch parent profile ────────────────────────────────────────────────

export async function GET() {
  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const [{ data: profile }, { data: parentProfile }] = await Promise.all([
    supabase
      .from("profiles")
      .select("full_name, email, phone, avatar_url, created_at")
      .eq("id", user.id)
      .single(),
    supabase
      .from("parent_profiles")
      .select("city, locality, communication_preference, onboarding_complete")
      .eq("user_id", user.id)
      .maybeSingle(),
  ]);

  return NextResponse.json({
    data: { ...profile, ...parentProfile },
  });
}

// ── PUT — update parent profile ───────────────────────────────────────────────

export async function PUT(request: Request) {
  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { data: profile } = await supabase
    .from("profiles")
    .select("role")
    .eq("id", user.id)
    .single();

  if (!profile || profile.role !== "parent") {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON" }, { status: 400 });
  }

  const parsed = parentProfileSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json(
      { error: parsed.error.errors[0].message },
      { status: 422 }
    );
  }

  const { full_name, phone, city, locality, communication_preference } =
    parsed.data;

  // Update both tables in parallel
  const [profileResult, parentProfileResult] = await Promise.all([
    supabase
      .from("profiles")
      .update({ full_name, phone })
      .eq("id", user.id),
    supabase
      .from("parent_profiles")
      .upsert(
        { user_id: user.id, city, locality, communication_preference },
        { onConflict: "user_id" }
      ),
  ]);

  if (profileResult.error || parentProfileResult.error) {
    console.error(
      "Profile update error:",
      profileResult.error ?? parentProfileResult.error
    );
    return NextResponse.json(
      { error: "Failed to update profile." },
      { status: 500 }
    );
  }

  return NextResponse.json({ success: true });
}
