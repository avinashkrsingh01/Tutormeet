import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { DashboardHeader } from "@/components/layout/DashboardShell";
import { Card } from "@/components/ui/Card";
import { Badge } from "@/components/ui/Badge";
import { EmptyState } from "@/components/ui/EmptyState";
import { CalendarCheck } from "lucide-react";
import { formatDate } from "@/lib/utils";
import type { Metadata } from "next";
import type { BadgeVariant } from "@/components/ui/Badge";

export const metadata: Metadata = { title: "Attendance" };

const statusConfig: Record<string, { label: string; variant: BadgeVariant }> = {
  present:   { label: "Present",   variant: "green"  },
  absent:    { label: "Absent",    variant: "red"    },
  cancelled: { label: "Cancelled", variant: "yellow" },
};

export default async function AttendancePage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  // Get attendance for this parent's students
  const { data: studentIds } = await supabase
    .from("students")
    .select("id")
    .eq("parent_id", user.id);

  const ids = (studentIds ?? []).map((s) => s.id);

  const { data: records } = ids.length > 0
    ? await supabase
        .from("attendance_records")
        .select("id, date, status, session_duration_minutes, notes, marked_by, students(full_name)")
        .in("student_id", ids)
        .order("date", { ascending: false })
        .limit(60)
    : { data: [] };

  // Summary counts
  const present   = records?.filter((r) => r.status === "present").length   ?? 0;
  const absent    = records?.filter((r) => r.status === "absent").length    ?? 0;
  const cancelled = records?.filter((r) => r.status === "cancelled").length ?? 0;
  const total     = records?.length ?? 0;

  return (
    <div>
      <DashboardHeader
        title="Attendance"
        description="Session attendance log for your active tuitions."
      />

      {/* Summary tiles */}
      {total > 0 && (
        <div className="mb-6 grid grid-cols-2 gap-3 sm:grid-cols-4">
          {[
            { label: "Total sessions",  value: total,     color: "bg-brand-50  text-brand-700"   },
            { label: "Present",         value: present,   color: "bg-emerald-50 text-emerald-700" },
            { label: "Absent",          value: absent,    color: "bg-red-50     text-red-700"     },
            { label: "Cancelled",       value: cancelled, color: "bg-amber-50   text-amber-700"   },
          ].map((tile) => (
            <div
              key={tile.label}
              className={`flex flex-col items-center gap-1 rounded-2xl p-4 text-center ${tile.color}`}
            >
              <span className="text-2xl font-extrabold" style={{ letterSpacing: "-0.03em" }}>
                {tile.value}
              </span>
              <span className="text-xs font-medium">{tile.label}</span>
            </div>
          ))}
        </div>
      )}

      {!records || records.length === 0 ? (
        <Card>
          <EmptyState
            icon={<CalendarCheck className="h-8 w-8" />}
            title="No sessions recorded"
            description="Attendance records will appear here once your tuition sessions begin."
          />
        </Card>
      ) : (
        <Card padding="none">
          <div className="overflow-x-auto">
            <table className="table-base">
              <thead>
                <tr>
                  <th>Date</th>
                  <th>Student</th>
                  <th>Duration</th>
                  <th>Marked by</th>
                  <th>Status</th>
                  <th>Notes</th>
                </tr>
              </thead>
              <tbody>
                {records.map((rec) => {
                  const studentRaw = rec.students as unknown;
                  const student    = (Array.isArray(studentRaw) ? studentRaw[0] : studentRaw) as
                    { full_name: string } | null;
                  const cfg = statusConfig[rec.status] ?? { label: rec.status, variant: "gray" as BadgeVariant };

                  return (
                    <tr key={rec.id}>
                      <td className="font-medium text-navy-900">{formatDate(rec.date)}</td>
                      <td>{student?.full_name ?? "—"}</td>
                      <td>{rec.session_duration_minutes} min</td>
                      <td className="capitalize text-neutral-500">{rec.marked_by}</td>
                      <td>
                        <Badge variant={cfg.variant} dot>{cfg.label}</Badge>
                      </td>
                      <td className="text-neutral-500">{rec.notes ?? "—"}</td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </Card>
      )}
    </div>
  );
}
