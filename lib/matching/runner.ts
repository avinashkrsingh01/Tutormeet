/**
 * TutorMeet Matching Runner
 *
 * Fetches data from Supabase, calls the pure engine, and (optionally)
 * persists the top matches back to tutor_matches.
 *
 * SECURITY: never reads or returns private fields (pincode, phone,
 * date_of_birth, document URLs, admin_notes).
 */

import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { runMatchingEngine } from "./engine";
import type {
  RequirementInput,
  TutorCandidate,
  MatchEngineOutput,
  MatchWeights,
} from "./types";

// ─────────────────────────────────────────────────────────────────────────────
// Fetch requirement from DB
// ─────────────────────────────────────────────────────────────────────────────

export async function fetchRequirement(
  requirementId: string
): Promise<RequirementInput | null> {
  const supabase = await createClient();

  const { data } = await supabase
    .from("tuition_requirements")
    .select(
      "subjects, grade, board, teaching_mode, preferred_days, preferred_time_slots, city, locality, budget_per_hour, preferred_tutor_gender"
    )
    .eq("id", requirementId)
    .single();

  if (!data) return null;

  return {
    subjects:              (data.subjects as string[]) ?? [],
    grade:                 data.grade,
    board:                 data.board,
    teaching_mode:         data.teaching_mode,
    preferred_days:        (data.preferred_days as string[]) ?? [],
    preferred_time_slots:  (data.preferred_time_slots as string[]) ?? [],
    city:                  data.city,
    locality:              data.locality,
    budget_per_hour:       data.budget_per_hour ?? null,
    preferred_tutor_gender: data.preferred_tutor_gender ?? "no_preference",
  };
}

// ─────────────────────────────────────────────────────────────────────────────
// Fetch verified tutor candidates from DB
// Only safe public fields — NO private data in the candidate pool.
// ─────────────────────────────────────────────────────────────────────────────

export async function fetchCandidates(
  req: RequirementInput,
  excludeTutorIds: string[] = []
): Promise<TutorCandidate[]> {
  const supabase = await createClient();

  // Pre-filter at DB level to reduce candidate pool before scoring
  let query = supabase
    .from("tutor_profiles")
    .select(
      `id, user_id, verification_status,
       gender,
       subjects, grades, boards,
       teaching_mode, preferred_days, preferred_time_slots,
       locality, city, max_travel_distance_km,
       expected_fee_per_hour, years_of_experience,
       average_rating, total_reviews,
       knowledge_score, teaching_score,
       demo_class_available,
       profiles!inner(full_name, avatar_url)`
    )
    .eq("verification_status", "verified")
    .eq("onboarding_complete", true)
    .eq("city", req.city)  // mandatory: same city
    .contains("subjects", req.subjects.slice(0, 1))  // at least one subject match
    .limit(100); // evaluate at most 100 candidates per run

  if (excludeTutorIds.length > 0) {
    query = query.not("id", "in", `(${excludeTutorIds.join(",")})`);
  }

  const { data, error } = await query;

  if (error) {
    console.error("[Matching] fetchCandidates error:", error);
    return [];
  }

  return (data ?? []).map((tp) => {
    const profileRaw = tp.profiles as unknown;
    const profile    = (Array.isArray(profileRaw) ? profileRaw[0] : profileRaw) as {
      full_name:  string;
      avatar_url: string | null;
    };

    return {
      id:                    tp.id,
      user_id:               tp.user_id,
      full_name:             profile.full_name,
      avatar_url:            profile.avatar_url,
      verification_status:   tp.verification_status,
      gender:                tp.gender ?? null,
      subjects:              (tp.subjects as string[]) ?? [],
      grades:                (tp.grades   as string[]) ?? [],
      boards:                (tp.boards   as string[]) ?? [],
      teaching_mode:         tp.teaching_mode ?? null,
      preferred_days:        (tp.preferred_days       as string[]) ?? [],
      preferred_time_slots:  (tp.preferred_time_slots as string[]) ?? [],
      locality:              tp.locality ?? null,
      city:                  tp.city     ?? null,
      max_travel_distance_km: tp.max_travel_distance_km ?? null,
      expected_fee_per_hour: tp.expected_fee_per_hour ?? null,
      years_of_experience:   tp.years_of_experience ?? 0,
      average_rating:        tp.average_rating ?? null,
      total_reviews:         tp.total_reviews ?? 0,
      knowledge_score:       tp.knowledge_score ?? null,
      teaching_score:        tp.teaching_score  ?? null,
      demo_class_available:  tp.demo_class_available ?? false,
    } satisfies TutorCandidate;
  });
}

