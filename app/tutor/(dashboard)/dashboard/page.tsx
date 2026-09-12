import { redirect } from "next/navigation";
import Link from "next/link";
import type { Metadata } from "next";
import {
  CheckCircle2,
  Clock,
  ArrowRight,
  Users,
  CalendarCheck,
  Star,
  ShieldCheck,
  BookOpen,
  AlertCircle,
  XCircle,
  BadgeCheck,
  FileText,
  ClipboardCheck,
} from "lucide-react";
import { createClient } from "@/lib/supabase/server";
import { DashboardHeader } from "@/components/layout/DashboardShell";
import { Card } from "@/components/ui/Card";
import { Button } from "@/components/ui/Button";
import { Avatar } from "@/components/ui/Avatar";
import { TutorStatusBadge } from "@/components/ui/StatusBadge";
import { VerifiedBadge } from "@/components/ui/Badge";
import { formatDate, formatINR } from "@/lib/utils";
import { cn } from "@/lib/utils";
import type { TutorVerificationStatus } from "@/types/tutor";

export const metadata: Metadata = { title: "Tutor Dashboard" };

// ─── Verification pipeline config ────────────────────────────────────────────

const PIPELINE: {
  status:      TutorVerificationStatus;
  label:       string;
  description: string;
  href?:       string;
  ctaLabel?:   string;
}[] = [
  {
    status:     "profile_submitted",
    label:      "Application submitted",
    description: "Your application has been received. Our team will start reviewing it shortly.",
  },
  {
    status:     "under_review",
    label:      "Documents under review",
    description: "Our verification team is reviewing your documents and profile.",
    href:       "/tutor/documents",
    ctaLabel:   "View documents",
  },
  {
    status:     "assessment_pending",
    label:      "Knowledge assessment",
    description: "We'll contact you to schedule a short subject knowledge test.",
    href:       "/tutor/assessment",
    ctaLabel:   "View assessment",
  },
  {
    status:     "interview_pending",
    label:      "Brief interview",
    description: "Assessment passed. We'll schedule a quick call with our team.",
    href:       "/tutor/status",
    ctaLabel:   "View details",
  },
  {
    status:     "verified",
    label:      "Verified & active",
    description: "You are a TutorMeet Verified Tutor. You'll receive student match requests.",
  },
];

const PIPELINE_ORDER: TutorVerificationStatus[] = [
  "profile_submitted",
  "under_review",
  "assessment_pending",
  "interview_pending",
  "verified",
];

function getStepIndex(status: TutorVerificationStatus): number {
  return PIPELINE_ORDER.indexOf(status);
}

// ─── Status banner ────────────────────────────────────────────────────────────

