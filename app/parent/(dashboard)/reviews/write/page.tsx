import { redirect, notFound } from "next/navigation";
import Link from "next/link";
import type { Metadata } from "next";
import { ArrowLeft } from "lucide-react";
import { createClient } from "@/lib/supabase/server";
import { Card } from "@/components/ui/Card";
import { ReviewForm } from "@/components/reviews/ReviewForm";

export const metadata: Metadata = { title: "Write a Review" };

interface PageProps {
  searchParams: Promise<{ tutor?: string; enrollment?: string; demo?: string }>;
}

export default async function WriteReviewPage({ searchParams }: PageProps) {
  const { tutor: tutorProfileId, enrollment: enrollmentId, demo: demoId } = await searchParams;

  if (!tutorProfileId) notFound();

  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  // Must be a parent
  const { data: profile } = await supabase
    .from("profiles")
    .select("role")
    .eq("id", user.id)
    .single();

  if (!profile || profile.role !== "parent") redirect("/unauthorized");

  // Fetch tutor public info
  const { data: tp } = await supabase
    .from("tutor_profiles")
    .select("id, user_id, profiles!inner(full_name, avatar_url)")
    .eq("id", tutorProfileId)
    .eq("verification_status", "verified")
    .single();

  if (!tp) notFound();

  const profileRaw = tp.profiles as unknown;
  const tutorProfile = (Array.isArray(profileRaw) ? profileRaw[0] : profileRaw) as
    { full_name: string; avatar_url: string | null };

  // Check eligibility
  const { data: eligible } = await supabase.rpc("parent_can_review_tutor", {
    p_parent_id: user.id,
    p_tutor_id:  tp.id,
  });

  if (!eligible) redirect("/parent/reviews?error=not_eligible");

  // Check already reviewed
  const { data: existing } = await supabase
    .from("reviews")
    .select("id")
    .eq("tutor_id",  tp.id)
    .eq("parent_id", user.id)
    .maybeSingle();

  if (existing) redirect("/parent/reviews?error=already_reviewed");

  return (
    <div className="mx-auto max-w-2xl">
      <div className="mb-5">
        <Link href="/parent/reviews"
          className="flex items-center gap-1.5 text-sm text-neutral-500 hover:text-navy-900 transition-colors">
          <ArrowLeft className="h-4 w-4" /> Back to reviews
        </Link>
      </div>

      <div className="mb-5">
        <h1 className="text-2xl font-bold text-navy-900" style={{ letterSpacing: "-0.02em" }}>
          Review {tutorProfile.full_name}
        </h1>
        <p className="mt-1 text-sm text-neutral-500">
          Your honest feedback helps other parents and motivates great tutors.
        </p>
      </div>

      <Card padding="lg">
        <ReviewForm
          tutorProfileId={tutorProfileId}
          tutorName={tutorProfile.full_name}
          tutorAvatarUrl={tutorProfile.avatar_url}
          enrollmentId={enrollmentId}
          demoClassId={demoId}
        />
      </Card>
    </div>
  );
}
