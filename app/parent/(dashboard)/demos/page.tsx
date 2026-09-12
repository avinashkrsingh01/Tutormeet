import { redirect } from "next/navigation";
import Link from "next/link";
import type { Metadata } from "next";
import {
  Video, MapPin, Clock, ExternalLink, CheckCircle2,
  AlertCircle, ArrowRight,
} from "lucide-react";
import { createClient } from "@/lib/supabase/server";
import { DashboardHeader } from "@/components/layout/DashboardShell";
import { Card } from "@/components/ui/Card";
import { Avatar } from "@/components/ui/Avatar";
import { Button } from "@/components/ui/Button";
import { EmptyState } from "@/components/ui/EmptyState";
import { DemoStatusBadge } from "@/components/ui/StatusBadge";
import { formatDate } from "@/lib/utils";
import { cn } from "@/lib/utils";
import type { DemoStatus } from "@/types/requirement";

export const metadata: Metadata = { title: "Demo Classes" };

function extractProfile(raw: unknown): { full_name: string; avatar_url: string | null } {
  const tp = (Array.isArray(raw) ? raw[0] : raw) as {
    profiles: { full_name: string; avatar_url: string | null } |
              { full_name: string; avatar_url: string | null }[];
  } | null;
  if (!tp) return { full_name: "Tutor", avatar_url: null };
  const p = tp.profiles;
  return Array.isArray(p) ? (p[0] ?? { full_name: "Tutor", avatar_url: null }) : p;
}

const statusMeta: Record<string, { label: string; color: string; bg: string }> = {
  requested:      { label: "Requested",      color: "text-brand-700", bg: "bg-brand-50 border-brand-200" },
  tutor_accepted: { label: "Tutor Accepted",  color: "text-blue-700",  bg: "bg-blue-50 border-blue-200" },
  scheduled:      { label: "Scheduled",       color: "text-accent-700",bg: "bg-accent-50 border-accent-200" },
  completed:      { label: "Completed",       color: "text-emerald-700",bg: "bg-emerald-50 border-emerald-200" },
  cancelled:      { label: "Cancelled",       color: "text-neutral-600",bg: "bg-neutral-50 border-neutral-200" },
  no_show:        { label: "No Show",         color: "text-amber-700", bg: "bg-amber-50 border-amber-200" },
};

