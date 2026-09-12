"use client";

import { X, SlidersHorizontal, ChevronDown } from "lucide-react";
import { cn } from "@/lib/utils";
import { SUBJECTS, GRADES, BOARDS, TEACHING_MODES } from "@/lib/constants";
import type { TutorFilters } from "@/types/common";

// ─── Helpers ──────────────────────────────────────────────────────────────────

export function activeFilterCount(f: TutorFilters): number {
  let n = 0;
  if (f.city)           n++;
  if (f.locality)       n++;
  if (f.pincode)        n++;
  if (f.subject)        n++;
  if (f.grade)          n++;
  if (f.board)          n++;
  if (f.gender)         n++;
  if (f.teaching_mode)  n++;
  if (f.min_fee)        n++;
  if (f.max_fee)        n++;
  if (f.min_experience) n++;
  if (f.demo_only)      n++;
  return n;
}

// ─── Shared filter primitives ─────────────────────────────────────────────────

function FilterRow({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div className="space-y-1.5">
      <p className="text-2xs font-semibold uppercase tracking-widest text-neutral-400">
        {label}
      </p>
      {children}
    </div>
  );
}

function FilterSelect({
  value, onChange, placeholder, options,
}: {
  value:       string;
  onChange:    (v: string) => void;
  placeholder: string;
  options:     { label: string; value: string }[];
}) {
  return (
    <div className="relative">
      <select
        value={value}
        onChange={(e) => onChange(e.target.value)}
        className={cn(
          "w-full appearance-none rounded-xl border border-neutral-200 bg-white",
          "px-3 py-2.5 pr-8 text-sm transition-all",
          "focus:border-brand-500 focus:outline-none focus:shadow-[0_0_0_3px_rgb(47_87_173_/_0.10)]",
          "hover:border-neutral-300",
          !value ? "text-neutral-400" : "text-navy-900 font-medium"
        )}
      >
        <option value="">{placeholder}</option>
        {options.map((opt) => (
          <option key={opt.value} value={opt.value}>{opt.label}</option>
        ))}
      </select>
      <ChevronDown className="pointer-events-none absolute right-2.5 top-1/2 h-4 w-4 -translate-y-1/2 text-neutral-400" />
    </div>
  );
}

function FilterInput({
  value, onChange, placeholder, type = "text",
}: {
  value:       string;
  onChange:    (v: string) => void;
  placeholder: string;
  type?:       string;
}) {
  return (
    <input
      type={type}
      value={value}
      onChange={(e) => onChange(e.target.value)}
      placeholder={placeholder}
      className={cn(
        "w-full rounded-xl border border-neutral-200 bg-white",
        "px-3 py-2.5 text-sm placeholder:text-neutral-400",
        "focus:border-brand-500 focus:outline-none focus:shadow-[0_0_0_3px_rgb(47_87_173_/_0.10)]",
        "hover:border-neutral-300 transition-all"
      )}
    />
  );
}

// ─── Main panel (used in sidebar and mobile drawer) ───────────────────────────

interface TutorFilterPanelProps {
  filters:   TutorFilters;
  onChange:  (key: keyof TutorFilters, value: string | boolean | number) => void;
  onReset:   () => void;
  className?: string;
}

