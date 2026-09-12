"use client";

import { useState, useTransition } from "react";
import {
  CheckCircle2,
  ShieldCheck,
  Clock,
  FileText,
  BookOpen,
  MapPin,
  IndianRupee,
  ArrowLeft,
  Send,
} from "lucide-react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/Button";
import { Alert } from "@/components/ui/Alert";
import { formatINR } from "@/lib/utils";
import { submitTutorApplicationAction } from "@/app/actions/tutor";

interface Summary {
  full_name:            string;
  email:                string;
  subjects:             string[];
  grades:               string[];
  boards:               string[];
  locality:             string;
  city:                 string;
  years_of_experience:  number;
  expected_fee_per_hour: number;
  education_count:      number;
  doc_count:            number;
}

function ReviewRow({
  label,
  value,
  icon,
}: {
  label: string;
  value: React.ReactNode;
  icon?: React.ReactNode;
}) {
  return (
    <div className="flex items-start justify-between gap-4 border-b border-neutral-100 pb-3 last:border-0">
      <div className="flex items-center gap-2 text-xs font-semibold uppercase tracking-wide text-neutral-400">
        {icon && <span>{icon}</span>}
        {label}
      </div>
      <div className="text-right text-sm font-medium text-navy-900">{value}</div>
    </div>
  );
}

const pipeline = [
  {
    icon: <ShieldCheck className="h-5 w-5" />,
    title: "Document review",
    desc:  "We verify your identity and education certificates.",
    time:  "1–2 days",
  },
  {
    icon: <BookOpen className="h-5 w-5" />,
    title: "Knowledge assessment",
    desc:  "A short subject test to confirm your teaching knowledge.",
    time:  "Scheduled by us",
  },
  {
    icon: <Clock className="h-5 w-5" />,
    title: "Brief interview",
    desc:  "A short call with our verification team.",
    time:  "After assessment",
  },
  {
    icon: <CheckCircle2 className="h-5 w-5" />,
    title: "Verified & active",
    desc:  "You start receiving student match requests.",
    time:  "After interview",
  },
];

export function SubmitApplicationForm({ summary }: { summary: Summary }) {
  const router = useRouter();
  const [serverError, setServerError] = useState<string | null>(null);
  const [isPending, startTransition]  = useTransition();
  const [agreed, setAgreed]           = useState(false);

  function handleSubmit() {
    if (!agreed) {
      setServerError("Please confirm that the information is accurate before submitting.");
      return;
    }
    setServerError(null);
    startTransition(async () => {
      const result = await submitTutorApplicationAction();
      if (result?.error) setServerError(result.error);
    });
  }

  return (
    <div className="space-y-6">
      {serverError && <Alert variant="error" message={serverError} />}

      {/* Application summary */}
      <div className="rounded-2xl border border-neutral-200 bg-neutral-50 p-5 space-y-3">
        <h3 className="text-sm font-bold text-navy-900">Application summary</h3>
        <ReviewRow label="Name"       value={summary.full_name} />
        <ReviewRow label="Email"      value={summary.email} />
        <ReviewRow
          label="Subjects"
          icon={<BookOpen className="h-3.5 w-3.5" />}
          value={summary.subjects.join(", ") || "—"}
        />
        <ReviewRow
          label="Classes"
          value={summary.grades.slice(0, 4).join(", ") + (summary.grades.length > 4 ? ` +${summary.grades.length - 4}` : "") || "—"}
        />
        <ReviewRow label="Boards"     value={summary.boards.join(", ")  || "—"} />
        <ReviewRow
          label="Location"
          icon={<MapPin className="h-3.5 w-3.5" />}
          value={[summary.locality, summary.city].filter(Boolean).join(", ") || "—"}
        />
        <ReviewRow
          label="Experience"
          icon={<Clock className="h-3.5 w-3.5" />}
          value={summary.years_of_experience === 0 ? "Fresher" : `${summary.years_of_experience}+ years`}
        />
        <ReviewRow
          label="Expected fee"
          icon={<IndianRupee className="h-3.5 w-3.5" />}
          value={summary.expected_fee_per_hour > 0 ? `${formatINR(summary.expected_fee_per_hour)}/hr` : "—"}
        />
        <ReviewRow
          label="Qualifications"
          icon={<FileText className="h-3.5 w-3.5" />}
          value={`${summary.education_count} added`}
        />
        <ReviewRow
          label="Documents"
          icon={<ShieldCheck className="h-3.5 w-3.5" />}
          value={`${summary.doc_count} uploaded`}
        />
      </div>

      {/* What happens next */}
      <div>
        <h3 className="mb-4 text-sm font-bold text-navy-900">
          What happens after you submit
        </h3>
        <div className="space-y-3">
          {pipeline.map((step, i) => (
            <div key={i} className="flex items-start gap-4">
              <div className="flex h-9 w-9 flex-shrink-0 items-center justify-center rounded-xl bg-brand-50 text-brand-700">
                {step.icon}
              </div>
              <div className="flex-1">
                <div className="flex flex-wrap items-start justify-between gap-1">
                  <p className="text-sm font-semibold text-navy-900">{step.title}</p>
                  <span className="flex-shrink-0 rounded-full bg-neutral-100 px-2 py-0.5 text-xs text-neutral-500">
                    {step.time}
                  </span>
                </div>
                <p className="mt-0.5 text-xs text-neutral-500">{step.desc}</p>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Privacy assurance */}
      <div className="flex items-start gap-3 rounded-2xl border border-accent-200 bg-accent-50 px-4 py-4">
        <ShieldCheck className="mt-0.5 h-5 w-5 flex-shrink-0 text-accent-700" />
        <p className="text-xs leading-relaxed text-accent-800">
          Your identity documents and personal details (phone, pincode, exact address)
          are never shared with parents, students, or any third party. Only your
          name, locality, subjects, and verified status are shown publicly.
        </p>
      </div>

      {/* Accuracy declaration */}
      <label className={`flex cursor-pointer items-start gap-3 rounded-2xl border-2 p-4 transition-colors ${
        agreed ? "border-brand-900 bg-brand-50" : "border-neutral-200 bg-white"
      }`}>
        <input
          type="checkbox"
          checked={agreed}
          onChange={(e) => setAgreed(e.target.checked)}
          className="mt-0.5 h-4 w-4 rounded border-neutral-300 text-brand-900"
        />
        <div>
          <p className="text-sm font-semibold text-navy-900">
            I confirm all information is accurate
          </p>
          <p className="mt-0.5 text-xs text-neutral-500">
            The details I have provided are true and correct to the best of my
            knowledge. I understand that providing false information may result in
            rejection or suspension from TutorMeet.
          </p>
        </div>
      </label>

      {/* Navigation */}
      <div className="flex justify-between border-t border-neutral-100 pt-5">
        <Button
          type="button"
          variant="ghost"
          size="md"
          onClick={() => router.push("/tutor/onboarding/documents")}
          disabled={isPending}
          iconLeft={<ArrowLeft className="h-4 w-4" />}
        >
          Back
        </Button>
        <Button
          type="button"
          variant="teal"
          size="lg"
          loading={isPending}
          onClick={handleSubmit}
          iconRight={<Send className="h-4 w-4" />}
        >
          Submit Application
        </Button>
      </div>
    </div>
  );
}
