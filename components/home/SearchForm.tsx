"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { Search, ChevronDown, ArrowRight, MapPin, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/Button";
import { useLocation } from "@/components/layout/LocationProvider";
import { GRADES, SUBJECTS, TIME_SLOTS } from "@/lib/constants";
import { cn } from "@/lib/utils";

// ─── Field wrapper ─────────────────────────────────────────────────────────

function Field({
  label,
  children,
  required,
  action,
}: {
  label: string;
  children: React.ReactNode;
  required?: boolean;
  action?: React.ReactNode;
}) {
  return (
    <div className="flex flex-col gap-1.5">
      <div className="flex items-center justify-between">
        <label className="text-xs font-semibold text-navy-700">
          {label}
          {required && (
            <span className="ml-1 text-red-500" aria-hidden="true">*</span>
          )}
        </label>
        {action && action}
      </div>
      {children}
    </div>
  );
}

// ─── Styled select ─────────────────────────────────────────────────────────

function StyledSelect({
  value,
  onChange,
  placeholder,
  options,
  className,
}: {
  value: string;
  onChange: (v: string) => void;
  placeholder: string;
  options: string[];
  className?: string;
}) {
  return (
    <div className="relative">
      <select
        value={value}
        onChange={(e) => onChange(e.target.value)}
        className={cn(
          "w-full appearance-none rounded-xl border border-neutral-200 bg-white",
          "px-4 py-2.5 pr-10 text-sm font-medium text-navy-900",
          "placeholder:text-neutral-400",
          "focus:border-brand-500 focus:outline-none",
          "focus:shadow-[0_0_0_3px_rgb(47_87_173_/_0.12)]",
          "transition-all duration-150 hover:border-neutral-300",
          !value && "text-neutral-400",
          className
        )}
      >
        <option value="" disabled hidden>
          {placeholder}
        </option>
        {options.map((opt) => (
          <option key={opt} value={opt}>
            {opt}
          </option>
        ))}
      </select>
      <ChevronDown
        className="pointer-events-none absolute right-3 top-1/2 h-4 w-4 -translate-y-1/2 text-neutral-400"
        aria-hidden="true"
      />
    </div>
  );
}

// ─── Styled text input ─────────────────────────────────────────────────────

function StyledInput({
  value,
  onChange,
  placeholder,
  type = "text",
}: {
  value: string;
  onChange: (v: string) => void;
  placeholder: string;
  type?: string;
}) {
  return (
    <input
      type={type}
      value={value}
      onChange={(e) => onChange(e.target.value)}
      placeholder={placeholder}
      className={cn(
        "w-full rounded-xl border border-neutral-200 bg-white",
        "px-4 py-2.5 text-sm font-medium text-navy-900",
        "placeholder:font-normal placeholder:text-neutral-400",
        "focus:border-brand-500 focus:outline-none",
        "focus:shadow-[0_0_0_3px_rgb(47_87_173_/_0.12)]",
        "transition-all duration-150 hover:border-neutral-300"
      )}
    />
  );
}

// ─── Main form ─────────────────────────────────────────────────────────────

