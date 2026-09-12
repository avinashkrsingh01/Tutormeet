import { redirect } from "next/navigation";
import type { Metadata } from "next";
import { createClient } from "@/lib/supabase/server";
import { OnboardingProgress } from "@/components/parent/OnboardingProgress";
import { RequirementForm } from "@/components/parent/RequirementForm";
import { DashboardHeader } from "@/components/layout/DashboardShell";
import { Card } from "@/components/ui/Card";

export const metadata: Metadata = { title: "Post Tuition Requirement" };

const ONBOARDING_STEPS = [
  { label: "Create account" },
  { label: "Your details" },
  { label: "Post requirement" },
];

interface PageProps {
  searchParams: Promise<{ onboarding?: string }>;
}

export default async function NewRequirementPage({ searchParams }: PageProps) {
  const { onboarding } = await searchParams;
  const isOnboarding   = onboarding === "1";

  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) redirect("/login");

  // Pre-fill city/locality from parent profile
  const { data: parentProfile } = await supabase
    .from("parent_profiles")
    .select("city, locality")
    .eq("user_id", user.id)
    .maybeSingle();

  return (
    <div className="mx-auto w-full max-w-2xl">
      {/* Show onboarding progress only when coming from onboarding flow */}
      {isOnboarding && (
        <OnboardingProgress steps={ONBOARDING_STEPS} currentStep={2} />
      )}

      {!isOnboarding && (
        <DashboardHeader
          title="Post Tuition Requirement"
          description="Tell us what you need and we'll shortlist verified tutors for you."
        />
      )}

      {isOnboarding && (
        <div className="mb-6 text-center">
          <h1
            className="text-xl font-bold text-navy-900"
            style={{ letterSpacing: "-0.02em" }}
          >
            Post your tuition requirement
          </h1>
          <p className="mt-1.5 text-sm text-neutral-500">
            Tell us what you need. Our team will shortlist suitable verified
            tutors within 48 hours — free.
          </p>
        </div>
      )}

      <Card padding="lg">
        <RequirementForm
          parentCity={parentProfile?.city ?? ""}
          parentLocality={parentProfile?.locality ?? ""}
          isOnboarding={isOnboarding}
        />
      </Card>
    </div>
  );
}
