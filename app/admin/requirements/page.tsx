import { redirect } from "next/navigation";
import Link from "next/link";
import { createClient } from "@/lib/supabase/server";
import { DashboardHeader } from "@/components/layout/DashboardShell";
import { Card } from "@/components/ui/Card";
import { RequirementStatusBadge } from "@/components/ui/StatusBadge";
import { EmptyState } from "@/components/ui/EmptyState";
import { ClipboardList } from "lucide-react";
import { formatDate } from "@/lib/utils";
import type { Metadata } from "next";
import type { RequirementStatus } from "@/types/requirement";

export const metadata: Metadata = { title: "Requirements" };

interface PageProps {
  searchParams: Promise<{ status?: string }>;
}

const filterOptions = [
  { label: "All Open", value: "" },
  { label: "Submitted", value: "submitted" },
  { label: "Matching", value: "matching" },
  { label: "Shortlisted", value: "shortlisted" },
  { label: "Demo Scheduled", value: "demo_scheduled" },
  { label: "Active", value: "active" },
  { label: "Completed", value: "completed" },
];

function extractOne<T>(raw: T | T[] | null | undefined): T | null {
  if (!raw) return null;
  if (Array.isArray(raw)) return raw[0] ?? null;
  return raw;
}

export default async function AdminRequirementsPage({ searchParams }: PageProps) {
  const { status: filterStatus } = await searchParams;
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  let query = supabase
    .from("tuition_requirements")
    .select(
      `id, grade, subjects, city, locality, sessions_per_week,
       teaching_mode, status, created_at,
       profiles(full_name, phone),
       students(full_name)`
    )
    .order("created_at", { ascending: false });

  if (filterStatus) {
    query = query.eq("status", filterStatus);
  } else {
    query = query.not("status", "in", '("completed","cancelled")');
  }

  const { data: requirements } = await query;

  return (
    <div>
      <DashboardHeader
        title="Requirements"
        description="All parent tuition requirements. Match tutors to open requirements."
      />

      {/* Filter tabs */}
      <div className="mb-6 flex flex-wrap gap-2">
        {filterOptions.map((opt) => (
          <Link
            key={opt.value}
            href={opt.value ? `/admin/requirements?status=${opt.value}` : "/admin/requirements"}
          >
            <span
              className={`inline-flex cursor-pointer items-center rounded-full px-3 py-1 text-xs font-medium transition-colors ${
                (filterStatus ?? "") === opt.value
                  ? "bg-brand-600 text-white"
                  : "bg-gray-100 text-gray-600 hover:bg-gray-200"
              }`}
            >
              {opt.label}
            </span>
          </Link>
        ))}
      </div>

      {!requirements || requirements.length === 0 ? (
        <Card>
          <EmptyState
            icon={<ClipboardList className="h-8 w-8" />}
            title="No requirements"
            description="No requirements match the selected filter."
          />
        </Card>
      ) : (
        <Card padding="none">
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-gray-100 bg-gray-50 text-left text-xs font-medium uppercase tracking-wide text-gray-500">
                  <th className="px-5 py-3">Parent / Student</th>
                  <th className="px-5 py-3">Requirement</th>
                  <th className="px-5 py-3">Location</th>
                  <th className="px-5 py-3">Status</th>
                  <th className="px-5 py-3">Date</th>
                  <th className="px-5 py-3">Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {requirements.map((req) => {
                  const parent = extractOne(
                    req.profiles as
                      | { full_name: string; phone: string | null }
                      | { full_name: string; phone: string | null }[]
                      | null
                  );
                  const student = extractOne(
                    req.students as
                      | { full_name: string }
                      | { full_name: string }[]
                      | null
                  );
                  return (
                    <tr key={req.id} className="hover:bg-gray-50 transition-colors">
                      <td className="px-5 py-3">
                        <p className="font-medium text-slate-900">{parent?.full_name ?? "—"}</p>
                        <p className="text-xs text-gray-500">{student?.full_name ?? "—"}</p>
                      </td>
                      <td className="px-5 py-3">
                        <p className="text-slate-900">{req.grade}</p>
                        <p className="text-xs text-gray-500">{(req.subjects as string[]).join(", ")}</p>
                      </td>
                      <td className="px-5 py-3 text-gray-600">
                        {req.locality}, {req.city}
                      </td>
                      <td className="px-5 py-3">
                        <RequirementStatusBadge status={req.status as RequirementStatus} />
                      </td>
                      <td className="px-5 py-3 text-gray-500">{formatDate(req.created_at)}</td>
                      <td className="px-5 py-3">
                        <Link href={`/admin/requirements/${req.id}`} className="text-xs font-medium text-brand-600 hover:text-brand-700">
                          Open →
                        </Link>
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
