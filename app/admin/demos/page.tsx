import { redirect } from "next/navigation";
import Link from "next/link";
import type { Metadata } from "next";
import { createClient } from "@/lib/supabase/server";
import { requireAdminPermission } from "@/lib/admin-auth";
import { DashboardHeader } from "@/components/layout/DashboardShell";
import { Card } from "@/components/ui/Card";
import { Avatar } from "@/components/ui/Avatar";
import { Badge } from "@/components/ui/Badge";
import { EmptyState } from "@/components/ui/EmptyState";
import { Video, Clock, Star, ArrowRight, CheckCircle2, XCircle } from "lucide-react";
import { formatDate } from "@/lib/utils";
import type { Metadata as NextMetadata } from "next";

export const metadata: NextMetadata = { title: "Demo Classes — Admin" };

interface PageProps {
  searchParams: Promise<{ status?: string }>;
}

const filterOptions = [
  { label: "All Active",     value: "" },
  { label: "Requested",      value: "requested" },
  { label: "Tutor Accepted", value: "tutor_accepted" },
  { label: "Scheduled",      value: "scheduled" },
  { label: "Completed",      value: "completed" },
  { label: "Cancelled",      value: "cancelled" },
  { label: "No Show",        value: "no_show" },
];

const statusVariant: Record<string, "navy" | "blue" | "teal" | "green" | "yellow" | "red" | "gray"> = {
  requested:      "navy",
  tutor_accepted: "blue",
  scheduled:      "teal",
  completed:      "green",
  cancelled:      "gray",
  no_show:        "yellow",
};

function extractProfile(raw: unknown): { full_name: string; avatar_url: string | null } {
  const tp = (Array.isArray(raw) ? raw[0] : raw) as {
    profiles: { full_name: string; avatar_url: string | null } |
              { full_name: string; avatar_url: string | null }[];
  } | null;
  if (!tp) return { full_name: "Tutor", avatar_url: null };
  const p = tp.profiles;
  return Array.isArray(p) ? (p[0] ?? { full_name: "Tutor", avatar_url: null }) : p;
}

