"use client";

import { useState, useEffect, useTransition, useCallback, useRef } from "react";
import { useRouter, useSearchParams, usePathname } from "next/navigation";
import { X, Search, Loader2 } from "lucide-react";
import { TutorCard } from "./TutorCard";
import { TutorFilterPanel, activeFilterCount } from "./TutorFilterPanel";
import { TutorSortBar } from "./TutorSortBar";
import { TutorPagination } from "./TutorPagination";
import { useLocation } from "@/components/layout/LocationProvider";
import { EmptyState } from "@/components/ui/EmptyState";
import { cn } from "@/lib/utils";
import type { TutorCard as TutorCardType } from "@/types/tutor";
import type { TutorFilters, SortOption, DEFAULT_FILTERS } from "@/types/common";
import { DEFAULT_FILTERS as DEFAULTS } from "@/types/common";

// ─── Types ────────────────────────────────────────────────────────────────────

interface SearchResult {
  data:       TutorCardType[];
  total:      number;
  page:       number;
  totalPages: number;
}

// ─── URL ↔ filter sync ────────────────────────────────────────────────────────

function filtersToParams(f: TutorFilters): URLSearchParams {
  const p = new URLSearchParams();
  if (f.city)           p.set("city",           f.city);
  if (f.locality)       p.set("locality",       f.locality);
  if (f.pincode)        p.set("pincode",        f.pincode);
  if (f.subject)        p.set("subject",        f.subject);
  if (f.grade)          p.set("grade",          f.grade);
  if (f.board)          p.set("board",          f.board);
  if (f.gender)         p.set("gender",         f.gender);
  if (f.teaching_mode)  p.set("teaching_mode",  f.teaching_mode);
  if (f.min_fee)        p.set("min_fee",        f.min_fee);
  if (f.max_fee)        p.set("max_fee",        f.max_fee);
  if (f.min_experience) p.set("min_experience", f.min_experience);
  if (f.demo_only)      p.set("demo_only",      "true");
  if (f.sort !== "best_match") p.set("sort",    f.sort);
  if (f.page > 1)       p.set("page",           String(f.page));
  return p;
}

function paramsToFilters(sp: URLSearchParams): TutorFilters {
  return {
    city:           sp.get("city")           ?? "",
    locality:       sp.get("locality")       ?? "",
    pincode:        sp.get("pincode")        ?? "",
    subject:        sp.get("subject")        ?? "",
    grade:          sp.get("grade")          ?? "",
    board:          sp.get("board")          ?? "",
    gender:         sp.get("gender")         ?? "",
    teaching_mode:  sp.get("teaching_mode")  ?? "",
    min_fee:        sp.get("min_fee")        ?? "",
    max_fee:        sp.get("max_fee")        ?? "",
    min_experience: sp.get("min_experience") ?? "",
    demo_only:      sp.get("demo_only") === "true",
    sort:           (sp.get("sort") ?? "best_match") as SortOption,
    page:           Math.max(1, parseInt(sp.get("page") ?? "1")),
  };
}

// ─── Main component ───────────────────────────────────────────────────────────

