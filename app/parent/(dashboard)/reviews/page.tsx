import { redirect } from "next/navigation";
import Link from "next/link";
import type { Metadata } from "next";
import { Star, PlusCircle } from "lucide-react";
import { createClient } from "@/lib/supabase/server";
import { DashboardHeader } from "@/components/layout/DashboardShell";
import { Card } from "@/components/ui/Card";
import { Button } from "@/components/ui/Button";
import { Badge } from "@/components/ui/Badge";
import { EmptyState } from "@/components/ui/EmptyState";
import { ReviewCard, VerifiedReviewBadge, StarDisplay } from "@/components/reviews/ReviewCard";
import type { ReviewCardData } from "@/components/reviews/ReviewCard";
import { formatDate } from "@/lib/utils";

export const metadata: Metadata = { title: "My Reviews" };

export default async function ReviewsPage() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  // My submitted reviews
  const { data: reviews } = await supabase
    .from("reviews")
    .select(
      `id, overall_rating, rating_teaching_quality, rating_subject_knowledge,
       rating_punctuality, rating_communication, rating_professionalism,
       comment, is_verified_review, status, is_published, published_at, created_at,
       tutor_profiles!inner(id, user_id, profiles!inner(full_name, avatar_url)),
       students(full_name)`
    )
    .eq("parent_id", user.id)
    .order("created_at", { ascending: false });

  // Completed enrollments / demos eligible for review but not yet reviewed
  const { data: eligibleEnrollments } = await supabase
    .from("enrollments")
    .select("id, tutor_id, tutor_profiles!inner(id, user_id, profiles!inner(full_name, avatar_url))")
    .eq("parent_id", user.id)
    .eq("status", "active");

  // Which tutor_profile ids already reviewed
  const reviewedTutorIds = new Set(
    (reviews ?? []).map((r) => {
      const tpRaw = r.tutor_profiles as unknown;
      const tp    = (Array.isArray(tpRaw) ? tpRaw[0] : tpRaw) as { id: string } | null;
      return tp?.id ?? "";
    })
  );

  // Pending reviews (eligible but not yet done)
  const pendingReviews = (eligibleEnrollments ?? []).filter((e) => {
    const tpRaw = e.tutor_profiles as unknown;
    const tp    = (Array.isArray(tpRaw) ? tpRaw[0] : tpRaw) as { id: string } | null;
    return tp?.id && !reviewedTutorIds.has(tp.id);
  });

  const statusConfig: Record<string, { label: string; variant: "yellow" | "teal" | "gray" | "red" }> = {
    pending:       { label: "Pending approval", variant: "yellow" },
    published:     { label: "Published",        variant: "teal"   },
    hidden:        { label: "Hidden",           variant: "gray"   },
    reported:      { label: "Reported",         variant: "red"    },
    investigating: { label: "Under review",     variant: "yellow" },
  };

  return (
    <div>
      <DashboardHeader
        title="My Reviews"
        description="Reviews you've submitted for tutors."
      />

      {/* Pending CTA */}
      {pendingReviews.length > 0 && (
        <div className="mb-5 rounded-2xl border border-brand-200 bg-brand-50 p-5">
          <p className="mb-2 text-sm font-bold text-brand-900">
            You can review {pendingReviews.length} tutor{pendingReviews.length !== 1 ? "s" : ""}
          </p>
          <div className="flex flex-wrap gap-3">
            {pendingReviews.map((e) => {
              const tpRaw = e.tutor_profiles as unknown;
              const tp    = (Array.isArray(tpRaw) ? tpRaw[0] : tpRaw) as {
                id: string; user_id: string;
                profiles: { full_name: string; avatar_url: string | null } |
                          { full_name: string; avatar_url: string | null }[];
              } | null;
              if (!tp) return null;
              const profileRaw = tp.profiles;
              const profile    = (Array.isArray(profileRaw) ? profileRaw[0] : profileRaw) as
                { full_name: string } | null;
              return (
                <Link key={e.id} href={`/parent/reviews/write?tutor=${tp.id}&enrollment=${e.id}`}>
                  <Button variant="primary" size="sm" iconLeft={<PlusCircle className="h-4 w-4" />}>
                    Review {profile?.full_name ?? "Tutor"}
                  </Button>
                </Link>
              );
            })}
          </div>
        </div>
      )}

      {!reviews || reviews.length === 0 ? (
        <Card>
          <EmptyState
            icon={<Star className="h-8 w-8" />}
            title="No reviews yet"
            description="After completing sessions with a tutor, you can leave a verified review here."
          />
        </Card>
      ) : (
        <div className="space-y-4">
          {reviews.map((review) => {
            const tpRaw  = review.tutor_profiles as unknown;
            const tp     = (Array.isArray(tpRaw) ? tpRaw[0] : tpRaw) as {
              user_id: string;
              profiles: { full_name: string; avatar_url: string | null } |
                        { full_name: string; avatar_url: string | null }[];
            } | null;
            const profileRaw = tp?.profiles;
            const profile    = profileRaw
              ? (Array.isArray(profileRaw) ? profileRaw[0] : profileRaw) as
                { full_name: string; avatar_url: string | null }
              : null;
            const studentRaw = review.students as unknown;
            const student    = (Array.isArray(studentRaw) ? studentRaw[0] : studentRaw) as
              { full_name: string } | null;

            const statusCfg = statusConfig[review.status as string] ?? { label: review.status, variant: "gray" as const };

            const cardData: ReviewCardData = {
              id:                       review.id,
              overall_rating:           review.overall_rating ?? review.overall_rating,
              rating_teaching_quality:  review.rating_teaching_quality,
              rating_subject_knowledge: review.rating_subject_knowledge,
              rating_punctuality:       review.rating_punctuality,
              rating_communication:     review.rating_communication,
              rating_professionalism:   review.rating_professionalism,
              comment:                  review.comment,
              is_verified_review:       review.is_verified_review,
              published_at:             review.published_at,
              created_at:               review.created_at,
              parent_name:              "You",
              parent_avatar_url:        null,
              student_name:             student?.full_name,
            };

            return (
              <div key={review.id} className="space-y-2">
                {/* Tutor header */}
                <div className="flex items-center justify-between px-1">
                  <Link href={`/tutors/${tp?.user_id}`}
                    className="text-sm font-bold text-navy-900 hover:text-brand-700 transition-colors">
                    {profile?.full_name ?? "Tutor"}
                  </Link>
                  <div className="flex items-center gap-2">
                    {review.is_verified_review && <VerifiedReviewBadge />}
                    <Badge variant={statusCfg.variant}>{statusCfg.label}</Badge>
                  </div>
                </div>

                <ReviewCard
                  review={cardData}
                  showCategories
                />

                {review.status === "pending" && (
                  <p className="px-1 text-xs text-neutral-400">
                    Your review is being reviewed by our team and will be published shortly.
                  </p>
                )}
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
