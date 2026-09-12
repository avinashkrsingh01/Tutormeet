import { cn } from "@/lib/utils";

// ─── Types ─────────────────────────────────────────────────────────────────────

type CardVariant = "default" | "elevated" | "filled" | "navy" | "teal" | "hover";
type CardPadding = "none" | "sm" | "md" | "lg" | "xl";

interface CardProps {
  children: React.ReactNode;
  className?: string;
  variant?: CardVariant;
  padding?: CardPadding;
  hover?: boolean;
  as?: React.ElementType;
}

// ─── Maps ──────────────────────────────────────────────────────────────────────

const variantMap: Record<CardVariant, string> = {
  default:  "card",
  elevated: "card-elevated",
  filled:   "card-filled",
  navy:     "card-navy",
  teal:     "card-teal",
  hover:    "card-hover",
};

const paddingMap: Record<CardPadding, string> = {
  none: "",
  sm:   "p-4",
  md:   "p-5 sm:p-6",
  lg:   "p-6 sm:p-8",
  xl:   "p-8 sm:p-10",
};

// ─── Card ──────────────────────────────────────────────────────────────────────

export function Card({
  children,
  className,
  variant = "default",
  padding = "md",
  hover = false,
  as: Tag = "div",
}: CardProps) {
  return (
    <Tag
      className={cn(
        hover ? variantMap.hover : variantMap[variant],
        paddingMap[padding],
        className
      )}
    >
      {children}
    </Tag>
  );
}

// ─── Card sub-components ───────────────────────────────────────────────────────

export function CardHeader({
  children,
  className,
}: {
  children: React.ReactNode;
  className?: string;
}) {
  return (
    <div className={cn("mb-4 flex items-center justify-between", className)}>
      {children}
    </div>
  );
}

export function CardTitle({
  children,
  className,
}: {
  children: React.ReactNode;
  className?: string;
}) {
  return (
    <h3 className={cn("text-base font-semibold text-navy-900 tracking-tight", className)}>
      {children}
    </h3>
  );
}

export function CardDescription({
  children,
  className,
}: {
  children: React.ReactNode;
  className?: string;
}) {
  return (
    <p className={cn("text-sm text-neutral-500 leading-relaxed", className)}>
      {children}
    </p>
  );
}

export function CardDivider({ className }: { className?: string }) {
  return <div className={cn("divider my-4", className)} />;
}

export function CardSection({
  children,
  className,
}: {
  children: React.ReactNode;
  className?: string;
}) {
  return (
    <div className={cn("px-5 sm:px-6 py-4 border-t border-neutral-100 first:border-t-0", className)}>
      {children}
    </div>
  );
}
