import { notFound } from "next/navigation";
import Link from "next/link";
import type { Metadata } from "next";
import {
  MapPin, Clock, IndianRupee, Star, BookOpen, Video,
  CheckCircle2, GraduationCap, Briefcase, Calendar,
  ArrowLeft, Shield, Users, Award, BadgeCheck,
} from "lucide-react";
import { createClient } from "@/lib/supabase/server";
import { Avatar } from "@/components/ui/Avatar";
import { Badge } from "@/components/ui/Badge";
import { VerifiedBadge } from "@/components/ui/Badge";
import { RequestDemoButton } from "@/components/tutors/RequestDemoButton";
import { formatINR, cn } from "@/lib/utils";
import { APP_NAME } from "@/lib/constants";
import type { EducationQualification, TeachingExperience } from "@/types/tutor";

// ─── Metadata ─────────────────────────────────────────────────────────────────

export async function generateMetadata({
  params,
}: {
  params: Promise<{ id: string }>;
}): Promise<Metadata> {
  const { id } = await params;
  const supabase = await createClient();
  const { data } = await supabase
    .from("profiles")
    .select("full_name")
    .eq("id", id)
    .single();

  if (!data) return { title: "Tutor Profile" };

  return {
    title:       `${data.full_name} — Verified Tutor | ${APP_NAME}`,
    description: `${data.full_name} is a TutorMeet Verified home tutor. Check subjects, experience, availability and request a free demo class.`,
  };
}

// ─── Shared display helpers ───────────────────────────────────────────────────

function StarRow({ rating, count }: { rating: number; count: number }) {
  return (
    <div className="flex items-center gap-1.5" aria-label={`Rated ${rating} out of 5`}>
      <div className="flex gap-0.5">
        {[1,2,3,4,5].map((s) => (
          <Star key={s} className={cn("h-4 w-4", s <= Math.round(rating)
            ? "fill-amber-400 text-amber-400"
            : "fill-neutral-200 text-neutral-200"
          )} />
        ))}
      </div>
      <span className="text-sm font-semibold text-navy-900">{rating.toFixed(1)}</span>
      <span className="text-xs text-neutral-400">({count} review{count !== 1 ? "s" : ""})</span>
    </div>
  );
}

function ScoreCard({ label, score, color }: {
  label: string; score: number; color: "navy" | "teal";
}) {
  return (
    <div className={cn(
      "flex flex-col items-center gap-1.5 rounded-2xl px-5 py-4 text-center",
      color === "navy" ? "bg-brand-900 text-white" : "bg-accent-500 text-white"
    )}>
      <span className="text-3xl font-extrabold leading-none" style={{ letterSpacing: "-0.04em" }}>
        {score}<span className="text-sm font-medium opacity-60">/100</span>
      </span>
      <span className="text-xs font-semibold opacity-80">{label}</span>
      <span className="text-2xs opacity-60">TutorMeet Score</span>
    </div>
  );
}

function SectionHeading({ children }: { children: React.ReactNode }) {
  return (
    <h2 className="text-lg font-bold text-navy-900" style={{ letterSpacing: "-0.02em" }}>
      {children}
    </h2>
  );
}

// ─── Page ─────────────────────────────────────────────────────────────────────

