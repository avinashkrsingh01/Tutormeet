// ============================================================
// TutorMeet — Deterministic Matching Engine v1.0
//
// Design principles:
//  - Pure function: no DB calls, no side effects
//  - Modular weights: swap DEFAULT_WEIGHTS for any config
//  - Transparent: every score is decomposed into breakdown + reasons
//  - Mandatory filters applied BEFORE scoring (eliminates disqualified)
//  - All scores are 0–1 before weighting, 0–100 final
//
// Score formula:
//   total = Σ(raw_i × weight_i) × 100, capped at 100
// ============================================================

import type {
  RequirementInput,
  TutorCandidate,
  MatchResult,
  MatchEngineOutput,
  MatchWeights,
  ScoreBreakdown,
  MatchReason,
  MatchReasonType,
} from "./types";
import { DEFAULT_WEIGHTS } from "./types";

// ─────────────────────────────────────────────────────────────────────────────
// SECTION 1 — MANDATORY FILTER
// Tutors who fail any mandatory check are excluded from scoring entirely.
// ─────────────────────────────────────────────────────────────────────────────

export function checkMandatory(
  tutor: TutorCandidate,
  req:   RequirementInput
): { pass: boolean; reason?: string } {

  // 1. Must be verified and active
  if (tutor.verification_status !== "verified") {
    return { pass: false, reason: "Tutor is not verified" };
  }

  // 2. Must teach at least one of the required subjects
  const subjectMatch = req.subjects.some((s) =>
    tutor.subjects.map((ts) => ts.toLowerCase()).includes(s.toLowerCase())
  );
  if (!subjectMatch) {
    return {
      pass:   false,
      reason: `Does not teach ${req.subjects.join(" or ")}`,
    };
  }

  // 3. Must teach the required grade
  const gradeMatch = tutor.grades.some(
    (g) => g.toLowerCase() === req.grade.toLowerCase()
  );
  if (!gradeMatch) {
    return {
      pass:   false,
      reason: `Does not teach ${req.grade}`,
    };
  }

  // 4. Must be in the same city (case-insensitive)
  if (
    tutor.city &&
    req.city &&
    tutor.city.toLowerCase().trim() !== req.city.toLowerCase().trim()
  ) {
    return {
      pass:   false,
      reason: `Not in ${req.city}`,
    };
  }

  // 5. Teaching mode must be compatible
  //    "Both" on either side means compatible with anything.
  if (
    req.teaching_mode &&
    tutor.teaching_mode &&
    req.teaching_mode !== "Both" &&
    tutor.teaching_mode !== "Both" &&
    req.teaching_mode !== tutor.teaching_mode
  ) {
    return {
      pass:   false,
      reason: `Teaching mode mismatch: parent needs ${req.teaching_mode}`,
    };
  }

  // 6. Gender preference (hard filter only when parent specified)
  if (
    req.preferred_tutor_gender &&
    req.preferred_tutor_gender !== "no_preference" &&
    tutor.gender &&
    tutor.gender !== req.preferred_tutor_gender
  ) {
    return {
      pass:   false,
      reason: `Gender preference not met`,
    };
  }

  return { pass: true };
}

// ─────────────────────────────────────────────────────────────────────────────
// SECTION 2 — COMPONENT SCORERS
// Each returns a number 0–1.
// ─────────────────────────────────────────────────────────────────────────────

/**
 * Subject score (0–1)
 * Full match on all required subjects = 1.0
 * Partial match = proportional.
 * Bonus for knowledge_score (admin-assessed quality signal).
 */
function scoreSubject(tutor: TutorCandidate, req: RequirementInput): number {
  if (req.subjects.length === 0) return 0.5;

  const tutorSubjectsLower = tutor.subjects.map((s) => s.toLowerCase());
  const matched = req.subjects.filter((s) =>
    tutorSubjectsLower.includes(s.toLowerCase())
  ).length;

  const baseScore = matched / req.subjects.length;

  // Boost for admin-verified knowledge score (0–10% bonus)
  const knowledgeBonus =
    tutor.knowledge_score !== null
      ? (tutor.knowledge_score / 100) * 0.10
      : 0;

  return Math.min(1, baseScore * 0.90 + knowledgeBonus + (baseScore === 1 ? 0.10 : 0));
}