export function TutorFilterPanel({
  filters, onChange, onReset, className,
}: TutorFilterPanelProps) {
  const count = activeFilterCount(filters);

  return (
    <aside className={cn("space-y-5", className)}>

      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <SlidersHorizontal className="h-4 w-4 text-brand-700" />
          <span className="text-sm font-bold text-navy-900">Filters</span>
          {count > 0 && (
            <span className="flex h-5 w-5 items-center justify-center rounded-full bg-brand-900 text-2xs font-bold text-white">
              {count}
            </span>
          )}
        </div>
        {count > 0 && (
          <button
            type="button"
            onClick={onReset}
            className="flex items-center gap-1 text-xs font-medium text-red-500 hover:text-red-600 transition-colors"
          >
            <X className="h-3.5 w-3.5" /> Clear all
          </button>
        )}
      </div>

      {/* ── Location ──────────────────────────────────────────── */}
      <section className="space-y-3">
        <p className="divider-label">Location</p>
        <FilterRow label="City">
          <FilterInput value={filters.city} onChange={(v) => onChange("city", v)} placeholder="e.g. Bengaluru" />
        </FilterRow>
        <FilterRow label="Locality / Area">
          <FilterInput value={filters.locality} onChange={(v) => onChange("locality", v)} placeholder="e.g. Indiranagar" />
        </FilterRow>
        <FilterRow label="PIN Code">
          <FilterInput value={filters.pincode} onChange={(v) => onChange("pincode", v)} placeholder="6-digit pincode" />
        </FilterRow>
      </section>

      {/* ── Academics ─────────────────────────────────────────── */}
      <section className="space-y-3">
        <p className="divider-label">Academics</p>
        <FilterRow label="Subject">
          <FilterSelect value={filters.subject} onChange={(v) => onChange("subject", v)}
            placeholder="Any subject" options={SUBJECTS.map((s) => ({ label: s, value: s }))} />
        </FilterRow>
        <FilterRow label="Class / Grade">
          <FilterSelect value={filters.grade} onChange={(v) => onChange("grade", v)}
            placeholder="Any class" options={GRADES.map((g) => ({ label: g, value: g }))} />
        </FilterRow>
        <FilterRow label="Board">
          <FilterSelect value={filters.board} onChange={(v) => onChange("board", v)}
            placeholder="Any board" options={BOARDS.map((b) => ({ label: b, value: b }))} />
        </FilterRow>
      </section>

      {/* ── Preferences ───────────────────────────────────────── */}
      <section className="space-y-3">
        <p className="divider-label">Preferences</p>
        <FilterRow label="Tutor gender">
          <FilterSelect value={filters.gender} onChange={(v) => onChange("gender", v)}
            placeholder="Any gender"
            options={[
              { label: "Male tutor",   value: "male"   },
              { label: "Female tutor", value: "female" },
            ]} />
        </FilterRow>
        <FilterRow label="Teaching mode">
          <FilterSelect value={filters.teaching_mode} onChange={(v) => onChange("teaching_mode", v)}
            placeholder="Any mode"
            options={TEACHING_MODES.map((m) => ({ label: m, value: m }))} />
        </FilterRow>
      </section>

      {/* ── Fee range ─────────────────────────────────────────── */}
      <section className="space-y-3">
        <p className="divider-label">Fee (₹/hour)</p>
        <div className="grid grid-cols-2 gap-2">
          <FilterRow label="Min">
            <FilterInput value={filters.min_fee} onChange={(v) => onChange("min_fee", v)}
              placeholder="₹0" type="number" />
          </FilterRow>
          <FilterRow label="Max">
            <FilterInput value={filters.max_fee} onChange={(v) => onChange("max_fee", v)}
              placeholder="Any" type="number" />
          </FilterRow>
        </div>
      </section>

      {/* ── Experience ────────────────────────────────────────── */}
      <section className="space-y-3">
        <p className="divider-label">Experience</p>
        <FilterRow label="Min. years">
          <FilterSelect value={filters.min_experience} onChange={(v) => onChange("min_experience", v)}
            placeholder="Any experience"
            options={[
              { label: "Fresher (0 yrs)", value: "0"  },
              { label: "1+ years",        value: "1"  },
              { label: "2+ years",        value: "2"  },
              { label: "3+ years",        value: "3"  },
              { label: "5+ years",        value: "5"  },
              { label: "8+ years",        value: "8"  },
              { label: "10+ years",       value: "10" },
            ]} />
        </FilterRow>
      </section>

      {/* ── Demo class ────────────────────────────────────────── */}
      <section>
        <label className="flex cursor-pointer items-start gap-3 rounded-2xl border border-neutral-200 bg-neutral-50 px-4 py-3.5 transition-colors hover:bg-brand-50 hover:border-brand-200">
          <input
            type="checkbox"
            checked={filters.demo_only}
            onChange={(e) => onChange("demo_only", e.target.checked)}
            className="mt-0.5 h-4 w-4 rounded border-neutral-300 text-brand-900 focus:ring-brand-700"
          />
          <div>
            <p className="text-sm font-semibold text-navy-900">Free demo class only</p>
            <p className="text-xs text-neutral-500">Show only tutors offering a free trial</p>
          </div>
        </label>
      </section>
    </aside>
  );
}