export function TutorSearchPage() {
  const router      = useRouter();
  const pathname    = usePathname();
  const searchParams = useSearchParams();
  const { location } = useLocation();

  const [filters, setFilters]       = useState<TutorFilters>(() => paramsToFilters(searchParams));
  const [result,  setResult]        = useState<SearchResult | null>(null);
  const [isPending, startTransition] = useTransition();
  const [drawerOpen, setDrawerOpen] = useState(false);
  const [quickCity, setQuickCity]   = useState("");

  // Sync global location if local filters don't have a city set yet
  useEffect(() => {
    if (location) {
      setFilters((prev) => {
        // If we already have something or it's unchanged, don't trigger re-render loop
        if ((prev.city || !location.city) && (prev.pincode || !location.pincode)) return prev;
        return {
          ...prev,
          city: prev.city || location.city,
          pincode: prev.pincode || location.pincode,
        };
      });
    }
  }, [location]);

  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const [fetchError, setFetchError] = useState<string | null>(null);

  const fetchTutors = useCallback((f: TutorFilters) => {
    startTransition(async () => {
      try {
        setFetchError(null);
        const params = filtersToParams(f);
        params.set("limit", "12");
        const res  = await fetch(`/api/tutors?${params.toString()}`);
        const json = await res.json();
        if (res.ok) {
          setResult(json);
        } else {
          setFetchError("Could not load tutors. Please try again.");
        }
      } catch {
        setFetchError("Network error. Please check your connection and try again.");
      }
    });
  }, []);

  // ── Sync URL + fetch on filter change ──────────────────────────────────────

  useEffect(() => {
    if (debounceRef.current) clearTimeout(debounceRef.current);
    debounceRef.current = setTimeout(() => {
      const params = filtersToParams(filters);
      router.replace(`${pathname}?${params.toString()}`, { scroll: false });
      fetchTutors(filters);
    }, 300);
    return () => { if (debounceRef.current) clearTimeout(debounceRef.current); };
  }, [filters, fetchTutors, pathname, router]);

  // ── Initial fetch on mount ──────────────────────────────────────────────────

  useEffect(() => {
    fetchTutors(paramsToFilters(searchParams));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // ── Handlers ───────────────────────────────────────────────────────────────

  function handleFilterChange(key: keyof TutorFilters, value: string | boolean | number) {
    setFilters((prev) => ({ ...prev, [key]: value, page: key !== "page" ? 1 : prev.page }));
  }

  function handleReset() {
    setFilters({ ...DEFAULTS });
    setQuickCity("");
  }

  function handleSort(s: SortOption) {
    setFilters((prev) => ({ ...prev, sort: s, page: 1 }));
  }

  function handlePage(p: number) {
    setFilters((prev) => ({ ...prev, page: p }));
    window.scrollTo({ top: 0, behavior: "smooth" });
  }

  function handleQuickSearch(e: React.FormEvent) {
    e.preventDefault();
    if (quickCity.trim()) {
      setFilters((prev) => ({ ...prev, city: quickCity.trim(), page: 1 }));
    }
  }

  const filterCount = activeFilterCount(filters);

  return (
    <div className="min-h-screen bg-neutral-50">

      {/* ── Hero search bar ─────────────────────────────────────── */}
      <div className="bg-brand-950 py-10 md:py-14">
        <div className="container-page">
          <div className="mx-auto max-w-2xl text-center">
            <h1 className="mb-2 text-3xl font-extrabold text-white md:text-4xl" style={{ letterSpacing: "-0.03em" }}>
              Find a Verified Tutor
            </h1>
            <p className="mb-7 text-brand-200 text-sm md:text-base">
              Every tutor on TutorMeet is verified, assessed, and interviewed.
            </p>

            {/* Quick city search */}
            <form onSubmit={handleQuickSearch} className="flex gap-2">
              <div className="relative flex-1">
                <Search className="pointer-events-none absolute left-3.5 top-1/2 h-4.5 w-4.5 -translate-y-1/2 text-neutral-400" />
                <input
                  type="text"
                  value={quickCity}
                  onChange={(e) => setQuickCity(e.target.value)}
                  placeholder="Search by city, subject or name…"
                  className="h-12 w-full rounded-2xl border border-neutral-200 bg-white pl-10 pr-4 text-sm font-medium text-navy-900 placeholder:text-neutral-400 focus:border-brand-500 focus:outline-none focus:shadow-[0_0_0_3px_rgb(47_87_173_/_0.15)]"
                />
                {quickCity && (
                  <button
                    type="button"
                    onClick={() => { setQuickCity(""); setFilters((p) => ({ ...p, city: "", page: 1 })); }}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-neutral-400 hover:text-neutral-600"
                  >
                    <X className="h-4 w-4" />
                  </button>
                )}
              </div>
              <button
                type="submit"
                className="flex h-12 items-center gap-2 rounded-2xl bg-accent-500 px-5 text-sm font-semibold text-white hover:bg-accent-600 transition-colors"
              >
                Search
              </button>
            </form>

            {/* Active filter summary pills */}
            {filterCount > 0 && (
              <div className="mt-4 flex flex-wrap items-center justify-center gap-2">
                {[
                  { key: "city",           label: filters.city           },
                  { key: "subject",        label: filters.subject        },
                  { key: "grade",          label: filters.grade          },
                  { key: "board",          label: filters.board          },
                  { key: "teaching_mode",  label: filters.teaching_mode  },
                  { key: "gender",         label: filters.gender ? `${filters.gender} tutor` : "" },
                ].filter((p) => p.label).map((pill) => (
                  <button
                    key={pill.key}
                    type="button"
                    onClick={() => handleFilterChange(pill.key as keyof TutorFilters, "")}
                    className="flex items-center gap-1.5 rounded-full bg-white/15 px-3 py-1 text-xs font-medium text-white backdrop-blur-sm hover:bg-white/25 transition-colors"
                  >
                    {pill.label}
                    <X className="h-3 w-3 opacity-70" />
                  </button>
                ))}
                {filterCount > 0 && (
                  <button
                    type="button"
                    onClick={handleReset}
                    className="rounded-full bg-red-500/20 px-3 py-1 text-xs font-medium text-red-200 hover:bg-red-500/30 transition-colors"
                  >
                    Clear all
                  </button>
                )}
              </div>
            )}
          </div>
        </div>
      </div>

      {/* ── Main layout ─────────────────────────────────────────── */}
      <div className="container-page py-8">
        <div className="flex gap-7">

          {/* Desktop sidebar filter */}
          <div className="hidden w-64 flex-shrink-0 lg:block">
            <div className="sticky top-24 rounded-2xl border border-neutral-200 bg-white p-5 shadow-xs">
              <TutorFilterPanel
                filters={filters}
                onChange={handleFilterChange}
                onReset={handleReset}
              />
            </div>
          </div>

          {/* Results column */}
          <div className="min-w-0 flex-1">

            {/* Sort bar */}
            <div className="mb-5">
              <TutorSortBar
                total={result?.total ?? 0}
                sort={filters.sort}
                onSort={handleSort}
                loading={isPending && !result}
                onOpenFilters={() => setDrawerOpen(true)}
                filterCount={filterCount}
              />
            </div>

            {/* Fetch error */}
            {fetchError && (
              <div className="mb-4 rounded-2xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700" role="alert">
                {fetchError}
              </div>
            )}

            {/* Loading skeleton */}
            {isPending && !result && (
              <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-3">
                {Array.from({ length: 6 }).map((_, i) => (
                  <div key={i} className="rounded-2xl border border-neutral-200 bg-white p-5 space-y-4">
                    <div className="flex items-start gap-3.5">
                      <div className="skeleton h-14 w-14 rounded-full" />
                      <div className="flex-1 space-y-2">
                        <div className="skeleton h-3.5 w-3/4 rounded" />
                        <div className="skeleton h-3 w-1/2 rounded" />
                        <div className="skeleton h-3 w-1/3 rounded" />
                      </div>
                    </div>
                    <div className="flex gap-1.5">
                      {[1,2,3].map((j) => <div key={j} className="skeleton h-6 w-16 rounded-lg" />)}
                    </div>
                    <div className="skeleton h-3 w-full rounded" />
                    <div className="skeleton h-3 w-4/5 rounded" />
                  </div>
                ))}
              </div>
            )}

            {/* Results grid */}
            {result && (
              <>
                {result.data.length === 0 ? (
                  <div className="rounded-2xl border border-neutral-200 bg-white">
                    <EmptyState
                      icon={<Search className="h-8 w-8" />}
                      title="No tutors found"
                      description={
                        filterCount > 0
                          ? "Try adjusting or clearing some filters to see more results."
                          : "No verified tutors are available in this area yet."
                      }
                      action={
                        filterCount > 0 ? (
                          <button
                            type="button"
                            onClick={handleReset}
                            className="btn btn-md btn-outline"
                          >
                            Clear filters
                          </button>
                        ) : undefined
                      }
                    />
                  </div>
                ) : (
                  <>
                    {/* Refresh indicator */}
                    {isPending && (
                      <div className="mb-3 flex items-center gap-2 text-xs text-neutral-500">
                        <Loader2 className="h-3.5 w-3.5 animate-spin" />
                        Updating results…
                      </div>
                    )}

                    <div className={cn(
                      "grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-3",
                      isPending && "opacity-60 pointer-events-none"
                    )}>
                      {result.data.map((tutor) => (
                        <TutorCard
                          key={tutor.id}
                          tutor={tutor}
                          actionHref={`/tutors/${tutor.id}`}
                          actionLabel="View Profile"
                        />
                      ))}
                    </div>

                    {/* Pagination */}
                    <div className="mt-8">
                      <TutorPagination
                        page={result.page}
                        totalPages={result.totalPages}
                        onPage={handlePage}
                      />
                    </div>
                  </>
                )}
              </>
            )}
          </div>
        </div>
      </div>

      {/* ── Mobile filter drawer ─────────────────────────────────── */}
      {drawerOpen && (
        <>
          <div
            className="fixed inset-0 z-40 bg-navy-950/40 backdrop-blur-sm lg:hidden"
            onClick={() => setDrawerOpen(false)}
          />
          <div className="fixed bottom-0 left-0 right-0 z-50 max-h-[88vh] overflow-y-auto rounded-t-3xl bg-white px-5 pb-8 pt-5 shadow-2xl lg:hidden animate-slide-up">
            {/* Drag handle */}
            <div className="mx-auto mb-5 h-1 w-10 rounded-full bg-neutral-300" />
            <TutorFilterPanel
              filters={filters}
              onChange={handleFilterChange}
              onReset={handleReset}
            />
            <div className="mt-6">
              <button
                type="button"
                onClick={() => setDrawerOpen(false)}
                className="btn btn-lg btn-primary w-full"
              >
                Show {result?.total ?? 0} tutors
              </button>
            </div>
          </div>
        </>
      )}
    </div>
  );
}
