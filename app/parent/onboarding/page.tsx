import { redirect } from "next/navigation";
import type { Metadata } from "next";
import { createClient } from "@/lib/supabase/server";
import { OnboardingProgress } from "@/components/parent/OnboardingProgress";
import { ProfileCompletionForm } from "@/components/parent/ProfileCompletionForm";

export const metadata: Metadata = { title: "Complete Your Profile — TutorMeet" };

const STEPS = [
  { label: "Create account" },
  { label: "Your details" },
  { label: "Post requirement" },
];

export default async function ParentOnboardingPage() {
  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  // Must be logged in
  if (!user) redirect("/login");

  // Fetch profile to pre-fill
  const { data: profile } = await supabase
    .from("profiles")
    .select("full_name, phone, role")
    .eq("id", user.id)
    .single();

  // Only parents reach this page
  if (!profile || profile.role !== "parent") redirect("/unauthorized");

  // If onboarding already done, skip to dashboard
  const { data: parentProfile } = await supabase
    .from("parent_profiles")
    .select("onboarding_complete")
    .eq("user_id", user.id)
    .maybeSingle();

  if (parentProfile?.onboarding_complete) {
    redirect("/parent/dashboard");
  }

  return (
    <div className="w-full max-w-lg">
      {/* Progress indicator */}
      <OnboardingProgress steps={STEPS} currentStep={1} />

      {/* Card */}
      <div className="rounded-3xl border border-neutral-200 bg-white shadow-lg">
        <div className="h-1 w-full rounded-t-3xl bg-gradient-to-r from-brand-900 via-brand-700 to-accent-500" />

        <div className="p-7 sm:p-8">
          <div className="mb-6">
            <h1
              className="text-xl font-bold text-navy-900"
              style={{ letterSpacing: "-0.02em" }}
            >
              A few quick details
            </h1>
            <p className="mt-1.5 text-sm text-neutral-500">
              This helps us find tutors in the right location and contact
              you quickly when there&apos;s a match.
            </p>
          </div>

          <ProfileCompletionForm
            defaultName={profile.full_name ?? ""}
            defaultPhone={profile.phone ?? ""}
          />
        </div>
      </div>

      <p className="mt-5 text-center text-xs text-neutral-400">
        Your location is only used to find tutors near you. We never share
        your full address with tutors.
      </p>
    </div>
  );
}
