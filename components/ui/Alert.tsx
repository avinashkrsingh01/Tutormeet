import { cn } from "@/lib/utils";
import {
  CheckCircle2,
  AlertCircle,
  Info,
  AlertTriangle,
  X,
} from "lucide-react";

export type AlertVariant = "success" | "error" | "warning" | "info" | "navy" | "teal";

interface AlertProps {
  variant?: AlertVariant;
  title?: string;
  message: string;
  className?: string;
  onDismiss?: () => void;
}

const config: Record<
  AlertVariant,
  {
    wrapper: string;
    icon: React.ElementType;
    iconColor: string;
  }
> = {
  success: {
    wrapper:   "callout-success",
    icon:      CheckCircle2,
    iconColor: "text-emerald-600",
  },
  error: {
    wrapper:   "callout-error",
    icon:      AlertCircle,
    iconColor: "text-red-600",
  },
  warning: {
    wrapper:   "callout-warning",
    icon:      AlertTriangle,
    iconColor: "text-amber-600",
  },
  info: {
    wrapper:   "callout-info",
    icon:      Info,
    iconColor: "text-blue-600",
  },
  navy: {
    wrapper:   "callout-navy",
    icon:      Info,
    iconColor: "text-brand-700",
  },
  teal: {
    wrapper:   "callout-teal",
    icon:      CheckCircle2,
    iconColor: "text-accent-700",
  },
};

export function Alert({
  variant = "info",
  title,
  message,
  className,
  onDismiss,
}: AlertProps) {
  const { wrapper, icon: Icon, iconColor } = config[variant];

  return (
    <div
      role="alert"
      className={cn(wrapper, "animate-fade-in", className)}
    >
      <Icon
        className={cn("mt-0.5 h-5 w-5 flex-shrink-0", iconColor)}
        aria-hidden="true"
      />
      <div className="flex-1 min-w-0">
        {title && (
          <p className="mb-0.5 font-semibold leading-snug">{title}</p>
        )}
        <p className="text-sm leading-relaxed">{message}</p>
      </div>
      {onDismiss && (
        <button
          onClick={onDismiss}
          className="ml-auto flex-shrink-0 rounded-md p-0.5 opacity-60 hover:opacity-100 transition-opacity"
          aria-label="Dismiss"
        >
          <X className="h-4 w-4" />
        </button>
      )}
    </div>
  );
}
