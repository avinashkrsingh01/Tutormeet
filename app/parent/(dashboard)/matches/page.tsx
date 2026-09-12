import { redirect } from "next/navigation";
import Link from "next/link";
import { createClient } from "@/lib/supabase/server";
import { DashboardHeader } from "@/components/layout/DashboardShell";
import { Card } from "@/components/ui/Card";
import { Avatar } from "@/components/ui/Avatar";
import { Badge } from "@/components/ui/Badge";
import { VerifiedBadge } from "@/components/ui/Badge";
import { Button } from "@/components/ui/Button";
import { EmptyState } from "@/components/ui/EmptyState";
import { MatchScoreCard } from "@/components/matching/MatchScoreCard";
import {
  Users, MapPin, Clock, IndianRupee, Star, Video, ArrowRight,
} from "lucide-react";
import { formatINR, cn } from "@/lib/utils";
import type { Metadata } from "next";
import type { MatchReason } from "@/lib/matching/types";

export const metadata: Metadata = { title: "Recommended Tutors" };

const matchStatusLabel: Record<string, string> = {
  suggested:      "New",
  sent:           "Shortlisted",
  viewed:         "Viewed",
  demo_requested: "Demo Requested",
  demo_scheduled: "Demo Scheduled",
  demo_completed: "Demo Done",
  selected:       "Selected",
  rejected:       "Not Selected",
};

function extractProfile(raw: unknown): { full_name: string; avatar_url: string | null } {
  const p = raw as { full_name: string; avatar_url: string | null } |
                   { full_name: string; avatar_url: string | null }[];
  return Array.isArray(p) ? (p[0] ?? { full_name: "Tutor", avatar_url: null }) : p;
}