/**
 * Class + board experience score (0–1)
 * Grade match: 0.60 of this component
 * Board match: 0.40 of this component
 */
function scoreClassBoard(tutor: TutorCandidate, req: RequirementInput): number {
  // Grade component
  const gradeMatches = tutor.grades.some(
    (g) => g.toLowerCase() === req.grade.toLowerCase()
  );
  const gradeScore = gradeMatches ? 1.0 : 0;

  // Adjacent grade bonus (e.g. teaching Class 9 also useful for Class 10)
  const gradeNum = extractGradeNumber(req.grade);
  const adjacentBonus =
    gradeNum !== null &&
    tutor.grades.some((g) => {
      const n = extractGradeNumber(g);
      return n !== null && Math.abs(n - gradeNum) === 1;
    })
      ? 0.3
      : 0;

  const finalGrade = gradeScore > 0 ? 1.0 : adjacentBonus;

  // Board component
  const boardMatches = tutor.boards.some(
    (b) => b.toLowerCase() === req.board.toLowerCase()
  );
  const boardScore = boardMatches ? 1.0 : 0;

  // "Other" or "State Board" is partially compatible with any board
  const boardCompatBonus =
    !boardMatches &&
    (tutor.boards.includes("Other") || tutor.boards.includes("State Board"))
      ? 0.4
      : 0;

  const finalBoard = boardMatches ? 1.0 : boardCompatBonus;

  return finalGrade * 0.6 + finalBoard * 0.4;
}

/**
 * Location score (0–1)
 * Same city is mandatory; this rewards closer locality.
 */
function scoreLocation(tutor: TutorCandidate, req: RequirementInput): number {
  // Same city guaranteed by mandatory filter — start at 0.5
  let score = 0.5;

  // Locality match within the city — strong signal
  if (
    tutor.locality &&
    req.locality &&
    tutor.locality.toLowerCase().trim() === req.locality.toLowerCase().trim()
  ) {
    score = 1.0;
  } else if (
    tutor.locality &&
    req.locality &&
    (tutor.locality.toLowerCase().includes(req.locality.toLowerCase()) ||
      req.locality.toLowerCase().includes(tutor.locality.toLowerCase()))
  ) {
    // Partial locality match (substring — e.g. "Koramangala 5th Block" vs "Koramangala")
    score = 0.8;
  }

  // Travel distance willingness (if tutor declares max_travel_distance_km)
  // Without GPS we can't compute exact distance, so use travel declaration as proxy
  if (tutor.max_travel_distance_km !== null) {
    if (tutor.max_travel_distance_km >= 15) score = Math.min(1.0, score + 0.1);
    else if (tutor.max_travel_distance_km >= 10) score = Math.min(1.0, score + 0.05);
  }

  return Math.min(1, score);
}

/**
 * Availability score (0–1)
 * Measures overlap between parent's preferred schedule and tutor's availability.
 */
function scoreAvailability(tutor: TutorCandidate, req: RequirementInput): number {
  const reqDays  = req.preferred_days.map((d) => d.toLowerCase());
  const reqSlots = req.preferred_time_slots.map((s) => s.toLowerCase().trim());
  const tutDays  = tutor.preferred_days.map((d) => d.toLowerCase());
  const tutSlots = tutor.preferred_time_slots.map((s) => s.toLowerCase().trim());

  // No info on either side — neutral
  if (reqDays.length === 0 && reqSlots.length === 0) return 0.5;
  if (tutDays.length === 0 && tutSlots.length === 0) return 0.5;

  // Day overlap (0.6 weight within this component)
  let dayScore = 0.5;
  if (reqDays.length > 0 && tutDays.length > 0) {
    const dayOverlap = reqDays.filter((d) => tutDays.includes(d)).length;
    dayScore = dayOverlap / reqDays.length;
    // Bonus: tutor has MORE days available than required
    if (tutDays.length >= reqDays.length && dayOverlap === reqDays.length) {
      dayScore = 1.0;
    }
  }

  // Time slot overlap (0.4 weight)
  let slotScore = 0.5;
  if (reqSlots.length > 0 && tutSlots.length > 0) {
    const slotOverlap = reqSlots.filter((s) => tutSlots.includes(s)).length;
    slotScore = slotOverlap > 0 ? slotOverlap / reqSlots.length : 0;
  }

  return dayScore * 0.6 + slotScore * 0.4;
}

