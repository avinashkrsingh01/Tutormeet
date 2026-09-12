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
import { StarDisplay, VerifiedReviewBadge } from "@/components/reviews/ReviewCard";
import { Star, AlertTriangle, ArrowRight } from "lucide-react";
import { formatDate } from "@/lib/utils";
import { cn } from "@/lib/utils";

export const metadata: Metadata = { title: "Reviews — Admin" };

interface PageProps {
  searchParams: Promise<{ status?: string }>;
}

const filterOptions = [
  { label: "Pending",       value: "pending"       },
  { label: "Reported",      value: "reported"       },
  { label: "Investigating", value: "investigating"  },
  { label: "Published",     value: "published"      },
  { label: "Hidden",        value: "hidden"         },
  { label: "All",           value: "all"            },
];

const statusVariant: Record<string, "yellow" | "red" | "teal" | "gray" | "blue"> = {
  pending:       "yellow",
  reported:      "red",
  investigating: "blue",
  published:     "teal",
  hidden:        "gray",
};

export default async function AdminReviewsPage({ searchParams }: PageProps) {
  await requireAdminPermission("moderate_reviews");

  const { status: filterStatus } = await searchParams;
  const activeFilter = filterStatus ?? "pending";
  const supabase = await createClient();

  let query = supabase
    .from("reviews")
    .select(
      `id, overall_rating, comment, status, is_verified_review,
       rating_teaching_quality, rating_subject_knowledge,
       rating_punctuality, rating_communication, rating_professionalism,
       report_reason, reported_at, published_at, created_at,
       tutor_profiles!inner(id, user_id, profiles!inner(full_name, avatar_url)),
       profiles!inner(full_name, avatar_url),
       students(full_name)`
    )
    .order("created_at", { ascending: false });

  if (activeFilter !== "all") {
    query = query.eq("status", activeFilter);
  }

  const { data: reviews } = await query;

  // Stats
  const { data: statRows } = await supabase
    .from("reviews")
    .select("status")
    .in("status", ["pending","reported","investigating","published","hidden"]);

  const counts = (statRows ?? []).reduce<Record<string, number>>((acc, r) => {
    acc[r.status] = (acc[r.status] ?? 0) + 1;
    return acc;
  }, {});

  return (
    <div>
      <DashboardHeader
        title="Reviews"
        description="Moderate submitted reviews. Approve, hide, or investigate reports."
      />

      {/* Stats */}
      <div className="mb-5 grid grid-cols-2 gap-3 sm:grid-cols-5">
        {[
          { label: "Pending",       key: "pending",       color: "bg-amber-50  text-amber-700  border-amber-200" },
          { label: "Reported",      key: "reported",      color: "bg-red-50    text-red-700    border-red-200"  },
          { label: "Investigating", key: "investigating", color: "bg-blue-50   text-blue-700   border-blue-200" },
          { label: "Published",     key: "published",     color: "bg-accent-50 text-accent-700 border-accent-200" },
          { label: "Hidden",        key: "hidden",        color: "bg-neutral-50 text-neutral-600 border-neutral-200" },
        ].map((s) => (
          <Link key={s.key} href={`/admin/reviews?status=${s.key}`}>
            <div className={cn("rounded-2xl border p-3.5 transition-all hover:shadow-sm", s.color,
              activeFilter === s.key && "ring-2 ring-current ring-offset-1")}>
              <p className="text-2xl font-extrabold" style={{ letterSpacing: "-0.04em" }}>
                {counts[s.key] ?? 0}
              </p>
              <p className="text-xs font-semibold">{s.label}</p>
            </div>
          </Link>
        ))}
      </div>

      {/* Filter tabs */}
      <div className="mb-5 flex flex-wrap gap-2">
        {filterOptions.map((opt) => (
          <Link key={opt.value} href={`/admin/reviews?status=${opt.value}`}>
            <span className={`inline-flex cursor-pointer items-center rounded-full px-3 py-1.5 text-xs font-semibold transition-colors ${
              activeFilter === opt.value
                ? "bg-brand-900 text-white"
                : "bg-neutral-100 text-neutral-600 hover:bg-neutral-200"
            }`}>
              {opt.value === "reported" && (counts.reported ?? 0) > 0 && (
                <AlertTriangle className="mr-1.5 h-3 w-3" />
              )}
              {opt.label}
              {opt.value === "reported" && (counts.reported ?? 0) > 0 && (
                <span className="ml-1.5 flex h-4 w-4 items-center justify-center rounded-full bg-red-500 text-white text-2xs font-bold">
                  {counts.reported}
                </span>
              )}
            </span>
          </Link>
        ))}
      </div>

      {!reviews || reviews.length === 0 ? (
        <Card>
          <EmptyState
            icon={<Star className="h-8 w-8" />}
            title="No reviews"
            description="No reviews in this status."
          />
        </Card>
      ) : (
        <div className="space-y-3">
          {reviews.map((review) => {
            const tpRaw   = review.tutor_profiles as unknown;
            const tp      = (Array.isArray(tpRaw) ? tpRaw[0] : tpRaw) as {
              user_id: string;
              profiles: { full_name: string; avatar_url: string | null } |
                        { full_name: string; avatar_url: string | null }[];
            } | null;
            const tutorProfileRaw = tp?.profiles;
            const tutorProfile    = tutorProfileRaw
              ? (Array.isArray(tutorProfileRaw) ? tutorProfileRaw[0] : tutorProfileRaw) as
                { full_name: string; avatar_url: string | null }
              : null;

            const parentRaw   = review.profiles as unknown;
            const parent      = (Array.isArray(parentRaw) ? parentRaw[0] : parentRaw) as
              { full_name: string; avatar_url: string | null } | null;

            const studentRaw  = review.students as unknown;
            const student     = (Array.isArray(studentRaw) ? studentRaw[0] : studentRaw) as
              { full_name: string } | null;

            const variant = statusVariant[review.status as string] ?? "gray";
            const isUrgent = review.status === "reported";

            return (
              <Link key={review.id} href={`/admin/reviews/${review.id}`}>
                <div className={cn(
                  "rounded-2xl border bg-white p-5 transition-all hover:shadow-sm",
                  isUrgent ? "border-red-200 bg-red-50/20" : "border-neutral-200"
                )}>
                  <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
                    {/* Left: parties + rating */}
                    <div className="flex items-start gap-3">
                      <Avatar name={parent?.full_name ?? "P"} src={parent?.avatar_url} size="sm" />
                      <div className="min-w-0">
                        <div className="flex flex-wrap items-center gap-1.5">
                          <p className="text-sm font-semibold text-navy-900">
                            {parent?.full_name ?? "Parent"}
                          </p>
                          <span className="text-neutral-300">→</span>
                          <p className="text-sm text-neutral-700">
                            {tutorProfile?.full_name ?? "Tutor"}
                          </p>
                          {review.is_verified_review && (
                            <VerifiedReviewBadge />
                          )}
                        </div>
                        {student?.full_name && (
                          <p className="text-xs text-neutral-400">For: {student.full_name}</p>
                        )}
                        <div className="mt-1 flex items-center gap-2">
                          <StarDisplay rating={review.overall_rating ?? 0} />
                          <span className="text-xs font-semibold text-navy-900">
                            {(review.overall_rating ?? 0).toFixed(1)}
                          </span>
                        </div>
                        {review.comment && (
                          <p className="mt-1.5 line-clamp-2 text-xs text-neutral-600 italic">
                            &ldquo;{review.comment}&rdquo;
                          </p>
                        )}
                        {isUrgent && review.report_reason && (
                          <p className="mt-2 flex items-start gap-1 rounded-lg bg-red-50 px-2.5 py-1.5 text-xs text-red-700">
                            <AlertTriangle className="mt-0.5 h-3.5 w-3.5 flex-shrink-0" />
                            Report: {review.report_reason}
                          </p>
                        )}
                      </div>
                    </div>

                    {/* Right: status + date */}
                    <div className="flex flex-shrink-0 flex-col items-end gap-2">
                      <Badge variant={variant}>
                        {(review.status as string).charAt(0).toUpperCase() +
                          (review.status as string).slice(1)}
                      </Badge>
                      <p className="text-xs text-neutral-400">
                        {isUrgent && review.reported_at
                          ? `Reported ${formatDate(review.reported_at)}`
                          : formatDate(review.created_at)}
                      </p>
                      <ArrowRight className="h-4 w-4 text-neutral-300" />
                    </div>
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
