import { redirect } from "next/navigation";
import type { Metadata } from "next";
import {
  Lock,
  CheckCircle2,
  Clock,
  XCircle,
  FileText,
  AlertCircle,
} from "lucide-react";
import { createClient } from "@/lib/supabase/server";
import { DashboardHeader } from "@/components/layout/DashboardShell";
import { Card } from "@/components/ui/Card";
import { Alert } from "@/components/ui/Alert";
import { DocumentUpload } from "@/components/tutor/DocumentUpload";
import { formatDate } from "@/lib/utils";
import { cn } from "@/lib/utils";
import { REQUIRED_DOCUMENTS, DOCUMENT_TYPE_LABELS } from "@/lib/constants";
import type { TutorDocument } from "@/types/tutor";

export const metadata: Metadata = { title: "My Documents" };

export default async function TutorDocumentsPage() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  const { data: tp } = await supabase
    .from("tutor_profiles")
    .select("id, verification_status, identity_verified, education_verified")
    .eq("user_id", user.id)
    .single();

  if (!tp) redirect("/tutor/onboarding");

  const { data: documents } = await supabase
    .from("tutor_documents")
    .select("id, document_type, file_name, status, admin_notes, uploaded_at, reviewed_at")
    .eq("tutor_id", tp.id)
    .order("uploaded_at", { ascending: false });

  const docs = (documents as TutorDocument[]) ?? [];

  // Group by document type — latest upload per type
  const latestByType = new Map<string, TutorDocument>();
  docs.forEach((d) => {
    if (!latestByType.has(d.document_type)) {
      latestByType.set(d.document_type, d);
    }
  });

  const hasRejected = docs.some((d) => d.status === "rejected");

  return (
    <div>
      <DashboardHeader
        title="My Documents"
        description="Verification documents submitted to TutorMeet. These are private and never shown publicly."
      />

      {/* Privacy banner */}
      <div className="mb-6 flex items-start gap-3 rounded-2xl border border-brand-200 bg-brand-50 px-5 py-4">
        <Lock className="mt-0.5 h-5 w-5 flex-shrink-0 text-brand-700" />
        <div>
          <p className="text-sm font-semibold text-brand-900">
            Your documents are strictly private
          </p>
          <p className="mt-0.5 text-xs leading-relaxed text-brand-700">
            Documents are stored in a secure, private storage bucket. They are
            accessible only to TutorMeet&apos;s authorised verification staff.
            Parents, students, and other tutors can never access them.
          </p>
        </div>
      </div>

      {hasRejected && (
        <Alert
          variant="warning"
          title="Some documents require attention"
          message="One or more of your documents were rejected. Please re-upload the corrected documents."
          className="mb-6"
        />
      )}

      {/* Verification flags */}
      <div className="mb-6 grid grid-cols-1 gap-3 sm:grid-cols-2">
        {[
          { label: "Identity verified",  value: tp.identity_verified  },
          { label: "Education verified", value: tp.education_verified },
        ].map((flag) => (
          <div
            key={flag.label}
            className={cn(
              "flex items-center gap-3 rounded-xl p-4",
              flag.value ? "bg-accent-50 border border-accent-200" : "bg-neutral-50 border border-neutral-200"
            )}
          >
            {flag.value
              ? <CheckCircle2 className="h-5 w-5 text-accent-600" />
              : <Clock className="h-5 w-5 text-neutral-400" />}
            <span className={cn("text-sm font-semibold", flag.value ? "text-accent-800" : "text-neutral-600")}>
              {flag.label}
            </span>
            <span className={cn("ml-auto text-xs font-medium", flag.value ? "text-accent-600" : "text-neutral-400")}>
              {flag.value ? "Verified" : "Pending"}
            </span>
          </div>
        ))}
      </div>

      {/* Required document slots */}
      <div className="mb-8 space-y-3">
        <h2 className="text-sm font-bold text-navy-900">Required &amp; recommended documents</h2>
        {REQUIRED_DOCUMENTS.map((reqDoc) => {
          const uploaded = latestByType.get(reqDoc.type) ?? null;
          return (
            <Card key={reqDoc.type} padding="md">
              <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
                <div className="flex items-start gap-3 flex-1">
                  <div className={cn(
                    "flex h-10 w-10 flex-shrink-0 items-center justify-center rounded-xl border",
                    uploaded?.status === "approved"
                      ? "border-accent-200 bg-accent-50 text-accent-700"
                      : uploaded?.status === "rejected"
                      ? "border-red-200 bg-red-50 text-red-600"
                      : uploaded
                      ? "border-amber-200 bg-amber-50 text-amber-600"
                      : "border-neutral-200 bg-neutral-50 text-neutral-400"
                  )}>
                    {uploaded?.status === "approved"  ? <CheckCircle2 className="h-5 w-5" />
                    : uploaded?.status === "rejected"  ? <XCircle className="h-5 w-5" />
                    : uploaded                         ? <Clock className="h-5 w-5" />
                    :                                   <FileText className="h-5 w-5" />}
                  </div>
                  <div className="min-w-0 flex-1">
                    <div className="flex flex-wrap items-center gap-2">
                      <p className="text-sm font-semibold text-navy-900">{reqDoc.label}</p>
                      {reqDoc.required
                        ? <span className="badge-red">Required</span>
                        : <span className="badge-gray">Optional</span>}
                      {uploaded && (
                        <span className={cn("badge", {
                          "badge-teal":   uploaded.status === "approved",
                          "badge-red":    uploaded.status === "rejected",
                          "badge-yellow": uploaded.status === "pending",
                        })}>
                          {uploaded.status === "approved"  ? "Approved"
                           : uploaded.status === "rejected" ? "Rejected"
                           :                                  "Under review"}
                        </span>
                      )}
                    </div>
                    <p className="mt-0.5 text-xs text-neutral-500">{reqDoc.hint}</p>
                    {uploaded && (
                      <p className="mt-1 text-xs text-neutral-400">
                        {uploaded.file_name} · Uploaded {formatDate(uploaded.uploaded_at)}
                        {uploaded.reviewed_at && ` · Reviewed ${formatDate(uploaded.reviewed_at)}`}
                      </p>
                    )}
                    {uploaded?.admin_notes && (
                      <div className="mt-2 flex items-start gap-2 rounded-lg border border-red-200 bg-red-50 px-3 py-2">
                        <AlertCircle className="mt-0.5 h-3.5 w-3.5 flex-shrink-0 text-red-500" />
                        <p className="text-xs text-red-700">{uploaded.admin_notes}</p>
                      </div>
                    )}
                  </div>
                </div>

                {/* Upload control */}
                {tp.id && (
                  <div className="flex-shrink-0 sm:ml-2">
                    <DocumentUpload
                      tutorId={tp.id}
                      documentType={reqDoc.type}
                      existingDoc={uploaded}
                    />
                  </div>
                )}
              </div>
            </Card>
          );
        })}
      </div>

      {/* All uploaded documents history */}
      {docs.length > 0 && (
        <div>
          <h2 className="mb-3 text-sm font-bold text-navy-900">Upload history</h2>
          <Card padding="none">
            <div className="overflow-x-auto">
              <table className="table-base">
                <thead>
                  <tr>
                    <th>Document</th>
                    <th>File name</th>
                    <th>Uploaded</th>
                    <th>Status</th>
                  </tr>
                </thead>
                <tbody>
                  {docs.map((doc) => (
                    <tr key={doc.id}>
                      <td className="font-medium text-navy-900">
                        {DOCUMENT_TYPE_LABELS[doc.document_type] ?? doc.document_type}
                      </td>
                      <td className="text-neutral-600 text-xs">{doc.file_name}</td>
                      <td className="text-neutral-500">{formatDate(doc.uploaded_at)}</td>
                      <td>
                        <span className={cn("badge", {
                          "badge-teal":   doc.status === "approved",
                          "badge-red":    doc.status === "rejected",
                          "badge-yellow": doc.status === "pending",
                        })}>
                          {doc.status.charAt(0).toUpperCase() + doc.status.slice(1)}
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </Card>
        </div>
      )}
    </div>
  );
}