/**
 * Experience score (0–1)
 * Logarithmic curve so the difference between 0 and 2 years matters
 * more than between 8 and 10 years.
 * teaching_score (admin interview rating) adds a quality bonus.
 */
function scoreExperience(tutor: TutorCandidate): number {
  const yrs = tutor.years_of_experience ?? 0;

  // Logarithmic: log(1 + yrs) / log(1 + 15) normalised to 0–1
  const expBase = Math.log(1 + yrs) / Math.log(1 + 15);
  const expScore = Math.min(1, expBase);

  // Admin teaching score bonus (up to 0.10)
  const teachingBonus =
    tutor.teaching_score !== null
      ? (tutor.teaching_score / 100) * 0.10
      : 0;

  return Math.min(1, expScore * 0.9 + teachingBonus);
}

/**
 * Fee compatibility score (0–1)
 * If no budget specified → neutral (0.5).
 * Under budget → 1.0. Over budget → decays linearly.
 */
function scoreFee(tutor: TutorCandidate, req: RequirementInput): number {
  if (!req.budget_per_hour || req.budget_per_hour <= 0) return 0.5;
  if (!tutor.expected_fee_per_hour) return 0.5;

  const budget = req.budget_per_hour;
  const fee    = tutor.expected_fee_per_hour;

  if (fee <= budget) return 1.0;

  // Tutor is over budget — linear decay up to 50% over
  const overBudgetRatio = (fee - budget) / budget;
  if (overBudgetRatio >= 0.5) return 0;
  return 1.0 - overBudgetRatio * 2;
}

/**
 * Rating score (0–1)
 * Minimum reviews threshold to avoid cold-start inflation.
 * New tutors with 0 reviews start at 0.4 (neutral-ish).
 */
function scoreRating(tutor: TutorCandidate): number {
  const rating  = tutor.average_rating ?? 0;
  const reviews = tutor.total_reviews ?? 0;

  if (reviews === 0) return 0.4;

  // Confidence weight: more reviews = trust the rating more
  const confidence = Math.min(1, reviews / 10); // 10+ reviews = full confidence
  const rawScore   = (rating - 1) / 4;          // 1–5 star → 0–1

  return rawScore * confidence + 0.4 * (1 - confidence);
}

// ─────────────────────────────────────────────────────────────────────────────
// SECTION 3 — REASON GENERATOR
// Turns a score breakdown into human-readable "why this matches" lines.
// ─────────────────────────────────────────────────────────────────────────────

