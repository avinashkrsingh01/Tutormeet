import {
  BookOpen,
  GraduationCap,
  Calendar,
  MapPin,
  Clock,
  Star,
  IndianRupee,
  Video,
  BadgeCheck,
  CheckCircle2,
} from "lucide-react";
import { cn } from "@/lib/utils";
import type { MatchReason, ScoreBreakdown } from "@/lib/matching/types";
import { WEIGHT_LABELS } from "@/lib/matching/engine";

// ─── Icon resolver ────────────────────────────────────────────────────────────

const ICON_MAP: Record<string, React.ElementType> = {
  BookOpen,
  GraduationCap,
  Calendar,
  MapPin,
  Clock,
  Star,
  IndianRupee,
  Video,
  BadgeCheck,
};

function ReasonIcon({ name, className }: { name: string; className?: string }) {
  const Icon = ICON_MAP[name] ?? CheckCircle2;
  return <Icon className={className} aria-hidden="true" />;
}

// ─── Score ring ───────────────────────────────────────────────────────────────

function ScoreRing({ score }: { score: number }) {
  const radius       = 28;
  const circumference = 2 * Math.PI * radius;
  const progress     = (score / 100) * circumference;

  const color =
    score >= 80 ? "#14b8a6"   // teal — excellent
    : score >= 60 ? "#1e3f8f" // navy — good
    : "#f97316";              // orange — fair

  return (
    <div className="relative flex h-20 w-20 flex-shrink-0 items-center justify-center">
      <svg className="absolute inset-0 -rotate-90" width="80" height="80" viewBox="0 0 80 80">
        {/* Track */}
        <circle cx="40" cy="40" r={radius} fill="none"
          stroke="#e5e5e5" strokeWidth="6" />
        {/* Progress */}
        <circle cx="40" cy="40" r={radius} fill="none"
          stroke={color} strokeWidth="6"
          strokeLinecap="round"
          strokeDasharray={`${progress} ${circumference}`}
        />
      </svg>
      <div className="relative text-center">
        <p className="text-xl font-extrabold leading-none text-navy-900"
          style={{ letterSpacing: "-0.04em" }}>
          {Math.round(score)}
        </p>
        <p className="text-2xs font-semibold text-neutral-400">/ 100</p>
      </div>
    </div>
  );
}

// ─── Main component ───────────────────────────────────────────────────────────

interface MatchScoreCardProps {
  score:     number;
  reasons:   MatchReason[];
  compact?:  boolean;
  className?: string;
}

export function MatchScoreCard({
  score,
  reasons,
  compact = false,
  className,
}: MatchScoreCardProps) {
  const scoreColor =
    score >= 80 ? "text-accent-700"
    : score >= 60 ? "text-brand-700"
    : "text-orange-600";

  const scoreBg =
    score >= 80 ? "border-accent-200 bg-accent-50"
    : score >= 60 ? "border-brand-200 bg-brand-50"
    : "border-orange-200 bg-orange-50";

  const scoreLabel =
    score >= 85 ? "Excellent match"
    : score >= 70 ? "Strong match"
    : score >= 55 ? "Good match"
    : "Partial match";

  if (compact) {
    return (
      <div className={cn("flex items-center gap-2", className)}>
        <span className={cn(
          "inline-flex items-center gap-1 rounded-full border px-2.5 py-0.5 text-xs font-bold",
          scoreBg, scoreColor
        )}>
          {Math.round(score)}% match
        </span>
      </div>
    );
  }

  return (
    <div className={cn(
      "overflow-hidden rounded-2xl border",
      scoreBg,
      className
    )}>
      <div className="p-4">
        {/* Header */}
        <div className="mb-4 flex items-center gap-4">
          <ScoreRing score={score} />
          <div>
            <p className={cn("text-lg font-extrabold leading-tight", scoreColor)}
              style={{ letterSpacing: "-0.03em" }}>
              {Math.round(score)}% Match
            </p>
            <p className="text-xs font-medium text-neutral-500">{scoreLabel}</p>
          </div>
        </div>

        {/* Reason lines */}
        {reasons.length > 0 && (
          <ul className="space-y-2">
            {reasons.map((reason, i) => (
              <li key={i} className="flex items-start gap-2.5">
                <ReasonIcon
                  name={reason.icon}
                  className={cn("mt-0.5 h-3.5 w-3.5 flex-shrink-0", scoreColor)}
                />
                <div className="min-w-0">
                  <span className="text-xs font-semibold text-navy-900">
                    {reason.label}
                  </span>
                  {reason.detail && (
                    <span className="ml-1.5 text-2xs text-neutral-500">
                      {reason.detail}
                    </span>
                  )}
                </div>
              </li>
            ))}
          </ul>
        )}
      </div>
    </div>
  );
}

// ─── Score breakdown bar (admin view) ─────────────────────────────────────────

interface MatchBreakdownBarProps {
  breakdown: Record<string, number>;  // component → % contribution
  className?: string;
}

export function MatchBreakdownBar({ breakdown, className }: MatchBreakdownBarProps) {
  const segments = [
    { key: "subject",       color: "bg-brand-900" },
    { key: "classBoardExp", color: "bg-brand-700" },
    { key: "location",      color: "bg-brand-500" },
    { key: "availability",  color: "bg-accent-500" },
    { key: "experience",    color: "bg-accent-400" },
    { key: "fee",           color: "bg-amber-400"  },
    { key: "rating",        color: "bg-amber-300"  },
  ] as const;

  return (
    <div className={cn("space-y-3", className)}>
      {/* Stacked bar */}
      <div className="flex h-3 w-full overflow-hidden rounded-full">
        {segments.map(({ key, color }) => {
          const pct = breakdown[key] ?? 0;
          return pct > 0 ? (
            <div
              key={key}
              className={cn("h-full", color)}
              style={{ width: `${pct}%` }}
              title={`${WEIGHT_LABELS[key as keyof typeof WEIGHT_LABELS]}: ${pct.toFixed(1)}%`}
            />
          ) : null;
        })}
      </div>

      {/* Legend */}
      <div className="grid grid-cols-2 gap-x-4 gap-y-1">
        {segments.map(({ key, color }) => {
          const pct = breakdown[key] ?? 0;
          return (
            <div key={key} className="flex items-center justify-between gap-2 text-xs">
              <span className="flex items-center gap-1.5 text-neutral-600">
                <span className={cn("h-2 w-2 flex-shrink-0 rounded-full", color)} />
                {WEIGHT_LABELS[key as keyof typeof WEIGHT_LABELS]}
              </span>
              <span className="font-semibold text-navy-900">{pct.toFixed(1)}%</span>
            </div>
          );
        })}
      </div>
    </div>
  );
}
