import { redirect } from "next/navigation";
import Link from "next/link";
import { createClient } from "@/lib/supabase/server";
import { DashboardHeader } from "@/components/layout/DashboardShell";
import { Card } from "@/components/ui/Card";
import { RequirementStatusBadge } from "@/components/ui/StatusBadge";
import { Badge } from "@/components/ui/Badge";
import { EmptyState } from "@/components/ui/EmptyState";
import { Shuffle } from "lucide-react";
import { formatDate } from "@/lib/utils";
import type { Metadata } from "next";
import type { RequirementStatus } from "@/types/requirement";

export const metadata: Metadata = { title: "Tutor Matching" };

function extractOne<T>(raw: T | T[] | null | undefined): T | null {
  if (!raw) return null;
  if (Array.isArray(raw)) return raw[0] ?? null;
  return raw;
}

export default async function AdminMatchingPage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  const { data: requirements } = await supabase
    .from("tuition_requirements")
    .select(
      `id, grade, subjects, city, status, created_at,
       profiles!inner(full_name),
       tutor_matches(id, match_status)`
    )
    .in("status", ["submitted", "matching", "shortlisted"])
    .order("created_at", { ascending: true });

  return (
    <div>
      <DashboardHeader
        title="Tutor Matching"
        description="Open requirements that need tutors assigned."
      />

      {!requirements || requirements.length === 0 ? (
        <Card>
          <EmptyState
            icon={<Shuffle className="h-8 w-8" />}
            title="All caught up"
            description="No requirements currently need tutor matching."
          />
        </Card>
      ) : (
        <div className="space-y-4">
          {requirements.map((req) => {
            const parent = extractOne(req.profiles as { full_name: string } | { full_name: string }[] | null);
            const matches = (req.tutor_matches as { id: string; match_status: string }[]) ?? [];
            const shortlisted = matches.length;

            return (
              <Link key={req.id} href={`/admin/requirements/${req.id}`}>
                <div className="card-hover flex flex-col gap-3 p-5 sm:flex-row sm:items-center sm:justify-between">
                  <div>
                    <div className="flex flex-wrap items-center gap-2">
                      <p className="font-semibold text-slate-900">
                        {req.grade} — {(req.subjects as string[]).join(", ")}
                      </p>
                      <RequirementStatusBadge status={req.status as RequirementStatus} />
                    </div>
                    <p className="mt-1 text-xs text-gray-500">
                      {parent?.full_name ?? "Parent"} · {req.city} · {formatDate(req.created_at)}
                    </p>
                  </div>
                  <div className="flex items-center gap-2">
                    <Badge variant={shortlisted > 0 ? "blue" : "gray"}>
                      {shortlisted} tutor{shortlisted !== 1 ? "s" : ""} shortlisted
                    </Badge>
                  </div>
                </div>
              </Link>
            );
          })}
        </div>
      )}
    </div>
  );
}
