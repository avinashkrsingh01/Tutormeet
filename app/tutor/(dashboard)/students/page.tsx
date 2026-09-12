import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { DashboardHeader } from "@/components/layout/DashboardShell";
import { Card } from "@/components/ui/Card";
import { Badge } from "@/components/ui/Badge";
import { Avatar } from "@/components/ui/Avatar";
import { EmptyState } from "@/components/ui/EmptyState";
import { Users, MapPin } from "lucide-react";
import type { Metadata } from "next";

export const metadata: Metadata = { title: "My Students" };

type ReqRelation = {
  id: string;
  grade: string;
  subjects: string[];
  sessions_per_week: number;
  city: string;
  locality: string;
  status: string;
  students:
    | { full_name: string; current_grade: string | null; school_name: string | null }
    | { full_name: string; current_grade: string | null; school_name: string | null }[];
  profiles:
    | { full_name: string; phone: string | null }
    | { full_name: string; phone: string | null }[];
};

function extractOne<T>(raw: T | T[]): T {
  return Array.isArray(raw) ? raw[0] : raw;
}

export default async function TutorStudentsPage() {
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

  const { data: matches } = await supabase
    .from("tutor_matches")
    .select(
      `id, match_status,
       tuition_requirements(
         id, grade, subjects, sessions_per_week,
         city, locality, status,
         students(full_name, current_grade, school_name),
         profiles(full_name, phone)
       )`
    )
    .eq("tutor_id", tutorProfile?.id ?? "")
    .eq("match_status", "selected")
    .order("created_at", { ascending: false });

  return (
    <div>
      <DashboardHeader
        title="My Students"
        description="Students currently assigned to you."
      />

      {!matches || matches.length === 0 ? (
        <Card>
          <EmptyState
            icon={<Users className="h-8 w-8" />}
            title="No students yet"
            description="Once a parent selects you as their tutor, your students will appear here."
          />
        </Card>
      ) : (
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {matches.map((match) => {
            const reqRaw = match.tuition_requirements as unknown;
            const req = extractOne(reqRaw as ReqRelation | ReqRelation[]);
            const student = extractOne(req.students);
            const parent = extractOne(req.profiles);

            return (
              <Card key={match.id} padding="md" hover>
                <div className="flex items-start gap-3">
                  <Avatar name={student.full_name} size="md" />
                  <div className="min-w-0 flex-1">
                    <p className="font-semibold text-slate-900">
                      {student.full_name}
                    </p>
                    {student.current_grade && (
                      <p className="text-xs text-gray-500">
                        {student.current_grade}
                        {student.school_name ? ` · ${student.school_name}` : ""}
                      </p>
                    )}
                  </div>
                </div>

                <div className="mt-4 space-y-2 text-xs text-gray-500">
                  <div className="flex flex-wrap gap-1">
                    {req.subjects.map((s) => (
                      <Badge key={s} variant="blue">{s}</Badge>
                    ))}
                  </div>
                  <p>{req.grade}</p>
                  <p>{req.sessions_per_week}x per week</p>
                  <p className="flex items-center gap-1">
                    <MapPin className="h-3 w-3" />
                    {req.locality}, {req.city}
                  </p>
                </div>

                <div className="mt-4 border-t border-gray-100 pt-3 text-xs text-gray-500">
                  <p className="font-medium text-slate-700">Parent</p>
                  <p>{parent.full_name}</p>
                  {parent.phone && <p>{parent.phone}</p>}
                </div>
              </Card>
            );
          })}
        </div>
      )}
    </div>
  );
}
