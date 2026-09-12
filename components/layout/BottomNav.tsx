"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { cn } from "@/lib/utils";

export interface BottomNavItem {
  label: string;
  href:  string;
  icon:  React.ReactNode;
  badge?: string | number;
}

interface BottomNavProps {
  items: BottomNavItem[];
}

/**
 * Mobile bottom navigation bar.
 * Visible only on < lg (below 1024px).
 * Fixed to the bottom, respects iOS safe-area-inset-bottom.
 * Max 5 items — labels truncate beyond that width.
 */
export function BottomNav({ items }: BottomNavProps) {
  const pathname = usePathname();

  // Show at most 5 items in the bottom bar
  const visibleItems = items.slice(0, 5);

  return (
    <nav
      aria-label="Mobile navigation"
      className={cn(
        // Only visible below lg breakpoint
        "lg:hidden",
        // Fixed at bottom, full width, above content
        "fixed bottom-0 left-0 right-0 z-40",
        // Visual
        "border-t border-neutral-100 bg-white/95 backdrop-blur-md shadow-lg",
        // Safe area inset for iPhone notch
        "pb-safe",
      )}
    >
      <div
        className="flex items-stretch"
        style={{ minHeight: "60px" }}
      >
        {visibleItems.map((item) => {
          const active =
            pathname === item.href ||
            (item.href !== "/" && pathname.startsWith(item.href));

          return (
            <Link
              key={item.href}
              href={item.href}
              className={cn(
                "relative flex flex-1 flex-col items-center justify-center gap-0.5",
                "pt-2 pb-1 text-center transition-colors duration-150",
                "no-select",
                active
                  ? "text-brand-700"
                  : "text-neutral-500 hover:text-neutral-800 active:text-brand-700"
              )}
              aria-current={active ? "page" : undefined}
            >
              {/* Active indicator dot */}
              {active && (
                <span
                  className="absolute top-0 left-1/2 -translate-x-1/2 h-0.5 w-8 rounded-full bg-brand-700"
                  aria-hidden="true"
                />
              )}

              {/* Icon with badge */}
              <span className="relative flex-shrink-0">
                <span
                  className={cn(
                    "flex h-6 w-6 items-center justify-center transition-transform duration-150",
                    active && "scale-110"
                  )}
                >
                  {item.icon}
                </span>
                {item.badge !== undefined && (
                  <span className="absolute -right-1.5 -top-1 flex h-4 min-w-4 items-center justify-center rounded-full bg-red-500 px-1 text-2xs font-bold text-white">
                    {item.badge}
                  </span>
                )}
              </span>

              {/* Label */}
              <span
                className={cn(
                  "text-2xs font-medium leading-none truncate max-w-full px-0.5",
                  active ? "font-semibold text-brand-700" : "text-neutral-500"
                )}
              >
                {item.label}
              </span>
            </Link>
          );
        })}
      </div>
    </nav>
  );
}
