import { redirect } from "next/navigation";
import type { Metadata } from "next";
import { createClient } from "@/lib/supabase/server";
import { DashboardHeader } from "@/components/layout/DashboardShell";
import { Card } from "@/components/ui/Card";
import { EmptyState } from "@/components/ui/EmptyState";
import { ReviewCard, ReviewSummary, VerifiedReviewBadge } from "@/components/reviews/ReviewCard";
import { TutorReportSection } from "@/components/reviews/TutorReportSection";
import { Star } from "lucide-react";
import type { ReviewCardData } from "@/components/reviews/ReviewCard";

export const metadata: Metadata = { title: "My Reviews" };

export default async function TutorReviewsPage() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  const { data: tp } = await supabase
    .from("tutor_profiles")
    .select(
      `id, average_rating, total_reviews,
       knowledge_score, teaching_score`
    )
    .eq("user_id", user.id)
    .single();

  const { data: reviews } = tp
    ? await supabase
        .from("reviews")
        .select(
          `id, overall_rating, comment, status, is_verified_review,
           rating_teaching_quality, rating_subject_knowledge,
           rating_punctuality, rating_communication, rating_professionalism,
           published_at, created_at,
           profiles!inner(full_name, avatar_url),
           students(full_name)`
        )
        .eq("tutor_id", tp.id)
        .eq("status", "published")
        .order("published_at", { ascending: false })
    : { data: [] };

  // Compute category averages for summary
  const published = reviews ?? [];
  const averages = published.length > 0
    ? {
        overall:           published.reduce((s, r) => s + (r.overall_rating ?? 0), 0) / published.length,
        teaching_quality:  published.reduce((s, r) => s + (r.rating_teaching_quality  ?? 0), 0) / published.length,
        subject_knowledge: published.reduce((s, r) => s + (r.rating_subject_knowledge ?? 0), 0) / published.length,
        punctuality:       published.reduce((s, r) => s + (r.rating_punctuality        ?? 0), 0) / published.length,
        communication:     published.reduce((s, r) => s + (r.rating_communication      ?? 0), 0) / published.length,
        professionalism:   published.reduce((s, r) => s + (r.rating_professionalism    ?? 0), 0) / published.length,
      }
    : null;

  return (
    <div>
      <DashboardHeader
        title="My Reviews"
        description="Published reviews from parents. All verified by TutorMeet."
      />

      {/* Summary */}
      {averages && tp?.total_reviews && (
        <ReviewSummary
          averages={averages}
          totalReviews={tp.total_reviews}
          className="mb-6"
        />
      )}

      {/* Reviews */}
      {published.length === 0 ? (
        <Card>
          <EmptyState
            icon={<Star className="h-8 w-8" />}
            title="No reviews yet"
            description="Verified reviews from parents will appear here after your tuition sessions."
          />
        </Card>
      ) : (
        <div className="space-y-4">
          {published.map((review) => {
            const parentRaw  = review.profiles as unknown;
            const parent     = (Array.isArray(parentRaw) ? parentRaw[0] : parentRaw) as
              { full_name: string; avatar_url: string | null } | null;
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

            return (
              <TutorReportSection key={review.id} reviewId={review.id}>
                <ReviewCard review={cardData} showCategories />
              </TutorReportSection>
            );
          })}
        </div>
      )}
    </div>
  );
}
