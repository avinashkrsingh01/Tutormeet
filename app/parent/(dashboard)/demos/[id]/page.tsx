import { redirect, notFound } from "next/navigation";
import Link from "next/link";
import type { Metadata } from "next";
import {
  ArrowLeft, Clock, MapPin, Video, ExternalLink,
  CheckCircle2, ShieldCheck,
} from "lucide-react";
import { createClient } from "@/lib/supabase/server";
import { Card } from "@/components/ui/Card";
import { Avatar } from "@/components/ui/Avatar";
import { VerifiedBadge } from "@/components/ui/Badge";
import { DemoStatusBadge } from "@/components/ui/StatusBadge";
import { DemoFeedbackForm } from "@/components/demo/DemoFeedbackForm";
import { formatDate, formatINR } from "@/lib/utils";

export const metadata: Metadata = { title: "Demo Class" };

interface PageProps { params: Promise<{ id: string }> }

export default async function ParentDemoDetailPage({ params }: PageProps) {
  const { id } = await params;
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  const { data: demo } = await supabase
    .from("demo_classes")
    .select(`
      id, status, scheduled_at, duration_minutes,
      meeting_link, delivery_method,
      parent_rating, parent_feedback, wants_to_continue,
      was_tutor_punctual, was_explanation_clear,
      student_name, created_at,
      tutor_profiles!inner(
        id, user_id, expected_fee_per_hour,
        subjects, grades, bio,
        profiles!inner(full_name, avatar_url)
      ),
      tuition_requirements!inner(grade, subjects, student_name, sessions_per_week)
    `)
    .eq("id", id)
    .eq("parent_id", user.id)
    .single();

  // SECURITY: venue_address is NOT fetched here — privacy protection
  // It would only be included after admin confirms a home visit demo

  if (!demo) notFound();

  const tpRaw    = demo.tutor_profiles as unknown;
  const tp       = (Array.isArray(tpRaw) ? tpRaw[0] : tpRaw) as {
    id:                    string;
    user_id:               string;
    expected_fee_per_hour: number | null;
    subjects:              string[];
    grades:                string[];
    bio:                   string | null;
    profiles: { full_name: string; avatar_url: string | null } |
              { full_name: string; avatar_url: string | null }[];
  };
  const profileRaw = tp.profiles;
  const profile    = (Array.isArray(profileRaw) ? profileRaw[0] : profileRaw) as
    { full_name: string; avatar_url: string | null };

  const reqRaw = demo.tuition_requirements as unknown;
  const req    = (Array.isArray(reqRaw) ? reqRaw[0] : reqRaw) as {
    grade: string; subjects: string[]; student_name: string | null; sessions_per_week: number;
  } | null;

  const needsFeedback = demo.status === "completed" && demo.parent_rating === null;
  const hasFeedback   = demo.status === "completed" && demo.parent_rating !== null;

  const statusLabels: Record<string, string> = {
    requested:      "Request submitted — TutorMeet will confirm the schedule within 24 hours.",
    tutor_accepted: "Tutor confirmed! TutorMeet is finalising the schedule.",
    scheduled:      "Your demo class is confirmed.",
    completed:      hasFeedback ? "Demo completed." : "Your demo class has been completed. Please share your feedback.",
    cancelled:      "This demo class was cancelled.",
    no_show:        "The session was marked as no-show.",
  };

  return (
    <div className="mx-auto max-w-2xl">
      <div className="mb-5">
        <Link href="/parent/demos"
          className="flex items-center gap-1.5 text-sm text-neutral-500 hover:text-navy-900 transition-colors">
          <ArrowLeft className="h-4 w-4" /> Back to demos
        </Link>
      </div>

      {/* ── Status header ─────────────────────────────────────────── */}
      <div className="mb-5 overflow-hidden rounded-2xl border border-neutral-200 bg-white shadow-xs">
        <div className="h-1 w-full bg-gradient-to-r from-brand-900 via-brand-700 to-accent-500" />
        <div className="p-5">
          <div className="flex items-start justify-between gap-4">
            <div className="flex items-start gap-4">
              <Avatar name={profile.full_name} src={profile.avatar_url} size="lg" verified />
              <div>
                <div className="flex flex-wrap items-center gap-2">
                  <p className="font-bold text-navy-900">{profile.full_name}</p>
                  <VerifiedBadge />
                </div>
                <p className="mt-0.5 text-xs text-neutral-500">
                  {tp.subjects.slice(0, 2).join(", ")}
                  {tp.expected_fee_per_hour && ` · ${formatINR(tp.expected_fee_per_hour)}/hr`}
                </p>
              </div>
            </div>
            <DemoStatusBadge status={demo.status as "scheduled" | "completed" | "cancelled" | "no_show"} />
          </div>

          <div className="mt-4 rounded-xl border border-neutral-100 bg-neutral-50 px-4 py-3">
            <p className="text-sm text-neutral-700">{statusLabels[demo.status] ?? demo.status}</p>
          </div>
        </div>
      </div>

      {/* ── Session details ───────────────────────────────────────── */}
      <Card padding="md" className="mb-5">
        <h3 className="mb-4 text-sm font-bold text-navy-900">Session Details</h3>
        <div className="space-y-3 text-sm">
          {demo.scheduled_at && (
            <div className="flex items-center gap-2.5 text-neutral-700">
              <Clock className="h-4 w-4 flex-shrink-0 text-neutral-400" />
              <span>{formatDate(demo.scheduled_at)} · {demo.duration_minutes} min</span>
            </div>
          )}
          {demo.delivery_method && (
            <div className="flex items-center gap-2.5 text-neutral-700">
              {demo.delivery_method === "online"
                ? <Video className="h-4 w-4 text-neutral-400" />
                : <MapPin className="h-4 w-4 text-neutral-400" />}
              <span className="capitalize">{demo.delivery_method.replace("_", " ")}</span>
            </div>
          )}
          {demo.meeting_link && demo.status === "scheduled" && (
            <a href={demo.meeting_link} target="_blank" rel="noopener noreferrer"
              className="flex items-center gap-2 text-brand-700 font-medium hover:text-brand-800">
              <ExternalLink className="h-4 w-4" /> Join online session
            </a>
          )}
          {req && (
            <div className="mt-3 border-t border-neutral-100 pt-3">
              <p className="text-xs text-neutral-500">
                For:{" "}
                <span className="font-medium text-navy-800">
                  {req.student_name ?? demo.student_name ?? "Student"} · {req.grade} — {req.subjects.join(", ")}
                </span>
              </p>
            </div>
          )}
        </div>
      </Card>

      {/* Privacy notice for confirmed demos */}
      {demo.status === "scheduled" && (
        <div className="mb-5 flex items-start gap-2.5 rounded-2xl border border-accent-200 bg-accent-50 px-4 py-3">
          <ShieldCheck className="mt-0.5 h-5 w-5 flex-shrink-0 text-accent-700" />
          <p className="text-xs text-accent-800">
            Your full home address will only be shared with the tutor once
            this demo is confirmed. Until then, only your locality is visible.
          </p>
        </div>
      )}

      {/* ── Feedback section ──────────────────────────────────────── */}
      {needsFeedback && (
        <Card padding="lg">
          <DemoFeedbackForm
            demoId={demo.id}
            tutorName={profile.full_name}
            tutorAvatarUrl={profile.avatar_url}
            agreedFee={tp.expected_fee_per_hour}
          />
        </Card>
      )}

      {/* Already submitted feedback */}
      {hasFeedback && (
        <Card padding="md">
          <h3 className="mb-4 text-sm font-bold text-navy-900">Your Feedback</h3>
          <div className="space-y-3">
            <div className="flex items-center gap-1.5">
              {[1,2,3,4,5].map((s) => (
                <span key={s} className={`text-xl ${s <= (demo.parent_rating ?? 0) ? "text-amber-400" : "text-neutral-200"}`}>
                  ★
                </span>
              ))}
              <span className="ml-1 text-sm font-semibold text-navy-900">
                {demo.parent_rating}/5
              </span>
            </div>
            <div className="flex flex-wrap gap-3 text-xs text-neutral-600">
              {demo.was_tutor_punctual !== null && (
                <span className="flex items-center gap-1">
                  <CheckCircle2 className={`h-3.5 w-3.5 ${demo.was_tutor_punctual ? "text-accent-500" : "text-red-400"}`} />
                  {demo.was_tutor_punctual ? "Punctual" : "Not punctual"}
                </span>
              )}
              {demo.was_explanation_clear !== null && (
                <span className="flex items-center gap-1">
                  <CheckCircle2 className={`h-3.5 w-3.5 ${demo.was_explanation_clear ? "text-accent-500" : "text-red-400"}`} />
                  {demo.was_explanation_clear ? "Clear explanation" : "Explanation unclear"}
                </span>
              )}
            </div>
            {demo.parent_feedback && (
              <p className="text-sm italic text-neutral-600">
                &ldquo;{demo.parent_feedback}&rdquo;
              </p>
            )}
            <div className="rounded-xl border p-3 text-sm font-medium text-center">
              {demo.wants_to_continue
                ? <span className="text-accent-700">✓ Continuing with {profile.full_name.split(" ")[0]}</span>
                : <span className="text-neutral-600">You chose to try another tutor</span>}
            </div>
            {demo.wants_to_continue && (
              <Link href="/parent/attendance">
                <p className="text-center text-xs text-brand-700 hover:underline">
                  View attendance →
                </p>
              </Link>
            )}
          </div>
        </Card>
      )}

      {/* Cancelled / no-show */}
      {(demo.status === "cancelled" || demo.status === "no_show") && (
        <Card padding="md" className="text-center">
          <p className="text-sm text-neutral-600 mb-4">
            {demo.status === "cancelled"
              ? "This demo was cancelled. You can request a demo with another tutor."
              : "This session was marked as no-show. Please contact support if you have questions."}
          </p>
          <div className="flex flex-col gap-2 sm:flex-row sm:justify-center">
            <Link href="/parent/matches">
              <p className="text-sm font-semibold text-brand-700 hover:underline">
                View other matched tutors →
              </p>
            </Link>
          </div>
        </Card>
      )}
    </div>
  );
}