export default async function MatchesPage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  const { data: matches } = await supabase
    .from("tutor_matches")
    .select(
      `id, match_status, match_score, match_reasons, updated_at,
       tuition_requirements!inner(id, grade, subjects, parent_id, student_name),
       tutor_profiles!inner(
         id, user_id, subjects, grades, boards,
         years_of_experience, expected_fee_per_hour,
         average_rating, total_reviews, demo_class_available,
         teaching_mode, locality, city,
         knowledge_score, teaching_score,
         profiles!inner(full_name, avatar_url)
       )`
    )
    .in("match_status", [
      "suggested","sent","viewed","demo_requested",
      "demo_scheduled","demo_completed",
    ])
    .order("match_score", { ascending: false })
    .order("updated_at", { ascending: false });

  // Filter to this parent's requirements
  const myMatches = (matches ?? []).filter((m) => {
    const reqRaw = m.tuition_requirements as unknown;
    const req    = (Array.isArray(reqRaw) ? reqRaw[0] : reqRaw) as { parent_id: string } | null;
    return req?.parent_id === user.id;
  });

  return (
    <div>
      <DashboardHeader
        title="Recommended Tutors"
        description="Tutors our team has matched to your requirements using TutorMeet's matching engine."
      />

      {myMatches.length === 0 ? (
        <Card>
          <EmptyState
            icon={<Users className="h-8 w-8" />}
            title="No tutors shortlisted yet"
            description="Our team is reviewing your requirement and will shortlist suitable verified tutors within 48 hours."
            action={
              <Link href="/parent/requirements/new">
                <Button size="sm" variant="outline">Post a Requirement</Button>
              </Link>
            }
          />
        </Card>
      ) : (
        <div className="space-y-4">
          {myMatches.map((match) => {
            const tpRaw  = match.tutor_profiles as unknown;
            const tp     = (Array.isArray(tpRaw) ? tpRaw[0] : tpRaw) as {
              id: string; user_id: string; subjects: string[]; grades: string[];
              boards: string[]; years_of_experience: number;
              expected_fee_per_hour: number | null; average_rating: number | null;
              total_reviews: number; demo_class_available: boolean;
              teaching_mode: string | null; locality: string | null; city: string | null;
              knowledge_score: number | null; teaching_score: number | null;
              profiles: unknown;
            };
            const profile = extractProfile(tp.profiles);
            const reqRaw  = match.tuition_requirements as unknown;
            const req     = (Array.isArray(reqRaw) ? reqRaw[0] : reqRaw) as {
              grade: string; subjects: string[]; student_name: string | null;
            };

            // Parse stored match reasons (if available from engine)
            let reasons: MatchReason[] = [];
            try {
              if (match.match_reasons) {
                reasons = typeof match.match_reasons === "string"
                  ? JSON.parse(match.match_reasons)
                  : (match.match_reasons as MatchReason[]);
              }
            } catch { /* ignore */ }

            const score = (match.match_score as number | null) ?? null;

            return (
              <div
                key={match.id}
                className="overflow-hidden rounded-2xl border border-neutral-200 bg-white shadow-xs transition-all hover:shadow-sm"
              >
                {/* Top accent strip */}
                <div className="h-1 w-full bg-gradient-to-r from-brand-900 via-brand-700 to-accent-500" />

                <div className="flex flex-col gap-5 p-5 sm:flex-row sm:gap-6">

                  {/* ── Tutor info ──────────────────────────────────── */}
                  <div className="flex flex-1 items-start gap-4">
                    <Avatar
                      name={profile.full_name}
                      src={profile.avatar_url}
                      size="lg"
                      verified
                      className="flex-shrink-0"
                    />

                    <div className="min-w-0 flex-1">
                      {/* Name + status */}
                      <div className="flex flex-wrap items-center gap-2">
                        <h3 className="text-base font-bold text-navy-900"
                          style={{ letterSpacing: "-0.01em" }}>
                          {profile.full_name}
                        </h3>
                        <VerifiedBadge />
                        <span className={cn(
                          "badge",
                          match.match_status === "selected"  ? "badge-teal"
                          : match.match_status === "suggested" || match.match_status === "sent" ? "badge-navy"
                          : "badge-yellow"
                        )}>
                          {matchStatusLabel[match.match_status] ?? match.match_status}
                        </span>
                      </div>

                      {/* Location */}
                      {(tp.locality || tp.city) && (
                        <p className="mt-0.5 flex items-center gap-1 text-xs text-neutral-400">
                          <MapPin className="h-3 w-3" />
                          {[tp.locality, tp.city].filter(Boolean).join(", ")}
                        </p>
                      )}

                      {/* Rating */}
                      {tp.average_rating !== null && tp.total_reviews > 0 && (
                        <div className="mt-1.5 flex items-center gap-1.5">
                          <Star className="h-3.5 w-3.5 fill-amber-400 text-amber-400" />
                          <span className="text-xs font-semibold text-navy-900">
                            {tp.average_rating.toFixed(1)}
                          </span>
                          <span className="text-xs text-neutral-400">
                            ({tp.total_reviews})
                          </span>
                        </div>
                      )}

                      {/* Subject tags */}
                      <div className="mt-2.5 flex flex-wrap gap-1.5">
                        {tp.subjects.slice(0, 3).map((s) => (
                          <span key={s} className="tag">{s}</span>
                        ))}
                        {tp.subjects.length > 3 && (
                          <span className="tag text-neutral-400">+{tp.subjects.length - 3}</span>
                        )}
                      </div>

                      {/* Stats row */}
                      <div className="mt-2 flex flex-wrap gap-x-4 gap-y-1 text-xs text-neutral-500">
                        {tp.years_of_experience > 0 && (
                          <span className="flex items-center gap-1">
                            <Clock className="h-3.5 w-3.5 text-neutral-400" />
                            {tp.years_of_experience}+ yrs
                          </span>
                        )}
                        {tp.expected_fee_per_hour && (
                          <span className="flex items-center gap-1 font-semibold text-navy-800">
                            <IndianRupee className="h-3.5 w-3.5 text-neutral-400" />
                            {formatINR(tp.expected_fee_per_hour)}/hr
                          </span>
                        )}
                        {tp.demo_class_available && (
                          <span className="flex items-center gap-1 text-accent-700">
                            <Video className="h-3.5 w-3.5" />
                            Free demo
                          </span>
                        )}
                      </div>

                      {/* Teaching context */}
                      <p className="mt-2 text-xs text-neutral-400">
                        Matched for:{" "}
                        <span className="font-medium text-navy-700">
                          {req.student_name ? `${req.student_name} · ` : ""}
                          {req.grade} — {req.subjects.join(", ")}
                        </span>
                      </p>
                    </div>
                  </div>

                  {/* ── Match score ──────────────────────────────────── */}
                  <div className="w-full sm:w-56 flex-shrink-0">
                    {score !== null ? (
                      <MatchScoreCard score={score} reasons={reasons} />
                    ) : (
                      <div className="rounded-2xl border border-neutral-200 bg-neutral-50 p-4 text-center">
                        <p className="text-xs text-neutral-500">Matched by admin team</p>
                      </div>
                    )}

                    {/* CTA */}
                    <div className="mt-3 flex flex-col gap-2">
                      <Link href={`/tutors/${tp.user_id}`}>
                        <Button variant="primary" size="sm" fullWidth
                          iconRight={<ArrowRight className="h-3.5 w-3.5" />}>
                          View Full Profile
                        </Button>
                      </Link>
                      {tp.demo_class_available && (
                        <Link href={`/tutors/${tp.user_id}`}>
                          <Button variant="outline" size="sm" fullWidth
                            iconLeft={<Video className="h-3.5 w-3.5" />}>
                            Request Demo
                          </Button>
                        </Link>
                      )}
                    </div>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
