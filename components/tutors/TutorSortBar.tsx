"use client";

import { cn } from "@/lib/utils";
import type { SortOption } from "@/types/common";

const SORT_OPTIONS: { value: SortOption; label: string }[] = [
  { value: "best_match",        label: "Best Match"        },
  { value: "highest_rated",     label: "Highest Rated"     },
  { value: "most_experienced",  label: "Most Experienced"  },
  { value: "lowest_fee",        label: "Lowest Fee"        },
  { value: "most_reviews",      label: "Most Reviews"      },
];

interface TutorSortBarProps {
  total:     number;
  sort:      SortOption;
  onSort:    (s: SortOption) => void;
  loading?:  boolean;
  onOpenFilters?: () => void;
  filterCount?: number;
}

export function TutorSortBar({
  total, sort, onSort, loading = false, onOpenFilters, filterCount = 0,
}: TutorSortBarProps) {
  return (
    <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
      {/* Count */}
      <p className="text-sm text-neutral-600">
        {loading ? (
          <span className="inline-block h-4 w-28 animate-pulse rounded bg-neutral-200" />
        ) : (
          <>
            <span className="font-bold text-navy-900">{total.toLocaleString("en-IN")}</span>
            {" "}verified tutor{total !== 1 ? "s" : ""} found
          </>
        )}
      </p>

      <div className="flex items-center gap-2">
        {/* Mobile — filter button */}
        {onOpenFilters && (
          <button
            type="button"
            onClick={onOpenFilters}
            className="relative flex items-center gap-1.5 rounded-xl border border-neutral-200 bg-white px-3.5 py-2 text-sm font-medium text-neutral-700 hover:border-brand-300 hover:bg-brand-50 transition-all sm:hidden"
          >
            <svg className="h-4 w-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <line x1="4" y1="6"  x2="20" y2="6" />
              <line x1="4" y1="12" x2="20" y2="12" />
              <line x1="4" y1="18" x2="20" y2="18" />
            </svg>
            Filters
            {filterCount > 0 && (
              <span className="absolute -right-1.5 -top-1.5 flex h-4 w-4 items-center justify-center rounded-full bg-brand-900 text-2xs font-bold text-white">
                {filterCount}
              </span>
            )}
          </button>
        )}

        {/* Sort pills */}
        <div className="flex flex-wrap gap-1.5">
          {SORT_OPTIONS.map((opt) => (
            <button
              key={opt.value}
              type="button"
              onClick={() => onSort(opt.value)}
              className={cn(
                "rounded-full border px-3 py-1.5 text-xs font-semibold transition-all duration-100",
                sort === opt.value
                  ? "border-brand-900 bg-brand-900 text-white"
                  : "border-neutral-200 bg-white text-neutral-600 hover:border-brand-300 hover:text-brand-800"
              )}
            >
              {opt.label}
            </button>
          ))}
        </div>
      </div>
    </div>
  );
}
