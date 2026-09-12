import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { runMatching, persistMatches } from "@/lib/matching/runner";
import { DEFAULT_WEIGHTS } from "@/lib/matching/types";
import { z } from "zod";

const bodySchema = z.object({
  requirement_id: z.string().uuid(),
  persist:        z.boolean().optional().default(false),
  top_n:          z.number().min(1).max(20).optional().default(10),
  min_score:      z.number().min(0).max(100).optional().default(40),
  weights:        z
    .object({
      subject:       z.number().min(0).max(1),
      classBoardExp: z.number().min(0).max(1),
      location:      z.number().min(0).max(1),
      availability:  z.number().min(0).max(1),
      experience:    z.number().min(0).max(1),
      fee:           z.number().min(0).max(1),
      rating:        z.number().min(0).max(1),
    })
    .optional(),
});

export async function POST(request: Request) {
  // ── Auth + admin check ────────────────────────────────────────────────────
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { data: profile } = await supabase
    .from("profiles")
    .select("role")
    .eq("id", user.id)
    .single();

  if (!profile || profile.role !== "admin") {
    return NextResponse.json({ error: "Forbidden — admin only" }, { status: 403 });
  }

  // ── Parse body ────────────────────────────────────────────────────────────
  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON" }, { status: 400 });
  }

  const parsed = bodySchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json(
      { error: parsed.error.errors[0].message },
      { status: 422 }
    );
  }

  const { requirement_id, persist, top_n, min_score, weights } = parsed.data;

  // ── Run engine ────────────────────────────────────────────────────────────
  const output = await runMatching({
    requirementId: requirement_id,
    weights:       weights ?? DEFAULT_WEIGHTS,
    topN:          top_n,
    minScore:      min_score,
  });

  if ("error" in output) {
    return NextResponse.json({ error: output.error }, { status: 404 });
  }

  // ── Persist (optional) ────────────────────────────────────────────────────
  let persistResult: { inserted: number; error?: string } | null = null;
  if (persist) {
    persistResult = await persistMatches(output, user.id);
  }

  // ── Return safe response ──────────────────────────────────────────────────
  // Strip private tutor fields from response — only return what's safe.
  const safeResults = output.results.map((r) => ({
    tutor: {
      id:                   r.tutor.id,
      user_id:              r.tutor.user_id,
      full_name:            r.tutor.full_name,
      avatar_url:           r.tutor.avatar_url,
      subjects:             r.tutor.subjects,
      grades:               r.tutor.grades,
      boards:               r.tutor.boards,
      locality:             r.tutor.locality,
      city:                 r.tutor.city,
      years_of_experience:  r.tutor.years_of_experience,
      expected_fee_per_hour: r.tutor.expected_fee_per_hour,
      average_rating:       r.tutor.average_rating,
      total_reviews:        r.tutor.total_reviews,
      knowledge_score:      r.tutor.knowledge_score,
      teaching_score:       r.tutor.teaching_score,
      demo_class_available: r.tutor.demo_class_available,
      // NOTE: gender deliberately omitted from response
    },
    score:          r.score,
    reasons:        r.reasons,
    passedMandatory: r.passedMandatory,
    breakdown: {
      subject:       Math.round(r.breakdown.subject       * 10000) / 100,
      classBoardExp: Math.round(r.breakdown.classBoardExp * 10000) / 100,
      location:      Math.round(r.breakdown.location      * 10000) / 100,
      availability:  Math.round(r.breakdown.availability  * 10000) / 100,
      experience:    Math.round(r.breakdown.experience    * 10000) / 100,
      fee:           Math.round(r.breakdown.fee           * 10000) / 100,
      rating:        Math.round(r.breakdown.rating        * 10000) / 100,
    },
  }));

  return NextResponse.json({
    requirement_id,
    run_at:    output.runAt,
    weights:   output.weights,
    total:     output.total,
    qualified: output.qualified,
    results:   safeResults,
    persisted: persistResult,
  });
}
