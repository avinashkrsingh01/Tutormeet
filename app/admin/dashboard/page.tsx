import { redirect } from "next/navigation";
import Link from "next/link";
import type { Metadata } from "next";
import {
  GraduationCap, Users, ClipboardList, Shuffle,
  Video, BookOpen, Clock, ArrowRight,
  BadgeCheck, UserPlus, AlertCircle,
} from "lucide-react";
import { createClient } from "@/lib/supabase/server";
import { requireAdmin } from "@/lib/admin-auth";
import { hasPermission } from "@/types/admin";
import { DashboardHeader } from "@/components/layout/DashboardShell";
import { Card } from "@/components/ui/Card";
import { TutorStatusBadge } from "@/components/ui/StatusBadge";
import { RequirementStatusBadge } from "@/components/ui/StatusBadge";
import { Avatar } from "@/components/ui/Avatar";
import { formatDate } from "@/lib/utils";
import { cn } from "@/lib/utils";
import type { TutorVerificationStatus } from "@/types/tutor";
import type { RequirementStatus } from "@/types/requirement";

export const metadata: Metadata = { title: "Admin Dashboard" };

function extractOne<T>(raw: T | T[] | null | undefined): T | null {
  if (!raw) return null;
  if (Array.isArray(raw)) return raw[0] ?? null;
  return raw;
}

// ─── Stat card ────────────────────────────────────────────────────────────────

function StatCard({
  icon, label, value, href, accent = "navy", urgent = false,
}: {
  icon:    React.ReactNode;
  label:   string;
  value:   number;
  href:    string;
  accent?: "navy" | "teal" | "amber" | "red";
  urgent?: boolean;
}) {
  const accentMap = {
    navy:  "bg-brand-50 text-brand-700",
    teal:  "bg-accent-50 text-accent-700",
    amber: "bg-amber-50 text-amber-700",
    red:   "bg-red-50 text-red-600",
  };

  return (
    <Link href={href} className="block">
      <div className={cn(
        "flex flex-col gap-3 rounded-2xl border bg-white p-5 transition-all hover:shadow-sm",
        urgent && value > 0
          ? "border-amber-200 bg-amber-50/30"
          : "border-neutral-200 hover:border-brand-200"
      )}>
        <div className={cn(
          "flex h-10 w-10 items-center justify-center rounded-xl",
          accentMap[accent]
        )}>
          {icon}
        </div>
        <div>
          <p className="text-2xl font-extrabold text-navy-900 leading-none"
            style={{ letterSpacing: "-0.04em" }}>
            {value.toLocaleString("en-IN")}
          </p>
          <p className="mt-1 text-xs font-medium text-neutral-500">{label}</p>
        </div>
      </div>
    </Link>
  );
}

// ─── Section card ─────────────────────────────────────────────────────────────

function SectionCard({
  title, href, children, empty,
}: {
  title: string; href: string; children: React.ReactNode; empty?: boolean;
}) {
  return (
    <Card padding="none">
      <div className="flex items-center justify-between border-b border-neutral-100 px-5 py-4">
        <h2 className="text-sm font-bold text-navy-900">{title}</h2>
        <Link href={href} className="flex items-center gap-1 text-xs font-semibold text-brand-700 hover:text-brand-800">
          View all <ArrowRight className="h-3 w-3" />
        </Link>
      </div>
      {empty
        ? <div className="py-10 text-center text-sm text-neutral-400">All clear</div>
        : children}
    </Card>
  );
}

