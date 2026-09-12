import Link from "next/link";
import {
  MapPin,
  Clock,
  IndianRupee,
  Star,
  BookOpen,
  Video,
} from "lucide-react";
import { Avatar } from "@/components/ui/Avatar";
import { Badge } from "@/components/ui/Badge";
import { VerifiedBadge } from "@/components/ui/Badge";
import { Button } from "@/components/ui/Button";
import { formatINR, cn } from "@/lib/utils";
import type { TutorCard as TutorCardType } from "@/types/tutor";

interface TutorCardProps {
  tutor: TutorCardType;
  actionLabel?: string;
  actionHref?: string;
  onAction?: () => void;
  compact?: boolean;
  className?: string;
}

// ─── Star rating display ───────────────────────────────────────────────────────

function StarRating({ rating, count }: { rating: number; count: number }) {
  return (
    <div className="flex items-center gap-1.5">
      <div className="flex items-center gap-0.5">
        {[1, 2, 3, 4, 5].map((star) => (
          <Star
            key={star}
            className={cn(
              "h-3.5 w-3.5",
              star <= Math.round(rating)
                ? "fill-amber-400 text-amber-400"
                : "fill-neutral-200 text-neutral-200"
            )}
          />
        ))}
      </div>
      <span className="text-xs font-semibold text-navy-900">
        {rating.toFixed(1)}
      </span>
      <span className="text-xs text-neutral-400">
        ({count})
      </span>
    </div>
  );
}

// ─── Main component ────────────────────────────────────────────────────────────

export function TutorCard({
  tutor,
  actionLabel = "View Profile",
  actionHref,
  onAction,
  compact = false,
  className,
}: TutorCardProps) {
  const location = [tutor.locality, tutor.city].filter(Boolean).join(", ");

  const cardContent = (
    <div
      className={cn(
        "group flex h-full flex-col overflow-hidden rounded-2xl border border-neutral-200 bg-white",
        "transition-all duration-200 hover:border-brand-200 hover:shadow-md",
        className
      )}
    >
      {/* ── Top accent strip ───────────────────────────────────── */}
      <div className="h-1 w-full bg-gradient-to-r from-brand-900 via-brand-700 to-accent-500" />

      {/* ── Card body ──────────────────────────────────────────── */}
      <div className="flex flex-1 flex-col gap-4 p-5">

        {/* Header row: avatar + name + verified + location */}
        <div className="flex items-start gap-3.5">
          <Avatar
            name={tutor.full_name}
            src={tutor.avatar_url}
            size="lg"
            verified
            className="flex-shrink-0"
          />

          <div className="min-w-0 flex-1">
            <div className="flex items-start justify-between gap-2">
              <h3 className="truncate text-sm font-bold text-navy-900 leading-snug"
                style={{ letterSpacing: "-0.01em" }}>
                {tutor.full_name}
              </h3>
              <VerifiedBadge className="flex-shrink-0" />
            </div>

            {location && (
              <p className="mt-0.5 flex items-center gap-1 text-xs text-neutral-400">
                <MapPin className="h-3 w-3 flex-shrink-0" aria-hidden="true" />
                <span className="truncate">{location}</span>
              </p>
            )}

            {tutor.average_rating ? (
              <div className="mt-1.5">
                <StarRating
                  rating={tutor.average_rating}
                  count={tutor.total_reviews}
                />
              </div>
            ) : (
              <p className="mt-1 text-xs text-neutral-400">No reviews yet</p>
            )}
          </div>
        </div>

        {/* Subjects */}
        {tutor.subjects.length > 0 && (
          <div className="flex flex-wrap gap-1.5">
            {tutor.subjects.slice(0, 3).map((s) => (
              <span key={s} className="tag">{s}</span>
            ))}
            {tutor.subjects.length > 3 && (
              <span className="tag text-neutral-400">
                +{tutor.subjects.length - 3}
              </span>
            )}
          </div>
        )}

        {/* Stats row */}
        <div className="flex flex-wrap items-center gap-x-4 gap-y-1.5">
          {tutor.years_of_experience !== null && (
            <span className="flex items-center gap-1.5 text-xs text-neutral-500">
              <Clock className="h-3.5 w-3.5 text-neutral-400" aria-hidden="true" />
              {tutor.years_of_experience === 0
                ? "Fresher"
                : `${tutor.years_of_experience}+ yrs`}
            </span>
          )}

          {tutor.expected_fee_per_hour !== null && (
            <span className="flex items-center gap-1 text-xs font-semibold text-navy-800">
              <IndianRupee className="h-3.5 w-3.5 text-neutral-400" aria-hidden="true" />
              {formatINR(tutor.expected_fee_per_hour)}/hr
            </span>
          )}

          {tutor.teaching_mode && (
            <span className="flex items-center gap-1 text-xs text-neutral-500">
              <BookOpen className="h-3.5 w-3.5 text-neutral-400" aria-hidden="true" />
              {tutor.teaching_mode}
            </span>
          )}
        </div>

        {/* Bio — only in full (non-compact) mode */}
        {!compact && tutor.bio && (
          <p className="line-clamp-2 text-xs leading-relaxed text-neutral-500">
            {tutor.bio}
          </p>
        )}

        {/* Spacer */}
        <div className="flex-1" />

        {/* Footer: demo badge + CTA */}
        <div className="flex items-center justify-between gap-3 border-t border-neutral-100 pt-4">
          {tutor.demo_class_available ? (
            <span className="flex items-center gap-1.5 text-xs font-medium text-accent-700">
              <Video className="h-3.5 w-3.5" aria-hidden="true" />
              Free demo
            </span>
          ) : (
            <span />
          )}

          {(actionHref || onAction) && (
            actionHref ? (
              <Link href={actionHref} onClick={(e) => e.stopPropagation()}>
                <Button variant="outline" size="sm">
                  {actionLabel}
                </Button>
              </Link>
            ) : (
              <Button variant="outline" size="sm" onClick={onAction}>
                {actionLabel}
              </Button>
            )
          )}
        </div>
      </div>
    </div>
  );

  // If actionHref is provided and no separate button logic, wrap entire card as link
  if (actionHref && !onAction) {
    return (
      <Link href={actionHref} className="block h-full focus:outline-none focus-visible:ring-2 focus-visible:ring-brand-500 focus-visible:ring-offset-2 rounded-2xl">
        {cardContent}
      </Link>
    );
  }

  return cardContent;
}