export function SearchForm() {
  const router = useRouter();
  const { location } = useLocation();

  const [studentClass, setStudentClass] = useState("");
  const [subject,      setSubject]      = useState("");
  const [city,         setCity]         = useState(location?.city || "");
  const [locality,     setLocality]     = useState(location?.pincode || "");
  const [timeSlot,     setTimeSlot]     = useState("");
  const [budget,       setBudget]       = useState("");
  const [isLocating, setIsLocating] = useState(false);

  // Sync with global location if it changes
  useEffect(() => {
    if (location) {
      if (!city) setCity(location.city);
      if (!locality) setLocality(location.pincode);
    }
  }, [location]);

  async function handleDetectLocation() {
    if (!navigator.geolocation) {
      alert("Geolocation is not supported by your browser");
      return;
    }
    
    setIsLocating(true);
    navigator.geolocation.getCurrentPosition(
      async (position) => {
        try {
          const { latitude, longitude } = position.coords;
          const res = await fetch(`https://nominatim.openstreetmap.org/reverse?format=json&lat=${latitude}&lon=${longitude}`);
          const data = await res.json();
          if (data && data.address) {
            const detectedCity = data.address.city || data.address.town || data.address.village || data.address.state_district || "";
            const detectedPincode = data.address.postcode || "";
            if (detectedCity) setCity(detectedCity);
            if (detectedPincode) setLocality(detectedPincode);
          }
        } catch (error) {
          console.error("Error fetching location details:", error);
          alert("Failed to detect location details. Please enter manually.");
        } finally {
          setIsLocating(false);
        }
      },
      (error) => {
        console.error("Geolocation error:", error);
        alert("Location access denied or unavailable.");
        setIsLocating(false);
      }
    );
  }

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    const params = new URLSearchParams();
    if (studentClass) params.set("grade",    studentClass);
    if (subject)      params.set("subject",  subject);
    if (city)         params.set("city",     city);
    if (locality)     params.set("locality", locality);
    if (timeSlot)     params.set("time",     timeSlot);
    if (budget)       params.set("max_fee",  budget);
    router.push(`/tutors?${params.toString()}`);
  }

  return (
    <div className="relative">
      {/* Card */}
      <div className="relative overflow-hidden rounded-3xl bg-white shadow-xl ring-1 ring-neutral-200">
        {/* Top accent bar */}
        <div className="h-1 w-full bg-gradient-to-r from-brand-900 via-brand-600 to-accent-500" />

        <div className="p-6 sm:p-7">
          {/* Card header */}
          <div className="mb-6">
            <div className="mb-1.5 flex items-center gap-2">
              <div className="flex h-7 w-7 items-center justify-center rounded-lg bg-brand-900 text-white">
                <Search className="h-3.5 w-3.5" />
              </div>
              <h2
                className="text-base font-bold text-navy-900"
                style={{ letterSpacing: "-0.01em" }}
              >
                Find My Tutor
              </h2>
            </div>
            <p className="text-xs text-neutral-500">
              Tell us what you need and we&apos;ll shortlist verified tutors near you.
            </p>
          </div>

          <form onSubmit={handleSubmit} noValidate className="space-y-4">
            {/* Row 1: Class + Subject */}
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
              <Field label="Student Class" required>
                <StyledSelect
                  value={studentClass}
                  onChange={setStudentClass}
                  placeholder="Select class"
                  options={GRADES}
                />
              </Field>

              <Field label="Subject" required>
                <StyledSelect
                  value={subject}
                  onChange={setSubject}
                  placeholder="Select subject"
                  options={SUBJECTS}
                />
              </Field>
            </div>

            {/* Row 2: City + Locality */}
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
              <Field 
    label="City" 
    required 
    action={
      <button
        type="button"
        onClick={handleDetectLocation}
        disabled={isLocating}
        className="flex items-center gap-1 text-[10px] font-bold text-accent-600 hover:text-accent-700 disabled:opacity-50"
      >
        {isLocating ? <Loader2 className="h-3 w-3 animate-spin" /> : <MapPin className="h-3 w-3" />}
        {isLocating ? "Locating..." : "Detect"}
      </button>
    }
  >
                <StyledInput
                  value={city}
                  onChange={setCity}
                  placeholder="e.g. Bengaluru"
                />
              </Field>

              <Field label="Locality / PIN Code">
                <StyledInput
                  value={locality}
                  onChange={setLocality}
                  placeholder="e.g. Koramangala or 560001"
                />
              </Field>
            </div>

            {/* Row 3: Preferred Time */}
            <Field label="Preferred Time">
              <StyledSelect
                value={timeSlot}
                onChange={setTimeSlot}
                placeholder="Select time slot"
                options={TIME_SLOTS}
              />
            </Field>

            {/* Row 4: Budget */}
            <Field label="Budget (₹ per month)">
              <StyledInput
                value={budget}
                onChange={setBudget}
                placeholder="e.g. 4000 — leave blank if flexible"
                type="number"
              />
            </Field>

            {/* Submit */}
            <Button
              type="submit"
              variant="primary"
              size="lg"
              fullWidth
              className="mt-2"
            >
              Find My Tutor
              <ArrowRight className="h-4 w-4" aria-hidden="true" />
            </Button>
          </form>

          {/* Trust note */}
          <p className="mt-4 text-center text-xs text-neutral-400">
            Free · No commitment · 100% verified tutors
          </p>
        </div>
      </div>

      {/* Floating badge */}
      <div className="absolute -right-3 -top-3 flex items-center gap-1.5 rounded-full border border-teal-200 bg-teal-50 px-3 py-1.5 text-xs font-semibold text-teal-700 shadow-sm">
        <span className="h-1.5 w-1.5 rounded-full bg-teal-500 animate-pulse" />
        Free demo class
      </div>
    </div>
  );
}
