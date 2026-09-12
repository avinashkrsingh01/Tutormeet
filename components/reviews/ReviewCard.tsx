import { Star, ShieldCheck, Flag } from "lucide-react";
import { Avatar } from "@/components/ui/Avatar";
import { cn } from "@/lib/utils";
import { formatDate } from "@/lib/utils";

// ─── Category bar ─────────────────────────────────────────────────────────────

function CategoryBar({
  label, rating,
}: { label: string; rating: number }) {
  const pct = (rating / 5) * 100;
  return (
    <div className="flex items-center gap-3">
      <span className="w-32 flex-shrink-0 text-xs text-neutral-500">{label}</span>
      <div className="flex-1">
        <div className="h-1.5 w-full overflow-hidden rounded-full bg-neutral-100">
          <div
            className="h-full rounded-full bg-amber-400"
            style={{ width: `${pct}%` }}
          />
        </div>
      </div>
      <span className="w-6 text-right text-xs font-semibold text-neutral-700">{rating}</span>
    </div>
  );
}

// ─── Verified badge ───────────────────────────────────────────────────────────

export function VerifiedReviewBadge({ className }: { className?: string }) {
  return (
    <span
      className={cn(
        "inline-flex items-center gap-1 rounded-full border border-accent-200 bg-accent-50",
        "px-2.5 py-0.5 text-2xs font-semibold text-accent-700",
        className
      )}
    >
      <ShieldCheck className="h-3 w-3" />
      Verified Review
    </span>
  );
}

// ─── Star display ─────────────────────────────────────────────────────────────

export function StarDisplay({
  rating, size = "sm",
}: {
  rating: number;
  size?:  "sm" | "md";
}) {
  const cls = size === "md" ? "h-5 w-5" : "h-4 w-4";
  return (
    <div className="flex items-center gap-0.5">
      {[1,2,3,4,5].map((s) => (
        <Star
          key={s}
          className={cn(cls,
            s <= Math.round(rating)
              ? "fill-amber-400 text-amber-400"
              : "fill-neutral-200 text-neutral-200"
          )}
          aria-hidden="true"
        />
      ))}
    </div>
  );
}

// ─── Review card props ────────────────────────────────────────────────────────

export interface ReviewCardData {
  id:                       string;
  overall_rating:           number;
  rating_teaching_quality:  number | null;
  rating_subject_knowledge: number | null;
  rating_punctuality:       number | null;
  rating_communication:     number | null;
  rating_professionalism:   number | null;
  comment:                  string | null;
  is_verified_review:       boolean;
  published_at:             string | null;
  created_at:               string;
  parent_name:              string;
  parent_avatar_url:        string | null;
  student_name?:            string | null;
}

interface ReviewCardProps {
  review:          ReviewCardData;
  showCategories?: boolean;
  onReport?:       (id: string) => void;
  className?:      string;
}

export function ReviewCard({
  review,
  showCategories = false,
  onReport,
  className,
}: ReviewCardProps) {
  const categories = [
    { label: "Teaching Quality",   val: review.rating_teaching_quality  },
    { label: "Subject Knowledge",  val: review.rating_subject_knowledge },
    { label: "Punctuality",        val: review.rating_punctuality        },
    { label: "Communication",      val: review.rating_communication      },
    { label: "Professionalism",    val: review.rating_professionalism    },
  ].filter((c): c is { label: string; val: number } => c.val !== null && c.val !== undefined);

  const date = review.published_at ?? review.created_at;

  return (
    <div className={cn("rounded-2xl border border-neutral-200 bg-white p-5", className)}>
      {/* Header */}
      <div className="flex items-start justify-between gap-4">
        <div className="flex items-start gap-3">
          <Avatar
            name={review.parent_name}
            src={review.parent_avatar_url}
            size="md"
          />
          <div>
            <p className="font-semibold text-navy-900">{review.parent_name}</p>
            {review.student_name && (
              <p className="text-xs text-neutral-500">
                For {review.student_name}
              </p>
            )}
            <div className="mt-1 flex flex-wrap items-center gap-2">
              <StarDisplay rating={review.overall_rating} />
              <span className="text-xs font-semibold text-navy-900">
                {review.overall_rating.toFixed(1)}
              </span>
              {review.is_verified_review && <VerifiedReviewBadge />}
            </div>
          </div>
        </div>

        <div className="flex flex-shrink-0 flex-col items-end gap-2">
          <p className="text-xs text-neutral-400">{formatDate(date)}</p>
          {onReport && (
            <button
              type="button"
              onClick={() => onReport(review.id)}
              className="flex items-center gap-1 text-2xs text-neutral-400 hover:text-red-500 transition-colors"
              aria-label="Report this review"
            >
              <Flag className="h-3 w-3" /> Report
            </button>
          )}
        </div>
      </div>

      {/* Written comment */}
      {review.comment && (
        <p className="mt-4 text-sm italic leading-relaxed text-neutral-600">
          &ldquo;{review.comment}&rdquo;
        </p>
      )}

      {/* Category breakdown */}
      {showCategories && categories.length > 0 && (
        <div className="mt-4 space-y-2 border-t border-neutral-100 pt-4">
          {categories.map((c) => (
            <CategoryBar key={c.label} label={c.label} rating={c.val} />
          ))}
        </div>
      )}
    </div>
  );
}

// ─── Summary bar (tutor profile aggregate) ───────────────────────────────────

interface ReviewSummaryProps {
  averages: {
    overall:          number;
    teaching_quality: number;
    subject_knowledge: number;
    punctuality:      number;
    communication:    number;
    professionalism:  number;
  };
  totalReviews: number;
  className?:   string;
}

export function ReviewSummary({ averages, totalReviews, className }: ReviewSummaryProps) {
  return (
    <div className={cn("rounded-2xl border border-neutral-200 bg-white p-5", className)}>
      {/* Overall score */}
      <div className="mb-5 flex items-center gap-4">
        <div className="flex h-16 w-16 flex-shrink-0 flex-col items-center justify-center rounded-2xl bg-amber-50 shadow-sm">
          <span className="text-2xl font-extrabold text-amber-600" style={{ letterSpacing: "-0.04em" }}>
            {averages.overall.toFixed(1)}
          </span>
          <span className="text-2xs text-amber-500">/ 5</span>
        </div>
        <div>
          <StarDisplay rating={averages.overall} size="md" />
          <p className="mt-1 text-sm text-neutral-500">
            Based on{" "}
            <span className="font-semibold text-navy-900">{totalReviews}</span>{" "}
            verified review{totalReviews !== 1 ? "s" : ""}
          </p>
        </div>
      </div>

      {/* Category breakdown */}
      <div className="space-y-2">
        {[
          { label: "Teaching Quality",   val: averages.teaching_quality   },
          { label: "Subject Knowledge",  val: averages.subject_knowledge  },
          { label: "Punctuality",        val: averages.punctuality        },
          { label: "Communication",      val: averages.communication      },
          { label: "Professionalism",    val: averages.professionalism    },
        ].map((c) => (
          <CategoryBar key={c.label} label={c.label} rating={Math.round(c.val * 10) / 10} />
        ))}
      </div>
    </div>
  );
}
