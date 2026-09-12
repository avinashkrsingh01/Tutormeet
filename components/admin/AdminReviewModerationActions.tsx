"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { CheckCircle2, EyeOff, Search, Undo2 } from "lucide-react";
import { Button } from "@/components/ui/Button";
import { Textarea } from "@/components/ui/Textarea";
import { Alert } from "@/components/ui/Alert";
import { Card, CardTitle } from "@/components/ui/Card";
import type { AdminRole } from "@/types/admin";
import { hasPermission } from "@/types/admin";

interface AdminReviewModerationActionsProps {
  reviewId:          string;
  currentStatus:     string;
  currentAdminNotes: string;
  adminRole:         AdminRole;
}

const VALID_TRANSITIONS: Record<string, string[]> = {
  pending:       ["published", "hidden"],
  reported:      ["investigating", "published", "hidden"],
  investigating: ["published", "hidden", "pending"],
  published:     ["hidden"],
  hidden:        ["published"],
};

const ACTION_CONFIG: Record<string, {
  label:   string;
  variant: "teal" | "ghost" | "danger" | "outline" | "primary";
  icon:    React.ReactNode;
  confirm: string;
}> = {
  published:     { label: "Publish Review",       variant: "teal",    icon: <CheckCircle2 className="h-4 w-4" />,  confirm: "This will make the review visible on the tutor's public profile." },
  hidden:        { label: "Hide Review",           variant: "danger",  icon: <EyeOff className="h-4 w-4" />,       confirm: "This will hide the review from the public. The parent will not be notified." },
  investigating: { label: "Start Investigation",  variant: "outline", icon: <Search className="h-4 w-4" />,       confirm: "Mark this review for investigation." },
  pending:       { label: "Return to Pending",    variant: "ghost",   icon: <Undo2 className="h-4 w-4" />,        confirm: "Move this review back to the pending queue." },
};

export function AdminReviewModerationActions({
  reviewId,
  currentStatus,
  currentAdminNotes,
  adminRole,
}: AdminReviewModerationActionsProps) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();
  const [adminNotes, setAdminNotes]  = useState(currentAdminNotes);
  const [error,      setError]       = useState<string | null>(null);
  const [success,    setSuccess]     = useState<string | null>(null);

  const canModerate = hasPermission(adminRole, "moderate_reviews");
  const nextStates  = VALID_TRANSITIONS[currentStatus] ?? [];

  async function handleAction(newStatus: string) {
    setError(null); setSuccess(null);
    startTransition(async () => {
      const res = await fetch(`/api/admin/reviews/${reviewId}`, {
        method:  "PATCH",
        headers: { "Content-Type": "application/json" },
        body:    JSON.stringify({ status: newStatus, admin_notes: adminNotes }),
      });
      const json = await res.json();
      if (!res.ok) { setError(json.error ?? "Action failed."); return; }
      setSuccess(`Review ${newStatus === "published" ? "published" : newStatus}.`);
      router.refresh();
    });
  }

  async function saveNotes() {
    setError(null); setSuccess(null);
    startTransition(async () => {
      const res = await fetch(`/api/admin/reviews/${reviewId}`, {
        method:  "PATCH",
        headers: { "Content-Type": "application/json" },
        body:    JSON.stringify({ admin_notes: adminNotes }),
      });
      const json = await res.json();
      if (!res.ok) { setError(json.error ?? "Failed to save."); return; }
      setSuccess("Notes saved.");
    });
  }

  return (
    <Card padding="md">
      <CardTitle className="mb-5">Moderation</CardTitle>

      {error   && <Alert variant="error"   message={error}   className="mb-4" />}
      {success && <Alert variant="success" message={success} className="mb-4" />}

      {!canModerate ? (
        <p className="text-sm text-neutral-500">
          Your role doesn&apos;t have permission to moderate reviews.
        </p>
      ) : (
        <>
          {/* Admin notes (private) */}
          <div className="mb-4">
            <Textarea
              label="Admin notes (private)"
              value={adminNotes}
              onChange={(e) => setAdminNotes(e.target.value)}
              placeholder="Internal investigation notes, reasons for decision..."
              rows={3}
              hint="Never shown to parents or tutors"
            />
            <button
              type="button"
              onClick={saveNotes}
              disabled={isPending}
              className="mt-2 text-xs font-semibold text-brand-700 hover:text-brand-800"
            >
              Save notes
            </button>
          </div>

          <div className="divider mb-4" />

          {/* Action buttons */}
          <div className="space-y-2.5">
            {nextStates.map((state) => {
              const cfg = ACTION_CONFIG[state];
              if (!cfg) return null;
              return (
                <div key={state} className="space-y-1">
                  <Button
                    variant={cfg.variant}
                    size="md"
                    fullWidth
                    loading={isPending}
                    onClick={() => handleAction(state)}
                    iconLeft={cfg.icon}
                  >
                    {cfg.label}
                  </Button>
                  <p className="text-center text-2xs text-neutral-400">
                    {cfg.confirm}
                  </p>
                </div>
              );
            })}
          </div>

          {nextStates.length === 0 && (
            <p className="text-center text-xs text-neutral-400">
              No further actions available.
            </p>
          )}
        </>
      )}
    </Card>
  );
}
