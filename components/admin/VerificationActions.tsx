"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import {
  CheckCircle2, XCircle, AlertCircle, PauseCircle, MessageSquare,
} from "lucide-react";
import { Button } from "@/components/ui/Button";
import { Textarea } from "@/components/ui/Textarea";
import { Alert } from "@/components/ui/Alert";
import { Card, CardTitle } from "@/components/ui/Card";
import { cn } from "@/lib/utils";
import type { TutorVerificationStatus } from "@/types/tutor";
import type { AdminRole } from "@/types/admin";
import { hasPermission } from "@/types/admin";

interface VerificationActionsProps {
  tutorProfileId:    string;
  currentStatus:     TutorVerificationStatus;
  currentAdminNotes: string;
  identityVerified:  boolean;
  educationVerified: boolean;
  adminRole:         AdminRole;
}

type ActionType = "approve" | "reject" | "info_request" | "suspend" | "save_notes";

const ACTION_LABELS: Record<ActionType, string> = {
  approve:      "Approve Tutor",
  reject:       "Reject Application",
  info_request: "Request More Info",
  suspend:      "Suspend Account",
  save_notes:   "Save Notes",
};

const STATUS_MAP: Record<ActionType, TutorVerificationStatus | null> = {
  approve:      "verified",
  reject:       "rejected",
  info_request: "documents_pending",
  suspend:      "suspended",
  save_notes:   null,
};

export function VerificationActions({
  tutorProfileId,
  currentStatus,
  currentAdminNotes,
  identityVerified,
  educationVerified,
  adminRole,
}: VerificationActionsProps) {
  const router = useRouter();
  const [notes,         setNotes]        = useState(currentAdminNotes);
  const [idVerified,    setIdVerified]   = useState(identityVerified);
  const [eduVerified,   setEduVerified]  = useState(educationVerified);
  const [actionError,   setActionError]  = useState<string | null>(null);
  const [actionSuccess, setActionSuccess] = useState<string | null>(null);
  const [pendingAction, setPendingAction] = useState<ActionType | null>(null);
  const [isPending,     startTransition] = useTransition();

  const canVerify  = hasPermission(adminRole, "verify_tutors");
  const canSuspend = hasPermission(adminRole, "suspend_tutors");

  async function handleAction(action: ActionType) {
    if (!notes.trim() && action !== "save_notes") {
      setActionError("Please add a note explaining this action.");
      return;
    }

    setActionError(null); setActionSuccess(null);
    setPendingAction(action);

    startTransition(async () => {
      const newStatus = STATUS_MAP[action];

      const res = await fetch(`/api/admin/tutors/${tutorProfileId}/verify`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          verification_status: newStatus ?? currentStatus,
          admin_notes:         notes,
          identity_verified:   idVerified,
          education_verified:  eduVerified,
          action_type:         action,
        }),
      });

      const json = await res.json();
      if (!res.ok) {
        setActionError(json.error ?? "Action failed. Please try again.");
      } else {
        setActionSuccess(`${ACTION_LABELS[action]} — saved successfully.`);
        router.refresh();
      }
      setPendingAction(null);
    });
  }

  return (
    <Card padding="md">
      <CardTitle className="mb-5">Admin Actions</CardTitle>

      {actionError   && <Alert variant="error"   message={actionError}   className="mb-4" />}
      {actionSuccess && <Alert variant="success" message={actionSuccess} className="mb-4" />}

      {/* Document verification toggles */}
      {canVerify && (
        <div className="mb-4 space-y-2">
          <p className="label-sm">Document verification</p>
          {[
            { id: "id_verified",  label: "Identity documents verified",  value: idVerified,  set: setIdVerified  },
            { id: "edu_verified", label: "Education documents verified", value: eduVerified, set: setEduVerified },
          ].map((item) => (
            <label key={item.id} className={cn(
              "flex cursor-pointer items-center gap-3 rounded-xl border p-3 transition-colors",
              item.value ? "border-accent-200 bg-accent-50" : "border-neutral-200 bg-white"
            )}>
              <input
                type="checkbox"
                checked={item.value}
                onChange={(e) => item.set(e.target.checked)}
                className="h-4 w-4 rounded border-neutral-300 text-accent-600"
              />
              <span className="text-sm font-medium text-navy-900">{item.label}</span>
            </label>
          ))}
        </div>
      )}

      {/* Notes */}
      <div className="mb-5">
        <Textarea
          label="Admin notes"
          value={notes}
          onChange={(e) => setNotes(e.target.value)}
          placeholder="Explain the action or provide feedback to the tutor..."
          rows={3}
          hint="Shown to tutor on their status page"
        />
      </div>

      {/* Save notes only */}
      <Button
        variant="ghost" size="sm" fullWidth
        loading={isPending && pendingAction === "save_notes"}
        onClick={() => handleAction("save_notes")}
        disabled={!canVerify || isPending}
        className="mb-4"
      >
        <MessageSquare className="h-4 w-4" /> Save Notes
      </Button>

      <div className="divider mb-4" />

      {/* Main action buttons */}
      <div className="space-y-2.5">
        {canVerify && (
          <>
            <Button
              variant="teal" size="md" fullWidth
              loading={isPending && pendingAction === "approve"}
              onClick={() => handleAction("approve")}
              disabled={isPending || currentStatus === "verified"}
              iconLeft={<CheckCircle2 className="h-4 w-4" />}
            >
              Approve Tutor
            </Button>

            <Button
              variant="ghost" size="md" fullWidth
              loading={isPending && pendingAction === "info_request"}
              onClick={() => handleAction("info_request")}
              disabled={isPending}
              iconLeft={<AlertCircle className="h-4 w-4" />}
              className="border border-amber-300 text-amber-700 hover:bg-amber-50"
            >
              Request More Information
            </Button>

            <Button
              variant="danger" size="md" fullWidth
              loading={isPending && pendingAction === "reject"}
              onClick={() => handleAction("reject")}
              disabled={isPending || currentStatus === "rejected"}
              iconLeft={<XCircle className="h-4 w-4" />}
            >
              Reject Application
            </Button>
          </>
        )}

        {canSuspend && currentStatus === "verified" && (
          <Button
            variant="danger" size="md" fullWidth
            loading={isPending && pendingAction === "suspend"}
            onClick={() => handleAction("suspend")}
            disabled={isPending}
            iconLeft={<PauseCircle className="h-4 w-4" />}
            className="bg-neutral-700 hover:bg-neutral-800"
          >
            Suspend Account
          </Button>
        )}
      </div>

      {/* Confirmation warnings */}
      {notes && (
        <div className="mt-4 space-y-1.5">
          <p className="text-2xs text-neutral-400">
            Notes will be saved and visible to the tutor. All actions are logged.
          </p>
        </div>
      )}
    </Card>
  );
}
