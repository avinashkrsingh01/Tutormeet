import { redirect } from "next/navigation";
import Link from "next/link";
import {
  Plus,
  ArrowRight,
  ClipboardList,
  Users,
  Video,
  CalendarCheck,
  Star,
  BookOpen,
  ShieldCheck,
  Clock,
} from "lucide-react";
import { createClient } from "@/lib/supabase/server";
import { DashboardHeader } from "@/components/layout/DashboardShell";
import { Card } from "@/components/ui/Card";
import { Button } from "@/components/ui/Button";
import { RequirementStatusBadge } from "@/components/ui/StatusBadge";
import { EmptyState } from "@/components/ui/EmptyState";
import { formatDate } from "@/lib/utils";
import type { Metadata } from "next";
import type { RequirementStatus } from "@/types/requirement";

export const metadata: Metadata = { title: "Parent Dashboard" };

// ─── Small stat tile ─────────────────────────────────────────────────────────

function StatTile({
  icon,
  label,
  value,
  href,
}: {
  icon: React.ReactNode;
  label: string;
  value: string | number;
  href: string;
}) {
  return (
    <Link href={href} className="block">
      <div className="flex flex-col gap-3 card-glass-hover p-5 animate-fade-in">
        <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-brand-50 text-brand-700">
          {icon}
        </div>
        <div>
          <p
            className="text-2xl font-extrabold text-navy-900 leading-none"
            style={{ letterSpacing: "-0.03em" }}
          >
            {value}
          </p>
          <p className="mt-1 text-xs font-medium text-neutral-500">{label}</p>
        </div>
      </div>
    </Link>
  );
}

// ─── Section card header ──────────────────────────────────────────────────────

function SectionCard({
  title,
  href,
  children,
  emptyState,
  isEmpty,
}: {
  title: string;
  href: string;
  children?: React.ReactNode;
  emptyState: React.ReactNode;
  isEmpty: boolean;
}) {
  return (
    <Card padding="none">
      <div className="flex items-center justify-between border-b border-neutral-100 px-5 py-4">
        <h2 className="text-sm font-bold text-navy-900" style={{ letterSpacing: "-0.01em" }}>
          {title}
        </h2>
        <Link
          href={href}
          className="flex items-center gap-1 text-xs font-semibold text-brand-700 hover:text-brand-800 transition-colors"
        >
          View all <ArrowRight className="h-3 w-3" />
        </Link>
      </div>
      {isEmpty ? emptyState : children}
    </Card>
  );
}

