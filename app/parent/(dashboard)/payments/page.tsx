import { redirect } from "next/navigation";
import type { Metadata } from "next";
import {
  CreditCard, ShieldCheck, IndianRupee,
  CheckCircle2, Clock, AlertCircle, RefreshCcw,
} from "lucide-react";
import { createClient } from "@/lib/supabase/server";
import { DashboardHeader } from "@/components/layout/DashboardShell";
import { Card } from "@/components/ui/Card";
import { Badge } from "@/components/ui/Badge";
import { EmptyState } from "@/components/ui/EmptyState";
import { formatDate } from "@/lib/utils";
import { formatPaise } from "@/types/payment";
import { cn } from "@/lib/utils";

export const metadata: Metadata = { title: "Payments" };

const statusConfig: Record<string, {
  label:   string;
  icon:    React.ReactNode;
  variant: "teal"|"yellow"|"red"|"gray"|"blue"|"orange";
  bg:      string;
}> = {
  paid:               { label: "Paid",               icon: <CheckCircle2 className="h-4 w-4" />, variant: "teal",   bg: "bg-accent-50" },
  pending:            { label: "Pending",             icon: <Clock className="h-4 w-4" />,        variant: "yellow", bg: "bg-amber-50" },
  processing:         { label: "Processing",          icon: <RefreshCcw className="h-4 w-4" />,   variant: "blue",   bg: "bg-blue-50" },
  failed:             { label: "Failed",              icon: <AlertCircle className="h-4 w-4" />,  variant: "red",    bg: "bg-red-50" },
  refunded:           { label: "Refunded",            icon: <RefreshCcw className="h-4 w-4" />,   variant: "gray",   bg: "bg-neutral-50" },
  partially_refunded: { label: "Partially Refunded",  icon: <RefreshCcw className="h-4 w-4" />,   variant: "orange", bg: "bg-orange-50" },
  cancelled:          { label: "Cancelled",           icon: <AlertCircle className="h-4 w-4" />,  variant: "gray",   bg: "bg-neutral-50" },
  disputed:           { label: "Disputed",            icon: <AlertCircle className="h-4 w-4" />,  variant: "red",    bg: "bg-red-50" },
};

