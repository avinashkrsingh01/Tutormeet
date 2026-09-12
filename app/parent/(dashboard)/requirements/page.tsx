import { redirect } from "next/navigation";
import Link from "next/link";
import { Plus, ClipboardList } from "lucide-react";
import { createClient } from "@/lib/supabase/server";
import { DashboardHeader } from "@/components/layout/DashboardShell";
import { Button } from "@/components/ui/Button";
import { RequirementStatusBadge } from "@/components/ui/StatusBadge";
import { EmptyState } from "@/components/ui/EmptyState";
import { Card } from "@/components/ui/Card";
import { formatDate } from "@/lib/utils";
import type { Metadata } from "next";
import type { RequirementStatus } from "@/types/requirement";

export const metadata: Metadata = { title: "My Requirements" };

export default async function RequirementsPage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) redirect("/login");

  const { data: requirements } = await supabase
    .from("tuition_requirements")
    .select(
      "id, grade, subjects, board, teaching_mode, city, locality, status, sessions_per_week, student_name, created_at"
    )
    .eq("parent_id", user.id)
    .order("created_at", { ascending: false });

  return (
    <div>
      <DashboardHeader
        title="My Requirements"
        description="All your tuition requirements and their current status."
        action={
          <Link href="/parent/requirements/new">
            <Button size="sm" iconLeft={<Plus className="h-4 w-4" />}>
              New Requirement
            </Button>
          </Link>
        }
      />

      {!requirements || requirements.length === 0 ? (
        <Card>
          <EmptyState
            icon={<ClipboardList className="h-8 w-8" />}
            title="No requirements yet"
            description="Post your first tuition requirement. Our team will shortlist verified tutors for you."
            action={
              <Link href="/parent/requirements/new">
                <Button size="sm" iconLeft={<Plus className="h-4 w-4" />}>
                  Post Your First Requirement
                </Button>
              </Link>
            }
          />
        </Card>
      ) : (
        <div className="space-y-3">
          {requirements.map((req) => (
            <Link key={req.id} href={`/parent/requirements/${req.id}`} className="block">
              <div className="card-hover flex flex-col gap-3 p-5 sm:flex-row sm:items-center sm:justify-between">
                <div className="flex-1">
                  <div className="flex flex-wrap items-center gap-2">
                    {req.student_name && (
                      <span className="text-sm font-bold text-navy-900">
                        {req.student_name}
                      </span>
                    )}
                    <span className="text-sm font-semibold text-navy-900">
                      {req.grade}
                    </span>
                    <span className="text-neutral-400">·</span>
                    <span className="text-sm text-neutral-600">
                      {(req.subjects as string[]).join(", ")}
                    </span>
                  </div>
                  <div className="mt-1 flex flex-wrap gap-x-3 gap-y-0.5 text-xs text-neutral-500">
                    <span>{req.board}</span>
                    <span>·</span>
                    <span>{req.teaching_mode}</span>
                    <span>·</span>
                    <span>{req.locality}, {req.city}</span>
                    <span>·</span>
                    <span>{req.sessions_per_week}× / week</span>
                  </div>
                  <p className="mt-1 text-xs text-neutral-400">
                    Posted {formatDate(req.created_at)}
                  </p>
                </div>
                <div className="flex-shrink-0">
                  <RequirementStatusBadge status={req.status as RequirementStatus} />
                </div>
              </div>
            </Link>
          ))}
        </div>
      )}
    </div>
  );
}
