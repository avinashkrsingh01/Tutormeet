import { CheckCircle2 } from "lucide-react";
import { cn } from "@/lib/utils";
import { TUTOR_ONBOARDING_STEPS } from "@/lib/constants";
import type { OnboardingStep } from "@/types/tutor";

interface TutorOnboardingProgressProps {
  currentStep: OnboardingStep;
  className?: string;
}

const stepOrder: OnboardingStep[] = [
  "basic_profile",
  "education",
  "experience",
  "teaching_preferences",
  "documents",
  "submitted",
];

export function TutorOnboardingProgress({
  currentStep,
  className,
}: TutorOnboardingProgressProps) {
  const currentIdx = stepOrder.indexOf(currentStep);

  return (
    <div className={cn("mb-8", className)}>
      {/* Desktop — horizontal stepper */}
      <nav aria-label="Registration steps" className="hidden sm:block">
        <ol className="flex items-start">
          {TUTOR_ONBOARDING_STEPS.map((step, i) => {
            const done   = i < currentIdx;
            const active = step.key === currentStep;
            const isLast = i === TUTOR_ONBOARDING_STEPS.length - 1;

            return (
              <li key={step.key} className="flex flex-1 flex-col items-center">
                <div className="flex w-full items-center">
                  {/* Left connector */}
                  <div
                    className={cn(
                      "h-0.5 flex-1 transition-colors duration-300",
                      i === 0   ? "invisible"
                      : done    ? "bg-accent-500"
                      :           "bg-neutral-200"
                    )}
                  />

                  {/* Circle */}
                  <div
                    className={cn(
                      "flex h-8 w-8 flex-shrink-0 items-center justify-center rounded-full text-xs font-bold transition-all duration-200",
                      done
                        ? "bg-accent-500 text-white shadow-sm"
                        : active
                        ? "bg-brand-900 text-white ring-4 ring-brand-100 shadow-navy"
                        : "border-2 border-neutral-200 bg-white text-neutral-400"
                    )}
                    aria-current={active ? "step" : undefined}
                  >
                    {done ? (
                      <CheckCircle2 className="h-4 w-4" aria-hidden="true" />
                    ) : (
                      <span>{i + 1}</span>
                    )}
                  </div>

                  {/* Right connector */}
                  <div
                    className={cn(
                      "h-0.5 flex-1 transition-colors duration-300",
                      isLast  ? "invisible"
                      : done  ? "bg-accent-500"
                      :         "bg-neutral-200"
                    )}
                  />
                </div>

                {/* Label */}
                <div className="mt-2 text-center">
                  <p
                    className={cn(
                      "text-xs font-semibold leading-tight",
                      active ? "text-navy-900"
                      : done  ? "text-accent-700"
                      :         "text-neutral-400"
                    )}
                  >
                    {step.label}
                  </p>
                </div>
              </li>
            );
          })}
        </ol>
      </nav>

      {/* Mobile — compact bar */}
      <div className="sm:hidden">
        <div className="flex items-center justify-between text-xs text-neutral-500 mb-2">
          <span className="font-semibold text-navy-900">
            Step {currentIdx + 1} of {TUTOR_ONBOARDING_STEPS.length}
          </span>
          <span>
            {TUTOR_ONBOARDING_STEPS[currentIdx]?.label}
          </span>
        </div>
        <div className="h-1.5 w-full overflow-hidden rounded-full bg-neutral-200">
          <div
            className="h-full rounded-full bg-brand-900 transition-all duration-300"
            style={{
              width: `${((currentIdx + 1) / TUTOR_ONBOARDING_STEPS.length) * 100}%`,
            }}
          />
        </div>
      </div>
    </div>
  );
}
