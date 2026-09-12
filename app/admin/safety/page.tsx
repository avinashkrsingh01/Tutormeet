import { redirect } from "next/navigation";
import Link from "next/link";
import type { Metadata } from "next";
import { createClient } from "@/lib/supabase/server";
import { requireAdminPermission } from "@/lib/admin-auth";
import { DashboardHeader } from "@/components/layout/DashboardShell";
import { Card } from "@/components/ui/Card";
import { Badge } from "@/components/ui/Badge";
import { EmptyState } from "@/components/ui/EmptyState";
import { Avatar } from "@/components/ui/Avatar";
import { AdminSafetyActions } from "@/components/admin/AdminSafetyActions";
import { ShieldAlert, AlertTriangle, ArrowRight } from "lucide-react";
import { formatDate } from "@/lib/utils";
import { cn } from "@/lib/utils";

export const metadata: Metadata = { title: "Safety Reports — Admin" };

interface PageProps {
  searchParams: Promise<{ status?: string }>;
}

const statusVariant: Record<string, "red"|"yellow"|"blue"|"green"|"gray"> = {
  submitted:     "red",
  acknowledged:  "yellow",
  investigating: "blue",
  resolved:      "green",
  closed:        "gray",
};

const categoryLabels: Record<string, string> = {
  inappropriate_behaviour:   "Inappropriate Behaviour",
  unprofessional_conduct:    "Unprofessional Conduct",
  no_show:                   "No-Show",
  abusive_language:          "Abusive Language",
  privacy_concern:           "Privacy Concern",
  fraud_misrepresentation:   "Fraud / Misrepresentation",
  payment_dispute:           "Payment Dispute",
  abusive_language_parent:   "Abusive Language (Parent)",
  false_information:         "False Information",
  child_safety_concern:      "CHILD SAFETY CONCERN",
  harassment:                "Harassment",
  unsafe_environment:        "Unsafe Environment",
  other:                     "Other",
};

export default async function AdminSafetyPage({ searchParams }: PageProps) {
  await requireAdminPermission("view_support_tickets");

  const { status: filterStatus } = await searchParams;
  const supabase = await createClient();

  let query = supabase
    .from("safety_reports")
    .select(
      `id, target_type, category, description, is_urgent, status,
       admin_notes, resolved_at, created_at, updated_at,
       profiles!inner(full_name, avatar_url, email)`
    )
    .order("is_urgent", { ascending: false })
    .order("created_at", { ascending: true });

  if (filterStatus) {
    query = query.eq("status", filterStatus);
  } else {
    query = query.in("status", ["submitted","acknowledged","investigating"]);
  }

  const { data: reports } = await query;

  const { data: stats } = await supabase
    .from("safety_reports")
    .select("status, is_urgent")
    .in("status", ["submitted","acknowledged","investigating","resolved","closed"]);

  const urgentCount  = (stats ?? []).filter((r) => r.is_urgent && r.status !== "resolved" && r.status !== "closed").length;
  const openCount    = (stats ?? []).filter((r) => r.status === "submitted").length;
  const activeCount  = (stats ?? []).filter((r) => r.status === "investigating").length;

  const filterOptions = [
    { label: "Open",          value: "" },
    { label: "Submitted",     value: "submitted" },
    { label: "Acknowledged",  value: "acknowledged" },
    { label: "Investigating", value: "investigating" },
    { label: "Resolved",      value: "resolved" },
    { label: "Closed",        value: "closed" },
  ];

  return (
    <div>
      <DashboardHeader
        title="Safety Reports"
        description="Review and respond to safety reports and incidents."
      />

      {/* Urgent alert */}
      {urgentCount > 0 && (
        <div className="mb-5 flex items-start gap-3 rounded-2xl border border-red-300 bg-red-50 px-5 py-4">
          <AlertTriangle className="mt-0.5 h-5 w-5 flex-shrink-0 text-red-600" />
          <div>
            <p className="font-bold text-red-900">
              {urgentCount} urgent report{urgentCount !== 1 ? "s" : ""} require immediate attention
            </p>
            <p className="text-sm text-red-700">Child safety concerns must be reviewed immediately.</p>
          </div>
        </div>
      )}

      {/* Stats */}
      <div className="mb-5 grid grid-cols-3 gap-3">
        {[
          { label: "Urgent",      value: urgentCount, color: "bg-red-50 text-red-700 border-red-200" },
          { label: "Submitted",   value: openCount,   color: "bg-amber-50 text-amber-700 border-amber-200" },
          { label: "Investigating",value: activeCount, color: "bg-blue-50 text-blue-700 border-blue-200" },
        ].map((s) => (
          <div key={s.label} className={cn("rounded-2xl border p-4", s.color)}>
            <p className="text-2xl font-extrabold" style={{ letterSpacing: "-0.04em" }}>{s.value}</p>
            <p className="text-xs font-semibold">{s.label}</p>
          </div>
        ))}
      </div>

      {/* Filter tabs */}
      <div className="mb-5 flex flex-wrap gap-2">
        {filterOptions.map((opt) => (
          <Link key={opt.value} href={opt.value ? `/admin/safety?status=${opt.value}` : "/admin/safety"}>
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

      {!reports || reports.length === 0 ? (
        <Card>
          <EmptyState
            icon={<ShieldAlert className="h-8 w-8" />}
            title="No reports"
            description="No safety reports in this status."
          />
        </Card>
      ) : (
        <div className="space-y-3">
          {reports.map((report) => {
            const reporterRaw = report.profiles as unknown;
            const reporter    = (Array.isArray(reporterRaw) ? reporterRaw[0] : reporterRaw) as
              { full_name: string; avatar_url: string | null; email: string } | null;
            const variant     = statusVariant[report.status as string] ?? "gray";

            return (
              <Link key={report.id} href={`/admin/safety/${report.id}`}>
                <div className={cn(
                  "rounded-2xl border bg-white p-5 transition-all hover:shadow-sm",
                  report.is_urgent ? "border-red-300 bg-red-50/20" : "border-neutral-200"
                )}>
                  <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
                    <div className="flex items-start gap-3">
                      <Avatar name={reporter?.full_name ?? "U"} src={reporter?.avatar_url} size="sm" />
                      <div>
                        <div className="flex flex-wrap items-center gap-2">
                          <p className="text-sm font-semibold text-navy-900">
                            {reporter?.full_name ?? "User"}
                          </p>
                          <span className={cn(
                            "badge text-xs font-bold",
                            report.is_urgent ? "badge-red" : "badge-gray"
                          )}>
                            {report.is_urgent ? "⚠ URGENT" : report.target_type}
                          </span>
                        </div>
                        <p className="text-xs text-neutral-500">
                          {categoryLabels[report.category as string] ?? report.category}
                        </p>
                        <p className="mt-1 line-clamp-2 text-xs text-neutral-600 italic">
                          &ldquo;{report.description}&rdquo;
                        </p>
                      </div>
                    </div>
                    <div className="flex flex-shrink-0 flex-col items-end gap-2">
                      <Badge variant={variant}>{(report.status as string).replace("_", " ")}</Badge>
                      <p className="text-xs text-neutral-400">{formatDate(report.created_at)}</p>
                      <ArrowRight className="h-4 w-4 text-neutral-300" />
                    </div>
                  </div>
                </div>
              </Link>
            );
          })}
        </div>
      )}
    </div>
  );
}
