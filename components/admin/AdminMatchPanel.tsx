"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { Shuffle, Plus, Trash2, ChevronDown, ChevronUp, BarChart3 } from "lucide-react";
import { Avatar } from "@/components/ui/Avatar";
import { Badge } from "@/components/ui/Badge";
import { Button } from "@/components/ui/Button";
import { Alert } from "@/components/ui/Alert";
import { Card } from "@/components/ui/Card";
import { MatchScoreCard, MatchBreakdownBar } from "@/components/matching/MatchScoreCard";
import { formatINR, cn } from "@/lib/utils";
import type { MatchReason } from "@/lib/matching/types";

// ─── Types ────────────────────────────────────────────────────────────────────

interface EngineResult {
  tutor: {
    id:                    string;
    user_id:               string;
    full_name:             string;
    avatar_url:            string | null;
    subjects:              string[];
    grades:                string[];
    locality:              string | null;
    city:                  string | null;
    years_of_experience:   number;
    expected_fee_per_hour: number | null;
    average_rating:        number | null;
    total_reviews:         number;
    knowledge_score:       number | null;
    teaching_score:        number | null;
    demo_class_available:  boolean;
  };
  score:           number;
  reasons:         MatchReason[];
  passedMandatory: boolean;
  breakdown:       Record<string, number>;
}

interface EngineOutput {
  total:     number;
  qualified: number;
  results:   EngineResult[];
  run_at:    string;
  weights:   Record<string, number>;
}

export interface ExistingMatch {
  id:           string;
  match_status: string;
  tutor_profiles: {
    id:        string;
    user_id:   string;
    subjects:  string[];
    years_of_experience: number;
    expected_fee_per_hour: number | null;
    profiles:  { full_name: string; avatar_url: string | null } |
               { full_name: string; avatar_url: string | null }[];
  } | {
    id:        string;
    user_id:   string;
    subjects:  string[];
    years_of_experience: number;
    expected_fee_per_hour: number | null;
    profiles:  { full_name: string; avatar_url: string | null } |
               { full_name: string; avatar_url: string | null }[];
  }[];
}

interface AdminMatchPanelProps {
  requirementId:   string;
  existingMatches: ExistingMatch[];
  availableTutors: Record<string, unknown>[];  // legacy simple list (fallback)
}

const matchStatusConfig: Record<string, { label: string; variant: "blue" | "teal" | "yellow" | "orange" | "gray" | "green" | "red" }> = {
  suggested:      { label: "Suggested",      variant: "blue"   },
  sent:           { label: "Sent",           variant: "blue"   },
  viewed:         { label: "Viewed",         variant: "yellow" },
  demo_requested: { label: "Demo Requested", variant: "orange" },
  demo_scheduled: { label: "Demo Scheduled", variant: "yellow" },
  demo_completed: { label: "Demo Done",      variant: "teal"   },
  selected:       { label: "Selected",       variant: "green"  },
  rejected:       { label: "Rejected",       variant: "red"    },
};

// ─── Component ────────────────────────────────────────────────────────────────

