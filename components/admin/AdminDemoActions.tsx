"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { Calendar, Video, MapPin, Check, X, Ban } from "lucide-react";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import { Select } from "@/components/ui/Select";
import { Textarea } from "@/components/ui/Textarea";
import { Alert } from "@/components/ui/Alert";
import { Card, CardTitle } from "@/components/ui/Card";

interface AdminDemoActionsProps {
  demoId:          string;
  currentStatus:   string;
  currentAdminNotes: string;
  requirementId:   string;
  tutorProfileId:  string;
}

const VALID_TRANSITIONS: Record<string, string[]> = {
  requested:      ["tutor_accepted", "cancelled"],
  tutor_accepted: ["scheduled",      "cancelled"],
  scheduled:      ["completed",      "cancelled", "no_show"],
  completed:      [],
  cancelled:      [],
  no_show:        [],
};

const DELIVERY_OPTIONS = [
  { label: "Home Visit (tutor comes to parent)", value: "home_visit"       },
  { label: "Online (video call)",                value: "online"           },
  { label: "Tutor's Location",                   value: "tutor_location"   },
];

export function AdminDemoActions({
  demoId,
  currentStatus,
  currentAdminNotes,
}: AdminDemoActionsProps) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();

  const [scheduledAt,     setScheduledAt]     = useState("");
  const [deliveryMethod,  setDeliveryMethod]  = useState("home_visit");
  const [meetingLink,     setMeetingLink]      = useState("");
  const [adminNotes,      setAdminNotes]       = useState(currentAdminNotes);
  const [error,           setError]            = useState<string | null>(null);
  const [success,         setSuccess]          = useState<string | null>(null);

  const nextStates = VALID_TRANSITIONS[currentStatus] ?? [];
  const canSchedule = currentStatus === "tutor_accepted";

  async function handleTransition(newStatus: string) {
    setError(null); setSuccess(null);

    if (newStatus === "scheduled" && !scheduledAt) {
      setError("Please select a date and time before scheduling.");
      return;
    }

    startTransition(async () => {
      const res = await fetch(`/api/admin/demos/${demoId}`, {
        method:  "PATCH",
        headers: { "Content-Type": "application/json" },
        body:    JSON.stringify({
          status:          newStatus,
          scheduled_at:    newStatus === "scheduled" ? scheduledAt : undefined,
          delivery_method: newStatus === "scheduled" ? deliveryMethod : undefined,
          meeting_link:    deliveryMethod === "online" ? meetingLink : undefined,
          admin_notes:     adminNotes || undefined,
        }),
      });

      const json = await res.json();
      if (!res.ok) { setError(json.error ?? "Action failed."); return; }

      setSuccess(`Status updated to "${newStatus.replace("_", " ")}".`);
      router.refresh();
    });
  }

  async function saveNotes() {
    setError(null); setSuccess(null);
    startTransition(async () => {
      const res = await fetch(`/api/admin/demos/${demoId}`, {
        method:  "PATCH",
        headers: { "Content-Type": "application/json" },
        body:    JSON.stringify({ admin_notes: adminNotes }),
      });
      const json = await res.json();
      if (!res.ok) { setError(json.error ?? "Failed to save."); return; }
      setSuccess("Notes saved.");
      router.refresh();
    });
  }

  return (
    <Card padding="md">
      <CardTitle className="mb-5">Admin Actions</CardTitle>

      {error   && <Alert variant="error"   message={error}   className="mb-4" />}
      {success && <Alert variant="success" message={success} className="mb-4" />}

      {/* Schedule form — shown when ready to schedule */}
      {canSchedule && (
        <div className="mb-5 space-y-3 rounded-2xl border border-brand-200 bg-brand-50 p-4">
          <p className="text-xs font-bold text-brand-900 flex items-center gap-2">
            <Calendar className="h-4 w-4" /> Set schedule
          </p>
          <Input
            label="Date &amp; time"
            type="datetime-local"
            value={scheduledAt}
            onChange={(e) => setScheduledAt(e.target.value)}
          />
          <Select
            label="Delivery method"
            value={deliveryMethod}
            onChange={(e) => setDeliveryMethod(e.target.value)}
            options={DELIVERY_OPTIONS}
          />
          {deliveryMethod === "online" && (
            <Input
              label="Meeting link"
              type="url"
              placeholder="https://meet.google.com/..."
              value={meetingLink}
              onChange={(e) => setMeetingLink(e.target.value)}
            />
          )}
        </div>
      )}

      {/* Admin notes */}
      <div className="mb-4">
        <Textarea
          label="Admin notes (internal)"
          value={adminNotes}
          onChange={(e) => setAdminNotes(e.target.value)}
          placeholder="Notes for internal reference..."
          rows={2}
          hint="Not visible to parents or tutors"
        />
        <button
          type="button"
          onClick={saveNotes}
          disabled={isPending}
          className="mt-2 text-xs font-semibold text-brand-700 hover:text-brand-800 transition-colors"
        >
          Save notes
        </button>
      </div>

      <div className="divider mb-4" />

      {/* Status transition buttons */}
      <div className="space-y-2.5">
        {nextStates.includes("tutor_accepted") && (
          <Button variant="blue" size="md" fullWidth loading={isPending}
            onClick={() => handleTransition("tutor_accepted")}
            iconLeft={<Check className="h-4 w-4" />}>
            Mark Tutor Accepted
          </Button>
        )}
        {nextStates.includes("scheduled") && (
          <Button variant="teal" size="md" fullWidth loading={isPending}
            onClick={() => handleTransition("scheduled")}
            iconLeft={<Calendar className="h-4 w-4" />}>
            Confirm Schedule
          </Button>
        )}
        {nextStates.includes("completed") && (
          <Button variant="primary" size="md" fullWidth loading={isPending}
            onClick={() => handleTransition("completed")}
            iconLeft={<Check className="h-4 w-4" />}>
            Mark as Completed
          </Button>
        )}
        {nextStates.includes("no_show") && (
          <Button variant="ghost" size="md" fullWidth loading={isPending}
            onClick={() => handleTransition("no_show")}
            className="border border-amber-300 text-amber-700 hover:bg-amber-50"
            iconLeft={<X className="h-4 w-4" />}>
            Mark as No-Show
          </Button>
        )}
        {nextStates.includes("cancelled") && (
          <Button variant="danger" size="md" fullWidth loading={isPending}
            onClick={() => handleTransition("cancelled")}
            iconLeft={<Ban className="h-4 w-4" />}>
            Cancel Demo
          </Button>
        )}
      </div>

      {nextStates.length === 0 && (
        <p className="text-center text-xs text-neutral-400">
          No further actions available for this status.
        </p>
      )}
    </Card>
  );
}
