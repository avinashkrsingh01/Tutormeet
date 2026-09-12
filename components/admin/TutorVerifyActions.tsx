"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/Button";
import { Textarea } from "@/components/ui/Textarea";
import { Select } from "@/components/ui/Select";
import { Alert } from "@/components/ui/Alert";
import { Card, CardHeader, CardTitle } from "@/components/ui/Card";
import type { TutorVerificationStatus } from "@/types/tutor";

interface TutorVerifyActionsProps {
  tutorProfileId: string;
  currentStatus: TutorVerificationStatus;
  currentAdminNotes: string;
}

const statusOptions: { label: string; value: TutorVerificationStatus }[] = [
  { label: "Pending", value: "pending" },
  { label: "Profile Submitted", value: "profile_submitted" },
  { label: "Under Review", value: "under_review" },
  { label: "Assessment Pending", value: "assessment_pending" },
  { label: "Interview Pending", value: "interview_pending" },
  { label: "Verified", value: "verified" },
  { label: "Rejected", value: "rejected" },
  { label: "Suspended", value: "suspended" },
];

export function TutorVerifyActions({
  tutorProfileId,
  currentStatus,
  currentAdminNotes,
}: TutorVerifyActionsProps) {
  const router = useRouter();
  const [status, setStatus] = useState<TutorVerificationStatus>(currentStatus);
  const [notes, setNotes] = useState(currentAdminNotes);
  const [identityVerified, setIdentityVerified] = useState(false);
  const [educationVerified, setEducationVerified] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);
  const [isPending, startTransition] = useTransition();

  function handleSave() {
    setError(null);
    setSuccess(false);
    startTransition(async () => {
      const res = await fetch(`/api/admin/tutors/${tutorProfileId}/verify`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          verification_status: status,
          admin_notes: notes,
          identity_verified: identityVerified,
          education_verified: educationVerified,
        }),
      });
      const json = await res.json();
      if (!res.ok) {
        setError(json.error ?? "Failed to update. Please try again.");
        return;
      }
      setSuccess(true);
      router.refresh();
    });
  }

  return (
    <Card padding="md">
      <CardHeader>
        <CardTitle>Admin Actions</CardTitle>
      </CardHeader>

      {error && <Alert variant="error" message={error} className="mb-4" />}
      {success && (
        <Alert
          variant="success"
          message="Tutor status updated successfully."
          className="mb-4"
        />
      )}

      <div className="space-y-4">
        <Select
          label="Verification Status"
          value={status}
          options={statusOptions}
          onChange={(e) =>
            setStatus(e.target.value as TutorVerificationStatus)
          }
        />

        <div className="space-y-2">
          <label className="block text-sm font-medium text-slate-700">
            Document Verification
          </label>
          <div className="flex flex-col gap-2">
            <label className="flex items-center gap-2 text-sm">
              <input
                type="checkbox"
                className="h-4 w-4 rounded border-gray-300 text-brand-600 focus:ring-brand-500"
                checked={identityVerified}
                onChange={(e) => setIdentityVerified(e.target.checked)}
              />
              Identity verified
            </label>
            <label className="flex items-center gap-2 text-sm">
              <input
                type="checkbox"
                className="h-4 w-4 rounded border-gray-300 text-brand-600 focus:ring-brand-500"
                checked={educationVerified}
                onChange={(e) => setEducationVerified(e.target.checked)}
              />
              Education verified
            </label>
          </div>
        </div>

        <Textarea
          label="Admin notes"
          value={notes}
          onChange={(e) => setNotes(e.target.value)}
          placeholder="Internal notes or feedback for tutor..."
          rows={3}
          hint="Visible to the tutor on their status page"
        />

        <div className="flex flex-col gap-2">
          <Button
            fullWidth
            loading={isPending}
            onClick={handleSave}
          >
            Save Changes
          </Button>
          {status === "verified" && (
            <p className="text-center text-xs text-green-600">
              This will mark the tutor as fully verified.
            </p>
          )}
          {status === "rejected" && (
            <p className="text-center text-xs text-red-600">
              This will reject the tutor&apos;s application.
            </p>
          )}
        </div>
      </div>
    </Card>
  );
}
