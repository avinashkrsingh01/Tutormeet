"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import {
  ShieldAlert, CheckCircle2, AlertTriangle,
  ChevronDown, ArrowRight, Phone,
} from "lucide-react";
import { Button } from "@/components/ui/Button";
import { Textarea } from "@/components/ui/Textarea";
import { Alert } from "@/components/ui/Alert";
import { cn } from "@/lib/utils";
import { submitSafetyReportAction } from "@/app/actions/safety";
import type { ReportTargetType, ReportCategory } from "@/types/safety";

// ─── Category groups ──────────────────────────────────────────────────────────

const TUTOR_CATEGORIES: { value: ReportCategory; label: string }[] = [
  { value: "inappropriate_behaviour",   label: "Inappropriate behaviour"        },
  { value: "unprofessional_conduct",    label: "Unprofessional conduct"         },
  { value: "no_show",                   label: "Did not show up"                },
  { value: "abusive_language",          label: "Abusive or offensive language"  },
  { value: "privacy_concern",           label: "Shared my private information"  },
  { value: "fraud_misrepresentation",   label: "Fraud or misrepresentation"     },
  { value: "child_safety_concern",      label: "Child safety concern (URGENT)"  },
  { value: "other",                     label: "Something else"                 },
];

const PARENT_CATEGORIES: { value: ReportCategory; label: string }[] = [
  { value: "payment_dispute",           label: "Payment or fee dispute"         },
  { value: "abusive_language_parent",   label: "Abusive or offensive language"  },
  { value: "false_information",         label: "Provided false information"     },
  { value: "child_safety_concern",      label: "Child safety concern (URGENT)"  },
  { value: "other",                     label: "Something else"                 },
];

const INCIDENT_CATEGORIES: { value: ReportCategory; label: string }[] = [
  { value: "child_safety_concern",      label: "Child safety concern (URGENT)"  },
  { value: "harassment",                label: "Harassment"                     },
  { value: "unsafe_environment",        label: "Unsafe environment"             },
  { value: "fraud_misrepresentation",   label: "Fraud or scam"                 },
  { value: "other",                     label: "Other incident"                 },
];

// ─── Props ────────────────────────────────────────────────────────────────────

interface SafetyReportFormProps {
  targetType?:    ReportTargetType;
  targetUserId?:  string;
  targetName?:    string;
  onSuccess?:     () => void;
}

