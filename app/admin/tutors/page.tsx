import Link from "next/link";
import { createClient } from "@/lib/supabase/server";
import { redirect } from "next/navigation";
import { DashboardHeader } from "@/components/layout/DashboardShell";
import { Card } from "@/components/ui/Card";
import { TutorStatusBadge } from "@/components/ui/StatusBadge";
import { Avatar } from "@/components/ui/Avatar";
import { Badge } from "@/components/ui/Badge";
import { EmptyState } from "@/components/ui/EmptyState";
import { Users, ArrowRight } from "lucide-react";
import type { Metadata } from "next";
import type { TutorVerificationStatus } from "@/types/tutor";
import { cn } from "@/lib/utils";

export const metadata: Metadata = { title: "Manage Tutors" };

interface PageProps {
  searchParams: Promise<{ status?: string }>;
}

const filterOptions = [
  { label: "All",                value: ""                   },
  { label: "Pending",            value: "pending"             },
  { label: "Profile Submitted",  value: "profile_submitted"  },
  { label: "Under Review",       value: "under_review"       },
  { label: "Assessment Pending", value: "assessment_pending" },
  { label: "Interview Pending",  value: "interview_pending"  },
  { label: "Verified",           value: "verified"           },
  { label: "Rejected",           value: "rejected"           },
];

function extractOne<T>(raw: T | T[] | null | undefined): T | null {
  if (!raw) return null;
  if (Array.isArray(raw)) return raw[0] ?? null;
  return raw;
}

export default async function AdminTutorsPage({ searchParams }: PageProps) {
  const { status: filterStatus } = await searchParams;
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  let query = supabase
    .from("tutor_profiles")
    .select(
      "id, verification_status, subjects, years_of_experience, created_at, profiles(full_name, email, avatar_url, phone)"
    )
    .order("updated_at", { ascending: false });

  if (filterStatus) {
    query = query.eq("verification_status", filterStatus);
  }

  const { data: tutors } = await query;

  return (
    <div>
      <DashboardHeader
        title="Tutors"
        description="Review and verify tutor applications."
      />

      {/* Filter chips — horizontal scroll on mobile */}
      <div className="mb-5 flex gap-2 scroll-x-smooth pb-1">
        {filterOptions.map((opt) => (
          <Link
            key={opt.value}
            href={opt.value ? `/admin/tutors?status=${opt.value}` : "/admin/tutors"}
            className="flex-shrink-0"
          >
            <span className={cn(
              "inline-flex items-center rounded-full px-3 py-1.5 text-xs font-semibold transition-colors cursor-pointer",
              (filterStatus ?? "") === opt.value
                ? "bg-brand-900 text-white"
                : "bg-neutral-100 text-neutral-600 hover:bg-neutral-200"
            )}>
              {opt.label}
            </span>
          </Link>
        ))}
      </div>

      {!tutors || tutors.length === 0 ? (
        <Card>
          <EmptyState
            icon={<Users className="h-8 w-8" />}
            title="No tutors found"
            description="No tutors match the selected filter."
          />
        </Card>
      ) : (
        <Card padding="none">
          {/* ── Desktop / tablet table (md+) ── */}
          <div className="hidden md:block table-responsive">
            <table className="table-base">
              <thead>
                <tr>
                  <th>Tutor</th>
                  <th>Subjects</th>
                  <th>Experience</th>
                  <th>Status</th>
                  <th>Registered</th>
                  <th></th>
                </tr>
              </thead>
              <tbody>
                {tutors.map((tp) => {
                  const profile = extractOne(
                    tp.profiles as
                      | { full_name: string; email: string; avatar_url: string | null; phone: string | null }
                      | { full_name: string; email: string; avatar_url: string | null; phone: string | null }[]
                      | null
                  );
                  return (
                    <tr key={tp.id} className="hover:bg-neutral-50 transition-colors">
                      <td>
                        <div className="flex items-center gap-3">
                          <Avatar name={profile?.full_name ?? "T"} src={profile?.avatar_url} size="sm" />
                          <div>
                            <p className="font-semibold text-navy-900">{profile?.full_name ?? "—"}</p>
                            <p className="text-xs text-neutral-400">{profile?.email}</p>
                          </div>
                        </div>
                      </td>
                      <td>
                        <div className="flex flex-wrap gap-1">
                          {(tp.subjects as string[]).slice(0, 2).map((s) => (
                            <Badge key={s} variant="blue">{s}</Badge>
                          ))}
                          {(tp.subjects as string[]).length > 2 && (
                            <Badge variant="gray">+{(tp.subjects as string[]).length - 2}</Badge>
                          )}
                        </div>
                      </td>
                      <td className="text-neutral-600">{tp.years_of_experience ?? 0} yrs</td>
                      <td>
                        <TutorStatusBadge status={tp.verification_status as TutorVerificationStatus} />
                      </td>
                      <td className="text-neutral-500 text-xs">
                        {new Date(tp.created_at).toLocaleDateString("en-IN")}
                      </td>
                      <td>
                        <Link href={`/admin/tutors/${tp.id}`}
                          className="text-xs font-semibold text-brand-700 hover:text-brand-800">
                          Review →
                        </Link>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>

          {/* ── Mobile card list (< md) ── */}
          <ul className="md:hidden divide-y divide-neutral-50">
            {tutors.map((tp) => {
              const profile = extractOne(
                tp.profiles as
                  | { full_name: string; email: string; avatar_url: string | null; phone: string | null }
                  | { full_name: string; email: string; avatar_url: string | null; phone: string | null }[]
                  | null
              );
              return (
                <li key={tp.id}>
                  <Link
                    href={`/admin/tutors/${tp.id}`}
                    className="flex items-start gap-3 px-4 py-4 hover:bg-neutral-50 transition-colors"
                  >
                    <Avatar name={profile?.full_name ?? "T"} src={profile?.avatar_url} size="sm" />
                    <div className="min-w-0 flex-1">
                      <div className="flex flex-wrap items-center gap-2 mb-1">
                        <p className="text-sm font-semibold text-navy-900 truncate">
                          {profile?.full_name ?? "—"}
                        </p>
                        <TutorStatusBadge status={tp.verification_status as TutorVerificationStatus} />
                      </div>
                      <p className="text-xs text-neutral-400 truncate mb-1.5">{profile?.email}</p>
                      <div className="flex flex-wrap gap-1">
                        {(tp.subjects as string[]).slice(0, 3).map((s) => (
                          <Badge key={s} variant="blue">{s}</Badge>
                        ))}
                        {(tp.subjects as string[]).length > 3 && (
                          <Badge variant="gray">+{(tp.subjects as string[]).length - 3}</Badge>
                        )}
                      </div>
                    </div>
                    <ArrowRight className="h-4 w-4 flex-shrink-0 text-neutral-300 mt-1" />
                  </Link>
                </li>
              );
            })}
          </ul>
        </Card>
      )}
    </div>
  );
}
