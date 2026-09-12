import { redirect, notFound } from "next/navigation";
import type { Metadata } from "next";
import { createClient } from "@/lib/supabase/server";
import { requireAdminPermission } from "@/lib/admin-auth";
import { DashboardHeader } from "@/components/layout/DashboardShell";
import { Card, CardHeader, CardTitle } from "@/components/ui/Card";
import { Avatar } from "@/components/ui/Avatar";
import { Badge } from "@/components/ui/Badge";
import { AdminSafetyActions } from "@/components/admin/AdminSafetyActions";
import { formatDate } from "@/lib/utils";

export const metadata: Metadata = { title: "Safety Report — Admin" };
interface PageProps { params: Promise<{ id: string }> }

const statusVariant: Record<string, "red"|"yellow"|"blue"|"green"|"gray"> = {
  submitted: "red", acknowledged: "yellow", investigating: "blue",
  resolved: "green", closed: "gray",
};

export default async function AdminSafetyDetailPage({ params }: PageProps) {
  const { id } = await params;
  const admin   = await requireAdminPermission("view_support_tickets");
  const supabase = await createClient();

  const { data: report } = await supabase
    .from("safety_reports")
    .select(
      `id, target_type, category, description, is_urgent, status,
       admin_notes, resolved_at, resolution, created_at, updated_at,
       profiles!inner(full_name, email, avatar_url)`
    )
    .eq("id", id)
    .single();

  if (!report) notFound();

  const reporterRaw = report.profiles as unknown;
  const reporter    = (Array.isArray(reporterRaw) ? reporterRaw[0] : reporterRaw) as
    { full_name: string; email: string; avatar_url: string | null } | null;

  const variant = statusVariant[report.status as string] ?? "gray";

  return (
    <div>
      <DashboardHeader
        title="Safety Report"
        description={`Filed ${formatDate(report.created_at)}`}
        action={
          <div className="flex items-center gap-2">
            {report.is_urgent && <span className="badge-red font-bold">⚠ URGENT</span>}
            <Badge variant={variant}>{(report.status as string).replace("_", " ")}</Badge>
          </div>
        }
      />

      <div className="grid grid-cols-1 gap-5 lg:grid-cols-3">
        <div className="space-y-5 lg:col-span-2">

          <Card padding="md">
            <CardHeader><CardTitle>Report Details</CardTitle></CardHeader>
            <dl className="space-y-3 text-sm">
              {[
                { label: "Category",    value: report.category as string },
                { label: "Target type", value: report.target_type as string },
                { label: "Filed",       value: formatDate(report.created_at) },
              ].map((item) => (
                <div key={item.label} className="flex items-start justify-between gap-4 border-b border-neutral-100 pb-2 last:border-0">
                  <dt className="label-sm">{item.label}</dt>
                  <dd className="capitalize text-navy-900">{item.value.replace(/_/g, " ")}</dd>
                </div>
              ))}
            </dl>
          </Card>

          <Card padding="md">
            <CardHeader><CardTitle>Reporter&apos;s Account</CardTitle></CardHeader>
            <div className="flex items-center gap-3 mb-4">
              <Avatar name={reporter?.full_name ?? "U"} src={reporter?.avatar_url} size="sm" />
              <div>
                <p className="text-sm font-semibold text-navy-900">{reporter?.full_name}</p>
                <p className="text-xs text-neutral-400">{reporter?.email}</p>
              </div>
            </div>
            <div className="rounded-xl bg-neutral-50 p-4">
              <p className="text-sm leading-relaxed text-neutral-700">{report.description as string}</p>
            </div>
          </Card>

          {report.resolution && (
            <Card padding="md">
              <CardHeader><CardTitle>Resolution</CardTitle></CardHeader>
              <p className="text-sm text-neutral-700">{report.resolution as string}</p>
              {report.resolved_at && (
                <p className="mt-2 text-xs text-neutral-400">Resolved {formatDate(report.resolved_at as string)}</p>
              )}
            </Card>
          )}
        </div>

        <div>
          <AdminSafetyActions
            reportId={id}
            currentStatus={report.status as string}
            currentAdminNotes={report.admin_notes as string ?? ""}
            adminRole={admin.admin_role}
          />
        </div>
      </div>
    </div>
  );
}
