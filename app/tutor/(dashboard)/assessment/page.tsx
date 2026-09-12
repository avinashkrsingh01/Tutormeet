import { redirect } from "next/navigation";
import type { Metadata } from "next";
import { createClient } from "@/lib/supabase/server";
import { DashboardHeader } from "@/components/layout/DashboardShell";
import { Card } from "@/components/ui/Card";
import { Alert } from "@/components/ui/Alert";
import { EmptyState } from "@/components/ui/EmptyState";
import { ClipboardCheck, Clock, Info } from "lucide-react";
import { formatDate } from "@/lib/utils";
import { cn } from "@/lib/utils";
import type { TutorVerificationStatus } from "@/types/tutor";

export const metadata: Metadata = { title: "Knowledge Assessment" };

const statusConfig: Record<string, { label: string; badgeClass: string }> = {
  not_started: { label: "Not started",   badgeClass: "badge-gray"   },
  scheduled:   { label: "Scheduled",     badgeClass: "badge-navy"   },
  in_progress: { label: "In progress",   badgeClass: "badge-blue"   },
  completed:   { label: "Completed",     badgeClass: "badge-yellow" },
  passed:      { label: "Passed",        badgeClass: "badge-teal"   },
  failed:      { label: "Failed",        badgeClass: "badge-red"    },
};

export default async function AssessmentPage() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  const { data: tp } = await supabase
    .from("tutor_profiles")
    .select("id, subjects, verification_status")
    .eq("user_id", user.id)
    .single();

  if (!tp) redirect("/tutor/onboarding");

  const { data: assessments } = await supabase
    .from("tutor_assessments")
    .select("id, subject, status, score, max_score, scheduled_at, started_at, completed_at")
    .eq("tutor_id", tp.id)
    .order("subject", { ascending: true });

  const status           = tp.verification_status as TutorVerificationStatus;
  const isProfilePending = ["draft", "pending"].includes(status);
  const subjects         = (tp.subjects as string[]) ?? [];

  return (
    <div>
      <DashboardHeader
        title="Knowledge Assessment"
        description="Subject knowledge assessments are part of the TutorMeet verification process."
      />

      {isProfilePending && (
        <Alert
          variant="info"
          title="Complete your profile first"
          message="Submit your full application before assessments are scheduled."
          className="mb-6"
        />
      )}

      {/* How assessments work */}
      <Card padding="md" className="mb-6">
        <div className="flex items-start gap-3">
          <Info className="mt-0.5 h-5 w-5 flex-shrink-0 text-brand-700" />
          <div>
            <p className="text-sm font-bold text-navy-900">
              How assessments work
            </p>
            <ul className="mt-2 space-y-1.5 text-xs text-neutral-600">
              <li>• Assessments are scheduled by the TutorMeet team — you cannot self-schedule.</li>
              <li>• You will receive an email and WhatsApp notification with the date, time, and format.</li>
              <li>• Assessments are subject-specific and typically 20–30 minutes long.</li>
              <li>• Scores are displayed on your public profile once verified (e.g. Knowledge Score: 92%).</li>
              <li>• If you fail, our team will contact you to discuss next steps.</li>
            </ul>
          </div>
        </div>
      </Card>

      {subjects.length === 0 ? (
        <Card>
          <EmptyState
            icon={<ClipboardCheck className="h-8 w-8" />}
            title="No subjects added yet"
            description="Add subjects to your teaching profile to see your scheduled assessments."
          />
        </Card>
      ) : (
        <div className="space-y-3">
          <h2 className="text-sm font-bold text-navy-900">
            Your assessments
          </h2>
          {subjects.map((subject) => {
            const assessment = assessments?.find((a) => a.subject === subject);
            const aStatus    = assessment?.status ?? "not_started";
            const cfg        = statusConfig[aStatus] ?? statusConfig.not_started;

            return (
              <Card key={subject} padding="md">
                <div className="flex items-center justify-between gap-4">
                  <div className="flex items-center gap-3">
                    <div className="flex h-10 w-10 flex-shrink-0 items-center justify-center rounded-xl bg-brand-50 text-brand-700">
                      <ClipboardCheck className="h-5 w-5" />
                    </div>
                    <div>
                      <p className="text-sm font-bold text-navy-900">{subject}</p>
                      {assessment?.scheduled_at && aStatus === "scheduled" && (
                        <p className="mt-0.5 flex items-center gap-1 text-xs text-brand-700">
                          <Clock className="h-3.5 w-3.5" />
                          Scheduled: {formatDate(assessment.scheduled_at)}
                        </p>
                      )}
                      {assessment?.completed_at && (
                        <p className="mt-0.5 text-xs text-neutral-400">
                          Completed: {formatDate(assessment.completed_at)}
                        </p>
                      )}
                    </div>
                  </div>

                  <div className="flex items-center gap-3">
                    {assessment?.score !== null && assessment?.score !== undefined && (
                      <span className="text-base font-extrabold text-navy-900" style={{ letterSpacing: "-0.02em" }}>
                        {assessment.score}
                        <span className="text-xs font-normal text-neutral-400">/{assessment.max_score}</span>
                      </span>
                    )}
                    <span className={cn("badge", cfg.badgeClass)}>{cfg.label}</span>
                  </div>
                </div>

                {aStatus === "scheduled" && (
                  <p className="mt-3 rounded-lg bg-blue-50 px-4 py-2.5 text-xs text-blue-700">
                    Your assessment is scheduled. You&apos;ll receive a reminder 24 hours before.
                    Please ensure you&apos;re available at the scheduled time.
                  </p>
                )}
                {aStatus === "failed" && (
                  <p className="mt-3 rounded-lg bg-red-50 px-4 py-2.5 text-xs text-red-700">
                    You did not pass this assessment. Our team will contact you to discuss next steps and re-scheduling options.
                  </p>
                )}
                {aStatus === "not_started" && !isProfilePending && (
                  <p className="mt-3 text-xs text-neutral-400">
                    Assessment not yet scheduled. Our team will contact you once your documents are reviewed.
                  </p>
                )}
              </Card>
            );
          })}
        </div>
      )}
    </div>
  );
}