export default async function AdminDemosPage({ searchParams }: PageProps) {
  await requireAdminPermission("view_demos");

  const { status: filterStatus } = await searchParams;
  const supabase = await createClient();

  let query = supabase
    .from("demo_classes")
    .select(
      `id, status, scheduled_at, duration_minutes, delivery_method,
       meeting_link, parent_rating, wants_to_continue,
       student_name, created_at, updated_at,
       tutor_profiles!inner(id, user_id, profiles!inner(full_name, avatar_url)),
       profiles!inner(full_name, phone)`
      // SECURITY: venue_address not selected in list view
    )
    .order("created_at", { ascending: false });

  if (filterStatus) {
    query = query.eq("status", filterStatus);
  } else {
    query = query.in("status", ["requested","tutor_accepted","scheduled"]);
  }

  const { data: demos } = await query;

  // Stats
  const { data: stats } = await supabase
    .from("demo_classes")
    .select("status")
    .in("status", ["requested","tutor_accepted","scheduled","completed"]);

  const counts = (stats ?? []).reduce<Record<string, number>>((acc, d) => {
    acc[d.status] = (acc[d.status] ?? 0) + 1;
    return acc;
  }, {});

  return (
    <div>
      <DashboardHeader
        title="Demo Classes"
        description="Manage and schedule demo sessions between parents and tutors."
      />

      {/* Quick stats */}
      <div className="mb-5 grid grid-cols-2 gap-3 sm:grid-cols-4">
        {[
          { label: "Requested",  value: counts.requested     ?? 0, color: "bg-brand-50 text-brand-700" },
          { label: "Accepted",   value: counts.tutor_accepted ?? 0, color: "bg-blue-50 text-blue-700" },
          { label: "Scheduled",  value: counts.scheduled     ?? 0, color: "bg-accent-50 text-accent-700" },
          { label: "Completed",  value: counts.completed     ?? 0, color: "bg-emerald-50 text-emerald-700" },
        ].map((stat) => (
          <div key={stat.label} className={`flex flex-col gap-1 rounded-2xl border p-4 ${stat.color} border-current/20`}>
            <p className="text-2xl font-extrabold" style={{ letterSpacing: "-0.04em" }}>
              {stat.value}
            </p>
            <p className="text-xs font-semibold">{stat.label}</p>
          </div>
        ))}
      </div>

      {/* Filter tabs */}
      <div className="mb-5 flex flex-wrap gap-2">
        {filterOptions.map((opt) => (
          <Link
            key={opt.value}
            href={opt.value ? `/admin/demos?status=${opt.value}` : "/admin/demos"}
          >
            <span className={`inline-flex cursor-pointer items-center rounded-full px-3 py-1.5 text-xs font-semibold transition-colors ${
              (filterStatus ?? "") === opt.value
                ? "bg-brand-900 text-white"
                : "bg-neutral-100 text-neutral-600 hover:bg-neutral-200"
            }`}>
              {opt.label}
            </span>
          </Link>
        ))}
      </div>

      {!demos || demos.length === 0 ? (
        <Card>
          <EmptyState
            icon={<Video className="h-8 w-8" />}
            title="No demos in this status"
            description="Demos will appear here once parents request them."
          />
        </Card>
      ) : (
        <div className="space-y-3">
          {demos.map((demo) => {
            const tutorProfile = extractProfile(demo.tutor_profiles);
            const parentRaw    = demo.profiles as unknown;
            const parent       = (Array.isArray(parentRaw) ? parentRaw[0] : parentRaw) as
              { full_name: string; phone: string | null } | null;
            const variant      = statusVariant[demo.status] ?? "gray";

            const daysSinceRequest = Math.floor(
              (Date.now() - new Date(demo.created_at).getTime()) / 86400000
            );
            const isUrgent = demo.status === "requested" && daysSinceRequest >= 1;

            return (
              <Link key={demo.id} href={`/admin/demos/${demo.id}`}>
                <div className={`flex flex-col gap-4 overflow-hidden rounded-2xl border bg-white p-5 transition-all hover:shadow-sm sm:flex-row sm:items-center sm:justify-between ${
                  isUrgent ? "border-amber-200 bg-amber-50/30" : "border-neutral-200"
                }`}>
                  <div className="flex items-start gap-4">
                    {/* Tutor */}
                    <div className="flex items-center gap-3">
                      <Avatar name={tutorProfile.full_name} src={tutorProfile.avatar_url} size="md" />
                      <div>
                        <p className="text-sm font-bold text-navy-900">{tutorProfile.full_name}</p>
                        <p className="text-xs text-neutral-500">
                          Parent: {parent?.full_name ?? "—"}
                        </p>
                        {demo.student_name && (
                          <p className="text-xs text-neutral-400">For: {demo.student_name}</p>
                        )}
                      </div>
                    </div>
                  </div>

                  <div className="flex flex-wrap items-center gap-3">
                    {/* Schedule info */}
                    {demo.scheduled_at ? (
                      <span className="flex items-center gap-1.5 text-xs text-neutral-600">
                        <Clock className="h-3.5 w-3.5 text-neutral-400" />
                        {formatDate(demo.scheduled_at)} · {demo.duration_minutes} min
                      </span>
                    ) : (
                      <span className="text-xs text-neutral-400">
                        Requested {daysSinceRequest === 0 ? "today" : `${daysSinceRequest}d ago`}
                        {isUrgent && " ⚠️"}
                      </span>
                    )}

                    {/* Feedback (if completed) */}
                    {demo.status === "completed" && (
                      <span className="flex items-center gap-1 text-xs">
                        {demo.parent_rating ? (
                          <>
                            <Star className="h-3.5 w-3.5 fill-amber-400 text-amber-400" />
                            <span className="font-semibold">{demo.parent_rating}★</span>
                            {demo.wants_to_continue !== null && (
                              demo.wants_to_continue
                                ? <CheckCircle2 className="h-3.5 w-3.5 text-accent-500" />
                                : <XCircle className="h-3.5 w-3.5 text-neutral-400" />
                            )}
                          </>
                        ) : (
                          <span className="text-neutral-400">No feedback yet</span>
                        )}
                      </span>
                    )}

                    <Badge variant={variant}>
                      {demo.status.charAt(0).toUpperCase() + demo.status.slice(1).replace("_", " ")}
                    </Badge>

                    <ArrowRight className="h-4 w-4 text-neutral-300" />
                  </div>
                </div>
              </Link>
            );
          })}
        </div>
      )}
    </div>
  );
}