export default async function PublicTutorProfilePage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const supabase = await createClient();

  // ── Fetch ONLY safe public fields — NEVER: pincode, gender, date_of_birth,
  //    state, phone, admin_notes, rejection_reason, document URLs ─────────────

  const { data: tp } = await supabase
    .from("tutor_profiles")
    .select(
      `id, user_id, verification_status,
       locality, city,
       subjects, grades, boards, teaching_mode,
       expected_fee_per_hour, demo_class_available,
       max_travel_distance_km, bio, years_of_experience,
       education, experience,
       knowledge_score, teaching_score,
       average_rating, total_reviews, total_students,
       verified_at,
       preferred_days, preferred_time_slots,
       profiles!inner(full_name, avatar_url)`
    )
    .eq("user_id", id)
    .eq("verification_status", "verified")
    .single();

  if (!tp) notFound();

  const profileRaw = tp.profiles as unknown;
  const profile    = (Array.isArray(profileRaw) ? profileRaw[0] : profileRaw) as {
    full_name:  string;
    avatar_url: string | null;
  };

  // Fetch published reviews only
  const { data: reviews } = await supabase
    .from("reviews")
    .select(
      `id, overall_rating, comment, is_verified_review, published_at, created_at,
       rating_teaching_quality, rating_subject_knowledge,
       rating_punctuality, rating_communication, rating_professionalism,
       profiles!inner(full_name, avatar_url)`
    )
    .eq("tutor_id", tp.id)
    .eq("status", "published")
    .order("published_at", { ascending: false })
    .limit(6);

  const education  = (tp.education  as EducationQualification[]) ?? [];
  const experience = (tp.experience as TeachingExperience[])       ?? [];
  const subjects   = (tp.subjects   as string[]) ?? [];
  const grades     = (tp.grades     as string[]) ?? [];
  const boards     = (tp.boards     as string[]) ?? [];
  const days       = (tp.preferred_days         as string[]) ?? [];
  const slots      = (tp.preferred_time_slots   as string[]) ?? [];
  const location   = [tp.locality, tp.city].filter(Boolean).join(", ");

  return (
    <div className="min-h-screen bg-white">

      {/* ── Breadcrumb ───────────────────────────────────────────── */}
      <div className="border-b border-neutral-100 bg-neutral-50">
        <div className="container-page py-3">
          <Link
            href="/tutors"
            className="flex items-center gap-1.5 text-sm text-neutral-500 hover:text-navy-900 transition-colors"
          >
            <ArrowLeft className="h-4 w-4" />
            Back to tutors
          </Link>
        </div>
      </div>

      {/* ── Hero ─────────────────────────────────────────────────── */}
      <div className="border-b border-neutral-100 bg-gradient-to-b from-brand-50 to-white">
        <div className="container-page py-10 sm:py-14">
          <div className="flex flex-col gap-7 lg:flex-row lg:items-start lg:gap-10">

            {/* Avatar + badges */}
            <div className="flex flex-col items-center gap-3 lg:items-start">
              <Avatar name={profile.full_name} src={profile.avatar_url} size="2xl" verified />
              <VerifiedBadge size="md" />
              {tp.demo_class_available && (
                <span className="flex items-center gap-1.5 rounded-full border border-accent-200 bg-accent-50 px-3 py-1 text-xs font-semibold text-accent-700">
                  <Video className="h-3.5 w-3.5" />
                  Free demo available
                </span>
              )}
            </div>

            {/* Core info */}
            <div className="flex-1 text-center lg:text-left">
              <h1 className="text-3xl font-extrabold text-navy-900 sm:text-4xl" style={{ letterSpacing: "-0.03em" }}>
                {profile.full_name}
              </h1>

              {/* Tagline */}
              <p className="mt-2 text-base text-neutral-600">
                {subjects.slice(0, 3).join(" · ")}
                {subjects.length > 3 && ` +${subjects.length - 3} more`}
              </p>

              {/* Stats strip */}
              <div className="mt-4 flex flex-wrap items-center justify-center gap-x-5 gap-y-2 lg:justify-start">
                {location && (
                  <span className="flex items-center gap-1.5 text-sm text-neutral-600">
                    <MapPin className="h-4 w-4 text-neutral-400" />
                    {location}
                  </span>
                )}
                {tp.years_of_experience !== null && (
                  <span className="flex items-center gap-1.5 text-sm text-neutral-600">
                    <Clock className="h-4 w-4 text-neutral-400" />
                    {tp.years_of_experience === 0 ? "Fresher" : `${tp.years_of_experience}+ yrs experience`}
                  </span>
                )}
                {tp.expected_fee_per_hour && (
                  <span className="flex items-center gap-1 text-sm font-semibold text-navy-800">
                    <IndianRupee className="h-4 w-4 text-neutral-400" />
                    from {formatINR(tp.expected_fee_per_hour)}/hr
                  </span>
                )}
                {tp.teaching_mode && (
                  <span className="flex items-center gap-1.5 text-sm text-neutral-600">
                    <BookOpen className="h-4 w-4 text-neutral-400" />
                    {tp.teaching_mode}
                  </span>
                )}
              </div>

              {/* Rating */}
              {tp.average_rating !== null && tp.total_reviews > 0 && (
                <div className="mt-3 flex justify-center lg:justify-start">
                  <StarRow rating={tp.average_rating} count={tp.total_reviews} />
                </div>
              )}
            </div>

            {/* CTA card */}
            <div className="flex-shrink-0 w-full lg:w-72">
              <div className="rounded-2xl border border-neutral-200 bg-white p-5 shadow-sm">
                {tp.expected_fee_per_hour && (
                  <p className="mb-4 text-center">
                    <span className="text-3xl font-extrabold text-navy-900" style={{ letterSpacing: "-0.03em" }}>
                      {formatINR(tp.expected_fee_per_hour)}
                    </span>
                    <span className="text-sm text-neutral-500">/hour</span>
                  </p>
                )}
                <RequestDemoButton
                  tutorUserId={id}
                  tutorName={profile.full_name}
                  fullWidth
                />
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* ── Body ─────────────────────────────────────────────────── */}
      <div className="container-page py-10">
        <div className="grid grid-cols-1 gap-10 lg:grid-cols-3">

          {/* ── Main content ──────────────────────────────────────── */}
          <div className="space-y-10 lg:col-span-2">

            {/* About */}
            {tp.bio && (
              <section>
                <SectionHeading>About {profile.full_name}</SectionHeading>
                <p className="mt-3 text-sm leading-relaxed text-neutral-600">{tp.bio}</p>
              </section>
            )}

            {/* Teaching approach */}
            <section>
              <SectionHeading>Subjects, Classes &amp; Boards</SectionHeading>
              <div className="mt-4 space-y-4">
                <div>
                  <p className="label-sm mb-2">Subjects</p>
                  <div className="flex flex-wrap gap-2">
                    {subjects.map((s) => (
                      <span key={s} className="tag-teal font-medium">{s}</span>
                    ))}
                  </div>
                </div>
                <div>
                  <p className="label-sm mb-2">Classes</p>
                  <div className="flex flex-wrap gap-2">
                    {grades.map((g) => <span key={g} className="tag">{g}</span>)}
                  </div>
                </div>
                <div>
                  <p className="label-sm mb-2">Boards</p>
                  <div className="flex flex-wrap gap-2">
                    {boards.map((b) => <span key={b} className="tag">{b}</span>)}
                  </div>
                </div>
                {tp.teaching_mode && (
                  <div>
                    <p className="label-sm mb-2">Teaching mode</p>
                    <span className="tag font-medium">{tp.teaching_mode}</span>
                  </div>
                )}
              </div>
            </section>

            {/* Education */}
            {education.length > 0 && (
              <section>
                <SectionHeading>Education</SectionHeading>
                <div className="mt-4 space-y-3">
                  {education.map((edu, i) => (
                    <div key={i} className="flex items-start gap-4 rounded-2xl border border-neutral-200 bg-neutral-50 p-4">
                      <div className="flex h-10 w-10 flex-shrink-0 items-center justify-center rounded-xl bg-brand-100 text-brand-700">
                        <GraduationCap className="h-5 w-5" />
                      </div>
                      <div>
                        <p className="font-semibold text-navy-900">{edu.degree}</p>
                        <p className="text-sm text-neutral-600">{edu.institution}</p>
                        <div className="mt-0.5 flex flex-wrap gap-x-3 text-xs text-neutral-400">
                          <span>{edu.board_or_university}</span>
                          <span>· {edu.year_of_passing}</span>
                          {edu.percentage_or_grade && <span>· {edu.percentage_or_grade}</span>}
                        </div>
                        {edu.subject_specialisation && (
                          <p className="mt-1 text-xs text-neutral-500">
                            Specialisation: {edu.subject_specialisation}
                          </p>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              </section>
            )}

            {/* Teaching experience */}
            {experience.length > 0 && (
              <section>
                <SectionHeading>Teaching Experience</SectionHeading>
                <div className="mt-4 space-y-3">
                  {experience.map((exp, i) => (
                    <div key={i} className="flex items-start gap-4 rounded-2xl border border-neutral-200 bg-neutral-50 p-4">
                      <div className="flex h-10 w-10 flex-shrink-0 items-center justify-center rounded-xl bg-accent-100 text-accent-700">
                        <Briefcase className="h-5 w-5" />
                      </div>
                      <div className="min-w-0 flex-1">
                        <div className="flex flex-wrap items-start justify-between gap-2">
                          <div>
                            <p className="font-semibold text-navy-900">{exp.role}</p>
                            <p className="text-sm text-neutral-600">{exp.institution_name}</p>
                          </div>
                          <span className="text-xs text-neutral-400">
                            {exp.start_year}–{exp.is_current ? "Present" : (exp.end_year ?? "")}
                          </span>
                        </div>
                        {(exp.subjects as string[]).length > 0 && (
                          <div className="mt-2 flex flex-wrap gap-1.5">
                            {(exp.subjects as string[]).map((s) => (
                              <span key={s} className="tag text-xs">{s}</span>
                            ))}
                          </div>
                        )}
                        {exp.description && (
                          <p className="mt-2 text-xs text-neutral-500">{exp.description}</p>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              </section>
            )}

            {/* Reviews */}
            {reviews && reviews.length > 0 && (
              <section>
                <div className="flex items-center gap-3">
                  <SectionHeading>Parent Reviews</SectionHeading>
                  {tp.average_rating !== null && (
                    <span className="text-sm text-neutral-500">
                      · {tp.average_rating}★ · {tp.total_reviews} review{tp.total_reviews !== 1 ? "s" : ""}
                    </span>
                  )}
                </div>
                <div className="mt-4 space-y-4">
                  {reviews.map((review) => {
                    const pRaw   = review.profiles as unknown;
                    const parent = (Array.isArray(pRaw) ? pRaw[0] : pRaw) as
                      { full_name: string; avatar_url: string | null } | null;

                    return (
                      <div key={review.id} className="rounded-2xl border border-neutral-200 bg-white p-5">
                        <div className="flex items-center gap-3">
                          <div className={cn(
                            "flex h-9 w-9 flex-shrink-0 items-center justify-center rounded-full text-sm font-bold",
                            "bg-brand-100 text-brand-800"
                          )}>
                            {(parent?.full_name ?? "P").charAt(0).toUpperCase()}
                          </div>
                          <div>
                            <p className="text-sm font-semibold text-navy-900">
                              {parent?.full_name ?? "Parent"}
                            </p>
                            <div className="mt-0.5 flex gap-0.5">
                              {[1,2,3,4,5].map((s) => (
                                <Star key={s} className={cn("h-3.5 w-3.5",
                                  s <= (review.overall_rating ?? 0)
                                    ? "fill-amber-400 text-amber-400"
                                    : "fill-neutral-200 text-neutral-200"
                                )} />
                              ))}
                            </div>
                          </div>
                        </div>
                        {review.comment && (
                          <p className="mt-3 text-sm italic leading-relaxed text-neutral-600">
                            &ldquo;{review.comment}&rdquo;
                          </p>
                        )}
                      </div>
                    );
                  })}
                </div>
              </section>
            )}
          </div>

          {/* ── Sidebar ───────────────────────────────────────────── */}
          <div className="space-y-5">

            {/* TutorMeet scores */}
            {(tp.knowledge_score !== null || tp.teaching_score !== null) && (
              <div className="rounded-2xl border border-neutral-200 bg-white p-5">
                <p className="label-sm mb-4">TutorMeet Verified Scores</p>
                <div className="grid grid-cols-2 gap-3">
                  {tp.knowledge_score !== null && (
                    <ScoreCard label="Knowledge"  score={tp.knowledge_score} color="navy" />
                  )}
                  {tp.teaching_score !== null && (
                    <ScoreCard label="Teaching"   score={tp.teaching_score}  color="teal" />
                  )}
                </div>
                <p className="mt-3 text-center text-xs text-neutral-400">
                  Assessed and scored by TutorMeet verification team
                </p>
              </div>
            )}

            {/* Availability */}
            {(days.length > 0 || slots.length > 0) && (
              <div className="rounded-2xl border border-neutral-200 bg-white p-5">
                <p className="label-sm mb-4">Availability</p>
                {days.length > 0 && (
                  <div className="mb-3">
                    <p className="mb-1.5 text-xs font-semibold text-neutral-500">Days</p>
                    <div className="flex flex-wrap gap-1.5">
                      {days.map((d) => (
                        <span key={d} className="tag text-xs">{d.slice(0, 3)}</span>
                      ))}
                    </div>
                  </div>
                )}
                {slots.length > 0 && (
                  <div>
                    <p className="mb-1.5 text-xs font-semibold text-neutral-500">Time slots</p>
                    <div className="space-y-1">
                      {slots.map((t) => (
                        <p key={t} className="flex items-center gap-1.5 text-xs text-neutral-600">
                          <Calendar className="h-3.5 w-3.5 flex-shrink-0 text-neutral-400" />
                          {t}
                        </p>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            )}

            {/* Service area */}
            {(tp.locality || tp.city || tp.max_travel_distance_km) && (
              <div className="rounded-2xl border border-neutral-200 bg-white p-5">
                <p className="label-sm mb-4">Service Area</p>
                <div className="space-y-2">
                  {(tp.locality || tp.city) && (
                    <div className="flex items-center gap-2 text-sm text-neutral-700">
                      <MapPin className="h-4 w-4 flex-shrink-0 text-neutral-400" />
                      {[tp.locality, tp.city].filter(Boolean).join(", ")}
                    </div>
                  )}
                  {tp.max_travel_distance_km && (
                    <p className="text-xs text-neutral-500">
                      Travels up to {tp.max_travel_distance_km} km from base location
                    </p>
                  )}
                </div>
              </div>
            )}

            {/* Stats */}
            <div className="rounded-2xl border border-neutral-200 bg-white p-5">
              <p className="label-sm mb-4">Stats</p>
              <div className="space-y-3">
                {[
                  { icon: <Users className="h-4 w-4" />,  label: "Students taught", value: tp.total_students },
                  { icon: <Star className="h-4 w-4" />,   label: "Total reviews",   value: tp.total_reviews  },
                  { icon: <Award className="h-4 w-4" />,  label: "Experience",
                    value: tp.years_of_experience === 0 ? "Fresher" : `${tp.years_of_experience}+ years` },
                ].map((stat) => (
                  <div key={stat.label} className="flex items-center justify-between text-sm">
                    <span className="flex items-center gap-2 text-neutral-500">
                      <span className="text-neutral-400">{stat.icon}</span>
                      {stat.label}
                    </span>
                    <span className="font-semibold text-navy-900">{stat.value}</span>
                  </div>
                ))}
              </div>
            </div>

            {/* Verification badges */}
            <div className="rounded-2xl border border-accent-200 bg-accent-50 p-5">
              <div className="flex items-start gap-3">
                <Shield className="mt-0.5 h-5 w-5 flex-shrink-0 text-accent-700" />
                <div>
                  <p className="text-sm font-bold text-accent-900">TutorMeet Verified</p>
                  <ul className="mt-2.5 space-y-2">
                    {[
                      "Identity documents verified",
                      "Education certificates checked",
                      "Subject knowledge assessed",
                      "Personal interview completed",
                    ].map((item) => (
                      <li key={item} className="flex items-center gap-2 text-xs text-accent-800">
                        <CheckCircle2 className="h-3.5 w-3.5 flex-shrink-0" />
                        {item}
                      </li>
                    ))}
                  </ul>
                </div>
              </div>
            </div>

            {/* Bottom CTA */}
            <div className="rounded-2xl border border-neutral-200 bg-neutral-50 p-5 text-center">
              <p className="mb-1.5 text-sm font-semibold text-navy-900">
                Interested in {profile.full_name.split(" ")[0]}?
              </p>
              <p className="mb-4 text-xs text-neutral-500">
                Request a free demo class and meet the tutor at your home before committing.
              </p>
              <RequestDemoButton
                tutorUserId={id}
                tutorName={profile.full_name}
                size="md"
                fullWidth
              />
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
