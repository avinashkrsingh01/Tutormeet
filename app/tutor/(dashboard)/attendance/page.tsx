import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { DashboardHeader } from "@/components/layout/DashboardShell";
import { Card } from "@/components/ui/Card";
import { Badge } from "@/components/ui/Badge";
import { EmptyState } from "@/components/ui/EmptyState";
import { CalendarCheck } from "lucide-react";
import { formatDate } from "@/lib/utils";
import type { Metadata } from "next";

export const metadata: Metadata = { title: "Attendance" };

const statusVariant = {
  present: "green",
  absent: "red",
  cancelled: "yellow",
} as const;

export default async function TutorAttendancePage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) redirect("/login");

  const { data: tutorProfile } = await supabase
    .from("tutor_profiles")
    .select("id")
    .eq("user_id", user.id)
    .single();

  const { data: records } = await supabase
    .from("attendance_records")
    .select(
      "id, date, status, session_duration_minutes, notes, marked_by, students(full_name)"
    )
    .eq("tutor_id", tutorProfile?.id ?? "")
    .order("date", { ascending: false })
    .limit(50);

  return (
    <div>
      <DashboardHeader
        title="Attendance"
        description="Session attendance log for all your students."
      />

      {!records || records.length === 0 ? (
        <Card>
          <EmptyState
            icon={<CalendarCheck className="h-8 w-8" />}
            title="No sessions recorded yet"
            description="Attendance records will appear here once your tuition sessions begin."
          />
        </Card>
      ) : (
        <Card padding="none">
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-gray-100 bg-gray-50 text-left text-xs font-medium uppercase tracking-wide text-gray-500">
                  <th className="px-5 py-3">Date</th>
                  <th className="px-5 py-3">Student</th>
                  <th className="px-5 py-3">Duration</th>
                  <th className="px-5 py-3">Marked By</th>
                  <th className="px-5 py-3">Status</th>
                  <th className="px-5 py-3">Notes</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {records.map((rec) => {
                  const studentRaw = rec.students as unknown;
                  const student = Array.isArray(studentRaw)
                    ? (studentRaw[0] as { full_name: string } | undefined) ?? null
                    : (studentRaw as { full_name: string } | null);
                  const variant =
                    statusVariant[rec.status as keyof typeof statusVariant] ??
                    "gray";
                  return (
                    <tr key={rec.id} className="hover:bg-gray-50 transition-colors">
                      <td className="px-5 py-3 text-slate-900">
                        {formatDate(rec.date)}
                      </td>
                      <td className="px-5 py-3 text-slate-700">
                        {student?.full_name ?? "—"}
                      </td>
                      <td className="px-5 py-3 text-gray-500">
                        {rec.session_duration_minutes} min
                      </td>
                      <td className="px-5 py-3 capitalize text-gray-500">
                        {rec.marked_by}
                      </td>
                      <td className="px-5 py-3">
                        <Badge variant={variant}>
                          {rec.status.charAt(0).toUpperCase() +
                            rec.status.slice(1)}
                        </Badge>
                      </td>
                      <td className="px-5 py-3 text-gray-500">
                        {rec.notes ?? "—"}
                      </td>
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