function buildReasons(
  tutor:     TutorCandidate,
  req:       RequirementInput,
  breakdown: ScoreBreakdown
): MatchReason[] {
  const reasons: MatchReason[] = [];

  // Subject
  if (breakdown.raw.subject >= 0.9) {
    const subjectList = req.subjects
      .filter((s) =>
        tutor.subjects.map((ts) => ts.toLowerCase()).includes(s.toLowerCase())
      )
      .join(", ");
    reasons.push({
      type:   "subject_specialist",
      label:  `${subjectList} specialist`,
      detail: tutor.knowledge_score !== null
        ? `Knowledge score: ${tutor.knowledge_score}%`
        : null,
      icon:   "BookOpen",
    });
  } else if (breakdown.raw.subject >= 0.5) {
    reasons.push({
      type:   "subject_specialist",
      label:  "Teaches required subjects",
      detail: null,
      icon:   "BookOpen",
    });
  }

  // Class + board
  if (breakdown.raw.classBoardExp >= 0.8) {
    reasons.push({
      type:   "class_board_match",
      label:  `${req.grade} ${req.board} experience`,
      detail: null,
      icon:   "GraduationCap",
    });
  } else if (breakdown.raw.classBoardExp >= 0.5) {
    reasons.push({
      type:   "class_board_match",
      label:  `Teaches ${req.grade}`,
      detail: null,
      icon:   "GraduationCap",
    });
  }

  // Availability
  if (breakdown.raw.availability >= 0.8) {
    const dayCount = req.preferred_days.filter((d) =>
      tutor.preferred_days.map((td) => td.toLowerCase()).includes(d.toLowerCase())
    ).length;
    reasons.push({
      type:   "availability_match",
      label:  "Available at your preferred times",
      detail: dayCount > 0
        ? `${dayCount} of your ${req.preferred_days.length} preferred day${req.preferred_days.length !== 1 ? "s" : ""} match`
        : null,
      icon:   "Calendar",
    });
  } else if (breakdown.raw.availability >= 0.5) {
    reasons.push({
      type:   "availability_match",
      label:  "Partially available at preferred times",
      detail: null,
      icon:   "Calendar",
    });
  }

  // Location
  if (breakdown.raw.location >= 0.8) {
    const locStr = tutor.locality
      ? `Based in ${tutor.locality}`
      : `Based in ${tutor.city}`;
    reasons.push({
      type:   "location_match",
      label:  locStr,
      detail: tutor.max_travel_distance_km
        ? `Travels up to ${tutor.max_travel_distance_km} km`
        : null,
      icon:   "MapPin",
    });
  }

  // Experience
  const yrs = tutor.years_of_experience ?? 0;
  if (yrs >= 5) {
    reasons.push({
      type:   "experience",
      label:  `${yrs}+ years teaching experience`,
      detail: null,
      icon:   "Clock",
    });
  } else if (yrs >= 2) {
    reasons.push({
      type:   "experience",
      label:  `${yrs} years of experience`,
      detail: null,
      icon:   "Clock",
    });
  } else if (yrs === 0) {
    // Don't add a reason for freshers — neutral
  } else {
    reasons.push({
      type:   "experience",
      label:  `${yrs} year${yrs !== 1 ? "s" : ""} experience`,
      detail: null,
      icon:   "Clock",
    });
  }

  // Rating
  if (tutor.average_rating !== null && tutor.average_rating >= 4.5 && tutor.total_reviews >= 3) {
    reasons.push({
      type:   "top_rated",
      label:  `${tutor.average_rating}★ rated by parents`,
      detail: `${tutor.total_reviews} review${tutor.total_reviews !== 1 ? "s" : ""}`,
      icon:   "Star",
    });
  }

  // Fee
  if (breakdown.raw.fee === 1.0 && req.budget_per_hour && tutor.expected_fee_per_hour) {
    reasons.push({
      type:   "fee_match",
      label:  "Within your budget",
      detail: `₹${tutor.expected_fee_per_hour}/hr`,
      icon:   "IndianRupee",
    });
  }

  // Demo class
  if (tutor.demo_class_available) {
    reasons.push({
      type:   "demo_available",
      label:  "Free demo class available",
      detail: null,
      icon:   "Video",
    });
  }

  // Teaching score
  if (tutor.teaching_score !== null && tutor.teaching_score >= 85) {
    reasons.push({
      type:   "teaching_score",
      label:  `Teaching score: ${tutor.teaching_score}%`,
      detail: "Evaluated by TutorMeet team",
      icon:   "BadgeCheck",
    });
  }

  // Return top 6 reasons, sorted: strongest category first
  const priority: Record<MatchReasonType, number> = {
    subject_specialist: 1,
    class_board_match:  2,
    availability_match: 3,
    location_match:     4,
    experience:         5,
    top_rated:          6,
    fee_match:          7,
    demo_available:     8,
    knowledge_score:    9,
    teaching_score:     10,
  };

  return reasons
    .sort((a, b) => priority[a.type] - priority[b.type])
    .slice(0, 6);
}

// ─────────────────────────────────────────────────────────────────────────────
// SECTION 4 — MAIN ENGINE
// ─────────────────────────────────────────────────────────────────────────────

