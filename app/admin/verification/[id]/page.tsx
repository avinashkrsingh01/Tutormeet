import { redirect, notFound } from "next/navigation";
import type { Metadata } from "next";
import { createClient } from "@/lib/supabase/server";
import { requireAdminPermission } from "@/lib/admin-auth";
import { DashboardHeader } from "@/components/layout/DashboardShell";
import { Card, CardHeader, CardTitle } from "@/components/ui/Card";
import { Avatar } from "@/components/ui/Avatar";
import { Badge } from "@/components/ui/Badge";
import { TutorStatusBadge } from "@/components/ui/StatusBadge";
import { VerificationActions } from "@/components/admin/VerificationActions";
import { VerificationHistory } from "@/components/admin/VerificationHistory";
import { FileText, GraduationCap, Briefcase, CheckCircle2, XCircle, Clock } from "lucide-react";
import { formatDate, formatINR } from "@/lib/utils";
import { DOCUMENT_TYPE_LABELS } from "@/lib/constants";
import type { TutorVerificationStatus, EducationQualification, TeachingExperience } from "@/types/tutor";

export const metadata: Metadata = { title: "Review Tutor Application" };

interface PageProps { params: Promise<{ id: string }> }

const docStatusIcon = {
  pending:  <Clock className="h-4 w-4 text-amber-500" />,
  approved: <CheckCircle2 className="h-4 w-4 text-accent-500" />,
  rejected: <XCircle className="h-4 w-4 text-red-500" />,
};

