"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { IndianRupee, CheckCircle2 } from "lucide-react";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import { Select } from "@/components/ui/Select";
import { Textarea } from "@/components/ui/Textarea";
import { Alert } from "@/components/ui/Alert";
import { Card, CardTitle } from "@/components/ui/Card";
import { recordManualPaymentAction } from "@/app/actions/payment";
import { formatPaise } from "@/types/payment";

interface AdminRecordPaymentPanelProps {
  enrollments: Record<string, unknown>[];
}

export function AdminRecordPaymentPanel({ enrollments }: AdminRecordPaymentPanelProps) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();
  const [error,   setError]   = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  const [enrollmentId, setEnrollmentId] = useState("");
  const [amountStr,    setAmountStr]    = useState("");
  const [method,       setMethod]       = useState("cash");
  const [notes,        setNotes]        = useState("");

  const enrollmentOptions = enrollments.map((e) => {
    const profileRaw = e.profiles as unknown;
    const profile    = (Array.isArray(profileRaw) ? profileRaw[0] : profileRaw) as
      { full_name: string } | null;
    return {
      label: `${profile?.full_name ?? "Parent"} (${e.id as string})`,
      value: e.id as string,
    };
  });

  // Show agreed fee for selected enrollment
  const selectedEnrollment = enrollments.find((e) => e.id === enrollmentId);
  const agreedFee = selectedEnrollment?.agreed_fee_per_hour as number | null;

  function handleSubmit() {
    const amount = parseFloat(amountStr);
    if (!enrollmentId) { setError("Select an enrollment."); return; }
    if (!amountStr || isNaN(amount) || amount <= 0) { setError("Enter a valid amount."); return; }

    setError(null); setSuccess(null);
    startTransition(async () => {
      const result = await recordManualPaymentAction({
        enrollment_id:  enrollmentId,
        amount_rupees:  amount,
        payment_method: method as "cash" | "bank_transfer" | "upi" | "other",
        notes:          notes || undefined,
      });

      if (!result.success) { setError(result.error); return; }

      setSuccess(`Payment recorded: ${result.transaction_id}`);
      setEnrollmentId(""); setAmountStr(""); setNotes("");
      router.refresh();
    });
  }

  return (
    <Card padding="md">
      <CardTitle className="mb-5 flex items-center gap-2">
        <IndianRupee className="h-4 w-4 text-brand-700" />
        Record Manual Payment
      </CardTitle>

      {error   && <Alert variant="error"   message={error}   className="mb-4" />}
      {success && <Alert variant="success" message={success} className="mb-4" />}

      <div className="space-y-4">
        <Select
          label="Enrollment"
          required
          placeholder="Select enrollment"
          options={enrollmentOptions}
          value={enrollmentId}
          onChange={(e) => setEnrollmentId(e.target.value)}
        />

        {agreedFee && (
          <p className="text-xs text-neutral-500">
            Agreed fee: <strong className="text-navy-900">{formatPaise(agreedFee * 100)}/hr</strong>
          </p>
        )}

        <Input
          label="Amount (₹)"
          type="number"
          required
          min={1}
          placeholder="e.g. 2400"
          value={amountStr}
          onChange={(e) => setAmountStr(e.target.value)}
          hint="Gross amount paid by parent"
        />

        <Select
          label="Payment method"
          required
          options={[
            { label: "Cash",          value: "cash"          },
            { label: "UPI",           value: "upi"           },
            { label: "Bank Transfer", value: "bank_transfer" },
            { label: "Other",         value: "other"         },
          ]}
          value={method}
          onChange={(e) => setMethod(e.target.value)}
        />

        <Textarea
          label="Admin notes (optional)"
          placeholder="e.g. Payment received for Nov 1–15 sessions..."
          rows={2}
          value={notes}
          onChange={(e) => setNotes(e.target.value)}
        />

        <div className="rounded-xl border border-brand-100 bg-brand-50 px-4 py-3 text-xs text-brand-800">
          Platform fee (10%) will be calculated automatically from the amount.
        </div>

        <Button
          variant="primary"
          fullWidth
          loading={isPending}
          onClick={handleSubmit}
          iconLeft={<CheckCircle2 className="h-4 w-4" />}
        >
          Record Payment
        </Button>
      </div>
    </Card>
  );
}
