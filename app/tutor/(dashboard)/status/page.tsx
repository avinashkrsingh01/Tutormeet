import { redirect } from "next/navigation";
import Link from "next/link";
import type { Metadata } from "next";
import {
  CheckCircle2,
  Clock,
  XCircle,
  ShieldCheck,
  FileText,
  BookOpen,
  MessageCircle,
  BadgeCheck,
  AlertCircle,
  ArrowRight,
} from "lucide-react";
import { createClient } from "@/lib/supabase/server";
import { DashboardHeader } from "@/components/layout/DashboardShell";
import { Card } from "@/components/ui/Card";
import { TutorStatusBadge } from "@/components/ui/StatusBadge";
import { VerifiedBadge } from "@/components/ui/Badge";
import { Button } from "@/components/ui/Button";
import { formatDate } from "@/lib/utils";
import { cn } from "@/lib/utils";
import type { TutorVerificationStatus } from "@/types/tutor";

export const metadata: Metadata = { title: "Verification Status" };

// ─── Status descriptions ──────────────────────────────────────────────────────

const statusConfig: Record<
  TutorVerificationStatus,
  {
    title:       string;
    description: string;
    icon:        React.ReactNode;
    iconBg:      string;
    callout?:    string;
  }
> = {
  draft: {
    title:       "Profile Incomplete",
    description: "You haven't started your verification yet. Complete your profile to begin.",
    icon:        <Clock className="h-7 w-7" />,
    iconBg:      "bg-neutral-100 text-neutral-500",
  },
  pending: {
    title:       "Application Received",
    description: "Your application has been received. Our team will begin reviewing it shortly.",
    icon:        <Clock className="h-7 w-7" />,
    iconBg:      "bg-brand-100 text-brand-700",
  },
  profile_submitted: {
    title:       "Application Under Review",
    description: "Your profile and documents have been submitted. Our team will begin reviewing within 1–2 working days.",
    icon:        <Clock className="h-7 w-7" />,
    iconBg:      "bg-brand-100 text-brand-700",
  },
  documents_pending: {
    title:       "Additional Documents Required",
    description: "Our team has reviewed your application and requires additional documents before proceeding.",
    icon:        <AlertCircle className="h-7 w-7" />,
    iconBg:      "bg-amber-100 text-amber-600",
    callout:     "Please check the notes below and upload the requested documents.",
  },
  under_review: {
    title:       "Documents Under Review",
    description: "Our verification team is actively reviewing your identity and education documents.",
    icon:        <ShieldCheck className="h-7 w-7" />,
    iconBg:      "bg-blue-100 text-blue-700",
  },
  assessment_pending: {
    title:       "Knowledge Assessment Pending",
    description: "Your documents have been approved. We'll contact you to schedule a short knowledge assessment for your subjects.",
    icon:        <BookOpen className="h-7 w-7" />,
    iconBg:      "bg-amber-100 text-amber-600",
    callout:     "Watch for an email or WhatsApp message from TutorMeet to schedule your assessment.",
  },
  interview_pending: {
    title:       "Interview Being Scheduled",
    description: "You've passed the knowledge assessment. Our team will contact you to schedule a brief interview.",
    icon:        <MessageCircle className="h-7 w-7" />,
    iconBg:      "bg-purple-100 text-purple-700",
    callout:     "Prepare to discuss your teaching approach and experience. The interview typically takes 20–30 minutes.",
  },
  verified: {
    title:       "You're a Verified Tutor",
    description: "Congratulations! You have completed all verification steps. Your profile is active and you'll receive student match requests.",
    icon:        <BadgeCheck className="h-7 w-7" />,
    iconBg:      "bg-accent-100 text-accent-700",
  },
  rejected: {
    title:       "Application Not Approved",
    description: "Unfortunately your application was not approved at this time. Please contact our support team for more information.",
    icon:        <XCircle className="h-7 w-7" />,
    iconBg:      "bg-red-100 text-red-600",
  },
  suspended: {
    title:       "Account Suspended",
    description: "Your tutor account has been suspended. Please contact TutorMeet support immediately.",
    icon:        <XCircle className="h-7 w-7" />,
    iconBg:      "bg-red-100 text-red-600",
  },
};

// ─── Pipeline steps ───────────────────────────────────────────────────────────

const PIPELINE_STEPS: {
  key:         TutorVerificationStatus;
  label:       string;
  description: string;
}[] = [
  { key: "profile_submitted", label: "Application submitted",         description: "Profile, education, experience & documents uploaded" },
  { key: "under_review",      label: "Documents verified",            description: "Identity & education documents approved" },
  { key: "assessment_pending", label: "Knowledge assessment passed",   description: "Subject knowledge test completed" },
  { key: "interview_pending", label: "Interview completed",           description: "Brief call with TutorMeet team" },
  { key: "verified",          label: "Verified & active",             description: "Profile visible to parents" },
];

const PIPELINE_ORDER: TutorVerificationStatus[] = PIPELINE_STEPS.map((s) => s.key);

// ─── Document status flags ────────────────────────────────────────────────────