// ─────────────────────────────────────────────────────────────────────────────
// Run full matching pipeline
// ─────────────────────────────────────────────────────────────────────────────

export interface RunMatchingOptions {
  requirementId:   string;
  weights?:        MatchWeights;
  topN?:           number;
  minScore?:       number;
  excludeExisting?: boolean;  // skip already-matched tutors
}

export async function runMatching(
  options: RunMatchingOptions
): Promise<MatchEngineOutput | { error: string }> {
  const { requirementId, weights, topN = 10, minScore = 40, excludeExisting = true } =
    options;

  // 1. Fetch requirement
  const req = await fetchRequirement(requirementId);
  if (!req) {
    return { error: `Requirement ${requirementId} not found.` };
  }

  // 2. Get already-matched tutor IDs (to avoid duplicating suggestions)
  let excludeIds: string[] = [];
  if (excludeExisting) {
    const supabase = await createClient();
    const { data: existing } = await supabase
      .from("tutor_matches")
      .select("tutor_id")
      .eq("requirement_id", requirementId);
    excludeIds = (existing ?? []).map((m) => m.tutor_id);
  }

  // 3. Fetch candidates
  const candidates = await fetchCandidates(req, excludeIds);

  if (candidates.length === 0) {
    return {
      requirementId,
      runAt:     new Date().toISOString(),
      weights:   weights ?? { subject: 0.25, classBoardExp: 0.20, location: 0.20, availability: 0.15, experience: 0.10, fee: 0.05, rating: 0.05 },
      total:     0,
      qualified: 0,
      results:   [],
    };
  }

  // 4. Run engine
  const output = runMatchingEngine(req, candidates, requirementId, {
    weights, topN, minScore,
  });

  return output;
}

// ─────────────────────────────────────────────────────────────────────────────
// Persist top matches to DB (admin action)
// Uses service-role to bypass RLS for bulk insert.
// ─────────────────────────────────────────────────────────────────────────────

export async function persistMatches(
  output:      MatchEngineOutput,
  adminUserId: string
): Promise<{ inserted: number; error?: string }> {
  if (output.results.length === 0) {
    return { inserted: 0 };
  }

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const adminDb = createAdminClient() as any;

  const rows = output.results.map((r) => ({
    requirement_id: output.requirementId,
    tutor_id:       r.tutor.id,
    match_status:   "suggested" as const,
    match_score:    r.score,
    match_reasons:  JSON.stringify(r.reasons),
    matched_by:     adminUserId,
  }));

  const { error } = await adminDb
    .from("tutor_matches")
    .upsert(rows, { onConflict: "requirement_id,tutor_id", ignoreDuplicates: true });

  if (error) {
    console.error("[Matching] persistMatches error:", error);
    return { inserted: 0, error: error.message };
  }

  // Update requirement status to "matching"
  await adminDb
    .from("tuition_requirements")
    .update({ status: "matching" })
    .eq("id", output.requirementId)
    .eq("status", "submitted");

  // Log admin action
  await adminDb.from("admin_actions").insert([{
    admin_id:    adminUserId,
    action_type: "tutor_matched",
    target_type: "requirement",
    target_id:   output.requirementId,
    notes:       `Engine run: ${output.results.length} matches persisted (top score: ${output.results[0]?.score ?? 0})`,
    metadata:    {
      total_evaluated: output.total,
      qualified:       output.qualified,
      persisted:       output.results.length,
      run_at:          output.runAt,
    },
  }]);

  return { inserted: rows.length };
}
