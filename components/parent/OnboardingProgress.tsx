import { CheckCircle2 } from "lucide-react";
import { cn } from "@/lib/utils";

export interface OnboardingStep {
  label: string;
  description?: string;
}

interface OnboardingProgressProps {
  steps: OnboardingStep[];
  currentStep: number; // 0-indexed
}

export function OnboardingProgress({
  steps,
  currentStep,
}: OnboardingProgressProps) {
  return (
    <nav aria-label="Onboarding steps" className="mb-8">
      <ol className="flex items-start gap-0">
        {steps.map((step, i) => {
          const done    = i < currentStep;
          const active  = i === currentStep;
          const isLast  = i === steps.length - 1;

          return (
            <li key={step.label} className="flex flex-1 flex-col items-center">
              <div className="flex w-full items-center">
                {/* Left connector */}
                <div
                  className={cn(
                    "h-0.5 flex-1 transition-colors duration-300",
                    i === 0 ? "invisible" : done ? "bg-accent-500" : "bg-neutral-200"
                  )}
                />

                {/* Circle */}
                <div
                  className={cn(
                    "flex h-8 w-8 flex-shrink-0 items-center justify-center rounded-full text-xs font-bold transition-all duration-200",
                    done
                      ? "bg-accent-500 text-white shadow-accent"
                      : active
                      ? "bg-brand-900 text-white shadow-navy ring-4 ring-brand-100"
                      : "border-2 border-neutral-200 bg-white text-neutral-400"
                  )}
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
                    isLast ? "invisible" : done ? "bg-accent-500" : "bg-neutral-200"
                  )}
                />
              </div>

              {/* Label */}
              <p
                className={cn(
                  "mt-2 text-center text-xs font-medium leading-tight",
                  active
                    ? "text-navy-900"
                    : done
                    ? "text-accent-700"
                    : "text-neutral-400"
                )}
              >
                {step.label}
              </p>
            </li>
          );
        })}
      </ol>
    </nav>
  );
}
