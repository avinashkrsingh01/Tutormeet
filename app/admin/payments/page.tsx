import { redirect } from "next/navigation";
import Link from "next/link";
import type { Metadata } from "next";
import { createClient } from "@/lib/supabase/server";
import { requireAdminPermission } from "@/lib/admin-auth";
import { DashboardHeader } from "@/components/layout/DashboardShell";
import { Card } from "@/components/ui/Card";
import { Badge } from "@/components/ui/Badge";
import { EmptyState } from "@/components/ui/EmptyState";
import { AdminRecordPaymentPanel } from "@/components/admin/AdminRecordPaymentPanel";
import { IndianRupee, CreditCard, ArrowRight } from "lucide-react";
import { formatDate } from "@/lib/utils";
import { formatPaise } from "@/types/payment";
import { cn } from "@/lib/utils";

export const metadata: Metadata = { title: "Payments — Admin" };

interface PageProps {
  searchParams: Promise<{ status?: string }>;
}

const statusVariant: Record<string, "teal"|"yellow"|"red"|"gray"|"blue"|"orange"> = {
  paid:               "teal",
  pending:            "yellow",
  processing:         "blue",
  failed:             "red",
  refunded:           "gray",
  partially_refunded: "orange",
  cancelled:          "gray",
  disputed:           "red",
};

