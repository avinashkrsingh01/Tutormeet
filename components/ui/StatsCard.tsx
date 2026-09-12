import { cn } from "@/lib/utils";
import { TrendingUp, TrendingDown } from "lucide-react";

interface StatsCardProps {
  title: string;
  value: string | number;
  description?: string;
  icon?: React.ReactNode;
  trend?: {
    value: number;
    label: string;
    direction: "up" | "down";
  };
  accent?: "navy" | "teal" | "blue";
  className?: string;
}

const accentConfig = {
  navy: {
    iconBg:   "bg-brand-900",
    iconText: "text-white",
    ring:     "ring-brand-100",
  },
  teal: {
    iconBg:   "bg-accent-500",
    iconText: "text-white",
    ring:     "ring-accent-100",
  },
  blue: {
    iconBg:   "bg-blue-600",
    iconText: "text-white",
    ring:     "ring-blue-100",
  },
};

export function StatsCard({
  title,
  value,
  description,
  icon,
  trend,
  accent = "navy",
  className,
}: StatsCardProps) {
  const { iconBg, iconText, ring } = accentConfig[accent];

  return (
    <div className={cn("stat-card", className)}>
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0 flex-1">
          <p className="stat-label">{title}</p>
          <p className="stat-value mt-2">{value}</p>
          {description && (
            <p className="stat-description">{description}</p>
          )}
        </div>

        {icon && (
          <div
            className={cn(
              "flex h-11 w-11 flex-shrink-0 items-center justify-center rounded-2xl ring-4",
              iconBg, iconText, ring
            )}
          >
            {icon}
          </div>
        )}
      </div>

      {trend && (
        <div
          className={cn(
            "mt-3 flex items-center gap-1.5 text-xs font-semibold pt-3 border-t border-neutral-100",
            trend.direction === "up" ? "text-emerald-600" : "text-red-500"
          )}
        >
          {trend.direction === "up" ? (
            <TrendingUp className="h-3.5 w-3.5" />
          ) : (
            <TrendingDown className="h-3.5 w-3.5" />
          )}
          <span>{trend.value}%</span>
          <span className="font-normal text-neutral-400">{trend.label}</span>
        </div>
      )}
    </div>
  );
}
