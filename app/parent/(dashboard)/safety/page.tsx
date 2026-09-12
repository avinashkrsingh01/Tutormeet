import type { Metadata } from "next";
import Link from "next/link";
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { DashboardHeader } from "@/components/layout/DashboardShell";
import { Card } from "@/components/ui/Card";
import { SafetyReportForm } from "@/components/safety/SafetyReportForm";
import { ShieldAlert, Phone, ArrowRight } from "lucide-react";

export const metadata: Metadata = { title: "Safety & Reporting" };

interface PageProps {
  searchParams: Promise<{ report_tutor?: string; tutor_name?: string }>;
}

export default async function ParentSafetyPage({ searchParams }: PageProps) {
  const { report_tutor: tutorId, tutor_name: tutorName } = await searchParams;

  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  return (
    <div>
      <DashboardHeader
        title="Safety & Reporting"
        description="Report a concern, incident, or safeguarding issue."
      />

      {/* Emergency banner — always visible */}
      <div className="mb-6 flex items-start gap-3 rounded-2xl border border-red-200 bg-red-50 px-5 py-4">
        <Phone className="mt-0.5 h-5 w-5 flex-shrink-0 text-red-600" />
        <div>
          <p className="font-bold text-red-900">In an emergency</p>
          <p className="text-sm text-red-700">
            Contact emergency services immediately: <strong>112</strong>.
            For child safety concerns, also contact the{" "}
            <strong>CHILDLINE helpline: 1098</strong> (free, 24/7).
          </p>
        </div>
      </div>

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
        <div className="lg:col-span-2">
          <Card padding="lg">
            <SafetyReportForm
              targetType={tutorId ? "tutor" : undefined}
              targetUserId={tutorId}
              targetName={tutorName ? decodeURIComponent(tutorName) : undefined}
            />
          </Card>
        </div>

        <div className="space-y-4">
          <Card padding="md">
            <div className="flex items-start gap-3">
              <ShieldAlert className="mt-0.5 h-5 w-5 flex-shrink-0 text-brand-700" />
              <div>
                <p className="text-sm font-bold text-navy-900">What happens after I report?</p>
                <ul className="mt-2 space-y-1.5 text-xs text-neutral-500">
                  <li>• Our team reviews every report confidentially</li>
                  <li>• Urgent reports (child safety) are escalated immediately</li>
                  <li>• We may ask for more information</li>
                  <li>• Your identity is not disclosed to the reported person</li>
                  <li>• Action taken depends on our investigation findings</li>
                </ul>
              </div>
            </div>
          </Card>

          <div className="rounded-2xl border border-neutral-200 bg-neutral-50 p-4">
            <p className="text-xs font-semibold text-navy-900">Need to speak to someone?</p>
            <p className="mt-1 text-xs text-neutral-500">
              Our support team is available Mon–Sat, 9 AM–7 PM IST.
            </p>
            <Link href="/parent/support" className="mt-3 flex items-center gap-1 text-xs font-semibold text-brand-700 hover:text-brand-800">
              Contact Support <ArrowRight className="h-3.5 w-3.5" />
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}
