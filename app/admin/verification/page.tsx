import Link from "next/link";
import type { Metadata } from "next";
import { createClient } from "@/lib/supabase/server";
import { requireAdminPermission } from "@/lib/admin-auth";
import { DashboardHeader } from "@/components/layout/DashboardShell";
import { Card } from "@/components/ui/Card";
import { Avatar } from "@/components/ui/Avatar";
import { TutorStatusBadge } from "@/components/ui/StatusBadge";
import { EmptyState } from "@/components/ui/EmptyState";
import { BadgeCheck, ArrowRight, Clock } from "lucide-react";
import { formatDate } from "@/lib/utils";
import { cn } from "@/lib/utils";
import type { TutorVerificationStatus } from "@/types/tutor";

export const metadata: Metadata = { title: "Tutor Verification" };

interface PageProps {
  searchParams: Promise<{ status?: string }>;
}

const filterOptions = [
  { label: "All Pending",        value: ""                   },
  { label: "Newly Submitted",    value: "profile_submitted"  },
  { label: "Under Review",       value: "under_review"       },
  { label: "Assessment Pending", value: "assessment_pending" },
  { label: "Interview Pending",  value: "interview_pending"  },
  { label: "Verified",           value: "verified"           },
  { label: "Rejected",           value: "rejected"           },
];

