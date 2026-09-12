import { cn } from "@/lib/utils";

export type BadgeVariant =
  | "navy"
  | "blue"
  | "teal"
  | "green"
  | "yellow"
  | "orange"
  | "red"
  | "gray"
  | "purple";

interface BadgeProps {
  variant?: BadgeVariant;
  children: React.ReactNode;
  className?: string;
  dot?: boolean;
}

const variantMap: Record<BadgeVariant, string> = {
  navy:   "badge-navy",
  blue:   "badge-blue",
  teal:   "badge-teal",
  green:  "badge-green",
  yellow: "badge-yellow",
  orange: "badge-orange",
  red:    "badge-red",
  gray:   "badge-gray",
  purple: "badge-purple",
};

const dotColorMap: Record<BadgeVariant, string> = {
  navy:   "bg-brand-600",
  blue:   "bg-blue-500",
  teal:   "bg-accent-500",
  green:  "bg-emerald-500",
  yellow: "bg-amber-400",
  orange: "bg-orange-500",
  red:    "bg-red-500",
  gray:   "bg-neutral-400",
  purple: "bg-purple-500",
};

export function Badge({
  variant = "gray",
  children,
  className,
  dot = false,
}: BadgeProps) {
  return (
    <span className={cn(variantMap[variant], className)}>
      {dot && (
        <span
          className={cn("badge-dot", dotColorMap[variant])}
          aria-hidden="true"
        />
      )}
      {children}
    </span>
  );
}

// ─── Verified badge ────────────────────────────────────────────────────────────

interface VerifiedBadgeProps {
  size?: "sm" | "md";
  className?: string;
}

export function VerifiedBadge({ size = "sm", className }: VerifiedBadgeProps) {
  return (
    <span className={cn(size === "md" ? "verified-badge-lg" : "verified-badge", className)}>
      <svg
        className={cn(size === "md" ? "h-4 w-4" : "h-3.5 w-3.5")}
        viewBox="0 0 20 20"
        fill="currentColor"
        aria-hidden="true"
      >
        <path
          fillRule="evenodd"
          d="M6.267 3.455a3.066 3.066 0 001.745-.723 3.066 3.066 0 013.976 0 3.066 3.066 0 001.745.723 3.066 3.066 0 012.812 2.812c.051.643.304 1.254.723 1.745a3.066 3.066 0 010 3.976 3.066 3.066 0 00-.723 1.745 3.066 3.066 0 01-2.812 2.812 3.066 3.066 0 00-1.745.723 3.066 3.066 0 01-3.976 0 3.066 3.066 0 00-1.745-.723 3.066 3.066 0 01-2.812-2.812 3.066 3.066 0 00-.723-1.745 3.066 3.066 0 010-3.976 3.066 3.066 0 00.723-1.745 3.066 3.066 0 012.812-2.812zm7.44 5.252a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z"
          clipRule="evenodd"
        />
      </svg>
      Verified
    </span>
  );
}
