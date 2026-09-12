import { redirect, notFound } from "next/navigation";
import Link from "next/link";
import { createClient } from "@/lib/supabase/server";
import { DashboardHeader } from "@/components/layout/DashboardShell";
import { Card } from "@/components/ui/Card";
import { Avatar } from "@/components/ui/Avatar";
import { Badge } from "@/components/ui/Badge";
import { VerifiedBadge } from "@/components/ui/Badge";
import { Button } from "@/components/ui/Button";
import { formatINR } from "@/lib/utils";
import {
  MapPin,
  Clock,
  IndianRupee,
  Star,
  BookOpen,
  Video,
  ArrowLeft,
  MessageCircle,
} from "lucide-react";
import type { Metadata } from "next";

export const metadata: Metadata = { title: "Tutor Profile" };

interface PageProps {
  params: Promise<{ id: string }>;
}

export default async function MatchDetailPage({ params }: PageProps) {
  const { id } = await params;
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  const { data: match } = await supabase
    .from("tutor_matches")
    .select(
      `id, match_status,
       tuition_requirements!inner(grade, subjects, student_name, parent_id),
       tutor_profiles!inner(
         id, subjects, grades, boards, years_of_experience, expected_fee_per_hour,
         average_rating, total_reviews, bio, teaching_mode, demo_class_available,
         preferred_days, preferred_time_slots, address,
         profiles!inner(full_name, avatar_url, email, phone)
       )`
    )
    .eq("id", id)
    .single();

  if (!match) notFound();

  // Auth: verify this match belongs to this parent
  const reqRaw = match.tuition_requirements as unknown;
  const req    = (Array.isArray(reqRaw) ? reqRaw[0] : reqRaw) as {
    grade: string; subjects: string[]; student_name: string | null; parent_id: string;
  };
  if (req.parent_id !== user.id) redirect("/unauthorized");

  const tpRaw = match.tutor_profiles as unknown;
  const tp    = (Array.isArray(tpRaw) ? tpRaw[0] : tpRaw) as {
    id: string;
    subjects: string[];
    grades: string[];
    boards: string[];
    years_of_experience: number | null;
    expected_fee_per_hour: number | null;
    average_rating: number | null;
    total_reviews: number;
    bio: string | null;
    teaching_mode: string | null;
    demo_class_available: boolean;
    preferred_days: string[];
    preferred_time_slots: string[];
    address: { locality?: string; city?: string } | null;
    profiles:
      | { full_name: string; avatar_url: string | null; email: string; phone: string | null }
      | { full_name: string; avatar_url: string | null; email: string; phone: string | null }[];
  };

  const profileRaw = tp.profiles;
  const profile    = Array.isArray(profileRaw) ? profileRaw[0] : profileRaw;

  return (
    <div className="mx-auto max-w-2xl">
      <div className="mb-5">
        <Link
          href="/parent/matches"
          className="inline-flex items-center gap-1.5 text-sm text-neutral-500 hover:text-navy-900 transition-colors"
        >
          <ArrowLeft className="h-4 w-4" />
          Back to matches
        </Link>
      </div>

      <Card padding="none">
        <div className="h-1 w-full rounded-t-2xl bg-gradient-to-r from-brand-900 via-brand-700 to-accent-500" />

        <div className="p-6 sm:p-8">
          {/* Header */}
          <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
            <div className="flex items-start gap-4">
              <Avatar name={profile.full_name} src={profile.avatar_url} size="xl" verified />
              <div>
                <div className="flex flex-wrap items-center gap-2">
                  <h1 className="text-xl font-bold text-navy-900" style={{ letterSpacing: "-0.02em" }}>
                    {profile.full_name}
                  </h1>
                  <VerifiedBadge size="md" />
                </div>
                {tp.address?.locality && (
                  <p className="mt-1 flex items-center gap-1 text-sm text-neutral-500">
                    <MapPin className="h-3.5 w-3.5" />
                    {tp.address.locality}, {tp.address.city}
                  </p>
                )}
                {tp.average_rating !== null && (
                  <div className="mt-1.5 flex items-center gap-1.5">
                    <Star className="h-4 w-4 fill-amber-400 text-amber-400" />
                    <span className="text-sm font-semibold text-navy-900">{tp.average_rating}</span>
                    <span className="text-xs text-neutral-400">({tp.total_reviews} reviews)</span>
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* Bio */}
          {tp.bio && (
            <p className="mt-5 text-sm leading-relaxed text-neutral-600">{tp.bio}</p>
          )}

          {/* Stats */}
          <div className="mt-5 grid grid-cols-2 gap-3 border-t border-neutral-100 pt-5 sm:grid-cols-4">
            {[
              {
                icon: <Clock className="h-4 w-4" />,
                label: "Experience",
                value: tp.years_of_experience !== null ? `${tp.years_of_experience}+ yrs` : "—",
              },
              {
                icon: <IndianRupee className="h-4 w-4" />,
                label: "Fee",
                value: tp.expected_fee_per_hour !== null
                  ? `${formatINR(tp.expected_fee_per_hour)}/hr`
                  : "Flexible",
              },
              {
                icon: <BookOpen className="h-4 w-4" />,
                label: "Mode",
                value: tp.teaching_mode ?? "—",
              },
              {
                icon: <Video className="h-4 w-4" />,
                label: "Demo",
                value: tp.demo_class_available ? "Available" : "Not offered",
              },
            ].map((stat) => (
              <div key={stat.label} className="rounded-xl bg-neutral-50 p-3 text-center">
                <div className="flex justify-center text-brand-700">{stat.icon}</div>
                <p className="mt-1 text-xs font-semibold text-navy-900">{stat.value}</p>
                <p className="text-2xs text-neutral-400">{stat.label}</p>
              </div>
            ))}
          </div>

          {/* Subjects */}
          <div className="mt-5">
            <p className="label-sm mb-2">Subjects</p>
            <div className="flex flex-wrap gap-1.5">
              {tp.subjects.map((s) => <span key={s} className="tag">{s}</span>)}
            </div>
          </div>

          {/* Availability */}
          <div className="mt-4 grid grid-cols-1 gap-4 sm:grid-cols-2">
            {tp.preferred_days.length > 0 && (
              <div>
                <p className="label-sm mb-2">Available days</p>
                <div className="flex flex-wrap gap-1.5">
                  {tp.preferred_days.map((d) => <span key={d} className="tag">{d}</span>)}
                </div>
              </div>
            )}
            {tp.preferred_time_slots.length > 0 && (
              <div>
                <p className="label-sm mb-2">Time slots</p>
                <div className="flex flex-wrap gap-1.5">
                  {tp.preferred_time_slots.map((t) => <span key={t} className="tag">{t}</span>)}
                </div>
              </div>
            )}
          </div>

          {/* Teaching context */}
          <div className="mt-5 rounded-xl border border-brand-100 bg-brand-50 px-4 py-3">
            <p className="text-xs font-semibold text-brand-800">
              Shortlisted for:{" "}
              {req.student_name ? `${req.student_name} · ` : ""}
              {req.grade} — {req.subjects.join(", ")}
            </p>
          </div>

          {/* Actions */}
          <div className="mt-6 flex flex-col gap-3 border-t border-neutral-100 pt-5 sm:flex-row">
            <Link href="/parent/support" className="flex-1">
              <Button variant="primary" fullWidth iconLeft={<Video className="h-4 w-4" />}>
                Request Demo Class
              </Button>
            </Link>
            <Link href="/parent/support" className="flex-1">
              <Button variant="ghost" fullWidth iconLeft={<MessageCircle className="h-4 w-4" />}>
                Contact Support
              </Button>
            </Link>
          </div>

          <p className="mt-4 text-center text-xs text-neutral-400">
            Demo class requests are processed by the TutorMeet team.
            We&apos;ll coordinate the schedule with the tutor.
          </p>
        </div>
      </Card>
    </div>
  );
}