export default async function AdminDashboardPage() {
  const admin   = await requireAdmin();
  const supabase = await createClient();

  const canSeeVerification = hasPermission(admin.admin_role, "verify_tutors");
  const canSeeMatching     = hasPermission(admin.admin_role, "shortlist_tutors");

  const today = new Date().toISOString().split("T")[0];

  const [
    { count: newApplications },
    { count: pendingVerification },
    { count: newRequests },
    { count: pendingMatches },
    { count: demosToday },
    { count: activeStudents },
    { count: activeTutors },
    { count: totalEnrollments },
    { data: pendingTutors },
    { data: openRequirements },
    { data: recentActions },
  ] = await Promise.all([
    // New applications (submitted in last 7 days)
    supabase.from("tutor_profiles").select("*", { count: "exact", head: true })
      .eq("verification_status", "profile_submitted"),
    // Pending verification queue
    supabase.from("tutor_profiles").select("*", { count: "exact", head: true })
      .in("verification_status", ["profile_submitted","under_review","assessment_pending","interview_pending"]),
    // New parent requirements (last 7 days)
    supabase.from("tuition_requirements").select("*", { count: "exact", head: true })
      .eq("status", "submitted"),
    // Unmatched requirements
    supabase.from("tuition_requirements").select("*", { count: "exact", head: true })
      .in("status", ["submitted","matching"]),
    // Demos today
    supabase.from("demo_classes").select("*", { count: "exact", head: true })
      .eq("status", "scheduled")
      .gte("scheduled_at", `${today}T00:00:00`)
      .lte("scheduled_at", `${today}T23:59:59`),
    // Active students (active enrollments)
    supabase.from("enrollments").select("*", { count: "exact", head: true })
      .eq("status", "active"),
    // Active tutors
    supabase.from("tutor_profiles").select("*", { count: "exact", head: true })
      .eq("verification_status", "verified"),
    // Total enrollments
    supabase.from("enrollments").select("*", { count: "exact", head: true })
      .not("status", "eq", "terminated"),
    // Tutors awaiting verification (for table)
    canSeeVerification
      ? supabase.from("tutor_profiles")
          .select("id, verification_status, updated_at, profiles!inner(full_name, email, avatar_url)")
          .in("verification_status", ["profile_submitted","under_review","assessment_pending"])
          .order("updated_at", { ascending: true })
          .limit(6)
      : Promise.resolve({ data: [] }),
    // Open requirements needing matching (for table)
    canSeeMatching
      ? supabase.from("tuition_requirements")
          .select("id, grade, subjects, city, status, created_at, profiles!inner(full_name)")
          .in("status", ["submitted","matching"])
          .order("created_at", { ascending: true })
          .limit(6)
      : Promise.resolve({ data: [] }),
    // Recent admin actions
    supabase.from("admin_action_logs")
      .select("id, action_type, target_type, notes, created_at, profiles!inner(full_name)")
      .order("created_at", { ascending: false })
      .limit(5),
  ]);

  return (
    <div>
      <DashboardHeader
        title="Dashboard"
        description={`Welcome back. ${new Date().toLocaleDateString("en-IN", { weekday: "long", day: "numeric", month: "long" })}`}
      />

      {/* ── 8 Stat cards ──────────────────────────────────────────── */}
      <div className="mb-8 grid grid-cols-2 gap-3 sm:grid-cols-4">
        <StatCard icon={<UserPlus className="h-5 w-5" />}     label="New Applications"    value={newApplications ?? 0}    href="/admin/verification"  accent="amber" urgent />
        <StatCard icon={<BadgeCheck className="h-5 w-5" />}   label="Pending Verification" value={pendingVerification ?? 0} href="/admin/verification"  accent="amber" urgent />
        <StatCard icon={<ClipboardList className="h-5 w-5" />} label="New Parent Requests"  value={newRequests ?? 0}        href="/admin/requirements"  accent="navy"  urgent />
        <StatCard icon={<Shuffle className="h-5 w-5" />}      label="Pending Matches"      value={pendingMatches ?? 0}     href="/admin/matching"       accent="teal"  urgent />
        <StatCard icon={<Video className="h-5 w-5" />}        label="Demos Today"          value={demosToday ?? 0}         href="/admin/demos"          accent="teal" />
        <StatCard icon={<Users className="h-5 w-5" />}        label="Active Students"      value={activeStudents ?? 0}     href="/admin/enrollments"    accent="navy" />
        <StatCard icon={<GraduationCap className="h-5 w-5" />} label="Active Tutors"       value={activeTutors ?? 0}       href="/admin/tutors?status=verified" accent="teal" />
        <StatCard icon={<BookOpen className="h-5 w-5" />}     label="Total Enrolments"     value={totalEnrollments ?? 0}   href="/admin/enrollments"    accent="navy" />
      </div>

      {/* ── Two-column feed ───────────────────────────────────────── */}
      <div className="grid grid-cols-1 gap-5 lg:grid-cols-2">

        {/* Pending verification queue */}
        {canSeeVerification && (
          <SectionCard title="Verification Queue" href="/admin/verification"
            empty={!pendingTutors || pendingTutors.length === 0}>
            <ul className="divide-y divide-neutral-50">
              {pendingTutors?.map((tp) => {
                const profile = extractOne(
                  tp.profiles as { full_name: string; email: string; avatar_url: string | null } |
                                 { full_name: string; email: string; avatar_url: string | null }[] | null
                );
                const daysSince = Math.floor(
                  (Date.now() - new Date(tp.updated_at).getTime()) / 86400000
                );
                return (
                  <li key={tp.id}>
                    <Link href={`/admin/verification/${tp.id}`}
                      className="flex items-center justify-between gap-3 px-5 py-3.5 hover:bg-neutral-50 transition-colors">
                      <div className="flex items-center gap-3">
                        <Avatar name={profile?.full_name ?? "T"} src={profile?.avatar_url} size="sm" />
                        <div>
                          <p className="text-sm font-semibold text-navy-900">{profile?.full_name}</p>
                          <p className="text-xs text-neutral-400">
                            {profile?.email} · {daysSince === 0 ? "today" : `${daysSince}d ago`}
                          </p>
                        </div>
                      </div>
                      <TutorStatusBadge status={tp.verification_status as TutorVerificationStatus} />
                    </Link>
                  </li>
                );
              })}
            </ul>
          </SectionCard>
        )}

        {/* Open requirements */}
        {canSeeMatching && (
          <SectionCard title="Requirements Needing Matching" href="/admin/matching"
            empty={!openRequirements || openRequirements.length === 0}>
            <ul className="divide-y divide-neutral-50">
              {openRequirements?.map((req) => {
                const parent = extractOne(
                  req.profiles as { full_name: string } | { full_name: string }[] | null
                );
                const daysSince = Math.floor(
                  (Date.now() - new Date(req.created_at).getTime()) / 86400000
                );
                return (
                  <li key={req.id}>
                    <Link href={`/admin/requirements/${req.id}`}
                      className="flex items-center justify-between gap-3 px-5 py-3.5 hover:bg-neutral-50 transition-colors">
                      <div>
                        <p className="text-sm font-semibold text-navy-900">
                          {req.grade} — {(req.subjects as string[]).join(", ")}
                        </p>
                        <p className="text-xs text-neutral-400">
                          {parent?.full_name} · {req.city}
                          {daysSince > 2 && (
                            <span className="ml-1.5 inline-flex items-center gap-0.5 text-amber-600">
                              <AlertCircle className="h-3 w-3" />
                              {daysSince}d waiting
                            </span>
                          )}
                        </p>
                      </div>
                      <RequirementStatusBadge status={req.status as RequirementStatus} />
                    </Link>
                  </li>
                );
              })}
            </ul>
          </SectionCard>
        )}

        {/* Recent admin actions */}
        <SectionCard title="Recent Activity" href="/admin/reports"
          empty={!recentActions || recentActions.length === 0}>
          <ul className="divide-y divide-neutral-50">
            {recentActions?.map((action) => {
              const admin = extractOne(
                action.profiles as { full_name: string } | { full_name: string }[] | null
              );
              return (
                <li key={action.id} className="flex items-start gap-3 px-5 py-3.5">
                  <div className="flex h-7 w-7 flex-shrink-0 items-center justify-center rounded-full bg-neutral-100 text-neutral-500">
                    <Clock className="h-3.5 w-3.5" />
                  </div>
                  <div className="min-w-0 flex-1">
                    <p className="text-xs text-neutral-700">
                      <span className="font-semibold">{admin?.full_name ?? "Admin"}</span>
                      {" · "}
                      <span className="text-neutral-500">
                        {action.action_type.replace(/_/g, " ")}
                      </span>
                    </p>
                    {action.notes && (
                      <p className="mt-0.5 truncate text-xs text-neutral-400">{action.notes}</p>
                    )}
                    <p className="mt-0.5 text-2xs text-neutral-400">
                      {formatDate(action.created_at)}
                    </p>
                  </div>
                </li>
              );
            })}
          </ul>
        </SectionCard>
      </div>
    </div>
  );
}