export default async function DemosPage() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  const { data: demos } = await supabase
    .from("demo_classes")
    .select(
      `id, status, scheduled_at, duration_minutes, meeting_link,
       delivery_method, parent_rating, wants_to_continue, student_name, created_at,
       tutor_profiles!inner(id, user_id, subjects, profiles!inner(full_name, avatar_url))`
      // SECURITY: venue_address intentionally excluded from this list query
    )
    .eq("parent_id", user.id)
    .order("created_at", { ascending: false });

  const active    = demos?.filter((d) => ["requested","tutor_accepted","scheduled"].includes(d.status)) ?? [];
  const completed = demos?.filter((d) => d.status === "completed") ?? [];
  const others    = demos?.filter((d) => ["cancelled","no_show"].includes(d.status)) ?? [];

  // Demos needing feedback
  const needsFeedback = completed.filter((d) => d.parent_rating === null);

  return (
    <div>
      <DashboardHeader
        title="Demo Classes"
        description="Free demo sessions with shortlisted tutors."
      />

      {/* Feedback alert */}
      {needsFeedback.length > 0 && (
        <div className="mb-5 flex items-start gap-3 rounded-2xl border border-amber-200 bg-amber-50 px-5 py-4">
          <AlertCircle className="mt-0.5 h-5 w-5 flex-shrink-0 text-amber-600" />
          <div className="flex-1">
            <p className="text-sm font-semibold text-amber-900">
              {needsFeedback.length === 1
                ? "1 demo class needs your feedback"
                : `${needsFeedback.length} demo classes need your feedback`}
            </p>
            <p className="mt-0.5 text-xs text-amber-700">
              Please rate your demo session so we can help you find the right tutor.
            </p>
          </div>
          <Link href={`/parent/demos/${needsFeedback[0].id}`}>
            <Button variant="primary" size="sm">
              Rate Now <ArrowRight className="h-3.5 w-3.5" />
            </Button>
          </Link>
        </div>
      )}

      {(!demos || demos.length === 0) ? (
        <Card>
          <EmptyState
            icon={<Video className="h-8 w-8" />}
            title="No demo classes yet"
            description="Once tutors are shortlisted for your requirement, TutorMeet will schedule free demo classes."
          />
        </Card>
      ) : (
        <div className="space-y-8">

          {/* Active / upcoming */}
          {active.length > 0 && (
            <section>
              <h2 className="mb-3 text-sm font-bold text-navy-900">Upcoming &amp; Requested</h2>
              <div className="space-y-3">
                {active.map((demo) => {
                  const profile = extractProfile(demo.tutor_profiles);
                  const meta    = statusMeta[demo.status] ?? statusMeta.scheduled;
                  return (
                    <Link key={demo.id} href={`/parent/demos/${demo.id}`}>
                      <Card padding="md" hover>
                        <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
                          <div className="flex items-start gap-4">
                            <div className="flex h-11 w-11 flex-shrink-0 items-center justify-center rounded-xl bg-brand-50 text-brand-700">
                              <Video className="h-5 w-5" />
                            </div>
                            <div>
                              <p className="font-semibold text-navy-900">
                                Demo with {profile.full_name}
                              </p>
                              <div className="mt-0.5 flex flex-wrap gap-x-3 gap-y-0.5 text-xs text-neutral-500">
                                {demo.scheduled_at ? (
                                  <span className="flex items-center gap-1">
                                    <Clock className="h-3.5 w-3.5" />
                                    {formatDate(demo.scheduled_at)} · {demo.duration_minutes} min
                                  </span>
                                ) : (
                                  <span className="text-neutral-400">Awaiting schedule</span>
                                )}
                                {demo.delivery_method && (
                                  <span className="flex items-center gap-1 capitalize">
                                    {demo.delivery_method.replace("_", " ")}
                                  </span>
                                )}
                              </div>
                              {demo.student_name && (
                                <p className="mt-1 text-xs text-neutral-400">
                                  For: {demo.student_name}
                                </p>
                              )}
                            </div>
                          </div>
                          <div className="flex flex-shrink-0 flex-col items-start gap-2 sm:items-end">
                            <span className={cn("badge text-xs font-semibold", meta.bg, meta.color)}>
                              {meta.label}
                            </span>
                            {demo.meeting_link && demo.status === "scheduled" && (
                              <a
                                href={demo.meeting_link}
                                target="_blank"
                                rel="noopener noreferrer"
                                onClick={(e) => e.stopPropagation()}
                                className="flex items-center gap-1 text-xs font-semibold text-brand-700 hover:text-brand-800"
                              >
                                <ExternalLink className="h-3.5 w-3.5" /> Join online
                              </a>
                            )}
                          </div>
                        </div>

                        {demo.status === "scheduled" && (
                          <div className="mt-3 flex items-start gap-2 rounded-xl border border-accent-200 bg-accent-50 px-3 py-2.5">
                            <CheckCircle2 className="mt-0.5 h-4 w-4 flex-shrink-0 text-accent-600" />
                            <p className="text-xs text-accent-800">
                              Your home address is only shared with the tutor once this demo is confirmed.
                            </p>
                          </div>
                        )}
                      </Card>
                    </Link>
                  );
                })}
              </div>
            </section>
          )}

          {/* Completed */}
          {completed.length > 0 && (
            <section>
              <h2 className="mb-3 text-sm font-bold text-navy-900">Completed Demos</h2>
              <div className="space-y-3">
                {completed.map((demo) => {
                  const profile  = extractProfile(demo.tutor_profiles);
                  const hasFeedback = demo.parent_rating !== null;
                  return (
                    <Link key={demo.id} href={`/parent/demos/${demo.id}`}>
                      <Card padding="md" hover>
                        <div className="flex items-center justify-between gap-4">
                          <div className="flex items-center gap-3">
                            <Avatar name={profile.full_name} src={profile.avatar_url} size="md" />
                            <div>
                              <p className="text-sm font-semibold text-navy-900">
                                Demo with {profile.full_name}
                              </p>
                              <p className="text-xs text-neutral-500">
                                {demo.scheduled_at ? formatDate(demo.scheduled_at) : "—"}
                                {demo.duration_minutes && ` · ${demo.duration_minutes} min`}
                              </p>
                            </div>
                          </div>
                          <div className="flex flex-col items-end gap-1.5">
                            {hasFeedback ? (
                              <>
                                <div className="flex gap-0.5">
                                  {[1,2,3,4,5].map((s) => (
                                    <span key={s} className={`text-sm ${s <= (demo.parent_rating ?? 0) ? "text-amber-400" : "text-neutral-200"}`}>★</span>
                                  ))}
                                </div>
                                {demo.wants_to_continue !== null && (
                                  <span className={`text-xs font-medium ${demo.wants_to_continue ? "text-accent-600" : "text-neutral-500"}`}>
                                    {demo.wants_to_continue ? "✓ Enrolled" : "Tried another"}
                                  </span>
                                )}
                              </>
                            ) : (
                              <span className="badge-yellow text-xs">Feedback needed</span>
                            )}
                          </div>
                        </div>
                      </Card>
                    </Link>
                  );
                })}
              </div>
            </section>
          )}

          {/* Cancelled / no-show */}
          {others.length > 0 && (
            <section>
              <h2 className="mb-3 text-sm font-bold text-navy-900">Cancelled &amp; No-show</h2>
              <div className="space-y-2">
                {others.map((demo) => {
                  const profile = extractProfile(demo.tutor_profiles);
                  return (
                    <Link key={demo.id} href={`/parent/demos/${demo.id}`}>
                      <Card padding="md" hover className="opacity-70">
                        <div className="flex items-center justify-between gap-4">
                          <div className="flex items-center gap-3">
                            <Avatar name={profile.full_name} src={profile.avatar_url} size="sm" />
                            <p className="text-sm text-neutral-700">
                              Demo with {profile.full_name}
                              {demo.scheduled_at && ` · ${formatDate(demo.scheduled_at)}`}
                            </p>
                          </div>
                          <DemoStatusBadge
                            status={demo.status as "cancelled" | "no_show"}
                          />
                        </div>
                      </Card>
                    </Link>
                  );
                })}
              </div>
            </section>
          )}
        </div>
      )}
    </div>
  );
}
