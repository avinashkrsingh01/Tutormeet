import { redirect } from "next/navigation";
import type { Metadata } from "next";
import { createClient } from "@/lib/supabase/server";
import { OnboardingCard } from "@/components/tutor/OnboardingCard";
import { PreferencesForm } from "@/components/tutor/onboarding/PreferencesForm";

export const metadata: Metadata = { title: "Teaching Preferences — Tutor Registration" };

export default async function TutorOnboardingPreferencesPage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  const { data: tp } = await supabase
    .from("tutor_profiles")
    .select("subjects, grades, boards, teaching_mode, preferred_days, preferred_time_slots, expected_fee_per_hour, demo_class_available, max_travel_distance_km, onboarding_step")
    .eq("user_id", user.id)
    .maybeSingle();

  if (!tp || !["teaching_preferences","documents","submitted"].includes(tp.onboarding_step ?? "")) {
    redirect("/tutor/onboarding/experience");
  }

  return (
    <OnboardingCard
      step="teaching_preferences"
      title="Teaching preferences"
      description="Tell us what you teach, when you're available, and how much you charge."
      maxWidth="lg"
    >
      <PreferencesForm
        defaultValues={{
          subjects:               (tp.subjects as string[]) ?? [],
          grades:                 (tp.grades   as string[]) ?? [],
          boards:                 (tp.boards   as string[]) ?? [],
          teaching_mode:          (tp.teaching_mode as "Home Visit" | "Student's Home" | "Both") ?? "Home Visit",
          preferred_days:         (tp.preferred_days        as string[]) ?? [],
          preferred_time_slots:   (tp.preferred_time_slots  as string[]) ?? [],
          expected_fee_per_hour:  (tp.expected_fee_per_hour  as number)  ?? 400,
          demo_class_available:   (tp.demo_class_available  as boolean)  ?? true,
          max_travel_distance_km: (tp.max_travel_distance_km as number | null) ?? null,
        }}
      />
    </OnboardingCard>
  );
}