export default async function ParentDashboardPage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  const { data: profile } = await supabase
    .from("profiles")
    .select("full_name")
    .eq("id", user.id)
    .single();

  // Parallel data fetches
  const [
    { data: requirements },
    { data: demos },
    { data: activeMatches },
    { data: recentAttendance },
  ] = await Promise.all([
    supabase
      .from("tuition_requirements")
      .select("id, grade, subjects, student_name, status, city, created_at")
      .eq("parent_id", user.id)
      .order("created_at", { ascending: false })
      .limit(4),

    supabase
      .from("demo_classes")
      .select("id, scheduled_at, duration_minutes, status")
      .eq("parent_id", user.id)
      .eq("status", "scheduled")
      .order("scheduled_at", { ascending: true })
      .limit(3),

    supabase
      .from("tutor_matches")
      .select("id, match_status")
      .in("match_status", ["sent", "viewed", "demo_scheduled", "demo_requested"])
      .limit(10),

    supabase
      .from("attendance_records")
      .select("id, date, status")
      .order("date", { ascending: false })
      .limit(5),
  ]);

  const activeReqs =
    requirements?.filter((r) =>
      ["submitted", "matching", "shortlisted", "demo_scheduled"].includes(r.status)
    ).length ?? 0;

  const firstName = profile?.full_name?.split(" ")[0] ?? "there";

  return (
    <div>
      {/* Greeting */}
      <div className="mb-8">
        <h1 className="text-2xl font-bold text-navy-900" style={{ letterSpacing: "-0.02em" }}>
          Hello, {firstName} 👋
        </h1>
        <p className="mt-1 text-sm text-neutral-500">
          Here&apos;s an overview of your tuition activity.
        </p>
      </div>

      {/* Stat tiles */}
      <div className="mb-8 grid grid-cols-2 gap-3 sm:grid-cols-4 animate-fade-in" style={{ animationDelay: "100ms" }}>
        <StatTile
          icon={<ClipboardList className="h-5 w-5" />}
          label="Active Requirements"
          value={activeReqs}
          href="/parent/requirements"
        />
        <StatTile
          icon={<Users className="h-5 w-5" />}
          label="Tutor Matches"
          value={activeMatches?.length ?? 0}
          href="/parent/matches"
        />
        <StatTile
          icon={<Video className="h-5 w-5" />}
          label="Demos Scheduled"
          value={demos?.length ?? 0}
          href="/parent/demos"
        />
        <StatTile
          icon={<CalendarCheck className="h-5 w-5" />}
          label="Sessions Tracked"
          value={recentAttendance?.length ?? 0}
          href="/parent/attendance"
        />
      </div>

      {/* Two-column sections */}
      <div className="grid grid-cols-1 gap-5 lg:grid-cols-2 animate-fade-in" style={{ animationDelay: "200ms", animationFillMode: "both" }}>

        {/* My Requirements */}
        <SectionCard
          title="My Requirements"
          href="/parent/requirements"
          isEmpty={!requirements || requirements.length === 0}
          emptyState={
            <EmptyState
              compact
              title="No requirements yet"
              description="Post your first tuition requirement."
              action={
                <Link href="/parent/requirements/new">
                  <Button size="sm" variant="primary" iconLeft={<Plus className="h-4 w-4" />}>
                    Post Requirement
                  </Button>
                </Link>
              }
            />
          }
        >
          <ul className="divide-y divide-neutral-50">
            {requirements?.map((req) => (
              <li key={req.id}>
                <Link
                  href={`/parent/requirements/${req.id}`}
                  className="flex items-center justify-between gap-3 px-5 py-3.5 hover:bg-neutral-50 transition-colors"
                >
                  <div className="min-w-0">
                    <p className="truncate text-sm font-semibold text-navy-900">
                      {req.student_name ? `${req.student_name} · ` : ""}
                      {req.grade}
                    </p>
                    <p className="truncate text-xs text-neutral-500">
                      {(req.subjects as string[]).join(", ")} · {req.city}
                    </p>
                    <p className="text-2xs text-neutral-400">{formatDate(req.created_at)}</p>
                  </div>
                  <RequirementStatusBadge status={req.status as RequirementStatus} />
                </Link>
              </li>
            ))}
          </ul>
        </SectionCard>

        {/* Upcoming demos */}
        <SectionCard
          title="Demo Classes"
          href="/parent/demos"
          isEmpty={!demos || demos.length === 0}
          emptyState={
            <EmptyState
              compact
              title="No demos scheduled"
              description="Demos appear here once tutors are shortlisted."
            />
          }
        >
          <ul className="divide-y divide-neutral-50">
            {demos?.map((demo) => (
              <li
                key={demo.id}
                className="flex items-center justify-between gap-3 px-5 py-3.5"
              >
                <div className="flex items-center gap-3">
                  <div className="flex h-9 w-9 flex-shrink-0 items-center justify-center rounded-xl bg-accent-50 text-accent-700">
                    <Video className="h-4 w-4" />
                  </div>
                  <div>
                    <p className="text-sm font-semibold text-navy-900">Demo Class</p>
                    <p className="text-xs text-neutral-500">
                      {formatDate(demo.scheduled_at)} · {demo.duration_minutes} min
                    </p>
                  </div>
                </div>
                <span className="badge-teal">Scheduled</span>
              </li>
            ))}
          </ul>
        </SectionCard>
      </div>

      {/* Post requirement CTA — shown when no active requirements */}
      {activeReqs === 0 && (
        <div className="mt-5 overflow-hidden rounded-2xl bg-brand-900 p-6">
          <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
            <div>
              <p className="text-base font-bold text-white">
                Ready to find a tutor?
              </p>
              <p className="mt-1 text-sm text-brand-200">
                Post your requirement — our team will shortlist verified tutors
                within 48 hours.
              </p>
            </div>
            <Link href="/parent/requirements/new" className="flex-shrink-0">
              <Button variant="teal" size="md">
                Post a Requirement
                <ArrowRight className="h-4 w-4" />
              </Button>
            </Link>
          </div>
        </div>
      )}
    </div>
  );
}
