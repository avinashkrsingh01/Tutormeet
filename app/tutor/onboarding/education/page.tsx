import { redirect } from "next/navigation";
import type { Metadata } from "next";
import { createClient } from "@/lib/supabase/server";
import { OnboardingCard } from "@/components/tutor/OnboardingCard";
import { EducationForm } from "@/components/tutor/onboarding/EducationForm";
import type { EducationQualification } from "@/types/tutor";

export const metadata: Metadata = { title: "Education — Tutor Registration" };

export default async function TutorOnboardingEducationPage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  const { data: tp } = await supabase
    .from("tutor_profiles")
    .select("education, onboarding_step")
    .eq("user_id", user.id)
    .maybeSingle();

  // Guard: must have completed step 1 first
  if (!tp || !["education","experience","teaching_preferences","documents","submitted"].includes(tp.onboarding_step ?? "")) {
    redirect("/tutor/onboarding");
  }

  return (
    <OnboardingCard
      step="education"
      title="Your education"
      description="Add your academic qualifications. You can add multiple degrees."
      maxWidth="lg"
    >
      <EducationForm
        existing={(tp.education as EducationQualification[]) ?? []}
      />
    </OnboardingCard>
  );
}