export default async function VerificationDetailPage({ params }: PageProps) {
  const { id } = await params;
  const admin = await requireAdminPermission("verify_tutors");
  const supabase = await createClient();

  const { data: tp } = await supabase
    .from("tutor_profiles")
    .select(`
      id, user_id, verification_status, gender, date_of_birth,
      locality, city, state,
      subjects, grades, boards, teaching_mode,
      expected_fee_per_hour, years_of_experience, bio,
      education, experience,
      knowledge_score, teaching_score,
      identity_verified, education_verified,
      admin_notes, verified_at, onboarding_complete,
      profiles!inner(full_name, email, phone, avatar_url, created_at)
    `)
    .eq("id", id)
    .single();

  if (!tp) notFound();

  // Documents — only if admin has permission
  const canViewDocs = ["super_admin","verification_admin"].includes(admin.admin_role);

  const { data: documents } = canViewDocs
    ? await supabase
        .from("tutor_documents")
        .select("id, document_type, file_name, file_url, status, admin_notes, uploaded_at, reviewed_at")
        .eq("tutor_id", id)
        .order("uploaded_at", { ascending: false })
    : { data: [] };

  const { data: assessments } = await supabase
    .from("tutor_assessments")
    .select("id, subject, status, score, max_score, scheduled_at, completed_at")
    .eq("tutor_id", id);

  const { data: interviews } = await supabase
    .from("tutor_interviews")
    .select("id, status, scheduled_at, completed_at, teaching_score, interview_type")
    .eq("tutor_id", id)
    .order("created_at", { ascending: false });

  // Verification history
  const { data: history } = await supabase
    .from("tutor_verifications")
    .select("id, from_status, to_status, reason, created_at, profiles!inner(full_name)")
    .eq("tutor_id", id)
    .order("created_at", { ascending: false });

  const profileRaw = tp.profiles as unknown;
  const profile    = (Array.isArray(profileRaw) ? profileRaw[0] : profileRaw) as {
    full_name: string; email: string; phone: string | null; avatar_url: string | null; created_at: string;
  };

  const education  = (tp.education  as EducationQualification[]) ?? [];
  const experience = (tp.experience as TeachingExperience[])       ?? [];

  return (
    <div>
      <DashboardHeader
        title="Review Application"
        description={`${profile.full_name} · Applied ${formatDate(profile.created_at)}`}
        action={<TutorStatusBadge status={tp.verification_status as TutorVerificationStatus} />}
      />

      <div className="grid grid-cols-1 gap-5 lg:grid-cols-3">

        {/* ── Main (2/3) ────────────────────────────────────────── */}
        <div className="space-y-5 lg:col-span-2">

          {/* Personal + teaching overview */}
          <Card>
            <CardHeader>
              <div className="flex items-center gap-4">
                <Avatar name={profile.full_name} src={profile.avatar_url} size="xl" />
                <div>
                  <h2 className="text-lg font-bold text-navy-900">{profile.full_name}</h2>
                  <p className="text-sm text-neutral-500">{profile.email}</p>
                  {profile.phone && (
                    <p className="text-sm text-neutral-500">{profile.phone}</p>
                  )}
                </div>
              </div>
            </CardHeader>

            <div className="grid grid-cols-2 gap-4 text-sm sm:grid-cols-3">
              {[
                { label: "Location",    value: [tp.locality, tp.city].filter(Boolean).join(", ") || "—" },
                { label: "State",       value: tp.state ?? "—" },
                { label: "Experience",  value: `${tp.years_of_experience ?? 0} years` },
                { label: "Mode",        value: tp.teaching_mode ?? "—" },
                { label: "Fee",         value: tp.expected_fee_per_hour ? formatINR(tp.expected_fee_per_hour) + "/hr" : "—" },
                { label: "Registered",  value: formatDate(profile.created_at) },
              ].map((item) => (
                <div key={item.label}>
                  <p className="label-sm">{item.label}</p>
                  <p className="mt-0.5 text-navy-900">{item.value}</p>
                </div>
              ))}
            </div>

            {tp.bio && (
              <div className="mt-4 rounded-xl bg-neutral-50 p-4">
                <p className="label-sm mb-1">Bio</p>
                <p className="text-sm text-neutral-600">{tp.bio}</p>
              </div>
            )}

            {/* Subjects */}
            <div className="mt-4 space-y-3">
              <div>
                <p className="label-sm mb-2">Subjects</p>
                <div className="flex flex-wrap gap-1.5">
                  {(tp.subjects as string[]).map((s) => <span key={s} className="tag-teal">{s}</span>)}
                </div>
              </div>
              <div>
                <p className="label-sm mb-2">Classes</p>
                <div className="flex flex-wrap gap-1.5">
                  {(tp.grades as string[]).map((g) => <span key={g} className="tag">{g}</span>)}
                </div>
              </div>
              <div>
                <p className="label-sm mb-2">Boards</p>
                <div className="flex flex-wrap gap-1.5">
                  {(tp.boards as string[]).map((b) => <span key={b} className="tag">{b}</span>)}
                </div>
              </div>
            </div>
          </Card>

          {/* Education */}
          {education.length > 0 && (
            <Card>
              <CardHeader><CardTitle>Education</CardTitle></CardHeader>
              <div className="space-y-3">
                {education.map((edu, i) => (
                  <div key={i} className="flex items-start gap-3 rounded-xl border border-neutral-200 bg-neutral-50 p-4">
                    <GraduationCap className="mt-0.5 h-5 w-5 flex-shrink-0 text-brand-700" />
                    <div>
                      <p className="font-semibold text-navy-900">{edu.degree}</p>
                      <p className="text-sm text-neutral-600">{edu.institution}</p>
                      <p className="text-xs text-neutral-400">
                        {edu.board_or_university} · {edu.year_of_passing}
                        {edu.percentage_or_grade && ` · ${edu.percentage_or_grade}`}
                      </p>
                      {edu.subject_specialisation && (
                        <p className="text-xs text-neutral-500">
                          Specialisation: {edu.subject_specialisation}
                        </p>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            </Card>
          )}

          {/* Experience */}
          {experience.length > 0 && (
            <Card>
              <CardHeader><CardTitle>Teaching Experience</CardTitle></CardHeader>
              <div className="space-y-3">
                {experience.map((exp, i) => (
                  <div key={i} className="flex items-start gap-3 rounded-xl border border-neutral-200 bg-neutral-50 p-4">
                    <Briefcase className="mt-0.5 h-5 w-5 flex-shrink-0 text-accent-700" />
                    <div className="flex-1">
                      <div className="flex items-start justify-between gap-2">
                        <div>
                          <p className="font-semibold text-navy-900">{exp.role}</p>
                          <p className="text-sm text-neutral-600">{exp.institution_name}</p>
                        </div>
                        <span className="text-xs text-neutral-400">
                          {exp.start_year}–{exp.is_current ? "Present" : (exp.end_year ?? "")}
                        </span>
                      </div>
                      <div className="mt-1.5 flex flex-wrap gap-1.5">
                        {(exp.subjects as string[]).map((s) => <span key={s} className="tag text-xs">{s}</span>)}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </Card>
          )}

          {/* Documents — only for authorized roles */}
          <Card>
            <CardHeader>
              <CardTitle>
                Verification Documents
                {!canViewDocs && (
                  <span className="ml-2 text-xs font-normal text-neutral-400">
                    (restricted — verification_admin or super_admin only)
                  </span>
                )}
              </CardTitle>
            </CardHeader>

            {!canViewDocs ? (
              <p className="text-sm text-neutral-500">
                You don&apos;t have permission to view verification documents.
              </p>
            ) : !documents || documents.length === 0 ? (
              <p className="text-sm text-neutral-400">No documents uploaded yet.</p>
            ) : (
              <div className="space-y-2">
                {documents.map((doc) => (
                  <div key={doc.id} className="flex items-center justify-between gap-3 rounded-xl border border-neutral-200 p-3.5">
                    <div className="flex items-center gap-3">
                      {docStatusIcon[doc.status as keyof typeof docStatusIcon]}
                      <div>
                        <p className="text-sm font-medium text-navy-900">
                          {DOCUMENT_TYPE_LABELS[doc.document_type] ?? doc.document_type}
                        </p>
                        <p className="text-xs text-neutral-400">
                          {doc.file_name} · {formatDate(doc.uploaded_at)}
                        </p>
                        {doc.admin_notes && (
                          <p className="text-xs text-red-600">{doc.admin_notes}</p>
                        )}
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      <span className={`badge ${
                        doc.status === "approved" ? "badge-teal"
                        : doc.status === "rejected" ? "badge-red"
                        : "badge-yellow"
                      }`}>
                        {doc.status}
                      </span>
                      {/* SECURITY: doc.file_url only accessible to authorized admins */}
                      <a
                        href={doc.file_url}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-xs font-semibold text-brand-700 hover:text-brand-800"
                      >
                        View
                      </a>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </Card>

          {/* Assessments */}
          {assessments && assessments.length > 0 && (
            <Card>
              <CardHeader><CardTitle>Knowledge Assessments</CardTitle></CardHeader>
              <div className="space-y-2">
                {assessments.map((a) => (
                  <div key={a.id} className="flex items-center justify-between rounded-xl border border-neutral-200 p-3.5">
                    <div>
                      <p className="font-semibold text-navy-900">{a.subject}</p>
                      {a.completed_at && <p className="text-xs text-neutral-400">{formatDate(a.completed_at)}</p>}
                      {a.scheduled_at && a.status === "scheduled" && (
                        <p className="text-xs text-brand-600">Scheduled: {formatDate(a.scheduled_at)}</p>
                      )}
                    </div>
                    <div className="flex items-center gap-3">
                      {a.score !== null && (
                        <span className="text-base font-bold text-navy-900">
                          {a.score}/{a.max_score}
                        </span>
                      )}
                      <span className={`badge ${
                        a.status === "passed" ? "badge-teal"
                        : a.status === "failed" ? "badge-red"
                        : a.status === "scheduled" ? "badge-navy"
                        : "badge-gray"
                      }`}>
                        {a.status.replace("_", " ")}
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            </Card>
          )}

          {/* Interview */}
          {interviews && interviews.length > 0 && (
            <Card>
              <CardHeader><CardTitle>Interview</CardTitle></CardHeader>
              {interviews.map((iv) => (
                <div key={iv.id} className="rounded-xl border border-neutral-200 p-4">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm font-semibold text-navy-900 capitalize">
                        {iv.interview_type ?? "Video"} Interview
                      </p>
                      {iv.scheduled_at && (
                        <p className="text-xs text-neutral-500">
                          {iv.status === "scheduled" ? "Scheduled: " : "Completed: "}
                          {formatDate(iv.scheduled_at)}
                        </p>
                      )}
                    </div>
                    <div className="flex items-center gap-3">
                      {iv.teaching_score !== null && (
                        <span className="text-base font-bold text-navy-900">
                          {iv.teaching_score}/100
                        </span>
                      )}
                      <span className={`badge ${
                        iv.status === "passed" ? "badge-teal"
                        : iv.status === "failed" ? "badge-red"
                        : iv.status === "scheduled" ? "badge-navy"
                        : "badge-gray"
                      }`}>
                        {iv.status.replace("_", " ")}
                      </span>
                    </div>
                  </div>
                </div>
              ))}
            </Card>
          )}

          {/* Verification history */}
          {history && history.length > 0 && (
            <VerificationHistory history={history} />
          )}
        </div>

        {/* ── Sidebar (1/3) ──────────────────────────────────────── */}
        <div className="space-y-5">

          {/* Verification flags */}
          <Card padding="md">
            <CardTitle className="mb-4">Document Verification</CardTitle>
            <div className="space-y-2.5">
              {[
                { label: "Identity verified",  value: tp.identity_verified  },
                { label: "Education verified", value: tp.education_verified },
              ].map((f) => (
                <div key={f.label} className={`flex items-center gap-3 rounded-xl p-3.5 ${
                  f.value ? "bg-accent-50" : "bg-neutral-50"
                }`}>
                  {f.value
                    ? <CheckCircle2 className="h-5 w-5 text-accent-600" />
                    : <Clock className="h-5 w-5 text-neutral-400" />}
                  <span className={`text-sm font-medium ${f.value ? "text-accent-800" : "text-neutral-600"}`}>
                    {f.label}
                  </span>
                </div>
              ))}
            </div>
          </Card>

          {/* Scores */}
          {(tp.knowledge_score !== null || tp.teaching_score !== null) && (
            <Card padding="md">
              <CardTitle className="mb-4">Scores</CardTitle>
              <div className="space-y-2">
                {tp.knowledge_score !== null && (
                  <div className="flex items-center justify-between rounded-xl bg-brand-50 px-4 py-3">
                    <span className="text-sm font-semibold text-brand-900">Knowledge</span>
                    <span className="text-xl font-extrabold text-brand-900">
                      {tp.knowledge_score}<span className="text-sm font-normal text-brand-400">/100</span>
                    </span>
                  </div>
                )}
                {tp.teaching_score !== null && (
                  <div className="flex items-center justify-between rounded-xl bg-accent-50 px-4 py-3">
                    <span className="text-sm font-semibold text-accent-900">Teaching</span>
                    <span className="text-xl font-extrabold text-accent-700">
                      {tp.teaching_score}<span className="text-sm font-normal text-accent-400">/100</span>
                    </span>
                  </div>
                )}
              </div>
            </Card>
          )}

          {/* Admin actions */}
          <VerificationActions
            tutorProfileId={id}
            currentStatus={tp.verification_status as TutorVerificationStatus}
            currentAdminNotes={tp.admin_notes ?? ""}
            identityVerified={tp.identity_verified}
            educationVerified={tp.education_verified}
            adminRole={admin.admin_role}
          />
        </div>
      </div>
    </div>
  );
}
