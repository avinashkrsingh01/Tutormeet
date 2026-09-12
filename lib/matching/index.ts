// Matching engine public API
export { runMatchingEngine, checkMandatory, WEIGHT_LABELS } from "./engine";
export { runMatching, fetchRequirement, fetchCandidates, persistMatches } from "./runner";
export { DEFAULT_WEIGHTS } from "./types";
export type {
  RequirementInput,
  TutorCandidate,
  MatchResult,
  MatchEngineOutput,
  MatchWeights,
  ScoreBreakdown,
  MatchReason,
  MatchReasonType,
} from "./types";