function StatusBanner({ status, adminNotes }: {
  status:     TutorVerificationStatus;
  adminNotes: string | null;
}) {
  if (status === "verified") {
    return (
      <div className="flex items-center gap-4 rounded-2xl border border-accent-200 bg-accent-50 px-5 py-4">
        <div className="flex h-11 w-11 flex-shrink-0 items-center justify-center rounded-xl bg-accent-500 text-white shadow-teal">
          <BadgeCheck className="h-6 w-6" />
        </div>
        <div>
          <p className="font-bold text-accent-900">
            You are a TutorMeet Verified Tutor
          </p>
          <p className="mt-0.5 text-sm text-accent-700">
            Your profile is active. You will now receive student match requests.
          </p>
        </div>
      </div>
    );
  }

  if (status === "rejected") {
    return (
      <div className="flex items-start gap-4 rounded-2xl border border-red-200 bg-red-50 px-5 py-4">
        <XCircle className="mt-0.5 h-6 w-6 flex-shrink-0 text-red-500" />
        <div>
          <p className="font-bold text-red-900">Application not approved</p>
          <p className="mt-0.5 text-sm text-red-700">
            Unfortunately your application was not approved at this time. Please
            contact{" "}
            <Link href="/tutor/support" className="underline font-medium">
              TutorMeet support
            </Link>{" "}
            for details.
          </p>
          {adminNotes && (
            <p className="mt-2 rounded-lg bg-red-100 px-3 py-2 text-xs text-red-800">
              Note from TutorMeet: {adminNotes}
            </p>
          )}
        </div>
      </div>
    );
  }

  if (status === "suspended") {
    return (
      <div className="flex items-start gap-4 rounded-2xl border border-red-200 bg-red-50 px-5 py-4">
        <AlertCircle className="mt-0.5 h-6 w-6 flex-shrink-0 text-red-500" />
        <div>
          <p className="font-bold text-red-900">Account suspended</p>
          <p className="mt-0.5 text-sm text-red-700">
            Your account has been suspended. Contact{" "}
            <Link href="/tutor/support" className="underline font-medium">
              support
            </Link>{" "}
            immediately.
          </p>
        </div>
      </div>
    );
  }

  if (status === "documents_pending") {
    return (
      <div className="flex items-start gap-4 rounded-2xl border border-amber-200 bg-amber-50 px-5 py-4">
        <AlertCircle className="mt-0.5 h-6 w-6 flex-shrink-0 text-amber-500" />
        <div className="flex-1">
          <p className="font-bold text-amber-900">Additional documents required</p>
          <p className="mt-0.5 text-sm text-amber-700">
            Our team has requested additional documents before proceeding.
            {adminNotes && ` Note: ${adminNotes}`}
          </p>
          <Link href="/tutor/documents" className="mt-2 inline-block">
            <Button size="sm" variant="primary">
              Upload Documents
              <ArrowRight className="h-4 w-4" />
            </Button>
          </Link>
        </div>
      </div>
    );
  }

  // Default: in-progress
  const statusLabels: Partial<Record<TutorVerificationStatus, string>> = {
    pending:            "Application received — review starting soon",
    profile_submitted:  "Application received — our team will review it shortly",
    under_review:       "Your documents are being reviewed",
    assessment_pending: "Ready for knowledge assessment",
    interview_pending:  "Interview being scheduled",
  };

  return (
    <div className="flex items-center gap-4 rounded-2xl border border-brand-200 bg-brand-50 px-5 py-4">
      <div className="flex h-11 w-11 flex-shrink-0 items-center justify-center rounded-xl bg-brand-100 text-brand-700">
        <Clock className="h-6 w-6" />
      </div>
      <div>
        <p className="font-bold text-brand-900">
          {statusLabels[status] ?? "Verification in progress"}
        </p>
        <p className="mt-0.5 text-sm text-brand-700">
          We aim to complete verification within 3–5 working days of application.
        </p>
      </div>
    </div>
  );
}

// ─── Pipeline progress tracker ────────────────────────────────────────────────

function PipelineTracker({ status }: { status: TutorVerificationStatus }) {
  const currentIdx = getStepIndex(status);
  const isTerminal = status === "rejected" || status === "suspended";

  if (isTerminal) return null;

  return (
    <Card padding="md">
      <h2 className="mb-5 text-sm font-bold text-navy-900">
        Verification progress
      </h2>

      <div className="space-y-3">
        {PIPELINE.map((step, i) => {
          const done    = i < currentIdx || status === "verified";
          const active  = step.status === status;
          const waiting = !done && !active;

          return (
            <div key={step.status} className="flex items-start gap-3">
              {/* Icon */}
              <div className={cn(
                "mt-0.5 flex h-8 w-8 flex-shrink-0 items-center justify-center rounded-full transition-all",
                done    ? "bg-accent-500 text-white shadow-sm"
                : active ? "bg-brand-900 text-white ring-4 ring-brand-100"
                :          "border-2 border-neutral-200 bg-white text-neutral-400"
              )}>
                {done ? (
                  <CheckCircle2 className="h-4 w-4" />
                ) : (
                  <span className="text-xs font-bold">{i + 1}</span>
                )}
              </div>

              {/* Content */}
              <div className="flex-1">
                <div className="flex items-center justify-between gap-2">
                  <p className={cn(
                    "text-sm font-semibold",
                    done    ? "text-accent-700 line-through"
                    : active ? "text-navy-900"
                    :          "text-neutral-400"
                  )}>
                    {step.label}
                  </p>
                  {active && (
                    <span className="flex-shrink-0 rounded-full bg-brand-100 px-2.5 py-0.5 text-2xs font-bold text-brand-700">
                      Current
                    </span>
                  )}
                </div>
                {(active || (done && i === currentIdx - 1)) && (
                  <p className="mt-0.5 text-xs text-neutral-500">{step.description}</p>
                )}
                {active && step.href && (
                  <Link href={step.href} className="mt-1.5 inline-flex">
                    <Button variant="outline" size="xs">
                      {step.ctaLabel} <ArrowRight className="h-3 w-3" />
                    </Button>
                  </Link>
                )}
              </div>

              {/* Vertical connector */}
              {i < PIPELINE.length - 1 && (
                <div className={cn(
                  "absolute ml-3.5 mt-8 h-3 w-0.5",
                  i < currentIdx ? "bg-accent-300" : "bg-neutral-200"
                )} style={{ marginTop: "2.25rem", marginLeft: "0.875rem", position: "relative" }} />
              )}
            </div>
          );
        })}
      </div>
    </Card>
  );
}

