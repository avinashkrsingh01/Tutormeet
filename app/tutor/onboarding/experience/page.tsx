import { redirect } from "next/navigation";
import type { Metadata } from "next";
import { createClient } from "@/lib/supabase/server";
import { OnboardingCard } from "@/components/tutor/OnboardingCard";
import { ExperienceForm } from "@/components/tutor/onboarding/ExperienceForm";
import type { TeachingExperience } from "@/types/tutor";

export const metadata: Metadata = { title: "Teaching Experience — Tutor Registration" };

export default async function TutorOnboardingExperiencePage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  const { data: tp } = await supabase
    .from("tutor_profiles")
    .select("experience, years_of_experience, onboarding_step")
    .eq("user_id", user.id)
    .maybeSingle();

  if (!tp || !["experience","teaching_preferences","documents","submitted"].includes(tp.onboarding_step ?? "")) {
    redirect("/tutor/onboarding/education");
  }

  return (
    <OnboardingCard
      step="experience"
      title="Teaching experience"
      description="Tell us about your teaching history. If you're a fresher, just check the box below."
      maxWidth="lg"
    >
      <ExperienceForm
        existing={(tp.experience as TeachingExperience[]) ?? []}
        existingYears={(tp.years_of_experience as number) ?? 0}
      />
    </OnboardingCard>
  );
}
