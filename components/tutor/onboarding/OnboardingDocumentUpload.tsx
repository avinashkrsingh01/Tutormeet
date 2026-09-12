"use client";

import { useState, useRef, useTransition } from "react";
import { useRouter } from "next/navigation";
import {
  Upload,
  CheckCircle2,
  Clock,
  XCircle,
  FileText,
  Lock,
  ArrowRight,
  ArrowLeft,
} from "lucide-react";
import { Button } from "@/components/ui/Button";
import { Alert } from "@/components/ui/Alert";
import { LoadingSpinner } from "@/components/ui/LoadingSpinner";
import { createClient as createBrowserClient } from "@/lib/supabase/client";
import { REQUIRED_DOCUMENTS, STORAGE_BUCKETS } from "@/lib/constants";
import { advanceTutorToSubmissionAction } from "@/app/actions/tutor";
import { cn } from "@/lib/utils";
import type { TutorDocument } from "@/types/tutor";

// ─── Per-document upload widget ───────────────────────────────────────────────

function DocumentSlot({
  tutorProfileId,
  docType,
  label,
  hint,
  required,
  uploaded,
  onUploaded,
}: {
  tutorProfileId: string;
  docType:        string;
  label:          string;
  hint:           string;
  required:       boolean;
  uploaded:       TutorDocument | null;
  onUploaded:     () => void;
}) {
  const inputRef           = useRef<HTMLInputElement>(null);
  const [uploading, setUploading] = useState(false);
  const [error, setError]  = useState<string | null>(null);

  const ALLOWED = ["image/jpeg", "image/png", "application/pdf"];
  const MAX_MB  = 10;

  async function handleFile(file: File) {
    setError(null);
    if (!ALLOWED.includes(file.type)) {
      setError("Only JPG, PNG and PDF files are allowed.");
      return;
    }
    if (file.size > MAX_MB * 1024 * 1024) {
      setError(`File must be under ${MAX_MB} MB.`);
      return;
    }

    setUploading(true);
    try {
      const supabase = createBrowserClient();
      const filePath = `${tutorProfileId}/${docType}_${Date.now()}_${file.name}`;

      const { error: uploadErr } = await supabase.storage
        .from(STORAGE_BUCKETS.documents)
        .upload(filePath, file, { upsert: false });

      if (uploadErr) throw new Error("Upload failed. Please try again.");

      // Save record via API (never expose the URL client-side beyond this)
      const { data: urlData } = supabase.storage
        .from(STORAGE_BUCKETS.documents)
        .getPublicUrl(filePath);

      const res = await fetch("/api/tutor/documents", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          tutor_id:      tutorProfileId,
          document_type: docType,
          file_url:      urlData.publicUrl,
          file_name:     file.name,
        }),
      });

      if (!res.ok) throw new Error("Could not save document record.");
      onUploaded();
    } catch (e) {
      setError(e instanceof Error ? e.message : "Upload failed.");
    } finally {
      setUploading(false);
      if (inputRef.current) inputRef.current.value = "";
    }
  }

  const isApproved = uploaded?.status === "approved";

  const statusIcon = uploaded
    ? uploaded.status === "approved"
      ? <CheckCircle2 className="h-4 w-4 text-accent-600" />
      : uploaded.status === "rejected"
      ? <XCircle className="h-4 w-4 text-red-500" />
      : <Clock className="h-4 w-4 text-amber-500" />
    : null;

  const statusLabel = uploaded
    ? uploaded.status === "approved"  ? "Approved"
    : uploaded.status === "rejected"  ? "Rejected — re-upload required"
    :                                   "Uploaded — pending review"
    : null;

  return (
    <div className={cn(
      "rounded-2xl border p-4 transition-all",
      uploaded?.status === "approved"
        ? "border-accent-200 bg-accent-50"
        : uploaded?.status === "rejected"
        ? "border-red-200 bg-red-50"
        : uploaded
        ? "border-amber-200 bg-amber-50/40"
        : "border-neutral-200 bg-neutral-50"
    )}>
      <div className="flex items-start justify-between gap-3">
        <div className="flex items-start gap-3">
          <div className="flex h-10 w-10 flex-shrink-0 items-center justify-center rounded-xl bg-white shadow-xs border border-neutral-200 text-brand-700">
            <FileText className="h-5 w-5" />
          </div>
          <div>
            <div className="flex items-center gap-1.5">
              <p className="text-sm font-semibold text-navy-900">{label}</p>
              {required && (
                <span className="rounded-full bg-red-100 px-1.5 py-0.5 text-2xs font-semibold text-red-700">
                  Required
                </span>
              )}
              {!required && (
                <span className="rounded-full bg-neutral-100 px-1.5 py-0.5 text-2xs font-medium text-neutral-500">
                  Optional
                </span>
              )}
            </div>
            <p className="text-xs text-neutral-500">{hint}</p>
            {uploaded && (
              <div className="mt-1 flex items-center gap-1.5">
                {statusIcon}
                <span className="text-xs font-medium text-neutral-700">
                  {uploaded.file_name}
                </span>
                <span className="text-xs text-neutral-400">— {statusLabel}</span>
              </div>
            )}
            {uploaded?.admin_notes && (
              <p className="mt-1 rounded-lg bg-red-50 border border-red-200 px-2.5 py-1.5 text-xs text-red-700">
                Admin note: {uploaded.admin_notes}
              </p>
            )}
          </div>
        </div>

        {!isApproved && (
          <div className="flex-shrink-0">
            <input
              ref={inputRef}
              type="file"
              accept=".jpg,.jpeg,.png,.pdf"
              className="sr-only"
              aria-label={`Upload ${label} document`}
              onChange={(e) => {
                const f = e.target.files?.[0];
                if (f) handleFile(f);
              }}
              disabled={uploading}
            />
            <Button
              type="button"
              variant={uploaded ? "ghost" : "outline"}
              size="sm"
              disabled={uploading}
              onClick={() => inputRef.current?.click()}
            >
              {uploading ? (
                <><LoadingSpinner size="xs" /> Uploading…</>
              ) : uploaded ? (
                <><Upload className="h-3.5 w-3.5" /> Re-upload</>
              ) : (
                <><Upload className="h-3.5 w-3.5" /> Upload</>
              )}
            </Button>
          </div>
        )}
      </div>

      {error && (
        <p className="mt-2 text-xs font-medium text-red-600">{error}</p>
      )}
    </div>
  );
}

