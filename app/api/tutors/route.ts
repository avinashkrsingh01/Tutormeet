import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { rateLimit, getClientIp, rateLimitKey } from "@/lib/rate-limit";
import type { SortOption } from "@/types/common";

/**
 * GET /api/tutors
 * Public endpoint — returns verified tutors with safe public fields only.
 * Rate limited: 60 requests per minute per IP.
 *
 * SECURITY — NEVER exposes:
 *   phone, pincode (in response), state, date_of_birth,
 *   document URLs, admin_notes, rejection_reason, or any private fields.
 */
export async function GET(request: Request) {
  // ── Rate limit: 60 requests/min per IP ───────────────────────────────────
  const ip          = getClientIp(request);
  const rlResult    = rateLimit({ key: rateLimitKey("tutors_list", ip), max: 60, windowSec: 60 });

  if (!rlResult.ok) {
    return NextResponse.json(
      { error: "Too many requests. Please try again shortly." },
      {
        status: 429,
        headers: {
          "Retry-After":        String(Math.ceil((rlResult.resetAt - Date.now()) / 1000)),
          "X-RateLimit-Limit":  "60",
          "X-RateLimit-Reset":  String(rlResult.resetAt),
        },
      }
    );
  }

  const supabase = await createClient();
  const { searchParams } = new URL(request.url);

  // ── Parse params ──────────────────────────────────────────────────────────

  const city         = searchParams.get("city")           ?? "";
  const locality     = searchParams.get("locality")       ?? "";
  const pincode      = searchParams.get("pincode")        ?? "";
  const subject      = searchParams.get("subject")        ?? "";
  const grade        = searchParams.get("grade")          ?? "";
  const board        = searchParams.get("board")          ?? "";
  const gender       = searchParams.get("gender")         ?? "";
  const teachingMode = searchParams.get("teaching_mode")  ?? "";
  const minFee       = parseFloat(searchParams.get("min_fee") ?? "0") || 0;
  const maxFee       = parseFloat(searchParams.get("max_fee") ?? "0") || 0;
  const minExp       = parseInt(searchParams.get("min_experience") ?? "0") || 0;
  const demoOnly     = searchParams.get("demo_only") === "true";
  const sort         = (searchParams.get("sort") ?? "best_match") as SortOption;
  const page         = Math.max(1, parseInt(searchParams.get("page")  ?? "1"));
  const limit        = Math.min(24, parseInt(searchParams.get("limit") ?? "12"));
  const offset       = (page - 1) * limit;

  // ── Build query — ONLY safe public columns ────────────────────────────────
  //    Intentionally omitting: pincode, state, date_of_birth, gender,
  //    admin_notes, rejection_reason, identity/education_verified flags.

  let query = supabase
    .from("tutor_profiles")
    .select(
      `user_id,
       locality,
       city,
       subjects,
       grades,
       boards,
       teaching_mode,
       expected_fee_per_hour,
       demo_class_available,
       max_travel_distance_km,
       bio,
       years_of_experience,
       knowledge_score,
       teaching_score,
       average_rating,
       total_reviews,
       total_students,
       verified_at,
       preferred_days,
       preferred_time_slots,
       profiles!inner(full_name, avatar_url)`,
      { count: "exact" }
    )
    .eq("verification_status", "verified")
    .eq("onboarding_complete", true);

  // ── Location filters ───────────────────────────────────────────────────────
  // Escape LIKE wildcards to prevent filter-bypass attacks
  const escapeIlike = (s: string) => s.replace(/[%_\\]/g, "\\$&");

  if (city)     query = query.ilike("city",     `%${escapeIlike(city.trim())}%`);
  if (locality) query = query.ilike("locality", `%${escapeIlike(locality.trim())}%`);
  // pincode used for matching only — filter but don't return it
  if (pincode)  query = query.eq("pincode", pincode.trim());

  // ── Subject / grade / board ────────────────────────────────────────────────

  if (subject) query = query.contains("subjects", [subject]);
  if (grade)   query = query.contains("grades",   [grade]);
  if (board)   query = query.contains("boards",   [board]);

  // ── Teaching preferences ───────────────────────────────────────────────────

  if (teachingMode) query = query.eq("teaching_mode", teachingMode);
  if (demoOnly)     query = query.eq("demo_class_available", true);

  // ── Fee range ──────────────────────────────────────────────────────────────

  if (minFee > 0) query = query.gte("expected_fee_per_hour", minFee);
  if (maxFee > 0) query = query.lte("expected_fee_per_hour", maxFee);

  // ── Experience ────────────────────────────────────────────────────────────

  if (minExp > 0) query = query.gte("years_of_experience", minExp);

  // ── Gender — stored in tutor_profiles.gender but NOT returned in response ─

  if (gender && gender !== "no_preference") {
    query = query.eq("gender", gender);
  }

  // ── Sorting ────────────────────────────────────────────────────────────────

  switch (sort) {
    case "highest_rated":
      query = query
        .order("average_rating",        { ascending: false, nullsFirst: false })
        .order("total_reviews",         { ascending: false });
      break;
    case "most_experienced":
      query = query
        .order("years_of_experience",   { ascending: false, nullsFirst: false })
        .order("average_rating",        { ascending: false, nullsFirst: false });
      break;
    case "lowest_fee":
      query = query
        .order("expected_fee_per_hour", { ascending: true,  nullsFirst: false })
        .order("average_rating",        { ascending: false, nullsFirst: false });
      break;
    case "most_reviews":
      query = query
        .order("total_reviews",         { ascending: false })
        .order("average_rating",        { ascending: false, nullsFirst: false });
      break;
    case "best_match":
    default:
      // Best match: knowledge_score + teaching_score (verified quality) → then rating
      query = query
        .order("knowledge_score",       { ascending: false, nullsFirst: false })
        .order("teaching_score",        { ascending: false, nullsFirst: false })
        .order("average_rating",        { ascending: false, nullsFirst: false });
      break;
  }

  query = query.range(offset, offset + limit - 1);

  const { data, count, error } = await query;

  if (error) {
    console.error("[GET /api/tutors] error:", error);
    return NextResponse.json({ error: "Failed to fetch tutors." }, { status: 500 });
  }

  // ── Shape response — strip any accidental leakage ─────────────────────────

  const tutors = (data ?? []).map((tp) => {
    const profileRaw = tp.profiles as unknown;
    const profile    = (Array.isArray(profileRaw)
      ? profileRaw[0]
      : profileRaw) as { full_name: string; avatar_url: string | null };

    return {
      id:                     tp.user_id,
      full_name:              profile.full_name,
      avatar_url:             profile.avatar_url,
      locality:               tp.locality,
      city:                   tp.city,
      // NOTE: pincode deliberately omitted from response
      subjects:               tp.subjects,
      grades:                 tp.grades,
      boards:                 tp.boards,
      teaching_mode:          tp.teaching_mode,
      expected_fee_per_hour:  tp.expected_fee_per_hour,
      demo_class_available:   tp.demo_class_available,
      max_travel_distance_km: tp.max_travel_distance_km,
      bio:                    tp.bio,
      years_of_experience:    tp.years_of_experience,
      knowledge_score:        tp.knowledge_score,
      teaching_score:         tp.teaching_score,
      average_rating:         tp.average_rating,
      total_reviews:          tp.total_reviews,
      total_students:         tp.total_students,
      preferred_days:         tp.preferred_days,
      preferred_time_slots:   tp.preferred_time_slots,
    };
  });

  return NextResponse.json({
    data:       tutors,
    total:      count ?? 0,
    page,
    pageSize:   limit,
    totalPages: Math.ceil((count ?? 0) / limit),
    appliedFilters: {
      city, locality, subject, grade, board,
      teaching_mode: teachingMode, demo_only: demoOnly,
      min_fee: minFee || null, max_fee: maxFee || null,
      min_experience: minExp || null, sort,
    },
  });
}
