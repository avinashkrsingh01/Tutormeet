import { redirect } from "next/navigation";
import type { Metadata } from "next";
import { createClient } from "@/lib/supabase/server";
import { OnboardingCard } from "@/components/tutor/OnboardingCard";
import { SubmitApplicationForm } from "@/components/tutor/onboarding/SubmitApplicationForm";

export const metadata: Metadata = { title: "Submit Application — Tutor Registration" };

export default async function TutorOnboardingSubmitPage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  const [{ data: profile }, { data: tp }] = await Promise.all([
    supabase
      .from("profiles")
      .select("full_name, email, phone")
      .eq("id", user.id)
      .single(),
    supabase
      .from("tutor_profiles")
      .select("id, subjects, grades, boards, locality, city, years_of_experience, expected_fee_per_hour, education, onboarding_step, verification_status")
      .eq("user_id", user.id)
      .maybeSingle(),
  ]);

  if (!tp || tp.onboarding_step !== "submitted") {
    redirect("/tutor/onboarding/documents");
  }

  // Count uploaded docs
  const { count: docCount } = await supabase
    .from("tutor_documents")
    .select("*", { count: "exact", head: true })
    .eq("tutor_id", tp.id);

  const summary = {
    full_name:            profile?.full_name ?? "",
    email:                profile?.email     ?? "",
    subjects:             (tp.subjects as string[]) ?? [],
    grades:               (tp.grades   as string[]) ?? [],
    boards:               (tp.boards   as string[]) ?? [],
    locality:             tp.locality ?? "",
    city:                 tp.city     ?? "",
    years_of_experience:  tp.years_of_experience ?? 0,
    expected_fee_per_hour: tp.expected_fee_per_hour ?? 0,
    education_count:      Array.isArray(tp.education) ? tp.education.length : 0,
    doc_count:            docCount ?? 0,
  };

  return (
    <OnboardingCard
      step="submitted"
      title="Review &amp; submit"
      description="Check your details before submitting. Our team will review your application within 3–5 working days."
      maxWidth="lg"
    >
      <SubmitApplicationForm summary={summary} />
    </OnboardingCard>
  );
}