export default async function VerificationPage({ searchParams }: PageProps) {
  await requireAdminPermission("verify_tutors");

  const { status: filterStatus } = await searchParams;
  const supabase = await createClient();

  let query = supabase
    .from("tutor_profiles")
    .select(
      `id, verification_status, subjects, grades, city, locality,
       years_of_experience, knowledge_score, teaching_score,
       identity_verified, education_verified, updated_at, created_at,
       profiles!inner(full_name, email, phone, avatar_url)`
    )
    .order("updated_at", { ascending: true });

  if (filterStatus) {
    query = query.eq("verification_status", filterStatus);
  } else {
    query = query.in("verification_status", [
      "profile_submitted", "under_review", "assessment_pending", "interview_pending",
    ]);
  }

  const { data: tutors } = await query;

  return (
    <div>
      <DashboardHeader
        title="Tutor Verification"
        description="Oldest applications shown first."
      />

      {/* Filter chips — scrollable row on mobile */}
      <div className="mb-5 flex gap-2 scroll-x-smooth pb-1">
        {filterOptions.map((opt) => (
          <Link
            key={opt.value}
            href={opt.value ? `/admin/verification?status=${opt.value}` : "/admin/verification"}
            className="flex-shrink-0"
          >
            <span className={cn(
              "inline-flex cursor-pointer items-center rounded-full px-3 py-1.5 text-xs font-semibold transition-colors",
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
            icon={<BadgeCheck className="h-8 w-8" />}
            title="All caught up"
            description="No tutors in this stage of verification."
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
                  <th>Location</th>
                  <th>Exp.</th>
                  <th>Docs</th>
                  <th>Status</th>
                  <th>Wait</th>
                  <th></th>
                </tr>
              </thead>
              <tbody>
                {tutors.map((tp) => {
                  const profileRaw = tp.profiles as unknown;
                  const profile = (Array.isArray(profileRaw) ? profileRaw[0] : profileRaw) as {
                    full_name: string; email: string; phone: string | null; avatar_url: string | null;
                  } | null;

                  const daysSince = Math.floor(
                    (Date.now() - new Date(tp.updated_at).getTime()) / 86400000
                  );
                  const urgent = daysSince >= 3;

                  return (
                    <tr key={tp.id} className={urgent ? "bg-amber-50/40" : undefined}>
                      <td>
                        <div className="flex items-center gap-3">
                          <Avatar name={profile?.full_name ?? "T"} src={profile?.avatar_url} size="sm" />
                          <div>
                            <p className="font-semibold text-navy-900">{profile?.full_name}</p>
                            <p className="text-xs text-neutral-400">{profile?.email}</p>
                          </div>
                        </div>
                      </td>
                      <td>
                        <div className="flex flex-wrap gap-1">
                          {(tp.subjects as string[]).slice(0, 2).map((s) => (
                            <span key={s} className="tag text-xs">{s}</span>
                          ))}
                          {(tp.subjects as string[]).length > 2 && (
                            <span className="tag text-xs text-neutral-400">
                              +{(tp.subjects as string[]).length - 2}
                            </span>
                          )}
                        </div>
                      </td>
                      <td className="text-neutral-600 text-xs">
                        {tp.locality ? `${tp.locality}, ` : ""}{tp.city ?? "—"}
                      </td>
                      <td className="text-neutral-600 text-xs">
                        {tp.years_of_experience ?? 0}yr{tp.years_of_experience !== 1 ? "s" : ""}
                      </td>
                      <td>
                        <div className="flex flex-col gap-1">
                          <span className={`badge ${tp.identity_verified ? "badge-teal" : "badge-gray"}`}>
                            {tp.identity_verified ? "ID ✓" : "ID —"}
                          </span>
                          <span className={`badge ${tp.education_verified ? "badge-teal" : "badge-gray"}`}>
                            {tp.education_verified ? "Edu ✓" : "Edu —"}
                          </span>
                        </div>
                      </td>
                      <td>
                        <TutorStatusBadge status={tp.verification_status as TutorVerificationStatus} />
                      </td>
                      <td>
                        <span className={cn(
                          "text-xs font-medium",
                          urgent ? "text-amber-600" : "text-neutral-400"
                        )}>
                          {daysSince === 0 ? "Today" : `${daysSince}d`}
                        </span>
                      </td>
                      <td>
                        <Link
                          href={`/admin/verification/${tp.id}`}
                          className="text-xs font-semibold text-brand-700 hover:text-brand-800 whitespace-nowrap"
                        >
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
              const profileRaw = tp.profiles as unknown;
              const profile = (Array.isArray(profileRaw) ? profileRaw[0] : profileRaw) as {
                full_name: string; email: string; avatar_url: string | null;
              } | null;

              const daysSince = Math.floor(
                (Date.now() - new Date(tp.updated_at).getTime()) / 86400000
              );
              const urgent = daysSince >= 3;

              return (
                <li key={tp.id}>
                  <Link
                    href={`/admin/verification/${tp.id}`}
                    className={cn(
                      "flex items-start gap-3 px-4 py-4 transition-colors hover:bg-neutral-50",
                      urgent && "bg-amber-50/30"
                    )}
                  >
                    <Avatar name={profile?.full_name ?? "T"} src={profile?.avatar_url} size="sm" />
                    <div className="min-w-0 flex-1">
                      <div className="flex flex-wrap items-center gap-2 mb-1">
                        <p className="text-sm font-semibold text-navy-900 truncate">
                          {profile?.full_name}
                        </p>
                        {urgent && (
                          <span className="badge-yellow text-2xs">
                            <Clock className="h-2.5 w-2.5" />
                            {daysSince}d waiting
                          </span>
                        )}
                      </div>
                      <p className="text-xs text-neutral-400 mb-1.5">{profile?.email}</p>
                      <div className="flex flex-wrap items-center gap-2">
                        <TutorStatusBadge status={tp.verification_status as TutorVerificationStatus} />
                        <span className={`badge ${tp.identity_verified ? "badge-teal" : "badge-gray"}`}>
                          {tp.identity_verified ? "ID ✓" : "ID —"}
                        </span>
                        <span className={`badge ${tp.education_verified ? "badge-teal" : "badge-gray"}`}>
                          {tp.education_verified ? "Edu ✓" : "Edu —"}
                        </span>
                      </div>
                      <p className="mt-1.5 text-xs text-neutral-400">
                        {tp.city}{tp.years_of_experience ? ` · ${tp.years_of_experience}yr exp` : ""}
                      </p>
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
