"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { Star, CheckCircle2, Clock, BookOpen, MessageCircle, Award, ArrowRight } from "lucide-react";
import { Button } from "@/components/ui/Button";
import { Textarea } from "@/components/ui/Textarea";
import { Alert } from "@/components/ui/Alert";
import { Avatar } from "@/components/ui/Avatar";
import { cn } from "@/lib/utils";
import { submitReviewAction } from "@/app/actions/review";

// ─── Category definition ──────────────────────────────────────────────────────

const CATEGORIES = [
  {
    key:   "rating_teaching_quality"  as const,
    label: "Teaching Quality",
    desc:  "How well did the tutor explain concepts and engage the student?",
    icon:  <BookOpen className="h-4 w-4" />,
  },
  {
    key:   "rating_subject_knowledge" as const,
    label: "Subject Knowledge",
    desc:  "How strong was the tutor's command of the subject?",
    icon:  <Award className="h-4 w-4" />,
  },
  {
    key:   "rating_punctuality"       as const,
    label: "Punctuality",
    desc:  "Did the tutor arrive on time and respect the schedule?",
    icon:  <Clock className="h-4 w-4" />,
  },
  {
    key:   "rating_communication"     as const,
    label: "Communication",
    desc:  "How clear and responsive was the tutor with you and the student?",
    icon:  <MessageCircle className="h-4 w-4" />,
  },
  {
    key:   "rating_professionalism"   as const,
    label: "Professionalism",
    desc:  "Was the tutor prepared, respectful, and professional throughout?",
    icon:  <CheckCircle2 className="h-4 w-4" />,
  },
] as const;

type CategoryKey = typeof CATEGORIES[number]["key"];

type Ratings = Record<CategoryKey, number>;

// ─── Star picker ──────────────────────────────────────────────────────────────

const STAR_LABELS = ["", "Poor", "Fair", "Good", "Very Good", "Excellent"];

function CategoryRating({
  label, desc, icon, value, onChange,
}: {
  label:    string;
  desc:     string;
  icon:     React.ReactNode;
  value:    number;
  onChange: (v: number) => void;
}) {
  const [hover, setHover] = useState(0);

  return (
    <div className="flex flex-col gap-2 sm:flex-row sm:items-start sm:gap-5">
      <div className="flex-1">
        <div className="flex items-center gap-2 mb-0.5">
          <span className="text-brand-700">{icon}</span>
          <p className="text-sm font-semibold text-navy-900">{label}</p>
        </div>
        <p className="text-xs text-neutral-500">{desc}</p>
      </div>

      <div className="flex flex-col items-end gap-1">
        <div className="flex gap-1">
          {[1, 2, 3, 4, 5].map((star) => (
            <button
              key={star}
              type="button"
              onClick={() => onChange(star)}
              onMouseEnter={() => setHover(star)}
              onMouseLeave={() => setHover(0)}
              aria-label={`Rate ${star}`}
              className="transition-transform hover:scale-110"
            >
              <Star
                className={cn(
                  "h-7 w-7 transition-colors",
                  star <= (hover || value)
                    ? "fill-amber-400 text-amber-400"
                    : "fill-neutral-100 text-neutral-300"
                )}
              />
            </button>
          ))}
        </div>
        {(hover || value) > 0 && (
          <p className="text-xs text-neutral-500">
            {STAR_LABELS[hover || value]}
          </p>
        )}
      </div>
    </div>
  );
}

// ─── Overall display ──────────────────────────────────────────────────────────

function OverallDisplay({ ratings }: { ratings: Partial<Ratings> }) {
  const vals = Object.values(ratings).filter((v) => v > 0);
  if (vals.length === 0) return null;
  const avg  = vals.reduce((a, b) => a + b, 0) / vals.length;
  const rounded = Math.round(avg * 10) / 10;

  return (
    <div className="flex items-center justify-between rounded-2xl border border-amber-200 bg-amber-50 px-5 py-3.5">
      <p className="text-sm font-semibold text-amber-900">Overall Rating</p>
      <div className="flex items-center gap-2">
        <span className="text-2xl font-extrabold text-amber-600" style={{ letterSpacing: "-0.03em" }}>
          {rounded.toFixed(1)}
        </span>
        <span className="text-amber-400 text-xl">★</span>
        <span className="text-xs text-amber-700">/ 5</span>
      </div>
    </div>
  );
}

// ─── Main component ───────────────────────────────────────────────────────────

interface ReviewFormProps {
  tutorProfileId: string;
  tutorName:      string;
  tutorAvatarUrl: string | null;
  enrollmentId?:  string;
  demoClassId?:   string;
  onSuccess?:     () => void;
}