// ─── Stats tile ───────────────────────────────────────────────────────────────

function StatTile({
  icon, label, value, href,
}: {
  icon: React.ReactNode; label: string; value: string | number; href: string;
}) {
  return (
    <Link href={href}>
      <div className="flex flex-col gap-3 rounded-2xl border border-neutral-200 bg-white p-5 transition-all hover:border-brand-200 hover:shadow-sm">
        <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-brand-50 text-brand-700">
          {icon}
        </div>
        <div>
          <p className="text-2xl font-extrabold text-navy-900 leading-none" style={{ letterSpacing: "-0.03em" }}>
            {value}
          </p>
          <p className="mt-1 text-xs font-medium text-neutral-500">{label}</p>
        </div>
      </div>
    </Link>
  );
}

// ─── Page ─────────────────────────────────────────────────────────────────────

export default async function TutorDashboardPage() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  const [{ data: profile }, { data: tp }] = await Promise.all([
    supabase.from("profiles").select("full_name, avatar_url").eq("id", user.id).single(),
    supabase
      .from("tutor_profiles")
      .select("id, verification_status, admin_notes, total_students, total_reviews, average_rating, knowledge_score, teaching_score, verified_at, expected_fee_per_hour, subjects, locality, city")
      .eq("user_id", user.id)
      .single(),
  ]);

  if (!tp) redirect("/tutor/onboarding");

  const [{ data: recentStudents }, { data: recentAttendance }, { count: docCount }] = await Promise.all([
    supabase
      .from("tutor_matches")
      .select("id, match_status, tuition_requirements(grade, subjects, student_name)")
      .eq("tutor_id", tp.id)
      .eq("match_status", "selected")
      .limit(4),
    supabase
      .from("attendance_records")
      .select("id, date, status, students(full_name)")
      .eq("tutor_id", tp.id)
      .order("date", { ascending: false })
      .limit(5),
    supabase
      .from("tutor_documents")
      .select("*", { count: "exact", head: true })
      .eq("tutor_id", tp.id),
  ]);

  const status    = tp.verification_status as TutorVerificationStatus;
  const isVerified = status === "verified";
  const firstName = profile?.full_name?.split(" ")[0] ?? "there";

  return (
    <div className="space-y-6">
      {/* Greeting */}
      <div className="flex flex-col gap-2 sm:flex-row sm:items-start sm:justify-between">
        <div className="flex items-center gap-4">
          <Avatar name={profile?.full_name ?? ""} src={profile?.avatar_url} size="lg" verified={isVerified} />
          <div>
            <div className="flex flex-wrap items-center gap-2">
              <h1 className="text-2xl font-bold text-navy-900" style={{ letterSpacing: "-0.02em" }}>
                Hello, {firstName}
              </h1>
              {isVerified && <VerifiedBadge size="md" />}
            </div>
            <div className="mt-1 flex items-center gap-2">
              <TutorStatusBadge status={status} />
              {tp.verified_at && (
                <span className="text-xs text-neutral-400">
                  since {formatDate(tp.verified_at)}
                </span>
              )}
            </div>
          </div>
        </div>

        {!isVerified && status !== "rejected" && status !== "suspended" && (
          <Link href="/tutor/status">
            <Button variant="outline" size="sm">
              View verification status
              <ArrowRight className="h-4 w-4" />
            </Button>
          </Link>
        )}
      </div>

      {/* Status banner */}
      <StatusBanner status={status} adminNotes={tp.admin_notes} />

      {/* Stats (only for verified tutors) */}
      {isVerified && (
        <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
          <StatTile icon={<Users className="h-5 w-5" />}         label="Active Students"    value={tp.total_students}  href="/tutor/students" />
          <StatTile icon={<Star className="h-5 w-5" />}          label="Average Rating"     value={tp.average_rating ? `${tp.average_rating}★` : "—"} href="/tutor/reviews" />
          <StatTile icon={<CalendarCheck className="h-5 w-5" />} label="Sessions Tracked"   value={recentAttendance?.length ?? 0} href="/tutor/attendance" />
          <StatTile icon={<BookOpen className="h-5 w-5" />}      label="Total Reviews"      value={tp.total_reviews}   href="/tutor/reviews" />
        </div>
      )}

      {/* Score cards (shown once assessed) */}
      {(tp.knowledge_score !== null || tp.teaching_score !== null) && (
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
          {tp.knowledge_score !== null && (
            <div className="flex items-center gap-4 rounded-2xl border border-brand-100 bg-brand-50 p-5">
              <div className="flex h-14 w-14 flex-shrink-0 items-center justify-center rounded-2xl bg-brand-900 text-white shadow-navy">
                <span className="text-xl font-extrabold" style={{ letterSpacing: "-0.03em" }}>
                  {tp.knowledge_score}
                </span>
              </div>
              <div>
                <p className="text-xs font-semibold uppercase tracking-wider text-brand-600">Knowledge Score</p>
                <p className="text-sm text-brand-800">Subject knowledge assessment</p>
              </div>
            </div>
          )}
          {tp.teaching_score !== null && (
            <div className="flex items-center gap-4 rounded-2xl border border-accent-100 bg-accent-50 p-5">
              <div className="flex h-14 w-14 flex-shrink-0 items-center justify-center rounded-2xl bg-accent-600 text-white shadow-teal">
                <span className="text-xl font-extrabold" style={{ letterSpacing: "-0.03em" }}>
                  {tp.teaching_score}
                </span>
              </div>
              <div>
                <p className="text-xs font-semibold uppercase tracking-wider text-accent-700">Teaching Score</p>
                <p className="text-sm text-accent-800">Interview & demo evaluation</p>
              </div>
            </div>
          )}
        </div>
      )}

      {/* Main two-column grid */}
      <div className="grid grid-cols-1 gap-5 lg:grid-cols-2">
        {/* Pipeline / students */}
        {!isVerified ? (
          <PipelineTracker status={status} />
        ) : (
          <Card padding="none">
            <div className="flex items-center justify-between border-b border-neutral-100 px-5 py-4">
              <h2 className="text-sm font-bold text-navy-900">My Students</h2>
              <Link href="/tutor/students" className="flex items-center gap-1 text-xs font-semibold text-brand-700 hover:text-brand-800">
                View all <ArrowRight className="h-3 w-3" />
              </Link>
            </div>
            {!recentStudents || recentStudents.length === 0 ? (
              <div className="px-5 py-10 text-center">
                <p className="text-sm text-neutral-500">No students assigned yet.</p>
                <p className="mt-0.5 text-xs text-neutral-400">You&apos;ll see them here once a parent selects you.</p>
              </div>
            ) : (
              <ul className="divide-y divide-neutral-50">
                {recentStudents.map((m) => {
                  const reqRaw = m.tuition_requirements as unknown;
                  const req    = (Array.isArray(reqRaw) ? reqRaw[0] : reqRaw) as {
                    grade: string; subjects: string[]; student_name: string | null;
                  } | null;
                  return (
                    <li key={m.id} className="flex items-center gap-3 px-5 py-3.5">
                      <div className="flex h-8 w-8 flex-shrink-0 items-center justify-center rounded-full bg-brand-100 text-brand-800 text-xs font-bold">
                        {(req?.student_name ?? "S").charAt(0).toUpperCase()}
                      </div>
                      <div>
                        <p className="text-sm font-semibold text-navy-900">{req?.student_name ?? "Student"}</p>
                        <p className="text-xs text-neutral-500">{req?.grade} · {(req?.subjects ?? []).join(", ")}</p>
                      </div>
                    </li>
                  );
                })}
              </ul>
            )}
          </Card>
        )}

        {/* Recent sessions */}
        <Card padding="none">
          <div className="flex items-center justify-between border-b border-neutral-100 px-5 py-4">
            <h2 className="text-sm font-bold text-navy-900">Recent Sessions</h2>
            <Link href="/tutor/attendance" className="flex items-center gap-1 text-xs font-semibold text-brand-700 hover:text-brand-800">
              View all <ArrowRight className="h-3 w-3" />
            </Link>
          </div>
          {!recentAttendance || recentAttendance.length === 0 ? (
            <div className="px-5 py-10 text-center">
              <p className="text-sm text-neutral-500">No sessions recorded yet.</p>
            </div>
          ) : (
            <ul className="divide-y divide-neutral-50">
              {recentAttendance.map((rec) => {
                const studentRaw = rec.students as unknown;
                const student    = (Array.isArray(studentRaw) ? studentRaw[0] : studentRaw) as { full_name: string } | null;
                const dotColor   = rec.status === "present" ? "bg-emerald-500"
                  : rec.status === "absent" ? "bg-red-500" : "bg-amber-400";
                return (
                  <li key={rec.id} className="flex items-center justify-between px-5 py-3.5">
                    <div className="flex items-center gap-3">
                      <span className={cn("h-2 w-2 rounded-full flex-shrink-0", dotColor)} />
                      <div>
                        <p className="text-sm font-medium text-navy-900">{student?.full_name ?? "Student"}</p>
                        <p className="text-xs text-neutral-400">{formatDate(rec.date)}</p>
                      </div>
                    </div>
                    <span className="text-xs font-medium capitalize text-neutral-500">{rec.status}</span>
                  </li>
                );
              })}
            </ul>
          )}
        </Card>
      </div>

      {/* Quick actions (for unverified tutors) */}
      {!isVerified && status !== "rejected" && status !== "suspended" && (
        <div className="grid grid-cols-1 gap-3 sm:grid-cols-3">
          {[
            { href: "/tutor/profile",    icon: <ShieldCheck className="h-5 w-5" />, label: "Complete Profile",   desc: "Update your teaching profile" },
            { href: "/tutor/documents",  icon: <FileText className="h-5 w-5" />,    label: "Upload Documents",   desc: "Identity & education docs" },
            { href: "/tutor/assessment", icon: <ClipboardCheck className="h-5 w-5" />, label: "Assessment",       desc: "Subject knowledge test" },
          ].map((action) => (
            <Link key={action.href} href={action.href}>
              <div className="flex items-center gap-3 rounded-2xl border border-neutral-200 bg-white p-4 transition-all hover:border-brand-200 hover:shadow-sm">
                <div className="flex h-10 w-10 flex-shrink-0 items-center justify-center rounded-xl bg-brand-50 text-brand-700">
                  {action.icon}
                </div>
                <div>
                  <p className="text-sm font-semibold text-navy-900">{action.label}</p>
                  <p className="text-xs text-neutral-500">{action.desc}</p>
                </div>
                <ArrowRight className="ml-auto h-4 w-4 flex-shrink-0 text-neutral-400" />
              </div>
            </Link>
          ))}
        </div>
      )}
    </div>
  );
}
