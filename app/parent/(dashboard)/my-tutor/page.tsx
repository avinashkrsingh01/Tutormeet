import { redirect } from "next/navigation";
import Link from "next/link";
import { createClient } from "@/lib/supabase/server";
import { DashboardHeader } from "@/components/layout/DashboardShell";
import { Card } from "@/components/ui/Card";
import { Avatar } from "@/components/ui/Avatar";
import { Badge } from "@/components/ui/Badge";
import { Button } from "@/components/ui/Button";
import { EmptyState } from "@/components/ui/EmptyState";
import { VerifiedBadge } from "@/components/ui/Badge";
import {
  BookOpen,
  MapPin,
  Clock,
  IndianRupee,
  Star,
  CalendarCheck,
  MessageCircle,
  Phone,
  Mail,
} from "lucide-react";
import { formatINR } from "@/lib/utils";
import type { Metadata } from "next";

export const metadata: Metadata = { title: "My Tutor" };

export default async function MyTutorPage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  // Find the active tutor — match status "selected" on an active/tutor_selected requirement
  const { data: matches } = await supabase
    .from("tutor_matches")
    .select(
      `id, match_status,
       tuition_requirements!inner(id, grade, subjects, status, student_name, parent_id),
       tutor_profiles!inner(
         id, user_id, subjects, grades, years_of_experience, expected_fee_per_hour,
         average_rating, total_reviews, bio, teaching_mode, address,
         profiles!inner(full_name, email, phone, avatar_url)
       )`
    )
    .eq("match_status", "selected")
    .in("tuition_requirements.status", ["tutor_selected", "active"])
    .eq("tuition_requirements.parent_id", user.id)
    .limit(5);

  const hasTutor = matches && matches.length > 0;

  return (
    <div>
      <DashboardHeader
        title="My Tutor"
        description="Your currently active tutor."
      />

      {!hasTutor ? (
        <Card>
          <EmptyState
            icon={<BookOpen className="h-8 w-8" />}
            title="No active tutor yet"
            description="Once you select a tutor from your matched list and a demo is completed, your tutor will appear here."
            action={
              <Link href="/parent/matches">
                <Button size="sm" variant="outline">View Matched Tutors</Button>
              </Link>
            }
          />
        </Card>
      ) : (
        <div className="space-y-5">
          {matches.map((match) => {
            const tpRaw = match.tutor_profiles as unknown;
            const tp = (Array.isArray(tpRaw) ? tpRaw[0] : tpRaw) as {
              id: string;
              subjects: string[];
              grades: string[];
              years_of_experience: number | null;
              expected_fee_per_hour: number | null;
              average_rating: number | null;
              total_reviews: number;
              bio: string | null;
              teaching_mode: string | null;
              address: { locality?: string; city?: string } | null;
              profiles: { full_name: string; email: string; phone: string | null; avatar_url: string | null } |
                        { full_name: string; email: string; phone: string | null; avatar_url: string | null }[];
            };
            const profileRaw = tp.profiles;
            const profile = Array.isArray(profileRaw) ? profileRaw[0] : profileRaw;

            const reqRaw = match.tuition_requirements as unknown;
            const req = (Array.isArray(reqRaw) ? reqRaw[0] : reqRaw) as {
              grade: string; subjects: string[]; student_name: string | null;
            };

            return (
              <Card key={match.id} padding="none">
                {/* Top strip */}
                <div className="h-1 w-full rounded-t-2xl bg-gradient-to-r from-brand-900 via-brand-700 to-accent-500" />

                <div className="p-6">
                  {/* Header */}
                  <div className="flex flex-col gap-5 sm:flex-row sm:items-start sm:justify-between">
                    <div className="flex items-start gap-4">
                      <Avatar
                        name={profile.full_name}
                        src={profile.avatar_url}
                        size="xl"
                        verified
                      />
                      <div>
                        <div className="flex flex-wrap items-center gap-2">
                          <h2 className="text-lg font-bold text-navy-900" style={{ letterSpacing: "-0.02em" }}>
                            {profile.full_name}
                          </h2>
                          <VerifiedBadge />
                        </div>
                        {tp.address?.locality && (
                          <p className="mt-0.5 flex items-center gap-1 text-sm text-neutral-500">
                            <MapPin className="h-3.5 w-3.5" />
                            {tp.address.locality}, {tp.address.city}
                          </p>
                        )}
                        <div className="mt-2 flex flex-wrap gap-2">
                          {tp.subjects.slice(0, 4).map((s) => (
                            <span key={s} className="tag">{s}</span>
                          ))}
                        </div>
                      </div>
                    </div>

                    <div className="flex-shrink-0">
                      <Badge variant="teal" dot>Active tutor</Badge>
                    </div>
                  </div>

                  {/* Stats row */}
                  <div className="mt-5 flex flex-wrap gap-5 border-t border-neutral-100 pt-5 text-sm">
                    {tp.years_of_experience !== null && (
                      <span className="flex items-center gap-1.5 text-neutral-600">
                        <Clock className="h-4 w-4 text-neutral-400" />
                        {tp.years_of_experience}+ yrs experience
                      </span>
                    )}
                    {tp.expected_fee_per_hour !== null && (
                      <span className="flex items-center gap-1.5 font-semibold text-navy-800">
                        <IndianRupee className="h-4 w-4 text-neutral-400" />
                        {formatINR(tp.expected_fee_per_hour)}/hr
                      </span>
                    )}
                    {tp.average_rating !== null && (
                      <span className="flex items-center gap-1.5 text-neutral-600">
                        <Star className="h-4 w-4 fill-amber-400 text-amber-400" />
                        {tp.average_rating} ({tp.total_reviews} reviews)
                      </span>
                    )}
                    {tp.teaching_mode && (
                      <span className="flex items-center gap-1.5 text-neutral-600">
                        <BookOpen className="h-4 w-4 text-neutral-400" />
                        {tp.teaching_mode}
                      </span>
                    )}
                  </div>

                  {/* Bio */}
                  {tp.bio && (
                    <p className="mt-4 text-sm leading-relaxed text-neutral-600">
                      {tp.bio}
                    </p>
                  )}

                  {/* Teaching */}
                  <div className="mt-4 rounded-xl bg-neutral-50 px-4 py-3 text-xs text-neutral-600">
                    <span className="font-semibold text-navy-900">Teaching:</span>{" "}
                    {req.student_name ? `${req.student_name} · ` : ""}
                    {req.grade} — {req.subjects.join(", ")}
                  </div>

                  {/* Actions */}
                  <div className="mt-5 flex flex-wrap gap-3 border-t border-neutral-100 pt-5">
                    <Link href="/parent/attendance">
                      <Button variant="outline" size="sm" iconLeft={<CalendarCheck className="h-4 w-4" />}>
                        Attendance
                      </Button>
                    </Link>
                    <Link href="/parent/reviews">
                      <Button variant="ghost" size="sm" iconLeft={<Star className="h-4 w-4" />}>
                        Leave a Review
                      </Button>
                    </Link>
                    <Link href="/parent/support">
                      <Button variant="ghost" size="sm" iconLeft={<MessageCircle className="h-4 w-4" />}>
                        Get Support
                      </Button>
                    </Link>
                  </div>
                </div>
              </Card>
            );
          })}
        </div>
      )}
    </div>
  );
}
