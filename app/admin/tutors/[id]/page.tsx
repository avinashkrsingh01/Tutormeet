import { redirect, notFound } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { DashboardHeader } from "@/components/layout/DashboardShell";
import { Card, CardHeader, CardTitle } from "@/components/ui/Card";
import { Avatar } from "@/components/ui/Avatar";
import { Badge } from "@/components/ui/Badge";
import { TutorStatusBadge } from "@/components/ui/StatusBadge";
import { TutorVerifyActions } from "@/components/admin/TutorVerifyActions";
import { FileText, CheckCircle2, XCircle, Clock } from "lucide-react";
import { formatDate, formatINR } from "@/lib/utils";
import type { Metadata } from "next";
import type { TutorVerificationStatus } from "@/types/tutor";

export const metadata: Metadata = { title: "Review Tutor" };

interface PageProps {
  params: Promise<{ id: string }>;
}

export default async function AdminTutorDetailPage({ params }: PageProps) {
  const { id } = await params;
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  const { data: tp } = await supabase
    .from("tutor_profiles")
    .select(
      `*, profiles!inner(full_name, email, phone, avatar_url, created_at)`
    )
    .eq("id", id)
    .single();

  if (!tp) notFound();

  const { data: documents } = await supabase
    .from("tutor_documents")
    .select("*")
    .eq("tutor_id", id)
    .order("uploaded_at", { ascending: false });

  const { data: assessments } = await supabase
    .from("tutor_assessments")
    .select("*")
    .eq("tutor_id", id);

  const profile = tp.profiles as {
    full_name: string;
    email: string;
    phone: string | null;
    avatar_url: string | null;
    created_at: string;
  };

  const docStatusIcon = {
    pending: <Clock className="h-4 w-4 text-yellow-500" />,
    approved: <CheckCircle2 className="h-4 w-4 text-green-500" />,
    rejected: <XCircle className="h-4 w-4 text-red-500" />,
  };

  return (
    <div>
      <DashboardHeader
        title="Review Tutor"
        description={`Application from ${profile.full_name}`}
        action={
          <TutorStatusBadge
            status={tp.verification_status as TutorVerificationStatus}
          />
        }
      />

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
        {/* Main content */}
        <div className="space-y-6 lg:col-span-2">
          {/* Teaching info */}
          <Card>
            <CardHeader>
              <CardTitle>Teaching Profile</CardTitle>
            </CardHeader>
            <div className="grid grid-cols-1 gap-5 sm:grid-cols-2">
              <div>
                <p className="text-xs font-medium uppercase tracking-wide text-gray-500">
                  Subjects
                </p>
                <div className="mt-1.5 flex flex-wrap gap-1">
                  {(tp.subjects as string[]).map((s: string) => (
                    <Badge key={s} variant="blue">{s}</Badge>
                  ))}
                </div>
              </div>
              <div>
                <p className="text-xs font-medium uppercase tracking-wide text-gray-500">
                  Grades
                </p>
                <div className="mt-1.5 flex flex-wrap gap-1">
                  {(tp.grades as string[]).map((g: string) => (
                    <Badge key={g} variant="gray">{g}</Badge>
                  ))}
                </div>
              </div>
              <div>
                <p className="text-xs font-medium uppercase tracking-wide text-gray-500">
                  Boards
                </p>
                <p className="mt-1 text-sm text-slate-700">
                  {(tp.boards as string[]).join(", ") || "—"}
                </p>
              </div>
              <div>
                <p className="text-xs font-medium uppercase tracking-wide text-gray-500">
                  Teaching Mode
                </p>
                <p className="mt-1 text-sm text-slate-700">
                  {tp.teaching_mode ?? "—"}
                </p>
              </div>
              <div>
                <p className="text-xs font-medium uppercase tracking-wide text-gray-500">
                  Experience
                </p>
                <p className="mt-1 text-sm text-slate-700">
                  {tp.years_of_experience ?? 0} years
                </p>
              </div>
              <div>
                <p className="text-xs font-medium uppercase tracking-wide text-gray-500">
                  Expected Fee
                </p>
                <p className="mt-1 text-sm text-slate-700">
                  {tp.expected_fee_per_hour
                    ? `${formatINR(tp.expected_fee_per_hour)}/hr`
                    : "—"}
                </p>
              </div>
            </div>
            {tp.bio && (
              <div className="mt-5 border-t border-gray-100 pt-5">
                <p className="text-xs font-medium uppercase tracking-wide text-gray-500">
                  Bio
                </p>
                <p className="mt-2 text-sm leading-relaxed text-slate-700">
                  {tp.bio}
                </p>
              </div>
            )}
          </Card>

          {/* Documents */}
          <Card>
            <CardHeader>
              <CardTitle>Uploaded Documents</CardTitle>
            </CardHeader>
            {!documents || documents.length === 0 ? (
              <p className="text-sm text-gray-400">No documents uploaded.</p>
            ) : (
              <ul className="divide-y divide-gray-100">
                {documents.map((doc) => (
                  <li
                    key={doc.id}
                    className="flex items-center justify-between py-3"
                  >
                    <div className="flex items-center gap-3">
                      <FileText className="h-5 w-5 text-gray-400" />
                      <div>
                        <p className="text-sm font-medium text-slate-900">
                          {doc.file_name}
                        </p>
                        <p className="text-xs text-gray-500">
                          {doc.document_type.replace(/_/g, " ")} ·{" "}
                          {formatDate(doc.uploaded_at)}
                        </p>
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      {docStatusIcon[doc.status as keyof typeof docStatusIcon]}
                      <a
                        href={doc.file_url}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-xs text-brand-600 hover:text-brand-700"
                      >
                        View
                      </a>
                    </div>
                  </li>
                ))}
              </ul>
            )}
          </Card>

          {/* Assessments */}
          {assessments && assessments.length > 0 && (
            <Card>
              <CardHeader>
                <CardTitle>Assessments</CardTitle>
              </CardHeader>
              <ul className="divide-y divide-gray-100">
                {assessments.map((a) => (
                  <li
                    key={a.id}
                    className="flex items-center justify-between py-3"
                  >
                    <div>
                      <p className="text-sm font-medium text-slate-900">
                        {a.subject}
                      </p>
                      {a.completed_at && (
                        <p className="text-xs text-gray-500">
                          {formatDate(a.completed_at)}
                        </p>
                      )}
                    </div>
                    <div className="flex items-center gap-3">
                      {a.score !== null && (
                        <span className="text-sm font-medium text-slate-700">
                          {a.score}/{a.max_score}
                        </span>
                      )}
                      <Badge
                        variant={
                          a.status === "passed"
                            ? "green"
                            : a.status === "failed"
                            ? "red"
                            : "gray"
                        }
                      >
                        {a.status}
                      </Badge>
                    </div>
                  </li>
                ))}
              </ul>
            </Card>
          )}
        </div>

        {/* Sidebar */}
        <div className="space-y-6">
          {/* Profile summary */}
          <Card padding="md">
            <div className="flex flex-col items-center gap-3 text-center">
              <Avatar
                name={profile.full_name}
                src={profile.avatar_url}
                size="lg"
              />
              <div>
                <p className="font-semibold text-slate-900">
                  {profile.full_name}
                </p>
                <p className="text-xs text-gray-500">{profile.email}</p>
                {profile.phone && (
                  <p className="text-xs text-gray-500">{profile.phone}</p>
                )}
                <p className="mt-2 text-xs text-gray-400">
                  Registered {formatDate(profile.created_at)}
                </p>
              </div>
            </div>
            <div className="mt-4 space-y-2 border-t border-gray-100 pt-4 text-xs text-gray-500">
              <div className="flex items-center justify-between">
                <span>Identity verified</span>
                <span>{tp.identity_verified ? "✓" : "—"}</span>
              </div>
              <div className="flex items-center justify-between">
                <span>Education verified</span>
                <span>{tp.education_verified ? "✓" : "—"}</span>
              </div>
            </div>
          </Card>

          {/* Admin actions */}
          <TutorVerifyActions
            tutorProfileId={id}
            currentStatus={tp.verification_status as TutorVerificationStatus}
            currentAdminNotes={tp.admin_notes ?? ""}
          />
        </div>
      </div>
    </div>
  );
}
