import { redirect } from "next/navigation";
import type { Metadata } from "next";
import { createClient } from "@/lib/supabase/server";
import { OnboardingCard } from "@/components/tutor/OnboardingCard";
import { BasicProfileForm } from "@/components/tutor/onboarding/BasicProfileForm";

export const metadata: Metadata = { title: "Basic Profile — Tutor Registration" };

export default async function TutorOnboardingBasicPage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  const [{ data: profile }, { data: tp }] = await Promise.all([
    supabase
      .from("profiles")
      .select("full_name, phone, email")
      .eq("id", user.id)
      .single(),
    supabase
      .from("tutor_profiles")
      .select("gender, date_of_birth, locality, city, pincode, state, bio")
      .eq("user_id", user.id)
      .maybeSingle(),
  ]);

  return (
    <OnboardingCard
      step="basic_profile"
      title="Tell us about yourself"
      description="This information helps parents understand who you are and where you're based."
    >
      <BasicProfileForm
        defaultValues={{
          full_name:     profile?.full_name ?? "",
          phone:         profile?.phone     ?? "",
          gender:        (tp?.gender as "male" | "female" | "other") ?? "male",
          date_of_birth: tp?.date_of_birth ?? "",
          city:          tp?.city          ?? "",
          locality:      tp?.locality      ?? "",
          pincode:       tp?.pincode       ?? "",
          state:         tp?.state         ?? "",
          bio:           tp?.bio           ?? "",
        }}
      />
    </OnboardingCard>
  );
}
