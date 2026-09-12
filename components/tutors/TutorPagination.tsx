"use client";

import { ChevronLeft, ChevronRight } from "lucide-react";
import { cn } from "@/lib/utils";

interface TutorPaginationProps {
  page:       number;
  totalPages: number;
  onPage:     (p: number) => void;
}

export function TutorPagination({ page, totalPages, onPage }: TutorPaginationProps) {
  if (totalPages <= 1) return null;

  // Build page window: always show first, last, and ±2 around current
  const pages: (number | "…")[] = [];
  for (let i = 1; i <= totalPages; i++) {
    if (i === 1 || i === totalPages || Math.abs(i - page) <= 2) {
      pages.push(i);
    } else if (pages.at(-1) !== "…") {
      pages.push("…");
    }
  }

  return (
    <nav
      className="flex items-center justify-center gap-1"
      aria-label="Pagination"
    >
      <button
        onClick={() => onPage(page - 1)}
        disabled={page <= 1}
        className="flex h-9 w-9 items-center justify-center rounded-xl border border-neutral-200 text-neutral-500 transition-all hover:border-brand-300 hover:text-brand-700 disabled:cursor-not-allowed disabled:opacity-40"
        aria-label="Previous page"
      >
        <ChevronLeft className="h-4 w-4" />
      </button>

      {pages.map((p, i) =>
        p === "…" ? (
          <span key={`ellipsis-${i}`} className="flex h-9 w-9 items-center justify-center text-sm text-neutral-400">
            …
          </span>
        ) : (
          <button
            key={p}
            onClick={() => onPage(p as number)}
            className={cn(
              "flex h-9 w-9 items-center justify-center rounded-xl border text-sm font-semibold transition-all",
              p === page
                ? "border-brand-900 bg-brand-900 text-white"
                : "border-neutral-200 bg-white text-neutral-700 hover:border-brand-300 hover:text-brand-800"
            )}
            aria-current={p === page ? "page" : undefined}
          >
            {p}
          </button>
        )
      )}

      <button
        onClick={() => onPage(page + 1)}
        disabled={page >= totalPages}
        className="flex h-9 w-9 items-center justify-center rounded-xl border border-neutral-200 text-neutral-500 transition-all hover:border-brand-300 hover:text-brand-700 disabled:cursor-not-allowed disabled:opacity-40"
        aria-label="Next page"
      >
        <ChevronRight className="h-4 w-4" />
      </button>
    </nav>
  );
}
