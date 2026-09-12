import { redirect, notFound } from "next/navigation";
import type { Metadata } from "next";
import { createClient } from "@/lib/supabase/server";
import { requireAdminPermission } from "@/lib/admin-auth";
import { DashboardHeader } from "@/components/layout/DashboardShell";
import { Card, CardHeader, CardTitle } from "@/components/ui/Card";
import { Avatar } from "@/components/ui/Avatar";
import { Badge } from "@/components/ui/Badge";
import { AdminDemoActions } from "@/components/admin/AdminDemoActions";
import { formatDate } from "@/lib/utils";
import { Star, CheckCircle2, XCircle } from "lucide-react";

export const metadata: Metadata = { title: "Demo Class — Admin" };

interface PageProps { params: Promise<{ id: string }> }

const statusVariant: Record<string, "navy" | "blue" | "teal" | "green" | "yellow" | "red" | "gray"> = {
  requested: "navy", tutor_accepted: "blue", scheduled: "teal",
  completed: "green", cancelled: "gray", no_show: "yellow",
};

export default async function AdminDemoDetailPage({ params }: PageProps) {
  const { id } = await params;
  const admin   = await requireAdminPermission("view_demos");
  const supabase = await createClient();

  const { data: demo } = await supabase
    .from("demo_classes")
    .select(`
      id, status, scheduled_at, duration_minutes,
      delivery_method, meeting_link, venue_address,
      parent_rating, parent_feedback, wants_to_continue,
      was_tutor_punctual, was_explanation_clear,
      tutor_feedback, admin_notes, student_name, created_at, updated_at,
      tutor_profiles!inner(id, user_id, subjects, profiles!inner(full_name, avatar_url, email, phone)),
      profiles!inner(full_name, email, phone),
      tuition_requirements!inner(id, grade, subjects, sessions_per_week, city, locality)
    `)
    .eq("id", id)
    .single();

  if (!demo) notFound();

  const tpRaw      = demo.tutor_profiles as unknown;
  const tp         = (Array.isArray(tpRaw) ? tpRaw[0] : tpRaw) as {
    id: string; user_id: string; subjects: string[];
    profiles: { full_name: string; avatar_url: string | null; email: string; phone: string | null } |
              { full_name: string; avatar_url: string | null; email: string; phone: string | null }[];
  };
  const tProfileRaw = tp.profiles;
  const tutorProfile = (Array.isArray(tProfileRaw) ? tProfileRaw[0] : tProfileRaw) as
    { full_name: string; avatar_url: string | null; email: string; phone: string | null };

  const parentRaw = demo.profiles as unknown;
  const parent    = (Array.isArray(parentRaw) ? parentRaw[0] : parentRaw) as
    { full_name: string; email: string; phone: string | null } | null;

  const reqRaw = demo.tuition_requirements as unknown;
  const req    = (Array.isArray(reqRaw) ? reqRaw[0] : reqRaw) as {
    id: string; grade: string; subjects: string[];
    sessions_per_week: number; city: string; locality: string;
  } | null;

  const canSchedule = ["super_admin","operations_admin"].includes(admin.admin_role);

  return (
    <div>
      <DashboardHeader
        title="Demo Class"
        description={`${tutorProfile.full_name} → ${parent?.full_name ?? "Parent"}`}
        action={
          <Badge variant={statusVariant[demo.status] ?? "gray"}>
            {demo.status.replace("_", " ")}
          </Badge>
        }
      />

      <div className="grid grid-cols-1 gap-5 lg:grid-cols-3">

        {/* ── Main ──────────────────────────────────────────────── */}
        <div className="space-y-5 lg:col-span-2">

          {/* Parties */}
          <Card padding="md">
            <CardHeader><CardTitle>Participants</CardTitle></CardHeader>
            <div className="grid grid-cols-1 gap-5 sm:grid-cols-2">
              <div>
                <p className="label-sm mb-2">Tutor</p>
                <div className="flex items-center gap-3">
                  <Avatar name={tutorProfile.full_name} src={tutorProfile.avatar_url} size="md" verified />
                  <div>
                    <p className="font-semibold text-navy-900">{tutorProfile.full_name}</p>
                    <p className="text-xs text-neutral-500">{tutorProfile.email}</p>
                    {tutorProfile.phone && (
                      <p className="text-xs text-neutral-500">{tutorProfile.phone}</p>
                    )}
                  </div>
                </div>
              </div>
              <div>
                <p className="label-sm mb-2">Parent</p>
                <div>
                  <p className="font-semibold text-navy-900">{parent?.full_name ?? "—"}</p>
                  <p className="text-xs text-neutral-500">{parent?.email ?? "—"}</p>
                  {parent?.phone && <p className="text-xs text-neutral-500">{parent.phone}</p>}
                </div>
              </div>
            </div>
            {demo.student_name && (
              <div className="mt-4 rounded-xl bg-neutral-50 px-4 py-3">
                <p className="text-xs text-neutral-500">
                  Student: <span className="font-semibold text-navy-900">{demo.student_name}</span>
                </p>
              </div>
            )}
          </Card>

          {/* Requirement context */}
          {req && (
            <Card padding="md">
              <CardHeader><CardTitle>Requirement</CardTitle></CardHeader>
              <div className="flex flex-wrap gap-3 text-sm">
                {[
                  { label: "Grade",    value: req.grade },
                  { label: "Location", value: `${req.locality}, ${req.city}` },
                  { label: "Sessions", value: `${req.sessions_per_week}×/week` },
                ].map((item) => (
                  <div key={item.label} className="min-w-[6rem]">
                    <p className="label-sm">{item.label}</p>
                    <p className="mt-0.5 text-navy-900">{item.value}</p>
                  </div>
                ))}
              </div>
              <div className="mt-3 flex flex-wrap gap-1.5">
                {req.subjects.map((s) => <span key={s} className="tag">{s}</span>)}
              </div>
            </Card>
          )}

          {/* Parent feedback (after completion) */}
          {demo.status === "completed" && demo.parent_rating !== null && (
            <Card padding="md">
              <CardHeader><CardTitle>Parent Feedback</CardTitle></CardHeader>
              <div className="space-y-3">
                <div className="flex items-center gap-2">
                  {[1,2,3,4,5].map((s) => (
                    <Star key={s} className={`h-5 w-5 ${s <= (demo.parent_rating ?? 0) ? "fill-amber-400 text-amber-400" : "fill-neutral-200 text-neutral-200"}`} />
                  ))}
                  <span className="ml-1 font-bold text-navy-900">{demo.parent_rating}/5</span>
                </div>
                <div className="grid grid-cols-2 gap-3 text-sm">
                  {[
                    { label: "Tutor punctual",       value: demo.was_tutor_punctual },
                    { label: "Explanation clear",    value: demo.was_explanation_clear },
                  ].map((q) => (
                    <div key={q.label} className="flex items-center gap-2">
                      {q.value
                        ? <CheckCircle2 className="h-4 w-4 text-accent-500" />
                        : <XCircle className="h-4 w-4 text-red-400" />}
                      <span className="text-neutral-700">{q.label}: <strong>{q.value ? "Yes" : "No"}</strong></span>
                    </div>
                  ))}
                </div>
                {demo.parent_feedback && (
                  <p className="italic text-sm text-neutral-600">&ldquo;{demo.parent_feedback}&rdquo;</p>
                )}
                <div className={`rounded-xl px-4 py-3 text-sm font-semibold text-center ${
                  demo.wants_to_continue ? "bg-accent-50 text-accent-700" : "bg-neutral-50 text-neutral-600"
                }`}>
                  {demo.wants_to_continue
                    ? "✓ Parent chose to continue with this tutor"
                    : "Parent chose to try another tutor"}
                </div>
              </div>
            </Card>
          )}
        </div>

        {/* ── Sidebar ───────────────────────────────────────────── */}
        <div className="space-y-5">

          {/* Current schedule */}
          <Card padding="md">
            <CardTitle className="mb-4">Schedule</CardTitle>
            <dl className="space-y-2.5 text-sm">
              {[
                { label: "Status",   value: demo.status.replace("_", " ") },
                { label: "Date",     value: demo.scheduled_at ? formatDate(demo.scheduled_at) : "Not set" },
                { label: "Duration", value: `${demo.duration_minutes} min` },
                { label: "Method",   value: demo.delivery_method?.replace("_", " ") ?? "Not set" },
              ].map((item) => (
                <div key={item.label} className="flex items-center justify-between">
                  <dt className="text-xs font-semibold text-neutral-400">{item.label}</dt>
                  <dd className="capitalize text-navy-900">{item.value}</dd>
                </div>
              ))}
              {demo.meeting_link && (
                <div>
                  <dt className="label-sm">Meeting link</dt>
                  <a href={demo.meeting_link} target="_blank" rel="noopener noreferrer"
                    className="text-xs text-brand-700 hover:underline break-all">
                    {demo.meeting_link}
                  </a>
                </div>
              )}
              {/* SECURITY: venue_address only shown to authorised admins in this detail view */}
              {demo.venue_address && canSchedule && (
                <div>
                  <dt className="label-sm">Venue address</dt>
                  <dd className="text-xs text-neutral-600">{demo.venue_address}</dd>
                  <p className="text-2xs text-neutral-400 mt-0.5">Private — not shown to parents in list view</p>
                </div>
              )}
            </dl>
          </Card>

          {/* Admin actions */}
          {canSchedule && (
            <AdminDemoActions
              demoId={id}
              currentStatus={demo.status}
              currentAdminNotes={demo.admin_notes ?? ""}
              requirementId={req?.id ?? ""}
              tutorProfileId={tp.id}
            />
          )}
        </div>
      </div>
    </div>
  );
}