export default async function AdminPaymentsPage({ searchParams }: PageProps) {
  await requireAdminPermission("view_payments");

  const { status: filterStatus } = await searchParams;
  const supabase = await createClient();

  let query = supabase
    .from("payments")
    .select(
      // SECURITY: notes (admin-only) included here since this is admin view
      `id, transaction_id, amount_paise, platform_fee_paise, tutor_amount_paise,
       currency, payment_method, gateway, status, verified_by_webhook,
       description, notes, failure_reason, created_at,
       profiles!inner(full_name, email),
       tutor_profiles!inner(profiles!inner(full_name))`
    )
    .order("created_at", { ascending: false })
    .limit(50);

  if (filterStatus) {
    query = query.eq("status", filterStatus);
  }

  const { data: payments } = await query;

  // Stats
  const { data: stats } = await supabase
    .from("payments")
    .select("status, amount_paise")
    .in("status", ["paid","pending","failed","refunded"]);

  const totalPaid    = (stats ?? []).filter((p) => p.status === "paid")
    .reduce((s, p) => s + p.amount_paise, 0);
  const platformRevenue = totalPaid ? Math.round(totalPaid * 0.1) : 0; // approx 10%
  const pendingCount = (stats ?? []).filter((p) => p.status === "pending").length;

  // Active enrollments for manual payment recording
  const { data: enrollments } = await supabase
    .from("enrollments")
    .select("id, parent_id, tutor_id, agreed_fee_per_hour, profiles!inner(full_name)")
    .eq("status", "active")
    .limit(20);

  const filterOptions = [
    { label: "All",              value: "" },
    { label: "Paid",             value: "paid" },
    { label: "Pending",          value: "pending" },
    { label: "Failed",           value: "failed" },
    { label: "Disputed",         value: "disputed" },
    { label: "Refunded",         value: "refunded" },
  ];

  return (
    <div>
      <DashboardHeader
        title="Payments"
        description="Payment tracking and ledger."
      />

      {/* Summary stats */}
      <div className="mb-5 grid grid-cols-2 gap-3 sm:grid-cols-4">
        {[
          { label: "Total Collected",  value: formatPaise(totalPaid),       color: "bg-accent-50 text-accent-700 border-accent-200" },
          { label: "Platform Revenue", value: formatPaise(platformRevenue), color: "bg-brand-50  text-brand-700  border-brand-200"  },
          { label: "Pending",          value: pendingCount,                  color: "bg-amber-50  text-amber-700  border-amber-200"  },
          { label: "Transactions",     value: stats?.length ?? 0,            color: "bg-neutral-50 text-neutral-600 border-neutral-200" },
        ].map((s) => (
          <div key={s.label} className={cn("flex flex-col gap-1 rounded-2xl border p-4", s.color)}>
            <p className="text-xl font-extrabold" style={{ letterSpacing: "-0.03em" }}>{s.value}</p>
            <p className="text-xs font-semibold">{s.label}</p>
          </div>
        ))}
      </div>

      <div className="grid grid-cols-1 gap-5 lg:grid-cols-3">

        {/* Transactions list */}
        <div className="lg:col-span-2 space-y-5">
          {/* Filter chips — scrollable on mobile */}
          <div className="flex gap-2 scroll-x-smooth pb-1">
            {filterOptions.map((opt) => (
              <Link key={opt.value} href={opt.value ? `/admin/payments?status=${opt.value}` : "/admin/payments"}
                className="flex-shrink-0">
                <span className={`inline-flex cursor-pointer items-center rounded-full px-3 py-1.5 text-xs font-semibold transition-colors ${
                  (filterStatus ?? "") === opt.value
                    ? "bg-brand-900 text-white"
                    : "bg-neutral-100 text-neutral-600 hover:bg-neutral-200"
                }`}>
                  {opt.label}
                </span>
              </Link>
            ))}
          </div>

          {!payments || payments.length === 0 ? (
            <Card>
              <EmptyState
                icon={<CreditCard className="h-8 w-8" />}
                title="No payments"
                description="Payments will appear here once recorded."
              />
            </Card>
          ) : (
            <Card padding="none">
              {/* ── Desktop / tablet table (md+) ── */}
              <div className="hidden md:block table-responsive">
                <table className="table-base">
                  <thead>
                    <tr>
                      <th>Transaction</th>
                      <th>Parent → Tutor</th>
                      <th>Amount</th>
                      <th>Gateway</th>
                      <th>Status</th>
                      <th>Date</th>
                    </tr>
                  </thead>
                  <tbody>
                    {payments.map((p) => {
                      const parentRaw = p.profiles as unknown;
                      const parent    = (Array.isArray(parentRaw) ? parentRaw[0] : parentRaw) as
                        { full_name: string; email: string } | null;
                      const tpRaw     = p.tutor_profiles as unknown;
                      const tp        = (Array.isArray(tpRaw) ? tpRaw[0] : tpRaw) as {
                        profiles: { full_name: string } | { full_name: string }[];
                      } | null;
                      const tutorProfileRaw = tp?.profiles;
                      const tutorProfile    = tutorProfileRaw
                        ? (Array.isArray(tutorProfileRaw) ? tutorProfileRaw[0] : tutorProfileRaw) as
                          { full_name: string }
                        : null;
                      const variant = statusVariant[p.status] ?? "gray";
                      return (
                        <tr key={p.id}>
                          <td>
                            <span className="font-mono text-xs">{p.transaction_id}</span>
                            {p.notes && (
                              <p className="text-2xs text-neutral-400 mt-0.5 italic">{p.notes}</p>
                            )}
                          </td>
                          <td>
                            <p className="text-xs font-medium">{parent?.full_name ?? "—"}</p>
                            <p className="text-2xs text-neutral-400">→ {tutorProfile?.full_name ?? "—"}</p>
                          </td>
                          <td>
                            <p className="font-semibold text-navy-900">{formatPaise(p.amount_paise, p.currency)}</p>
                            <p className="text-2xs text-neutral-400">
                              Platform: {formatPaise(p.platform_fee_paise, p.currency)}
                            </p>
                          </td>
                          <td className="capitalize text-neutral-600 text-xs">
                            {p.gateway}
                            {p.verified_by_webhook && (
                              <span className="ml-1 text-accent-600">✓</span>
                            )}
                          </td>
                          <td><Badge variant={variant}>{p.status.replace("_", " ")}</Badge></td>
                          <td className="text-neutral-500 text-xs whitespace-nowrap">{formatDate(p.created_at)}</td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>

              {/* ── Mobile card list (< md) ── */}
              <ul className="md:hidden divide-y divide-neutral-50">
                {payments.map((p) => {
                  const parentRaw = p.profiles as unknown;
                  const parent    = (Array.isArray(parentRaw) ? parentRaw[0] : parentRaw) as
                    { full_name: string; email: string } | null;
                  const tpRaw     = p.tutor_profiles as unknown;
                  const tp        = (Array.isArray(tpRaw) ? tpRaw[0] : tpRaw) as {
                    profiles: { full_name: string } | { full_name: string }[];
                  } | null;
                  const tutorProfileRaw = tp?.profiles;
                  const tutorProfile    = tutorProfileRaw
                    ? (Array.isArray(tutorProfileRaw) ? tutorProfileRaw[0] : tutorProfileRaw) as
                      { full_name: string }
                    : null;
                  const variant = statusVariant[p.status] ?? "gray";
                  return (
                    <li key={p.id} className="px-4 py-4 space-y-2">
                      {/* Top row: amount + status */}
                      <div className="flex items-center justify-between gap-3">
                        <p className="text-base font-bold text-navy-900">
                          {formatPaise(p.amount_paise, p.currency)}
                        </p>
                        <Badge variant={variant}>{p.status.replace("_", " ")}</Badge>
                      </div>
                      {/* People */}
                      <p className="text-xs text-neutral-600">
                        <span className="font-medium">{parent?.full_name ?? "—"}</span>
                        <span className="text-neutral-400"> → </span>
                        <span className="font-medium">{tutorProfile?.full_name ?? "—"}</span>
                      </p>
                      {/* Meta row */}
                      <div className="flex flex-wrap items-center gap-x-3 gap-y-1 text-2xs text-neutral-400">
                        <span className="font-mono">{p.transaction_id}</span>
                        <span className="capitalize">{p.gateway}{p.verified_by_webhook ? " ✓" : ""}</span>
                        <span>Platform: {formatPaise(p.platform_fee_paise, p.currency)}</span>
                        <span>{formatDate(p.created_at)}</span>
                      </div>
                      {p.notes && (
                        <p className="text-xs text-neutral-400 italic">{p.notes}</p>
                      )}
                    </li>
                  );
                })}
              </ul>
            </Card>
          )}
        </div>

        {/* Sidebar: record manual payment */}
        <div className="space-y-5">
          <AdminRecordPaymentPanel
            enrollments={(enrollments ?? []) as Record<string, unknown>[]}
          />
        </div>
      </div>
    </div>
  );
}
