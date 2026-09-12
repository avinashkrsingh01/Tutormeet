"use server";

import { createClient } from "@/lib/supabase/server";
import { z } from "zod";

// ─── Submit review ────────────────────────────────────────────────────────────

const reviewSchema = z.object({
  tutor_profile_id:         z.string().uuid(),
  enrollment_id:            z.string().uuid().optional(),
  demo_class_id:            z.string().uuid().optional(),

  // Category ratings
  rating_teaching_quality:  z.number().int().min(1).max(5),
  rating_subject_knowledge: z.number().int().min(1).max(5),
  rating_punctuality:       z.number().int().min(1).max(5),
  rating_communication:     z.number().int().min(1).max(5),
  rating_professionalism:   z.number().int().min(1).max(5),

  // Written review
  comment: z.string().min(10, "Please write at least 10 characters").max(800).optional(),
});

export type ReviewSubmitResult =
  | { success: true;  reviewId: string; autoPublished: boolean }
  | { success: false; error: string };

export async function submitReviewAction(
  data: z.infer<typeof reviewSchema>
): Promise<ReviewSubmitResult> {
  const parsed = reviewSchema.safeParse(data);
  if (!parsed.success) {
    return { success: false, error: parsed.error.errors[0].message };
  }

  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return { success: false, error: "Session expired." };

  // ── Role check: only parents can review ──────────────────────────────────
  const { data: profile } = await supabase
    .from("profiles")
    .select("role")
    .eq("id", user.id)
    .single();

  if (!profile || profile.role !== "parent") {
    return { success: false, error: "Only parents can submit reviews." };
  }

  // ── Anti-self-review: verify the tutor is not this user ──────────────────
  const { data: tp } = await supabase
    .from("tutor_profiles")
    .select("id, user_id")
    .eq("id", parsed.data.tutor_profile_id)
    .single();

  if (!tp) return { success: false, error: "Tutor not found." };
  if (tp.user_id === user.id) {
    return { success: false, error: "You cannot review yourself." };
  }

  // ── Duplicate check: one review per (parent, tutor) ───────────────────────
  const { data: existing } = await supabase
    .from("reviews")
    .select("id")
    .eq("tutor_id",  tp.id)
    .eq("parent_id", user.id)
    .maybeSingle();

  if (existing) {
    return { success: false, error: "You have already submitted a review for this tutor." };
  }

  // ── Eligibility check: must have a completed demo or active enrollment ────
  const { data: eligible } = await supabase
    .rpc("parent_can_review_tutor", {
      p_parent_id: user.id,
      p_tutor_id:  tp.id,
    });

  if (!eligible) {
    return {
      success: false,
      error: "You can only review a tutor after completing a demo class or having active tuition with them.",
    };
  }

  // ── Get student linked to this context ────────────────────────────────────
  let studentId: string | null = null;
  if (parsed.data.enrollment_id) {
    const { data: enroll } = await supabase
      .from("enrollments")
      .select("student_id")
      .eq("id", parsed.data.enrollment_id)
      .eq("parent_id", user.id)
      .single();
    studentId = enroll?.student_id ?? null;
  } else if (parsed.data.demo_class_id) {
    const { data: demo } = await supabase
      .from("demo_classes")
      .select("student_id")
      .eq("id", parsed.data.demo_class_id)
      .eq("parent_id", user.id)
      .single();
    studentId = demo?.student_id ?? null;
  }

  // ── Compute overall rating (mean of 5 categories) ─────────────────────────
  const overallRating = Math.round(
    (parsed.data.rating_teaching_quality +
     parsed.data.rating_subject_knowledge +
     parsed.data.rating_punctuality +
     parsed.data.rating_communication +
     parsed.data.rating_professionalism) / 5
  );

  // ── Insert review ─────────────────────────────────────────────────────────
  const { data: review, error } = await supabase
    .from("reviews")
    .insert({
      tutor_id:                 tp.id,
      parent_id:                user.id,
      student_id:               studentId,
      enrollment_id:            parsed.data.enrollment_id ?? null,
      demo_class_id:            parsed.data.demo_class_id ?? null,

      rating_teaching_quality:  parsed.data.rating_teaching_quality,
      rating_subject_knowledge: parsed.data.rating_subject_knowledge,
      rating_punctuality:       parsed.data.rating_punctuality,
      rating_communication:     parsed.data.rating_communication,
      rating_professionalism:   parsed.data.rating_professionalism,

      overall_rating:           overallRating,
      rating:                   overallRating, // legacy column compat
      comment:                  parsed.data.comment ?? null,

      is_verified_review:       true,   // eligibility confirmed above
      status:                   "pending",
      is_published:             false,
    })
    .select("id, status, is_published")
    .single();

  if (error || !review) {
    // Unique violation = already reviewed (race condition)
    if (error?.code === "23505") {
      return { success: false, error: "You have already reviewed this tutor." };
    }
    console.error("Review insert error:", error);
    return { success: false, error: "Could not submit review. Please try again." };
  }

  return {
    success:       true,
    reviewId:      review.id,
    autoPublished: review.is_published,
  };
}

// ─── Report a review (tutor reports inappropriate content) ───────────────────

const reportSchema = z.object({
  review_id: z.string().uuid(),
  reason:    z.string().min(10).max(500),
});

export async function reportReviewAction(
  reviewId: string,
  reason:   string
): Promise<{ success: boolean; error?: string }> {
  const parsed = reportSchema.safeParse({ review_id: reviewId, reason });
  if (!parsed.success) {
    return { success: false, error: parsed.error.errors[0].message };
  }

  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return { success: false, error: "Session expired." };

  const { data: profileCheck } = await supabase
    .from("profiles")
    .select("role")
    .eq("id", user.id)
    .single();

  if (!profileCheck || profileCheck.role !== "tutor") {
    return { success: false, error: "Unauthorized access." };
  }

  // Only tutors can report reviews about themselves
  const { data: tp } = await supabase
    .from("tutor_profiles")
    .select("id")
    .eq("user_id", user.id)
    .single();

  if (!tp) return { success: false, error: "Only verified tutors can report reviews." };

  const { data: rev } = await supabase
    .from("reviews")
    .select("id, tutor_id, status")
    .eq("id", parsed.data.review_id)
    .single();

  if (!rev || rev.tutor_id !== tp.id) {
    return { success: false, error: "Review not found." };
  }

  if (rev.status === "reported" || rev.status === "investigating") {
    return { success: false, error: "This review has already been reported." };
  }

  const { error } = await supabase
    .from("reviews")
    .update({
      status:        "reported",
      report_reason: parsed.data.reason,
      reported_at:   new Date().toISOString(),
    })
    .eq("id", parsed.data.review_id);

  if (error) return { success: false, error: "Could not submit report." };

  return { success: true };
}
