import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { requirementSchema } from "@/lib/validations";

export async function POST(request: Request) {
  const supabase = await createClient();

  // ── Auth check ────────────────────────────────────────────────────────────
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  // ── Role check — only parents ────────────────────────────────────────────
  const { data: profile } = await supabase
    .from("profiles")
    .select("role")
    .eq("id", user.id)
    .single();

  if (!profile || profile.role !== "parent") {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  // ── Parse + validate body ─────────────────────────────────────────────────
  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON body" }, { status: 400 });
  }

  const parsed = requirementSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json(
      { error: parsed.error.errors[0].message },
      { status: 422 }
    );
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

  // ── Create or re-use student row ──────────────────────────────────────────
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
      return NextResponse.json(
        { error: "Could not save student details." },
        { status: 500 }
      );
    }

    studentId = newStudent.id;
  }

  // ── Insert requirement ────────────────────────────────────────────────────
  const { data: requirement, error } = await supabase
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

  if (error) {
    console.error("Requirement insert error:", error);
    return NextResponse.json(
      { error: "Failed to submit requirement. Please try again." },
      { status: 500 }
    );
  }

  return NextResponse.json({ id: requirement.id }, { status: 201 });
}

// ── GET — list requirements for current parent ────────────────────────────────

export async function GET(request: Request) {
  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { searchParams } = new URL(request.url);
  const status = searchParams.get("status");

  let query = supabase
    .from("tuition_requirements")
    .select(
      "id, grade, subjects, student_name, status, city, created_at, updated_at"
    )
    .eq("parent_id", user.id)
    .order("created_at", { ascending: false });

  if (status) {
    query = query.eq("status", status);
  }

  const { data, error } = await query;

  if (error) {
    return NextResponse.json({ error: "Failed to fetch requirements." }, { status: 500 });
  }

  return NextResponse.json({ data });
}
