"use client";

import { useState, useRef, useTransition } from "react";
import { Upload, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/Button";
import { Alert } from "@/components/ui/Alert";
import { createClient as createSupabaseBrowserClient } from "@/lib/supabase/client";
import { STORAGE_BUCKETS } from "@/lib/constants";
import type { TutorDocument } from "@/types/tutor";

interface DocumentUploadProps {
  tutorId:      string;
  documentType: string;
  existingDoc:  TutorDocument | null;
}

const ALLOWED_TYPES = ["image/jpeg", "image/png", "application/pdf"];
const MAX_SIZE_MB   = 10;

export function DocumentUpload({
  tutorId,
  documentType,
  existingDoc,
}: DocumentUploadProps) {
  const [error, setError]             = useState<string | null>(null);
  const [success, setSuccess]         = useState(false);
  const [isPending, startTransition]  = useTransition();
  const inputRef                      = useRef<HTMLInputElement>(null);

  const isApproved = existingDoc?.status === "approved";

  async function handleFile(file: File) {
    setError(null); setSuccess(false);
    if (!ALLOWED_TYPES.includes(file.type)) {
      setError("Only JPG, PNG, and PDF files are allowed."); return;
    }
    if (file.size > MAX_SIZE_MB * 1024 * 1024) {
      setError(`File must be under ${MAX_SIZE_MB} MB.`); return;
    }

    startTransition(async () => {
      const supabase = createSupabaseBrowserClient();
      const filePath = `${tutorId}/${documentType}_${Date.now()}_${file.name}`;

      const { error: uploadErr } = await supabase.storage
        .from(STORAGE_BUCKETS.documents)
        .upload(filePath, file, { upsert: false });

      if (uploadErr) { setError("Upload failed. Please try again."); return; }

      const { data: urlData } = supabase.storage
        .from(STORAGE_BUCKETS.documents)
        .getPublicUrl(filePath);

      const res = await fetch("/api/tutor/documents", {
        method:  "POST",
        headers: { "Content-Type": "application/json" },
        body:    JSON.stringify({
          tutor_id:      tutorId,
          document_type: documentType,
          file_url:      urlData.publicUrl,
          file_name:     file.name,
        }),
      });

      if (!res.ok) { setError("Could not save document record. Please try again."); return; }
      setSuccess(true);
      if (inputRef.current) inputRef.current.value = "";
    });
  }

  return (
    <div className="space-y-2">
      {error   && <Alert variant="error"   message={error} />}
      {success && <Alert variant="success" message="Document uploaded — pending review." />}

      {!isApproved && (
        <>
          <input
            ref={inputRef}
            type="file"
            accept=".jpg,.jpeg,.png,.pdf"
            className="sr-only"
            aria-label={`Upload ${documentType} document`}
            onChange={(e) => { const f = e.target.files?.[0]; if (f) handleFile(f); }}
            disabled={isPending}
          />
          <Button
            type="button"
            variant="secondary"
            size="sm"
            fullWidth
            disabled={isPending}
            onClick={() => inputRef.current?.click()}
          >
            {isPending ? (
              <><Loader2 className="h-4 w-4 animate-spin" /> Uploading…</>
            ) : existingDoc ? (
              <><Upload className="h-4 w-4" /> Re-upload</>
            ) : (
              <><Upload className="h-4 w-4" /> Upload</>
            )}
          </Button>
          <p className="text-center text-xs text-neutral-400">
            JPG, PNG or PDF · Max {MAX_SIZE_MB} MB
          </p>
        </>
      )}
      {isApproved && (
        <p className="text-center text-xs text-accent-600 font-medium">
          ✓ Approved — no re-upload needed
        </p>
      )}
    </div>
  );
}
