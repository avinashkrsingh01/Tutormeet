import { redirect, notFound } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { DashboardHeader } from "@/components/layout/DashboardShell";
import { Card, CardHeader, CardTitle } from "@/components/ui/Card";
import { Badge } from "@/components/ui/Badge";
import { RequirementStatusBadge } from "@/components/ui/StatusBadge";
import { AdminMatchPanel } from "@/components/admin/AdminMatchPanel";
import type { ExistingMatch } from "@/components/admin/AdminMatchPanel";
import { formatDate, formatINR } from "@/lib/utils";
import type { Metadata } from "next";
import type { RequirementStatus } from "@/types/requirement";

export const metadata: Metadata = { title: "Requirement Details" };

interface PageProps {
  params: Promise<{ id: string }>;
}

export default async function AdminRequirementDetailPage({
  params,
}: PageProps) {
  const { id } = await params;
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  const { data: req } = await supabase
    .from("tuition_requirements")
    .select(
      `*, profiles!inner(full_name, email, phone), students!inner(full_name, current_grade, school_name)`
    )
    .eq("id", id)
    .single();

  if (!req) notFound();

  // Existing matches
  const { data: matches } = await supabase
    .from("tutor_matches")
    .select(
      `id, match_status, created_at,
       tutor_profiles!inner(id, user_id, subjects, years_of_experience, expected_fee_per_hour,
         profiles!inner(full_name, avatar_url))`
    )
    .eq("requirement_id", id)
    .order("created_at", { ascending: false });

  // Verified tutors available to match (exclude already matched)
  const matchedTutorIds = (matches ?? []).map((m) => {
    const tpRaw = m.tutor_profiles as unknown;
    const tp = (Array.isArray(tpRaw) ? tpRaw[0] : tpRaw) as { id: string } | null;
    return tp?.id ?? "";
  }).filter(Boolean);

  let tutorQuery = supabase
    .from("tutor_profiles")
    .select(
      `id, subjects, grades, years_of_experience, expected_fee_per_hour, address,
       profiles!inner(full_name, avatar_url)`
    )
    .eq("verification_status", "verified")
    .contains("subjects", req.subjects as string[]);

  if (matchedTutorIds.length > 0) {
    tutorQuery = tutorQuery.not("id", "in", `(${matchedTutorIds.join(",")})`);
  }

  const { data: availableTutors } = await tutorQuery.limit(20);

  const parent = req.profiles as { full_name: string; email: string; phone: string | null };
  const student = req.students as { full_name: string; current_grade: string | null; school_name: string | null };

  return (
    <div>
      <DashboardHeader
        title="Requirement Details"
        description={`From ${parent.full_name}`}
        action={<RequirementStatusBadge status={req.status as RequirementStatus} />}
      />

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
        <div className="space-y-6 lg:col-span-2">
          {/* Requirement details */}
          <Card>
            <CardHeader>
              <CardTitle>Requirement</CardTitle>
            </CardHeader>
            <div className="grid grid-cols-2 gap-4 text-sm sm:grid-cols-3">
              {[
                { label: "Grade", value: req.grade },
                { label: "Board", value: req.board },
                { label: "Mode", value: req.teaching_mode },
                { label: "Sessions/week", value: `${req.sessions_per_week}x` },
                { label: "Duration", value: `${req.session_duration_minutes} min` },
                { label: "Budget", value: req.budget_per_hour ? `${formatINR(req.budget_per_hour)}/month` : "Flexible" },
                { label: "Location", value: `${req.locality}, ${req.city}` },
                { label: "Pincode", value: req.pincode },
                { label: "Submitted", value: formatDate(req.created_at) },
              ].map((item) => (
                <div key={item.label}>
                  <p className="text-xs font-medium text-gray-500">{item.label}</p>
                  <p className="mt-0.5 text-slate-900">{item.value}</p>
                </div>
              ))}
            </div>
            <div className="mt-4">
              <p className="text-xs font-medium text-gray-500">Subjects</p>
              <div className="mt-1.5 flex flex-wrap gap-1">
                {(req.subjects as string[]).map((s: string) => (
                  <Badge key={s} variant="blue">{s}</Badge>
                ))}
              </div>
            </div>
            {req.special_requirements && (
              <div className="mt-4 rounded-lg bg-yellow-50 px-4 py-3">
                <p className="text-xs font-medium text-yellow-800">Special requirements</p>
                <p className="mt-1 text-sm text-yellow-700">{req.special_requirements}</p>
              </div>
            )}
          </Card>

          {/* Matching panel */}
          <AdminMatchPanel
            requirementId={id}
            existingMatches={(matches ?? []) as ExistingMatch[]}
            availableTutors={(availableTutors ?? []) as Record<string, unknown>[]}
          />
        </div>

        {/* Sidebar */}
        <div className="space-y-6">
          <Card padding="md">
            <CardHeader>
              <CardTitle>Parent</CardTitle>
            </CardHeader>
            <dl className="space-y-2 text-sm">
              <div>
                <dt className="text-xs text-gray-500">Name</dt>
                <dd className="text-slate-900">{parent.full_name}</dd>
              </div>
              <div>
                <dt className="text-xs text-gray-500">Email</dt>
                <dd className="text-slate-900">{parent.email}</dd>
              </div>
              {parent.phone && (
                <div>
                  <dt className="text-xs text-gray-500">Phone</dt>
                  <dd className="text-slate-900">{parent.phone}</dd>
                </div>
              )}
            </dl>
          </Card>

          <Card padding="md">
            <CardHeader>
              <CardTitle>Student</CardTitle>
            </CardHeader>
            <dl className="space-y-2 text-sm">
              <div>
                <dt className="text-xs text-gray-500">Name</dt>
                <dd className="text-slate-900">{student.full_name}</dd>
              </div>
              {student.current_grade && (
                <div>
                  <dt className="text-xs text-gray-500">Grade</dt>
                  <dd className="text-slate-900">{student.current_grade}</dd>
                </div>
              )}
              {student.school_name && (
                <div>
                  <dt className="text-xs text-gray-500">School</dt>
                  <dd className="text-slate-900">{student.school_name}</dd>
                </div>
              )}
            </dl>
          </Card>
        </div>
      </div>
    </div>
  );
}
