// ============================================================
// TutorMeet — Matching Engine Types
// ============================================================

// ─── Weight configuration ─────────────────────────────────────────────────────
// All weights must sum to 1.0.
// Designed to be swapped at runtime (e.g. A/B testing, admin override).

export interface MatchWeights {
  subject:      number;   // 0.25 — subject expertise match
  classBoardExp: number;  // 0.20 — grade + board experience
  location:     number;   // 0.20 — city/locality proximity
  availability: number;   // 0.15 — day + time slot overlap
  experience:   number;   // 0.10 — years of teaching
  fee:          number;   // 0.05 — fee within parent budget
  rating:       number;   // 0.05 — tutor rating + reviews
}

export const DEFAULT_WEIGHTS: MatchWeights = {
  subject:       0.25,
  classBoardExp: 0.20,
  location:      0.20,
  availability:  0.15,
  experience:    0.10,
  fee:           0.05,
  rating:        0.05,
};

// ─── Input: what the parent needs ─────────────────────────────────────────────

export interface RequirementInput {
  subjects:              string[];
  grade:                 string;
  board:                 string;
  teaching_mode:         string;
  preferred_days:        string[];
  preferred_time_slots:  string[];
  city:                  string;
  locality:              string;
  budget_per_hour:       number | null;
  preferred_tutor_gender: string;   // "male" | "female" | "no_preference"
}

// ─── Input: tutor candidate data ──────────────────────────────────────────────
// Only safe public fields — NO private data used for scoring.

export interface TutorCandidate {
  id:                    string;   // tutor_profiles.id (UUID)
  user_id:               string;   // auth user id
  full_name:             string;
  avatar_url:            string | null;
  verification_status:   string;
  gender:                string | null;  // used for mandatory filter only

  // Teaching capabilities
  subjects:              string[];
  grades:                string[];
  boards:                string[];
  teaching_mode:         string | null;
  preferred_days:        string[];
  preferred_time_slots:  string[];

  // Location (locality + city; NO pincode)
  locality:              string | null;
  city:                  string | null;
  max_travel_distance_km: number | null;

  // Fee + experience
  expected_fee_per_hour: number | null;
  years_of_experience:   number;

  // Quality signals
  average_rating:        number | null;
  total_reviews:         number;
  knowledge_score:       number | null;
  teaching_score:        number | null;
  demo_class_available:  boolean;
}

// ─── Score breakdown ──────────────────────────────────────────────────────────

export interface ScoreBreakdown {
  subject:       number;   // 0–1, weighted contribution
  classBoardExp: number;
  location:      number;
  availability:  number;
  experience:    number;
  fee:           number;
  rating:        number;
  // Raw (pre-weight) component scores for transparency
  raw: {
    subject:       number;  // 0–1
    classBoardExp: number;
    location:      number;
    availability:  number;
    experience:    number;
    fee:           number;
    rating:        number;
  };
}

// ─── Match reason line ────────────────────────────────────────────────────────

export type MatchReasonType =
  | "subject_specialist"
  | "class_board_match"
  | "location_match"
  | "availability_match"
  | "experience"
  | "top_rated"
  | "fee_match"
  | "demo_available"
  | "knowledge_score"
  | "teaching_score";

export interface MatchReason {
  type:   MatchReasonType;
  label:  string;           // e.g. "Mathematics specialist"
  detail: string | null;    // e.g. "Class 10 CBSE experience" or null
  icon:   string;           // lucide icon name
}

// ─── Final match result ───────────────────────────────────────────────────────

export interface MatchResult {
  tutor:       TutorCandidate;
  score:       number;            // 0–100 rounded to 1dp
  breakdown:   ScoreBreakdown;
  reasons:     MatchReason[];     // ordered: strongest first (max 6)
  passedMandatory: boolean;
  disqualifiedReason?: string;    // why tutor failed mandatory check
}

export interface MatchEngineOutput {
  requirementId: string;
  runAt:         string;          // ISO timestamp
  weights:       MatchWeights;
  total:         number;          // tutors evaluated
  qualified:     number;          // passed mandatory filters
  results:       MatchResult[];   // sorted by score desc
}