export function SafetyReportForm({
  targetType:   defaultTargetType,
  targetUserId: defaultTargetUserId,
  targetName,
  onSuccess,
}: SafetyReportFormProps) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();

  const [targetType,    setTargetType]    = useState<ReportTargetType>(defaultTargetType ?? "tutor");
  const [targetUserId,  setTargetUserId]  = useState(defaultTargetUserId ?? "");
  const [category,      setCategory]      = useState<ReportCategory | "">("");
  const [description,   setDescription]   = useState("");
  const [error,         setError]         = useState<string | null>(null);
  const [submitted,     setSubmitted]     = useState(false);
  const [isUrgent,      setIsUrgent]      = useState(false);

  const categories =
    targetType === "tutor"    ? TUTOR_CATEGORIES
    : targetType === "parent" ? PARENT_CATEGORIES
    :                           INCIDENT_CATEGORIES;

  const isChildSafety = category === "child_safety_concern";

  function handleSubmit() {
    if (!category) { setError("Please select a category."); return; }
    if (description.trim().length < 20) {
      setError("Please provide more detail (minimum 20 characters).");
      return;
    }
    setError(null);
    startTransition(async () => {
      const result = await submitSafetyReportAction({
        target_type:    targetType,
        target_user_id: targetUserId || undefined,
        category:       category as ReportCategory,
        description:    description.trim(),
      });

      if (!result.success) { setError(result.error); return; }

      setSubmitted(true);
      setIsUrgent(result.isUrgent);
      onSuccess?.();
    });
  }

  if (submitted) {
    return (
      <div className="flex flex-col items-center gap-5 py-6 text-center">
        <div className={cn(
          "flex h-14 w-14 items-center justify-center rounded-2xl",
          isUrgent ? "bg-red-100 text-red-600" : "bg-accent-100 text-accent-600"
        )}>
          {isUrgent
            ? <AlertTriangle className="h-7 w-7" />
            : <CheckCircle2  className="h-7 w-7" />}
        </div>
        <div>
          <p className="text-lg font-bold text-navy-900">Report submitted</p>
          <p className="mt-1.5 text-sm text-neutral-500 max-w-sm">
            {isUrgent
              ? "This is marked urgent. Our team has been notified and will review it as a priority."
              : "Our team will review your report and take appropriate action. Thank you for helping keep TutorMeet safe."}
          </p>
        </div>
        {isUrgent && (
          <div className="rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-800">
            <p className="font-semibold">If anyone is in immediate danger</p>
            <p className="mt-0.5">Contact emergency services immediately: <strong>112</strong></p>
          </div>
        )}
        <button
          type="button"
          onClick={() => router.back()}
          className="text-sm text-brand-700 hover:underline"
        >
          Go back
        </button>
      </div>
    );
  }

  return (
    <div className="space-y-5">
      {/* Emergency banner for child safety */}
      {isChildSafety && (
        <div className="flex items-start gap-3 rounded-2xl border border-red-300 bg-red-50 px-4 py-4">
          <Phone className="mt-0.5 h-5 w-5 flex-shrink-0 text-red-600" />
          <div>
            <p className="font-bold text-red-900">If anyone is in immediate danger</p>
            <p className="text-sm text-red-700">
              Contact emergency services immediately: <strong>112</strong>. Do not wait for TutorMeet to respond.
            </p>
          </div>
        </div>
      )}

      {error && <Alert variant="error" message={error} />}

      {/* Target type (if not pre-set) */}
      {!defaultTargetType && (
        <div>
          <p className="label-base mb-2">What are you reporting?</p>
          <div className="grid grid-cols-3 gap-2">
            {(["tutor", "parent", "incident"] as ReportTargetType[]).map((t) => (
              <button
                key={t}
                type="button"
                onClick={() => { setTargetType(t); setCategory(""); }}
                className={cn(
                  "rounded-xl border-2 px-3 py-2.5 text-sm font-semibold capitalize transition-all",
                  targetType === t
                    ? "border-brand-900 bg-brand-900 text-white"
                    : "border-neutral-200 bg-white text-neutral-600 hover:border-neutral-300"
                )}
              >
                {t === "incident" ? "An Incident" : `A ${t.charAt(0).toUpperCase() + t.slice(1)}`}
              </button>
            ))}
          </div>
        </div>
      )}

      {/* Target context */}
      {targetName && (
        <div className="rounded-xl bg-neutral-50 px-4 py-3">
          <p className="text-sm text-neutral-600">
            Reporting: <span className="font-semibold text-navy-900">{targetName}</span>
          </p>
        </div>
      )}

      {/* Category */}
      <div>
        <label className="label-base">Reason for report <span className="text-red-500">*</span></label>
        <div className="relative mt-1.5">
          <select
            value={category}
            onChange={(e) => setCategory(e.target.value as ReportCategory)}
            className={cn(
              "input-base appearance-none pr-10",
              !category && "text-neutral-400"
            )}
          >
            <option value="" disabled>Select a reason</option>
            {categories.map((c) => (
              <option key={c.value} value={c.value}>{c.label}</option>
            ))}
          </select>
          <ChevronDown className="pointer-events-none absolute right-3 top-1/2 h-4 w-4 -translate-y-1/2 text-neutral-400" />
        </div>
      </div>

      {/* Description */}
      <Textarea
        label="Describe what happened"
        required
        placeholder="Please describe the incident in detail. Include dates, times, and any specific behaviour that concerned you. Minimum 20 characters."
        rows={5}
        value={description}
        onChange={(e) => setDescription(e.target.value)}
        showCount
        maxLength={2000}
        hint="Your identity will not be disclosed to the person you are reporting."
      />

      {/* Privacy notice */}
      <div className="flex items-start gap-2.5 rounded-xl border border-brand-200 bg-brand-50 px-4 py-3">
        <ShieldAlert className="mt-0.5 h-4 w-4 flex-shrink-0 text-brand-700" />
        <p className="text-xs text-brand-800">
          Your name and contact details are never shared with the person you are reporting.
          Our team reviews all reports confidentially.
        </p>
      </div>

      <Button
        variant="danger"
        size="lg"
        fullWidth
        loading={isPending}
        onClick={handleSubmit}
        iconRight={<ArrowRight className="h-4 w-4" />}
      >
        Submit Report
      </Button>
    </div>
  );
}
