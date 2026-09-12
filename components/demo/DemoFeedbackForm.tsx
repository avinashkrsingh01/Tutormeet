"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import {
  Star, CheckCircle2, Clock, BookOpen,
  ThumbsUp, ThumbsDown, ArrowRight, Users,
} from "lucide-react";
import { Button } from "@/components/ui/Button";
import { Textarea } from "@/components/ui/Textarea";
import { Alert } from "@/components/ui/Alert";
import { Avatar } from "@/components/ui/Avatar";
import { cn } from "@/lib/utils";
import {
  submitDemoFeedbackAction,
  createEnrollmentAction,
} from "@/app/actions/demo";

// ─── Star rating picker ───────────────────────────────────────────────────────

function StarPicker({
  value,
  onChange,
  label,
}: {
  value:    number;
  onChange: (v: number) => void;
  label:    string;
}) {
  const [hover, setHover] = useState(0);

  return (
    <div>
      <p className="mb-2 text-sm font-semibold text-navy-900">{label}</p>
      <div className="flex gap-1.5">
        {[1, 2, 3, 4, 5].map((star) => (
          <button
            key={star}
            type="button"
            onClick={() => onChange(star)}
            onMouseEnter={() => setHover(star)}
            onMouseLeave={() => setHover(0)}
            aria-label={`${star} star${star !== 1 ? "s" : ""}`}
            className="transition-transform hover:scale-110"
          >
            <Star
              className={cn(
                "h-8 w-8 transition-colors",
                star <= (hover || value)
                  ? "fill-amber-400 text-amber-400"
                  : "fill-neutral-200 text-neutral-200"
              )}
            />
          </button>
        ))}
      </div>
      {value > 0 && (
        <p className="mt-1.5 text-xs text-neutral-500">
          {["", "Poor", "Fair", "Good", "Very good", "Excellent"][value]}
        </p>
      )}
    </div>
  );
}

// ─── Yes/No question ──────────────────────────────────────────────────────────

function YesNo({
  label,
  icon,
  value,
  onChange,
}: {
  label:    string;
  icon:     React.ReactNode;
  value:    boolean | null;
  onChange: (v: boolean) => void;
}) {
  return (
    <div>
      <div className="mb-2 flex items-center gap-2 text-sm font-semibold text-navy-900">
        <span className="text-brand-700">{icon}</span>
        {label}
      </div>
      <div className="flex gap-2">
        {[
          { val: true,  label: "Yes", icon: <ThumbsUp  className="h-4 w-4" /> },
          { val: false, label: "No",  icon: <ThumbsDown className="h-4 w-4" /> },
        ].map((opt) => (
          <button
            key={String(opt.val)}
            type="button"
            onClick={() => onChange(opt.val)}
            className={cn(
              "flex items-center gap-2 rounded-xl border-2 px-4 py-2.5 text-sm font-semibold transition-all",
              value === opt.val
                ? opt.val
                  ? "border-accent-500 bg-accent-50 text-accent-800"
                  : "border-red-300 bg-red-50 text-red-700"
                : "border-neutral-200 bg-white text-neutral-600 hover:border-neutral-300"
            )}
          >
            {opt.icon}
            {opt.label}
          </button>
        ))}
      </div>
    </div>
  );
}

// ─── Main form ────────────────────────────────────────────────────────────────

interface DemoFeedbackFormProps {
  demoId:          string;
  tutorName:       string;
  tutorAvatarUrl:  string | null;
  agreedFee?:      number | null;
}

