import { cn } from "@/lib/utils";

interface EmptyStateProps {
  icon?: React.ReactNode;
  title: string;
  description?: string;
  action?: React.ReactNode;
  secondaryAction?: React.ReactNode;
  className?: string;
  compact?: boolean;
}

export function EmptyState({
  icon,
  title,
  description,
  action,
  secondaryAction,
  className,
  compact = false,
}: EmptyStateProps) {
  return (
    <div
      className={cn(
        "flex flex-col items-center justify-center text-center",
        compact ? "py-10" : "py-16 px-6",
        className
      )}
    >
      {icon && (
        <div className="empty-icon-wrap">
          {icon}
        </div>
      )}

      <h3
        className={cn(
          "font-semibold text-navy-900 tracking-tight",
          compact ? "text-sm" : "text-base"
        )}
      >
        {title}
      </h3>

      {description && (
        <p
          className={cn(
            "mt-1.5 max-w-sm leading-relaxed text-neutral-500",
            compact ? "text-xs" : "text-sm"
          )}
        >
          {description}
        </p>
      )}

      {(action || secondaryAction) && (
        <div className={cn("flex flex-col gap-2 sm:flex-row sm:justify-center", compact ? "mt-4" : "mt-6")}>
          {action}
          {secondaryAction}
        </div>
      )}
    </div>
  );
}
