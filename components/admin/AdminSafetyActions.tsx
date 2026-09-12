"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/Button";
import { Textarea } from "@/components/ui/Textarea";
import { Input } from "@/components/ui/Input";
import { Alert } from "@/components/ui/Alert";
import { Card, CardTitle } from "@/components/ui/Card";
import type { AdminRole } from "@/types/admin";
import { hasPermission } from "@/types/admin";
import { suspendUserAction } from "@/app/actions/safety";

const TRANSITIONS: Record<string, string[]> = {
  submitted:     ["acknowledged", "investigating", "resolved", "closed"],
  acknowledged:  ["investigating", "resolved", "closed"],
  investigating: ["resolved", "closed"],
  resolved:      [],
  closed:        [],
};

interface AdminSafetyActionsProps {
  reportId:          string;
  currentStatus:     string;
  currentAdminNotes: string;
  adminRole:         AdminRole;
}

export function AdminSafetyActions({
  reportId, currentStatus, currentAdminNotes, adminRole,
}: AdminSafetyActionsProps) {
  const router = useRouter();
  const [isPending,    startTransition]  = useTransition();
  const [adminNotes,   setAdminNotes]    = useState(currentAdminNotes);
  const [resolution,   setResolution]    = useState("");
  const [suspendUserId, setSuspendUserId] = useState("");
  const [suspendReason, setSuspendReason] = useState("");
  const [error,        setError]         = useState<string | null>(null);
  const [success,      setSuccess]       = useState<string | null>(null);

  const canManage = hasPermission(adminRole, "respond_support_tickets");
  const nextStates = TRANSITIONS[currentStatus] ?? [];

  async function updateStatus(newStatus: string) {
    setError(null); setSuccess(null);
    startTransition(async () => {
      const res = await fetch(`/api/admin/safety/${reportId}`, {
        method:  "PATCH",
        headers: { "Content-Type": "application/json" },
        body:    JSON.stringify({
          status:       newStatus,
          admin_notes:  adminNotes,
          resolution:   newStatus === "resolved" ? resolution : undefined,
        }),
      });
      const json = await res.json();
      if (!res.ok) { setError(json.error ?? "Failed."); return; }
      setSuccess(`Status updated to "${newStatus}".`);
      router.refresh();
    });
  }

  async function handleSuspend() {
    if (!suspendUserId.trim()) { setError("Enter a user ID to suspend."); return; }
    if (suspendReason.trim().length < 10) { setError("Enter a reason (min 10 chars)."); return; }
    setError(null); setSuccess(null);
    startTransition(async () => {
      const result = await suspendUserAction(suspendUserId.trim(), suspendReason.trim());
      if (!result.success) { setError(result.error); return; }
      setSuccess("User suspended.");
      router.refresh();
    });
  }

  return (
    <div className="space-y-4">
      <Card padding="md">
        <CardTitle className="mb-4">Actions</CardTitle>

        {error   && <Alert variant="error"   message={error}   className="mb-3" />}
        {success && <Alert variant="success" message={success} className="mb-3" />}

        {!canManage ? (
          <p className="text-sm text-neutral-500">Insufficient permissions.</p>
        ) : (
          <div className="space-y-4">
            <Textarea
              label="Admin notes (private)"
              value={adminNotes}
              onChange={(e) => setAdminNotes(e.target.value)}
              placeholder="Investigation findings, actions taken..."
              rows={3}
              hint="Never shown to the reporter"
            />

            {nextStates.includes("resolved") && (
              <Textarea
                label="Resolution note"
                value={resolution}
                onChange={(e) => setResolution(e.target.value)}
                placeholder="Summarise the outcome and actions taken..."
                rows={2}
              />
            )}

            <div className="divider" />

            <div className="space-y-2">
              {["acknowledged","investigating","resolved","closed"]
                .filter((s) => nextStates.includes(s))
                .map((s) => (
                  <Button key={s} variant={s === "resolved" ? "teal" : s === "closed" ? "ghost" : "outline"}
                    size="sm" fullWidth loading={isPending}
                    onClick={() => updateStatus(s)}>
                    Mark as {s.replace("_", " ")}
                  </Button>
                ))}
            </div>
          </div>
        )}
      </Card>

      {/* Suspend user */}
      {hasPermission(adminRole, "suspend_tutors") && (
        <Card padding="md">
          <CardTitle className="mb-4">Suspend User</CardTitle>
          <div className="space-y-3">
            <Input
              label="User ID to suspend"
              placeholder="UUID"
              value={suspendUserId}
              onChange={(e) => setSuspendUserId(e.target.value)}
              hint="Paste the user's profile UUID"
            />
            <Textarea
              label="Reason"
              value={suspendReason}
              onChange={(e) => setSuspendReason(e.target.value)}
              placeholder="Reason for suspension..."
              rows={2}
            />
            <Button variant="danger" size="sm" fullWidth loading={isPending} onClick={handleSuspend}>
              Suspend Account
            </Button>
          </div>
        </Card>
      )}
    </div>
  );
}