export function DemoFeedbackForm({
  demoId,
  tutorName,
  tutorAvatarUrl,
  agreedFee,
}: DemoFeedbackFormProps) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();

  // Form state
  const [rating,                setRating]              = useState(0);
  const [wasPunctual,           setWasPunctual]         = useState<boolean | null>(null);
  const [wasExplanationClear,   setWasExplanationClear] = useState<boolean | null>(null);
  const [wantsToContinue,       setWantsToContinue]     = useState<boolean | null>(null);
  const [comment,               setComment]             = useState("");

  // UI state
  const [step,   setStep]   = useState<"feedback" | "decision" | "confirm">("feedback");
  const [error,  setError]  = useState<string | null>(null);
  const [feedbackSubmitted, setFeedbackSubmitted] = useState(false);

  // Validation
  const feedbackComplete =
    rating > 0 &&
    wasPunctual !== null &&
    wasExplanationClear !== null;

  // ── Step 1: Submit feedback ────────────────────────────────────────────────

  function handleFeedbackSubmit() {
    if (!feedbackComplete) {
      setError("Please rate the session and answer all questions.");
      return;
    }
    setError(null);
    setStep("decision");
    setFeedbackSubmitted(true);
  }

  // ── Step 2: Decision — continue or try another ────────────────────────────

  function handleDecision(continues: boolean) {
    setWantsToContinue(continues);
    startTransition(async () => {
      const result = await submitDemoFeedbackAction({
        demo_id:               demoId,
        rating,
        was_tutor_punctual:    wasPunctual!,
        was_explanation_clear: wasExplanationClear!,
        wants_to_continue:     continues,
        comment:               comment || undefined,
      });

      if (!result.success) {
        setError(result.error);
        return;
      }

      if (continues) {
        setStep("confirm");
      } else {
        // Return to matches list to try another tutor
        router.push("/parent/matches?feedback=declined");
      }
    });
  }

  // ── Step 3: Create enrollment ──────────────────────────────────────────────

  function handleCreateEnrollment() {
    startTransition(async () => {
      const result = await createEnrollmentAction({
        demo_id:             demoId,
        agreed_fee_per_hour: agreedFee ?? 0,
      });

      if (!result.success) {
        setError(result.error);
        return;
      }

      router.push(`/parent/dashboard?enrolled=1`);
    });
  }

  // ─────────────────────────────────────────────────────────────────────────

  if (step === "confirm") {
    return (
      <div className="space-y-6 text-center">
        <div className="flex flex-col items-center gap-4">
          <div className="flex h-16 w-16 items-center justify-center rounded-2xl bg-accent-100 text-accent-600">
            <CheckCircle2 className="h-8 w-8" />
          </div>
          <div>
            <h2 className="text-xl font-bold text-navy-900" style={{ letterSpacing: "-0.02em" }}>
              Great choice!
            </h2>
            <p className="mt-1.5 text-sm text-neutral-500">
              You&apos;ve selected{" "}
              <span className="font-semibold text-navy-800">{tutorName}</span>{" "}
              as your tutor. Ready to start?
            </p>
          </div>
        </div>

        {error && <Alert variant="error" message={error} />}

        <div className="rounded-2xl border border-accent-200 bg-accent-50 p-5 text-left">
          <p className="mb-2 text-sm font-semibold text-accent-900">What happens next</p>
          <ul className="space-y-2 text-xs text-accent-800">
            <li className="flex items-center gap-2">
              <CheckCircle2 className="h-3.5 w-3.5 flex-shrink-0" />
              Your enrollment will be confirmed immediately
            </li>
            <li className="flex items-center gap-2">
              <CheckCircle2 className="h-3.5 w-3.5 flex-shrink-0" />
              Sessions can be tracked via the Attendance page
            </li>
            <li className="flex items-center gap-2">
              <CheckCircle2 className="h-3.5 w-3.5 flex-shrink-0" />
              Payment is arranged directly with your tutor
            </li>
          </ul>
        </div>

        <Button
          variant="teal"
          size="lg"
          fullWidth
          loading={isPending}
          onClick={handleCreateEnrollment}
          iconRight={<ArrowRight className="h-4 w-4" />}
        >
          Confirm &amp; Start Tuition
        </Button>
      </div>
    );
  }

  if (step === "decision") {
    return (
      <div className="space-y-6">
        {/* Thank you header */}
        <div className="flex flex-col items-center gap-3 text-center">
          <Avatar name={tutorName} src={tutorAvatarUrl} size="lg" />
          <div>
            <p className="text-lg font-bold text-navy-900" style={{ letterSpacing: "-0.02em" }}>
              Thanks for your feedback!
            </p>
            <p className="mt-1 text-sm text-neutral-500">
              You gave {tutorName.split(" ")[0]}{" "}
              <span className="font-semibold text-amber-500">{rating}★</span>. What would you like to do?
            </p>
          </div>
        </div>

        {error && <Alert variant="error" message={error} />}

        <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
          {/* Continue with tutor */}
          <button
            type="button"
            disabled={isPending}
            onClick={() => handleDecision(true)}
            className={cn(
              "flex flex-col items-center gap-3 rounded-2xl border-2 p-6 text-center transition-all",
              "border-accent-300 bg-accent-50 hover:border-accent-400 hover:bg-accent-100",
              isPending && "opacity-60 cursor-not-allowed"
            )}
          >
            <CheckCircle2 className="h-8 w-8 text-accent-600" />
            <div>
              <p className="font-bold text-navy-900">Continue with {tutorName.split(" ")[0]}</p>
              <p className="mt-0.5 text-xs text-neutral-500">
                Create an enrollment and start tuition
              </p>
            </div>
          </button>

          {/* Try another tutor */}
          <button
            type="button"
            disabled={isPending}
            onClick={() => handleDecision(false)}
            className={cn(
              "flex flex-col items-center gap-3 rounded-2xl border-2 p-6 text-center transition-all",
              "border-neutral-200 bg-white hover:border-neutral-300 hover:bg-neutral-50",
              isPending && "opacity-60 cursor-not-allowed"
            )}
          >
            <Users className="h-8 w-8 text-neutral-400" />
            <div>
              <p className="font-bold text-navy-900">Try another tutor</p>
              <p className="mt-0.5 text-xs text-neutral-500">
                Return to your matched tutors list
              </p>
            </div>
          </button>
        </div>
      </div>
    );
  }

  // ── Step 1: Feedback form ────────────────────────────────────────────────

  return (
    <div className="space-y-6">
      {/* Tutor header */}
      <div className="flex items-center gap-4">
        <Avatar name={tutorName} src={tutorAvatarUrl} size="lg" />
        <div>
          <p className="font-bold text-navy-900">How was your demo with {tutorName.split(" ")[0]}?</p>
          <p className="mt-0.5 text-xs text-neutral-500">
            Your feedback helps us improve and helps other parents.
          </p>
        </div>
      </div>

      {error && <Alert variant="error" message={error} />}

      {/* Star rating */}
      <StarPicker
        value={rating}
        onChange={setRating}
        label="Overall rating"
      />

      {/* Yes/No questions */}
      <div className="space-y-5">
        <YesNo
          label="Was the tutor punctual?"
          icon={<Clock className="h-4 w-4" />}
          value={wasPunctual}
          onChange={setWasPunctual}
        />
        <YesNo
          label="Was the explanation clear and easy to understand?"
          icon={<BookOpen className="h-4 w-4" />}
          value={wasExplanationClear}
          onChange={setWasExplanationClear}
        />
      </div>

      {/* Comment */}
      <Textarea
        label="Anything else to share? (optional)"
        placeholder="e.g. The tutor was very patient and explained concepts step by step..."
        rows={3}
        value={comment}
        onChange={(e) => setComment(e.target.value)}
        showCount
        maxLength={500}
      />

      <Button
        variant="primary"
        size="lg"
        fullWidth
        disabled={!feedbackComplete}
        onClick={handleFeedbackSubmit}
        iconRight={<ArrowRight className="h-4 w-4" />}
      >
        Submit Feedback
      </Button>

      {!feedbackComplete && (
        <p className="text-center text-xs text-neutral-400">
          Please rate the session and answer all questions to continue.
        </p>
      )}
    </div>
  );
}
