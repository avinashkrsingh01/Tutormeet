import { redirect, notFound } from "next/navigation";
import Link from "next/link";
import { createClient } from "@/lib/supabase/server";
import { DashboardHeader } from "@/components/layout/DashboardShell";
import { Card, CardHeader, CardTitle } from "@/components/ui/Card";
import { Badge } from "@/components/ui/Badge";
import { RequirementStatusBadge } from "@/components/ui/StatusBadge";
import { Button } from "@/components/ui/Button";
import { formatDate, formatINR } from "@/lib/utils";
import { Users, ArrowRight } from "lucide-react";
import type { Metadata } from "next";
import type { RequirementStatus } from "@/types/requirement";

export const metadata: Metadata = { title: "Requirement Details" };

interface PageProps {
  params: Promise<{ id: string }>;
}

export default async function RequirementDetailPage({ params }: PageProps) {
  const { id } = await params;
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  const { data: req } = await supabase
    .from("tuition_requirements")
    .select("*, students(full_name, current_grade, school_name)")
    .eq("id", id)
    .eq("parent_id", user.id)
    .single();

  if (!req) notFound();

  const infoItems = [
    { label: "Grade",           value: req.grade },
    { label: "Board",           value: req.board },
    { label: "Teaching Mode",   value: req.teaching_mode },
    { label: "Tutor Gender",    value: (req.preferred_tutor_gender as string)?.replace("_", " ") ?? "No preference" },
    { label: "Sessions / week", value: `${req.sessions_per_week}×` },
    { label: "Duration",        value: `${req.session_duration_minutes} min` },
    { label: "Location",        value: `${req.locality}, ${req.city}` },
    { label: "PIN code",        value: req.pincode },
    {
      label: "Budget",
      value: req.budget_per_hour
        ? `${formatINR(req.budget_per_hour)}/hr`
        : "Flexible",
    },
    { label: "Submitted",       value: formatDate(req.created_at) },
  ];

  return (
    <div>
      <DashboardHeader
        title={req.student_name ? `${req.student_name}'s Requirement` : "Requirement Details"}
        description={`Posted ${formatDate(req.created_at)}`}
        action={
          <div className="flex items-center gap-2">
            <RequirementStatusBadge status={req.status as RequirementStatus} />
            {(req.status === "shortlisted" || req.status === "demo_scheduled") && (
              <Link href="/parent/matches">
                <Button size="sm" variant="primary" iconRight={<ArrowRight className="h-4 w-4" />}>
                  View Tutors
                </Button>
              </Link>
            )}
          </div>
        }
      />

      <div className="grid grid-cols-1 gap-5 lg:grid-cols-3">
        {/* Main */}
        <div className="space-y-5 lg:col-span-2">
          <Card>
            <CardHeader><CardTitle>Subjects Required</CardTitle></CardHeader>
            <div className="flex flex-wrap gap-2">
              {(req.subjects as string[]).map((s) => (
                <Badge key={s} variant="navy">{s}</Badge>
              ))}
            </div>
          </Card>

          {req.learning_goals && (
            <Card>
              <CardHeader><CardTitle>Learning Goals</CardTitle></CardHeader>
              <p className="text-sm leading-relaxed text-neutral-600">{req.learning_goals}</p>
            </Card>
          )}

          <Card>
            <CardHeader><CardTitle>Schedule Preferences</CardTitle></CardHeader>
            <div className="space-y-4">
              <div>
                <p className="label-sm mb-2">Preferred Days</p>
                <div className="flex flex-wrap gap-2">
                  {(req.preferred_days as string[]).map((d) => (
                    <Badge key={d} variant="gray">{d}</Badge>
                  ))}
                </div>
              </div>
              <div>
                <p className="label-sm mb-2">Preferred Time Slots</p>
                <div className="flex flex-wrap gap-2">
                  {(req.preferred_time_slots as string[]).map((t) => (
                    <Badge key={t} variant="gray">{t}</Badge>
                  ))}
                </div>
              </div>
            </div>
          </Card>

          {req.special_requirements && (
            <Card>
              <CardHeader><CardTitle>Special Requirements</CardTitle></CardHeader>
              <p className="text-sm leading-relaxed text-neutral-600">{req.special_requirements}</p>
            </Card>
          )}

          {req.admin_notes && (
            <Card variant="teal">
              <CardHeader><CardTitle>Note from TutorMeet</CardTitle></CardHeader>
              <p className="text-sm leading-relaxed text-neutral-700">{req.admin_notes}</p>
            </Card>
          )}
        </div>

        {/* Sidebar */}
        <div className="space-y-5">
          <Card>
            <CardHeader><CardTitle>Details</CardTitle></CardHeader>
            <dl className="space-y-3">
              {infoItems.map((item) => (
                <div key={item.label}>
                  <dt className="text-xs font-semibold uppercase tracking-wide text-neutral-400">
                    {item.label}
                  </dt>
                  <dd className="mt-0.5 text-sm font-medium text-navy-900">{item.value}</dd>
                </div>
              ))}
            </dl>
          </Card>

          {req.students && (
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Users className="h-4 w-4 text-neutral-400" />
                  Student
                </CardTitle>
              </CardHeader>
              <dl className="space-y-2">
                {[
                  { label: "Name",   value: (req.students as { full_name: string }).full_name },
                  { label: "Grade",  value: (req.students as { current_grade: string | null }).current_grade },
                  { label: "School", value: (req.students as { school_name: string | null }).school_name },
                ].filter((i) => i.value).map((item) => (
                  <div key={item.label}>
                    <dt className="text-xs font-semibold uppercase tracking-wide text-neutral-400">{item.label}</dt>
                    <dd className="mt-0.5 text-sm text-navy-900">{item.value}</dd>
                  </div>
                ))}
              </dl>
            </Card>
          )}
        </div>
      </div>
    </div>
  );
}