// ─── Horizontal tutor card (used in admin/matching views) ─────────────────────

interface TutorCardHorizontalProps {
  tutor: TutorCardType;
  action?: React.ReactNode;
  className?: string;
}

export function TutorCardHorizontal({
  tutor,
  action,
  className,
}: TutorCardHorizontalProps) {
  const location = [tutor.locality, tutor.city].filter(Boolean).join(", ");

  return (
    <div
      className={cn(
        "flex items-center gap-4 rounded-xl border border-neutral-200 bg-white p-4",
        "transition-all duration-150 hover:border-brand-200 hover:shadow-sm",
        className
      )}
    >
      <Avatar
        name={tutor.full_name}
        src={tutor.avatar_url}
        size="md"
        verified
        className="flex-shrink-0"
      />

      <div className="min-w-0 flex-1">
        <div className="flex items-center gap-2">
          <p className="truncate text-sm font-semibold text-navy-900">
            {tutor.full_name}
          </p>
          <VerifiedBadge />
        </div>

        <div className="mt-0.5 flex flex-wrap items-center gap-x-3 gap-y-0.5 text-xs text-neutral-500">
          {location && (
            <span className="flex items-center gap-1">
              <MapPin className="h-3 w-3" />
              {location}
            </span>
          )}
          {tutor.years_of_experience !== null && (
            <span className="flex items-center gap-1">
              <Clock className="h-3 w-3" />
              {tutor.years_of_experience}+ yrs
            </span>
          )}
          {tutor.expected_fee_per_hour !== null && (
            <span className="flex items-center gap-1 font-medium text-navy-800">
              <IndianRupee className="h-3 w-3" />
              {formatINR(tutor.expected_fee_per_hour)}/hr
            </span>
          )}
        </div>

        <div className="mt-1.5 flex flex-wrap gap-1">
          {tutor.subjects.slice(0, 3).map((s) => (
            <span key={s} className="tag">{s}</span>
          ))}
        </div>
      </div>

      {action && (
        <div className="flex-shrink-0">{action}</div>
      )}
    </div>
  );
}