export function ReviewForm({
  tutorProfileId,
  tutorName,
  tutorAvatarUrl,
  enrollmentId,
  demoClassId,
  onSuccess,
}: ReviewFormProps) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();
  const [error,     setError]        = useState<string | null>(null);
  const [submitted, setSubmitted]    = useState(false);
  const [autoPublished, setAutoPublished] = useState(false);

  const [ratings, setRatings] = useState<Partial<Ratings>>({});
  const [comment, setComment] = useState("");

  const allRated  = CATEGORIES.every((c) => (ratings[c.key] ?? 0) > 0);
  const canSubmit = allRated;

  function setRating(key: CategoryKey, val: number) {
    setRatings((prev) => ({ ...prev, [key]: val }));
  }

  function handleSubmit() {
    if (!canSubmit) {
      setError("Please rate all 5 categories before submitting.");
      return;
    }
    setError(null);
    startTransition(async () => {
      const result = await submitReviewAction({
        tutor_profile_id:         tutorProfileId,
        enrollment_id:            enrollmentId,
        demo_class_id:            demoClassId,
        rating_teaching_quality:  ratings.rating_teaching_quality!,
        rating_subject_knowledge: ratings.rating_subject_knowledge!,
        rating_punctuality:       ratings.rating_punctuality!,
        rating_communication:     ratings.rating_communication!,
        rating_professionalism:   ratings.rating_professionalism!,
        comment:                  comment || undefined,
      });

      if (!result.success) {
        setError(result.error);
        return;
      }

      setSubmitted(true);
      setAutoPublished(result.autoPublished);
      onSuccess?.();
    });
  }

  if (submitted) {
    return (
      <div className="flex flex-col items-center gap-5 py-6 text-center">
        <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-accent-100 text-accent-600">
          <CheckCircle2 className="h-7 w-7" />
        </div>
        <div>
          <p className="text-lg font-bold text-navy-900" style={{ letterSpacing: "-0.02em" }}>
            Review submitted!
          </p>
          <p className="mt-1.5 text-sm text-neutral-500">
            {autoPublished
              ? "Your review has been published and is now visible on the tutor's profile."
              : "Your review is being reviewed by our team and will be published shortly."}
          </p>
        </div>
        <button
          type="button"
          onClick={() => router.push("/parent/reviews")}
          className="text-sm font-semibold text-brand-700 hover:text-brand-800 underline-offset-2 hover:underline"
        >
          View your reviews →
        </button>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Tutor header */}
      <div className="flex items-center gap-3">
        <Avatar name={tutorName} src={tutorAvatarUrl} size="md" verified />
        <div>
          <p className="font-bold text-navy-900">Write a review for {tutorName}</p>
          <p className="text-xs text-neutral-500">
            Your review helps other parents find great tutors.
          </p>
        </div>
      </div>

      {/* Verified badge info */}
      <div className="flex items-start gap-2.5 rounded-xl border border-brand-200 bg-brand-50 px-4 py-3">
        <CheckCircle2 className="mt-0.5 h-4 w-4 flex-shrink-0 text-brand-700" />
        <p className="text-xs text-brand-800">
          This will be marked as a{" "}
          <span className="font-semibold">Verified Review</span> — only parents with confirmed tuition experience can submit reviews.
        </p>
      </div>

      {error && <Alert variant="error" message={error} />}

      {/* Category ratings */}
      <div className="space-y-5 rounded-2xl border border-neutral-200 bg-neutral-50 p-5">
        {CATEGORIES.map((cat) => (
          <div key={cat.key}>
            <CategoryRating
              label={cat.label}
              desc={cat.desc}
              icon={cat.icon}
              value={ratings[cat.key] ?? 0}
              onChange={(v) => setRating(cat.key, v)}
            />
            {cat !== CATEGORIES[CATEGORIES.length - 1] && (
              <div className="mt-4 h-px bg-neutral-200" />
            )}
          </div>
        ))}
      </div>

      {/* Overall */}
      <OverallDisplay ratings={ratings} />

      {/* Written review */}
      <Textarea
        label="Your experience (optional)"
        placeholder="Share what made this tutor stand out, how they helped your child, or anything parents should know..."
        rows={4}
        value={comment}
        onChange={(e) => setComment(e.target.value)}
        showCount
        maxLength={800}
        hint="Minimum 10 characters if you choose to write something"
      />

      <Button
        variant="primary"
        size="lg"
        fullWidth
        disabled={!canSubmit}
        loading={isPending}
        onClick={handleSubmit}
        iconRight={<ArrowRight className="h-4 w-4" />}
      >
        Submit Review
      </Button>

      {!canSubmit && (
        <p className="text-center text-xs text-neutral-400">
          Rate all 5 categories to submit your review.
        </p>
      )}
    </div>
  );
}