export function AdminMatchPanel({
  requirementId,
  existingMatches,
}: AdminMatchPanelProps) {
  const router = useRouter();
  const [error,       setError]       = useState<string | null>(null);
  const [success,     setSuccess]     = useState<string | null>(null);
  const [engineOutput, setEngineOutput] = useState<EngineOutput | null>(null);
  const [expandedId,  setExpandedId]  = useState<string | null>(null);
  const [removingId,  setRemovingId]  = useState<string | null>(null);
  const [isPending,   startTransition] = useTransition();
  const [isRunning,   startRunning]    = useTransition();

  // ── Run matching engine ─────────────────────────────────────────────────────
  function runEngine(persist: boolean) {
    setError(null); setSuccess(null);
    startRunning(async () => {
      const res = await fetch("/api/admin/match", {
        method:  "POST",
        headers: { "Content-Type": "application/json" },
        body:    JSON.stringify({
          requirement_id: requirementId,
          persist,
          top_n:          10,
          min_score:      40,
        }),
      });
      const json = await res.json();
      if (!res.ok) { setError(json.error ?? "Engine error."); return; }
      setEngineOutput(json);
      if (persist) {
        setSuccess(`${json.persisted?.inserted ?? 0} tutor(s) added to shortlist.`);
        router.refresh();
      }
    });
  }

  // ── Remove a match ──────────────────────────────────────────────────────────
  async function removeMatch(matchId: string) {
    setError(null);
    setRemovingId(matchId);
    startTransition(async () => {
      const res = await fetch(`/api/admin/matches/${matchId}`, { method: "DELETE" });
      if (!res.ok) { setError("Failed to remove match."); }
      else { router.refresh(); }
      setRemovingId(null);
    });
  }

  // ── Add a single tutor from engine results ──────────────────────────────────
  function addSingleTutor(tutorId: string) {
    startTransition(async () => {
      const res = await fetch("/api/admin/matches", {
        method:  "POST",
        headers: { "Content-Type": "application/json" },
        body:    JSON.stringify({ requirement_id: requirementId, tutor_id: tutorId }),
      });
      const json = await res.json();
      if (!res.ok) { setError(json.error ?? "Failed to add match."); }
      else { router.refresh(); }
    });
  }

  const existingTutorIds = new Set(
    existingMatches.map((m) => {
      const tp = Array.isArray(m.tutor_profiles) ? m.tutor_profiles[0] : m.tutor_profiles;
      return tp?.id ?? "";
    })
  );

  return (
    <div className="space-y-6">
      {error   && <Alert variant="error"   message={error}   />}
      {success && <Alert variant="success" message={success} />}

      {/* ── Engine controls ──────────────────────────────────────── */}
      <Card variant="filled" padding="md">
        <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
          <div>
            <h3 className="text-sm font-bold text-navy-900">Matching Engine</h3>
            <p className="mt-0.5 text-xs text-neutral-500">
              Deterministic algorithm — scores tutors across 7 dimensions.
            </p>
          </div>
          <div className="flex flex-wrap gap-2">
            <Button
              variant="outline" size="sm"
              loading={isRunning}
              iconLeft={<BarChart3 className="h-4 w-4" />}
              onClick={() => runEngine(false)}
            >
              Preview Matches
            </Button>
            <Button
              variant="primary" size="sm"
              loading={isRunning}
              iconLeft={<Shuffle className="h-4 w-4" />}
              onClick={() => runEngine(true)}
            >
              Run &amp; Shortlist
            </Button>
          </div>
        </div>

        {/* Engine results */}
        {engineOutput && (
          <div className="mt-4 border-t border-neutral-200 pt-4">
            <div className="mb-3 flex flex-wrap gap-4 text-xs text-neutral-600">
              <span>Evaluated: <strong className="text-navy-900">{engineOutput.total}</strong></span>
              <span>Qualified: <strong className="text-navy-900">{engineOutput.qualified}</strong></span>
              <span>Results: <strong className="text-navy-900">{engineOutput.results.length}</strong></span>
            </div>

            <div className="space-y-3">
              {engineOutput.results.map((r, i) => {
                const alreadyAdded = existingTutorIds.has(r.tutor.id);
                const isExpanded   = expandedId === r.tutor.id;

                return (
                  <div
                    key={r.tutor.id}
                    className={cn(
                      "rounded-xl border bg-white transition-all",
                      alreadyAdded ? "border-accent-200 opacity-60" : "border-neutral-200"
                    )}
                  >
                    <div className="flex items-center gap-3 p-3.5">
                      {/* Rank */}
                      <span className="flex h-6 w-6 flex-shrink-0 items-center justify-center rounded-full bg-brand-100 text-xs font-bold text-brand-800">
                        {i + 1}
                      </span>

                      <Avatar name={r.tutor.full_name} src={r.tutor.avatar_url} size="sm" />

                      <div className="min-w-0 flex-1">
                        <div className="flex flex-wrap items-center gap-2">
                          <p className="text-sm font-semibold text-navy-900">{r.tutor.full_name}</p>
                          <MatchScoreCard score={r.score} reasons={[]} compact />
                        </div>
                        <p className="text-xs text-neutral-500">
                          {r.tutor.subjects.slice(0, 2).join(", ")}
                          {r.tutor.years_of_experience > 0 && ` · ${r.tutor.years_of_experience}yr exp`}
                          {r.tutor.expected_fee_per_hour && ` · ${formatINR(r.tutor.expected_fee_per_hour)}/hr`}
                          {r.tutor.locality && ` · ${r.tutor.locality}`}
                        </p>
                      </div>

                      <div className="flex flex-shrink-0 items-center gap-1.5">
                        <button
                          type="button"
                          onClick={() => setExpandedId(isExpanded ? null : r.tutor.id)}
                          className="rounded-lg p-1 text-neutral-400 hover:bg-neutral-100 hover:text-navy-900 transition-colors"
                          title="Show breakdown"
                        >
                          {isExpanded
                            ? <ChevronUp className="h-4 w-4" />
                            : <ChevronDown className="h-4 w-4" />}
                        </button>
                        {!alreadyAdded && (
                          <Button
                            variant="teal" size="xs"
                            iconLeft={<Plus className="h-3.5 w-3.5" />}
                            onClick={() => addSingleTutor(r.tutor.id)}
                            disabled={isPending}
                          >
                            Add
                          </Button>
                        )}
                        {alreadyAdded && (
                          <span className="badge-teal text-xs">Added</span>
                        )}
                      </div>
                    </div>

                    {/* Expanded: reasons + breakdown */}
                    {isExpanded && (
                      <div className="border-t border-neutral-100 px-4 pb-4 pt-3 space-y-4">
                        {/* Match reasons */}
                        <MatchScoreCard
                          score={r.score}
                          reasons={r.reasons}
                          className="border-0 bg-transparent p-0"
                        />
                        {/* Score breakdown bar */}
                        <div>
                          <p className="mb-2 text-xs font-semibold text-neutral-500">Score breakdown</p>
                          <MatchBreakdownBar breakdown={r.breakdown} />
                        </div>
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          </div>
        )}
      </Card>

      {/* ── Current shortlist ──────────────────────────────────────── */}
      <div>
        <h3 className="mb-3 text-sm font-bold text-navy-900">
          Shortlisted Tutors ({existingMatches.length})
        </h3>

        {existingMatches.length === 0 ? (
          <p className="text-sm text-neutral-400">No tutors shortlisted yet. Run the engine above.</p>
        ) : (
          <div className="space-y-2">
            {existingMatches.map((match) => {
              const tpRaw = Array.isArray(match.tutor_profiles)
                ? match.tutor_profiles[0]
                : match.tutor_profiles;
              const profileRaw = tpRaw?.profiles;
              const profile    = (Array.isArray(profileRaw) ? profileRaw[0] : profileRaw) as
                { full_name: string; avatar_url: string | null } | null;
              const cfg = matchStatusConfig[match.match_status] ?? { label: match.match_status, variant: "gray" as const };

              return (
                <div key={match.id} className="flex items-center justify-between gap-3 rounded-xl border border-neutral-200 bg-white p-3.5">
                  <div className="flex items-center gap-3">
                    <Avatar name={profile?.full_name ?? "T"} src={profile?.avatar_url} size="sm" />
                    <div>
                      <p className="text-sm font-semibold text-navy-900">{profile?.full_name ?? "Tutor"}</p>
                      <p className="text-xs text-neutral-500">
                        {(tpRaw?.subjects as string[] | undefined)?.slice(0, 2).join(", ") ?? ""}
                        {(tpRaw?.expected_fee_per_hour as number | undefined)
                          ? ` · ${formatINR(tpRaw.expected_fee_per_hour as number)}/hr`
                          : ""}
                      </p>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <Badge variant={cfg.variant}>{cfg.label}</Badge>
                    <button
                      type="button"
                      onClick={() => removeMatch(match.id)}
                      disabled={isPending && removingId === match.id}
                      className="rounded-lg p-1.5 text-neutral-400 hover:bg-red-50 hover:text-red-500 transition-colors"
                      title="Remove"
                    >
                      <Trash2 className="h-4 w-4" />
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}