export default async function ParentPaymentsPage() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  const [{ data: payments }, { data: invoices }] = await Promise.all([
    supabase
      .from("payments")
      .select(
        // SECURITY: notes (admin-only) intentionally excluded
        "id, transaction_id, amount_paise, platform_fee_paise, tutor_amount_paise, currency, payment_method, status, description, created_at, updated_at"
      )
      .eq("parent_id", user.id)
      .order("created_at", { ascending: false }),

    supabase
      .from("invoices")
      .select(
        "id, invoice_number, amount_paise, currency, status, period_start, period_end, sessions_billed, issued_at, paid_at, due_date"
      )
      .eq("parent_id", user.id)
      .order("issued_at", { ascending: false }),
  ]);

  const totalPaid   = (payments ?? []).filter((p) => p.status === "paid")
    .reduce((sum, p) => sum + p.amount_paise, 0);
  const totalOwed   = (invoices ?? []).filter((i) => i.status === "issued")
    .reduce((sum, i) => sum + i.amount_paise, 0);

  const isPhase1 = !payments || payments.length === 0;

  return (
    <div>
      <DashboardHeader
        title="Payments"
        description="Your tuition payment history and pending invoices."
      />

      {/* Summary tiles */}
      {!isPhase1 && (
        <div className="mb-6 grid grid-cols-2 gap-3 sm:grid-cols-3">
          {[
            { label: "Total Paid",  value: formatPaise(totalPaid), color: "bg-accent-50 text-accent-700" },
            { label: "Amount Due",  value: formatPaise(totalOwed), color: totalOwed > 0 ? "bg-amber-50 text-amber-700" : "bg-neutral-50 text-neutral-500" },
            { label: "Transactions", value: payments?.length ?? 0,  color: "bg-brand-50 text-brand-700" },
          ].map((tile) => (
            <div key={tile.label} className={`flex flex-col gap-1 rounded-2xl border p-4 ${tile.color} border-current/20`}>
              <p className="text-xl font-extrabold" style={{ letterSpacing: "-0.03em" }}>{tile.value}</p>
              <p className="text-xs font-medium">{tile.label}</p>
            </div>
          ))}
        </div>
      )}

      {/* Phase 1 — manual payments explanation */}
      {isPhase1 && (
        <Card padding="lg" className="mb-6">
          <div className="flex flex-col items-center gap-4 py-4 text-center">
            <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-brand-50 text-brand-700">
              <CreditCard className="h-7 w-7" />
            </div>
            <div>
              <p className="font-bold text-navy-900">Online payments coming soon</p>
              <p className="mt-1.5 text-sm text-neutral-500 max-w-sm">
                Integrated payments via Razorpay are planned for the next release.
                For now, fees are paid directly to your tutor.
              </p>
            </div>
            <div className="w-full max-w-sm rounded-2xl border border-neutral-200 bg-neutral-50 p-5 text-left">
              <p className="mb-3 text-xs font-semibold uppercase tracking-wide text-neutral-400">
                How payments work now
              </p>
              <div className="space-y-3">
                {[
                  { icon: <IndianRupee className="h-4 w-4 text-accent-600" />,
                    text: "Agree a fee with your tutor during the demo class." },
                  { icon: <CheckCircle2 className="h-4 w-4 text-accent-600" />,
                    text: "Pay your tutor directly — cash, UPI, or bank transfer." },
                  { icon: <ShieldCheck className="h-4 w-4 text-accent-600" />,
                    text: "TutorMeet tracks your attendance records to confirm sessions." },
                ].map((item, i) => (
                  <div key={i} className="flex items-start gap-3 text-sm text-neutral-600">
                    <span className="mt-0.5 flex-shrink-0">{item.icon}</span>
                    {item.text}
                  </div>
                ))}
              </div>
            </div>
          </div>
        </Card>
      )}

      {/* Invoices */}
      {invoices && invoices.length > 0 && (
        <div className="mb-6">
          <h2 className="mb-3 text-sm font-bold text-navy-900">Invoices</h2>
          <div className="space-y-2">
            {invoices.map((inv) => (
              <div key={inv.id} className={cn(
                "flex flex-col gap-3 rounded-2xl border p-4 sm:flex-row sm:items-center sm:justify-between",
                inv.status === "issued" ? "border-amber-200 bg-amber-50/30" : "border-neutral-200 bg-white"
              )}>
                <div>
                  <div className="flex flex-wrap items-center gap-2">
                    <p className="text-sm font-bold text-navy-900">{inv.invoice_number}</p>
                    <span className={`badge ${
                      inv.status === "paid"    ? "badge-teal"
                      : inv.status === "issued" ? "badge-yellow"
                      : "badge-gray"
                    }`}>
                      {inv.status}
                    </span>
                  </div>
                  <p className="mt-0.5 text-xs text-neutral-500">
                    {inv.period_start} → {inv.period_end} · {inv.sessions_billed} session{inv.sessions_billed !== 1 ? "s" : ""}
                  </p>
                  {inv.due_date && inv.status === "issued" && (
                    <p className="text-xs text-amber-600">Due: {formatDate(inv.due_date)}</p>
                  )}
                </div>
                <p className="text-lg font-extrabold text-navy-900" style={{ letterSpacing: "-0.03em" }}>
                  {formatPaise(inv.amount_paise, inv.currency)}
                </p>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Payment transactions */}
      {payments && payments.length > 0 && (
        <div>
          <h2 className="mb-3 text-sm font-bold text-navy-900">Transaction History</h2>
          <Card padding="none">
            <div className="overflow-x-auto">
              <table className="table-base">
                <thead>
                  <tr>
                    <th>Transaction ID</th>
                    <th>Amount</th>
                    <th>Method</th>
                    <th>Status</th>
                    <th>Date</th>
                  </tr>
                </thead>
                <tbody>
                  {payments.map((p) => {
                    const cfg = statusConfig[p.status] ?? statusConfig.pending;
                    return (
                      <tr key={p.id}>
                        <td>
                          <span className="font-mono text-xs text-neutral-600">{p.transaction_id}</span>
                        </td>
                        <td className="font-semibold text-navy-900">
                          {formatPaise(p.amount_paise, p.currency)}
                        </td>
                        <td className="capitalize text-neutral-600">
                          {p.payment_method?.replace("_", " ") ?? "—"}
                        </td>
                        <td>
                          <span className={cn("flex items-center gap-1.5 text-xs font-semibold", cfg.bg, "rounded-full px-2.5 py-0.5 w-fit")}>
                            {cfg.icon}
                            {cfg.label}
                          </span>
                        </td>
                        <td className="text-neutral-500">{formatDate(p.created_at)}</td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </Card>
        </div>
      )}
    </div>
  );
}
