import { cn } from "@/lib/utils";

type SpinnerSize = "xs" | "sm" | "md" | "lg" | "xl";
type SpinnerVariant = "navy" | "teal" | "white" | "muted";

interface LoadingSpinnerProps {
  size?: SpinnerSize;
  variant?: SpinnerVariant;
  className?: string;
  label?: string;
}

const sizeMap: Record<SpinnerSize, string> = {
  xs: "h-3 w-3 border",
  sm: "h-4 w-4 border-2",
  md: "h-6 w-6 border-2",
  lg: "h-8 w-8 border-2",
  xl: "h-12 w-12 border-[3px]",
};

const variantMap: Record<SpinnerVariant, string> = {
  navy:  "border-brand-200 border-t-brand-900",
  teal:  "border-accent-200 border-t-accent-500",
  white: "border-white/20 border-t-white",
  muted: "border-neutral-200 border-t-neutral-400",
};

export function LoadingSpinner({
  size = "md",
  variant = "navy",
  className,
  label = "Loading…",
}: LoadingSpinnerProps) {
  return (
    <div
      role="status"
      className={cn("inline-flex items-center justify-center", className)}
    >
      <div
        className={cn(
          "animate-spin rounded-full",
          sizeMap[size],
          variantMap[variant]
        )}
        aria-hidden="true"
      />
      <span className="sr-only">{label}</span>
    </div>
  );
}

// ─── Full-page loader ──────────────────────────────────────────────────────────

export function PageLoader({ label = "Loading…" }: { label?: string }) {
  return (
    <div className="flex min-h-[50vh] flex-col items-center justify-center gap-3">
      <LoadingSpinner size="lg" />
      <p className="text-sm text-neutral-400">{label}</p>
    </div>
  );
}

// ─── Inline skeleton lines ─────────────────────────────────────────────────────

export function SkeletonLine({
  width = "full",
  className,
}: {
  width?: "full" | "3/4" | "1/2" | "1/3";
  className?: string;
}) {
  const widthMap = {
    full:  "w-full",
    "3/4": "w-3/4",
    "1/2": "w-1/2",
    "1/3": "w-1/3",
  };

  return (
    <div
      className={cn(
        "skeleton h-3 rounded-md",
        widthMap[width],
        className
      )}
    />
  );
}

export function SkeletonCard({ className }: { className?: string }) {
  return (
    <div className={cn("card p-5 space-y-3", className)}>
      <div className="flex items-center gap-3">
        <div className="skeleton h-10 w-10 rounded-full flex-shrink-0" />
        <div className="flex-1 space-y-2">
          <SkeletonLine width="3/4" />
          <SkeletonLine width="1/2" />
        </div>
      </div>
      <SkeletonLine />
      <SkeletonLine width="3/4" />
    </div>
  );
}
