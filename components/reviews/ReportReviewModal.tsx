"use client";

import { useState, useTransition } from "react";
import { Flag, X } from "lucide-react";
import { Button } from "@/components/ui/Button";
import { Textarea } from "@/components/ui/Textarea";
import { Alert } from "@/components/ui/Alert";
import { Modal, ModalFooter } from "@/components/ui/Modal";
import { reportReviewAction } from "@/app/actions/review";

interface ReportReviewModalProps {
  reviewId:   string;
  onClose:    () => void;
}

export function ReportReviewModal({ reviewId, onClose }: ReportReviewModalProps) {
  const [reason,    setReason]    = useState("");
  const [error,     setError]     = useState<string | null>(null);
  const [submitted, setSubmitted] = useState(false);
  const [isPending, startTransition] = useTransition();

  function handleSubmit() {
    if (reason.trim().length < 10) {
      setError("Please explain the reason in at least 10 characters.");
      return;
    }
    setError(null);
    startTransition(async () => {
      const result = await reportReviewAction(reviewId, reason);
      if (!result.success) { setError(result.error ?? "Failed to report."); return; }
      setSubmitted(true);
    });
  }

  return (
    <Modal
      open
      onClose={onClose}
      title="Report Review"
      description="Tell us why you believe this review is inaccurate, misleading, or violates our guidelines."
      size="md"
    >
      {submitted ? (
        <div className="py-4 text-center">
          <p className="font-semibold text-navy-900">Report submitted</p>
          <p className="mt-1.5 text-sm text-neutral-500">
            Our team will review your report and take appropriate action within 2 business days.
          </p>
          <Button variant="ghost" size="sm" className="mt-4" onClick={onClose}>
            Close
          </Button>
        </div>
      ) : (
        <div className="space-y-4">
          {error && <Alert variant="error" message={error} />}

          <div className="rounded-xl border border-amber-200 bg-amber-50 px-4 py-3">
            <p className="text-xs text-amber-800">
              Only report reviews that are factually incorrect, contain personal information, or violate our guidelines.
              Reporting a negative-but-honest review is not grounds for removal.
            </p>
          </div>

          <Textarea
            label="Reason for report"
            required
            placeholder="e.g. This review contains my home address. / This review is from someone I never tutored."
            rows={4}
            value={reason}
            onChange={(e) => setReason(e.target.value)}
            showCount
            maxLength={500}
            hint="Minimum 10 characters"
          />

          <ModalFooter>
            <Button variant="ghost" size="sm" onClick={onClose} disabled={isPending}>
              Cancel
            </Button>
            <Button variant="danger" size="sm" loading={isPending} onClick={handleSubmit}
              iconLeft={<Flag className="h-4 w-4" />}>
              Submit Report
            </Button>
          </ModalFooter>
        </div>
      )}
    </Modal>
  );
}
