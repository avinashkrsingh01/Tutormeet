import { cn } from "@/lib/utils";
import type { OnboardingStep } from "@/types/tutor";
import { TutorOnboardingProgress } from "./TutorOnboardingProgress";

interface OnboardingCardProps {
  step:        OnboardingStep;
  title:       string;
  description: string;
  children:    React.ReactNode;
  maxWidth?:   "sm" | "md" | "lg" | "xl";
}

const widthMap = {
  sm: "max-w-lg",
  md: "max-w-2xl",
  lg: "max-w-3xl",
  xl: "max-w-4xl",
};

export function OnboardingCard({
  step,
  title,
  description,
  children,
  maxWidth = "md",
}: OnboardingCardProps) {
  return (
    <div className={cn("mx-auto w-full", widthMap[maxWidth])}>
      <TutorOnboardingProgress currentStep={step} />

      <div className="overflow-hidden rounded-3xl border border-neutral-200 bg-white shadow-lg">
        {/* Accent strip */}
        <div className="h-1 w-full bg-gradient-to-r from-brand-900 via-brand-700 to-accent-500" />

        <div className="p-6 sm:p-8">
          <div className="mb-7">
            <h1
              className="text-xl font-bold text-navy-900"
              style={{ letterSpacing: "-0.02em" }}
            >
              {title}
            </h1>
            <p className="mt-1.5 text-sm text-neutral-500">{description}</p>
          </div>

          {children}
        </div>
      </div>
    </div>
  );
}