function DocVerificationFlag({
  label, verified,
}: { label: string; verified: boolean }) {
  return (
    <div className={cn(
      "flex items-center gap-3 rounded-xl p-3.5",
      verified ? "bg-accent-50" : "bg-neutral-50"
    )}>
      {verified
        ? <CheckCircle2 className="h-5 w-5 text-accent-600" />
        : <Clock className="h-5 w-5 text-neutral-400" />}
      <span className={cn(
        "text-sm font-medium",
        verified ? "text-accent-800" : "text-neutral-600"
      )}>
        {label}
      </span>
    </div>
  );
}

// ─── Page ─────────────────────────────────────────────────────────────────────

export default async function TutorStatusPage() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  const { data: tp } = await supabase
    .from("tutor_profiles")
    .select("id, verification_status, admin_notes, identity_verified, education_verified, verified_at, knowledge_score, teaching_score, subjects")
    .eq("user_id", user.id)
    .single();

  if (!tp) redirect("/tutor/onboarding");

  const { data: assessments } = await supabase
    .from("tutor_assessments")
    .select("subject, status, score, max_score, completed_at, scheduled_at")
    .eq("tutor_id", tp.id)
    .order("completed_at", { ascending: false });

  const status     = tp.verification_status as TutorVerificationStatus;
  const cfg        = statusConfig[status];
  const currentIdx = PIPELINE_ORDER.indexOf(status);
  const isTerminal = status === "rejected" || status === "suspended";
  const isVerified = status === "verified";

  return (
    <div>
      <DashboardHeader
        title="Verification Status"
        description="Track your progress through TutorMeet's verification process."
        action={<TutorStatusBadge status={status} />}
      />

      <div className="grid grid-cols-1 gap-5 lg:grid-cols-3">

        {/* ── Main column ─────────────────────────────────────── */}
        <div className="space-y-5 lg:col-span-2">

          {/* Status card */}
          <Card padding="md">
            <div className="flex items-start gap-4">
              <div className={cn(
                "flex h-14 w-14 flex-shrink-0 items-center justify-center rounded-2xl",
                cfg.iconBg
              )}>
                {cfg.icon}
              </div>
              <div>
                <h2 className="text-lg font-bold text-navy-900" style={{ letterSpacing: "-0.02em" }}>
                  {cfg.title}
                </h2>
                <p className="mt-1 text-sm leading-relaxed text-neutral-600">{cfg.description}</p>
                {cfg.callout && (
                  <p className="mt-2 rounded-xl bg-amber-50 border border-amber-200 px-3 py-2.5 text-xs font-medium text-amber-800">
                    {cfg.callout}
                  </p>
                )}
                {tp.admin_notes && !isVerified && (
                  <div className="mt-3 rounded-xl border border-amber-200 bg-amber-50 px-4 py-3">
                    <p className="text-xs font-semibold text-amber-800">Note from TutorMeet:</p>
                    <p className="mt-0.5 text-sm text-amber-700">{tp.admin_notes}</p>
                  </div>
                )}
                {isVerified && tp.verified_at && (
                  <p className="mt-2 text-xs text-neutral-400">
                    Verified on {formatDate(tp.verified_at)}
                  </p>
                )}
              </div>
            </div>

            {/* CTA for actionable states */}
            {status === "documents_pending" && (
              <div className="mt-4 border-t border-neutral-100 pt-4">
                <Link href="/tutor/documents">
                  <Button variant="primary" size="sm">
                    Upload Documents <ArrowRight className="h-4 w-4" />
                  </Button>
                </Link>
              </div>
            )}
          </Card>

          {/* Verification pipeline (hidden for terminal states) */}
          {!isTerminal && (
            <Card padding="md">
              <h3 className="mb-5 text-sm font-bold text-navy-900">Verification pipeline</h3>
              <div className="space-y-4">
                {PIPELINE_STEPS.map((step, i) => {
                  const done    = i < currentIdx || isVerified;
                  const active  = step.key === status && !isVerified;
                  const waiting = !done && !active;
                  return (
                    <div key={step.key} className="flex items-start gap-3">
                      <div className={cn(
                        "mt-0.5 flex h-8 w-8 flex-shrink-0 items-center justify-center rounded-full",
                        done    ? "bg-accent-500 text-white"
                        : active ? "bg-brand-900 text-white ring-4 ring-brand-100"
                        :          "border-2 border-neutral-200 bg-white text-neutral-400"
                      )}>
                        {done
                          ? <CheckCircle2 className="h-4 w-4" />
                          : <span className="text-xs font-bold">{i + 1}</span>}
                      </div>
                      <div className="flex-1 pb-1">
                        <div className="flex items-center justify-between gap-2">
                          <p className={cn(
                            "text-sm font-semibold",
                            done    ? "text-accent-700"
                            : active ? "text-navy-900"
                            :          "text-neutral-400"
                          )}>
                            {step.label}
                          </p>
                          {active && (
                            <span className="rounded-full bg-brand-100 px-2 py-0.5 text-2xs font-bold text-brand-700">
                              In progress
                            </span>
                          )}
                        </div>
                        <p className={cn(
                          "text-xs mt-0.5",
                          done ? "text-neutral-400" : active ? "text-neutral-500" : "text-neutral-300"
                        )}>
                          {step.description}
                        </p>
                      </div>
                    </div>
                  );
                })}
              </div>
            </Card>
          )}

          {/* Assessments */}
          {assessments && assessments.length > 0 && (
            <Card padding="none">
              <div className="border-b border-neutral-100 px-5 py-4">
                <h3 className="text-sm font-bold text-navy-900">Knowledge Assessments</h3>
              </div>
              <ul className="divide-y divide-neutral-50">
                {assessments.map((a, i) => {
                  const statusColors: Record<string, string> = {
                    passed:    "badge-teal",
                    failed:    "badge-red",
                    scheduled: "badge-navy",
                    completed: "badge-yellow",
                    not_started: "badge-gray",
                  };
                  return (
                    <li key={i} className="flex items-center justify-between px-5 py-4">
                      <div>
                        <p className="text-sm font-semibold text-navy-900">{a.subject}</p>
                        {a.completed_at && (
                          <p className="text-xs text-neutral-400">{formatDate(a.completed_at)}</p>
                        )}
                        {a.scheduled_at && a.status === "scheduled" && (
                          <p className="text-xs text-brand-600">Scheduled: {formatDate(a.scheduled_at)}</p>
                        )}
                      </div>
                      <div className="flex items-center gap-3">
                        {a.score !== null && (
                          <span className="text-sm font-bold text-navy-900">
                            {a.score}/{a.max_score}
                          </span>
                        )}
                        <span className={cn("badge", statusColors[a.status] ?? "badge-gray")}>
                          {a.status.replace("_", " ")}
                        </span>
                      </div>
                    </li>
                  );
                })}
              </ul>
            </Card>
          )}
        </div>

        {/* ── Sidebar ──────────────────────────────────────────── */}
        <div className="space-y-5">

          {/* Document verification flags */}
          <Card padding="md">
            <h3 className="mb-4 text-sm font-bold text-navy-900">Document verification</h3>
            <div className="space-y-2.5">
              <DocVerificationFlag label="Identity verified"  verified={tp.identity_verified} />
              <DocVerificationFlag label="Education verified" verified={tp.education_verified} />
            </div>
            <div className="mt-4 border-t border-neutral-100 pt-4">
              <Link href="/tutor/documents">
                <Button variant="ghost" size="sm" fullWidth>
                  <FileText className="h-4 w-4" /> Manage Documents
                </Button>
              </Link>
            </div>
          </Card>

          {/* Score display */}
          {(tp.knowledge_score !== null || tp.teaching_score !== null) && (
            <Card padding="md">
              <h3 className="mb-4 text-sm font-bold text-navy-900">Your scores</h3>
              <div className="space-y-3">
                {tp.knowledge_score !== null && (
                  <div className="flex items-center justify-between rounded-xl bg-brand-50 px-4 py-3">
                    <span className="text-sm font-semibold text-brand-900">Knowledge Score</span>
                    <span className="text-xl font-extrabold text-brand-900" style={{ letterSpacing: "-0.02em" }}>
                      {tp.knowledge_score}
                      <span className="text-sm font-medium text-brand-500">/100</span>
                    </span>
                  </div>
                )}
                {tp.teaching_score !== null && (
                  <div className="flex items-center justify-between rounded-xl bg-accent-50 px-4 py-3">
                    <span className="text-sm font-semibold text-accent-900">Teaching Score</span>
                    <span className="text-xl font-extrabold text-accent-700" style={{ letterSpacing: "-0.02em" }}>
                      {tp.teaching_score}
                      <span className="text-sm font-medium text-accent-500">/100</span>
                    </span>
                  </div>
                )}
                <p className="text-xs text-neutral-400 text-center">
                  Scores are assigned by the TutorMeet team after assessment &amp; interview
                </p>
              </div>
            </Card>
          )}

          {/* Verified profile preview link */}
          {isVerified && (
            <Card padding="md" variant="teal">
              <div className="flex items-start gap-3">
                <BadgeCheck className="mt-0.5 h-5 w-5 flex-shrink-0 text-accent-700" />
                <div>
                  <p className="text-sm font-bold text-accent-900">Your public profile is live</p>
                  <p className="mt-0.5 text-xs text-accent-700">
                    Parents can now find and view your profile.
                  </p>
                  <Link href={`/tutors/${user?.id}`} className="mt-2 inline-block">
                    <Button variant="teal" size="sm">
                      View Public Profile <ArrowRight className="h-3.5 w-3.5" />
                    </Button>
                  </Link>
                </div>
              </div>
            </Card>
          )}

          {/* Support */}
          <div className="rounded-2xl border border-neutral-200 bg-neutral-50 p-4">
            <p className="text-xs font-semibold text-navy-900">Need help?</p>
            <p className="mt-1 text-xs text-neutral-500">
              If you have questions about your verification status, contact our support team.
            </p>
            <Link href="/tutor/support" className="mt-3 inline-block">
              <Button variant="ghost" size="xs">
                <MessageCircle className="h-3.5 w-3.5" /> Contact Support
              </Button>
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}