// ─── Main component ────────────────────────────────────────────────────────────

interface Props {
  tutorProfileId:    string;
  existingDocuments: TutorDocument[];
}

export function OnboardingDocumentUpload({ tutorProfileId, existingDocuments }: Props) {
  const router = useRouter();
  const [docs,   setDocs]   = useState<TutorDocument[]>(existingDocuments);
  const [error,  setError]  = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();

  function getUploaded(type: string): TutorDocument | null {
    return docs.filter((d) => d.document_type === type).at(-1) ?? null;
  }

  async function refresh() {
    // Re-fetch documents list from the server
    const res = await fetch(`/api/tutor/documents`);
    if (res.ok) {
      const json = await res.json();
      setDocs(json.data ?? []);
    }
  }

  const requiredTypes = REQUIRED_DOCUMENTS.filter((d) => d.required).map((d) => d.type);
  const allRequired   = requiredTypes.every((t) => !!getUploaded(t));

  function handleContinue() {
    setError(null);
    startTransition(async () => {
      const result = await advanceTutorToSubmissionAction();
      if (result?.error) setError(result.error);
    });
  }

  return (
    <div className="space-y-6">
      {/* Privacy notice */}
      <div className="flex items-start gap-3 rounded-2xl border border-brand-200 bg-brand-50 px-4 py-4">
        <Lock className="mt-0.5 h-5 w-5 flex-shrink-0 text-brand-700" />
        <div>
          <p className="text-sm font-semibold text-brand-900">
            Your documents are private
          </p>
          <p className="mt-0.5 text-xs leading-relaxed text-brand-700">
            Documents are stored securely and reviewed only by TutorMeet&apos;s
            verification team. They are never shown to parents, students, or
            any other users — ever.
          </p>
        </div>
      </div>

      {error && <Alert variant="error" message={error} />}

      {/* Document slots */}
      <div className="space-y-3">
        {REQUIRED_DOCUMENTS.map((req) => (
          <DocumentSlot
            key={req.type}
            tutorProfileId={tutorProfileId}
            docType={req.type}
            label={req.label}
            hint={req.hint}
            required={req.required}
            uploaded={getUploaded(req.type)}
            onUploaded={refresh}
          />
        ))}
      </div>

      {/* File format note */}
      <p className="text-center text-xs text-neutral-400">
        Accepted formats: JPG, PNG, PDF · Maximum file size: 10 MB per document
      </p>

      {/* Navigation */}
      <div className="flex justify-between border-t border-neutral-100 pt-5">
        <Button
          type="button"
          variant="ghost"
          size="md"
          onClick={() => router.push("/tutor/onboarding/preferences")}
          disabled={isPending}
          iconLeft={<ArrowLeft className="h-4 w-4" />}
        >
          Back
        </Button>

        <div className="flex flex-col items-end gap-1.5">
          <Button
            type="button"
            variant="primary"
            size="lg"
            loading={isPending}
            onClick={handleContinue}
          >
            Continue to Review
            <ArrowRight className="h-4 w-4" />
          </Button>
          {!allRequired && (
            <p className="text-xs text-amber-600">
              Upload all required documents to continue
            </p>
          )}
        </div>
      </div>
    </div>
  );
}