export function runMatchingEngine(
  requirement:     RequirementInput,
  candidates:      TutorCandidate[],
  requirementId:   string,
  options: {
    weights?:  MatchWeights;
    topN?:     number;
    minScore?: number;   // 0–100 threshold — default 0
  } = {}
): MatchEngineOutput {
  const weights  = options.weights  ?? DEFAULT_WEIGHTS;
  const topN     = options.topN     ?? 20;
  const minScore = options.minScore ?? 0;

  // Validate weights sum ≈ 1.0
  const sum = Object.values(weights).reduce((a, b) => a + b, 0);
  if (Math.abs(sum - 1.0) > 0.01) {
    throw new Error(
      `Match weights must sum to 1.0 (got ${sum.toFixed(3)})`
    );
  }

  const results: MatchResult[] = [];
  let qualified = 0;

  for (const tutor of candidates) {
    // ── Mandatory filter ──────────────────────────────────────────────────────
    const mandatory = checkMandatory(tutor, requirement);

    if (!mandatory.pass) {
      // Still include in output so admin can see why it was excluded
      results.push({
        tutor,
        score:            0,
        breakdown:        zeroBreakdown(),
        reasons:          [],
        passedMandatory:  false,
        disqualifiedReason: mandatory.reason,
      });
      continue;
    }

    qualified++;

    // ── Component scores (0–1) ────────────────────────────────────────────────
    const raw = {
      subject:       scoreSubject(tutor,     requirement),
      classBoardExp: scoreClassBoard(tutor,  requirement),
      location:      scoreLocation(tutor,    requirement),
      availability:  scoreAvailability(tutor, requirement),
      experience:    scoreExperience(tutor),
      fee:           scoreFee(tutor,          requirement),
      rating:        scoreRating(tutor),
    };

    // ── Weighted scores ───────────────────────────────────────────────────────
    const breakdown: ScoreBreakdown = {
      subject:       raw.subject       * weights.subject,
      classBoardExp: raw.classBoardExp * weights.classBoardExp,
      location:      raw.location      * weights.location,
      availability:  raw.availability  * weights.availability,
      experience:    raw.experience    * weights.experience,
      fee:           raw.fee           * weights.fee,
      rating:        raw.rating        * weights.rating,
      raw,
    };

    // ── Total score (0–100) ───────────────────────────────────────────────────
    const total =
      breakdown.subject      +
      breakdown.classBoardExp +
      breakdown.location      +
      breakdown.availability  +
      breakdown.experience    +
      breakdown.fee           +
      breakdown.rating;

    const score = Math.min(100, Math.round(total * 1000) / 10); // 1dp

    // ── Reasons ───────────────────────────────────────────────────────────────
    const reasons = buildReasons(tutor, requirement, breakdown);

    results.push({
      tutor,
      score,
      breakdown,
      reasons,
      passedMandatory: true,
    });
  }

  // ── Sort qualified results ────────────────────────────────────────────────
  const sorted = results
    .filter((r) => r.passedMandatory && r.score >= minScore)
    .sort((a, b) => b.score - a.score)
    .slice(0, topN);

  return {
    requirementId,
    runAt:     new Date().toISOString(),
    weights,
    total:     candidates.length,
    qualified,
    results:   sorted,
  };
}

// ─────────────────────────────────────────────────────────────────────────────
// SECTION 5 — UTILITIES
// ─────────────────────────────────────────────────────────────────────────────

function zeroBreakdown(): ScoreBreakdown {
  return {
    subject: 0, classBoardExp: 0, location: 0,
    availability: 0, experience: 0, fee: 0, rating: 0,
    raw: {
      subject: 0, classBoardExp: 0, location: 0,
      availability: 0, experience: 0, fee: 0, rating: 0,
    },
  };
}

/** Extract numeric grade from "Class 10" → 10, "Nursery" → 0, etc. */
function extractGradeNumber(grade: string): number | null {
  const match = grade.match(/(\d+)/);
  return match ? parseInt(match[1]) : null;
}

/** Exported for admin UI — explains each weight dimension */
export const WEIGHT_LABELS: Record<keyof import("./types").MatchWeights, string> = {
  subject:       "Subject Expertise",
  classBoardExp: "Class & Board Experience",
  location:      "Location",
  availability:  "Availability",
  experience:    "Teaching Experience",
  fee:           "Fee Compatibility",
  rating:        "Parent Rating",
};
