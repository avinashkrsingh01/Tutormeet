import { redirect, notFound } from "next/navigation";
import type { Metadata } from "next";
import { createClient } from "@/lib/supabase/server";
import { requireAdminPermission } from "@/lib/admin-auth";
import { DashboardHeader } from "@/components/layout/DashboardShell";
import { Card, CardHeader, CardTitle } from "@/components/ui/Card";
import { Avatar } from "@/components/ui/Avatar";
import { Badge } from "@/components/ui/Badge";
import { ReviewCard, VerifiedReviewBadge } from "@/components/reviews/ReviewCard";
import { AdminReviewModerationActions } from "@/components/admin/AdminReviewModerationActions";
import { formatDate } from "@/lib/utils";
import type { ReviewCardData } from "@/components/reviews/ReviewCard";

export const metadata: Metadata = { title: "Review — Admin" };

interface PageProps { params: Promise<{ id: string }> }

export default async function AdminReviewDetailPage({ params }: PageProps) {
  const { id } = await params;
  const admin   = await requireAdminPermission("moderate_reviews");
  const supabase = await createClient();

  const { data: review } = await supabase
    .from("reviews")
    .select(
      `id, overall_rating, comment, status, is_verified_review, is_published,
       rating_teaching_quality, rating_subject_knowledge,
       rating_punctuality, rating_communication, rating_professionalism,
       report_reason, reported_at, admin_notes,
       enrollment_id, demo_class_id, published_at, created_at, updated_at,
       tutor_profiles!inner(id, user_id, profiles!inner(full_name, avatar_url, email)),
       profiles!inner(full_name, avatar_url, email),
       students(full_name)`
    )
    .eq("id", id)
    .single();

  if (!review) notFound();

  const tpRaw        = review.tutor_profiles as unknown;
  const tp           = (Array.isArray(tpRaw) ? tpRaw[0] : tpRaw) as {
    user_id: string;
    profiles: { full_name: string; avatar_url: string | null; email: string } |
              { full_name: string; avatar_url: string | null; email: string }[];
  } | null;
  const tutorProfileRaw = tp?.profiles;
  const tutorProfile    = tutorProfileRaw
    ? (Array.isArray(tutorProfileRaw) ? tutorProfileRaw[0] : tutorProfileRaw) as
      { full_name: string; avatar_url: string | null; email: string }
    : null;

  const parentRaw  = review.profiles as unknown;
  const parent     = (Array.isArray(parentRaw) ? parentRaw[0] : parentRaw) as
    { full_name: string; avatar_url: string | null; email: string } | null;

  const studentRaw = review.students as unknown;
  const student    = (Array.isArray(studentRaw) ? studentRaw[0] : studentRaw) as
    { full_name: string } | null;

  const cardData: ReviewCardData = {
    id:                       review.id,
    overall_rating:           review.overall_rating ?? 0,
    rating_teaching_quality:  review.rating_teaching_quality,
    rating_subject_knowledge: review.rating_subject_knowledge,
    rating_punctuality:       review.rating_punctuality,
    rating_communication:     review.rating_communication,
    rating_professionalism:   review.rating_professionalism,
    comment:                  review.comment,
    is_verified_review:       review.is_verified_review,
    published_at:             review.published_at,
    created_at:               review.created_at,
    parent_name:              parent?.full_name ?? "Parent",
    parent_avatar_url:        parent?.avatar_url ?? null,
    student_name:             student?.full_name,
  };

  const statusVariant: Record<string, "yellow"|"red"|"teal"|"gray"|"blue"> = {
    pending: "yellow", reported: "red", investigating: "blue",
    published: "teal", hidden: "gray",
  };
  const variant = statusVariant[review.status as string] ?? "gray";

  return (
    <div>
      <DashboardHeader
        title="Review Details"
        description="Moderate this review."
        action={
          <div className="flex items-center gap-2">
            {review.is_verified_review && <VerifiedReviewBadge />}
            <Badge variant={variant}>
              {(review.status as string).charAt(0).toUpperCase() +
                (review.status as string).slice(1)}
            </Badge>
          </div>
        }
      />

      <div className="grid grid-cols-1 gap-5 lg:grid-cols-3">

        {/* ── Main ──────────────────────────────────────────────── */}
        <div className="space-y-5 lg:col-span-2">

          {/* The review itself */}
          <ReviewCard review={cardData} showCategories />

          {/* Parties */}
          <Card padding="md">
            <CardHeader><CardTitle>Participants</CardTitle></CardHeader>
            <div className="grid grid-cols-1 gap-5 sm:grid-cols-2">
              <div>
                <p className="label-sm mb-2">Parent (reviewer)</p>
                <div className="flex items-center gap-3">
                  <Avatar name={parent?.full_name ?? "P"} src={parent?.avatar_url} size="sm" />
                  <div>
                    <p className="text-sm font-semibold text-navy-900">{parent?.full_name}</p>
                    <p className="text-xs text-neutral-400">{parent?.email}</p>
                  </div>
                </div>
              </div>
              <div>
                <p className="label-sm mb-2">Tutor (reviewed)</p>
                <div className="flex items-center gap-3">
                  <Avatar name={tutorProfile?.full_name ?? "T"} src={tutorProfile?.avatar_url} size="sm" verified />
                  <div>
                    <p className="text-sm font-semibold text-navy-900">{tutorProfile?.full_name}</p>
                    <p className="text-xs text-neutral-400">{tutorProfile?.email}</p>
                  </div>
                </div>
              </div>
            </div>
            {student?.full_name && (
              <div className="mt-4 rounded-xl bg-neutral-50 px-4 py-3">
                <p className="text-xs text-neutral-500">
                  Student: <span className="font-medium text-navy-900">{student.full_name}</span>
                </p>
              </div>
            )}
          </Card>

          {/* Report details */}
          {(review.status === "reported" || review.status === "investigating") && (
            <Card padding="md" className="border-red-200 bg-red-50/20">
              <CardHeader><CardTitle className="text-red-800">Report Details</CardTitle></CardHeader>
              <dl className="space-y-2 text-sm">
                <div>
                  <dt className="label-sm">Reason</dt>
                  <dd className="mt-0.5 text-neutral-700">{review.report_reason ?? "—"}</dd>
                </div>
                {review.reported_at && (
                  <div>
                    <dt className="label-sm">Reported</dt>
                    <dd className="mt-0.5 text-neutral-700">{formatDate(review.reported_at)}</dd>
                  </div>
                )}
              </dl>
            </Card>
          )}

          {/* Verification proof */}
          <Card padding="md">
            <CardHeader><CardTitle>Verification Proof</CardTitle></CardHeader>
            <div className="space-y-2 text-sm">
              {[
                { label: "Verified Review", value: review.is_verified_review ? "Yes" : "No" },
                { label: "Enrollment ID",   value: review.enrollment_id ?? "Not linked" },
                { label: "Demo Class ID",   value: review.demo_class_id  ?? "Not linked" },
                { label: "Submitted",       value: formatDate(review.created_at) },
              ].map((item) => (
                <div key={item.label} className="flex items-center justify-between border-b border-neutral-100 pb-2 last:border-0">
                  <dt className="text-xs font-semibold text-neutral-400">{item.label}</dt>
                  <dd className="text-navy-900">{item.value}</dd>
                </div>
              ))}
            </div>
          </Card>
        </div>

        {/* ── Sidebar ───────────────────────────────────────────── */}
        <div className="space-y-5">
          <AdminReviewModerationActions
            reviewId={id}
            currentStatus={review.status as string}
            currentAdminNotes={review.admin_notes ?? ""}
            adminRole={admin.admin_role}
          />
        </div>
      </div>
    </div>
  );
}
