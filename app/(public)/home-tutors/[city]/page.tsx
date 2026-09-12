import { notFound } from "next/navigation";
import Link from "next/link";
import type { Metadata } from "next";
import {
  ShieldCheck, MapPin, Star, ArrowRight,
  Users, BadgeCheck, CheckCircle2, BookOpen,
} from "lucide-react";
import { createClient } from "@/lib/supabase/server";
import { Button } from "@/components/ui/Button";
import { Badge } from "@/components/ui/Badge";
import { Avatar } from "@/components/ui/Avatar";
import { VerifiedBadge } from "@/components/ui/Badge";
import {
  buildMetadata,
  breadcrumbSchema,
  localBusinessSchema,
  faqSchema,
  jsonLd,
} from "@/lib/seo";
import {
  CITIES,
  getCityBySlug,
  getLocalitiesForCity,
  MIN_TUTORS_FOR_PAGE,
} from "@/lib/locations";
import { APP_NAME } from "@/lib/constants";

// ─── Static params: generate one route per known city ─────────────────────────
// We always generate the route — the page itself shows an "expanding soon"
// message if supply is below MIN_TUTORS_FOR_PAGE rather than 404-ing at
// build time. This keeps deploys stable when tutor supply fluctuates.

export async function generateStaticParams() {
  return CITIES.map((city) => ({ city: city.slug }));
}

// ─── Metadata ─────────────────────────────────────────────────────────────────

export async function generateMetadata({
  params,
}: {
  params: Promise<{ city: string }>;
}): Promise<Metadata> {
  const { city: citySlug } = await params;
  const city = getCityBySlug(citySlug);

  if (!city) {
    return { title: "Not Found", robots: { index: false, follow: false } };
  }

  return buildMetadata({
    title:       `Home Tutors in ${city.name} — Verified & Background Checked`,
    description: `Find verified home tutors in ${city.name}, ${city.state}. ${city.description}. Free demo class. Every tutor is background-checked and interviewed by TutorMeet.`,
    canonical:   `/home-tutors/${city.slug}`,
    keywords:    [
      `home tutor ${city.name}`,
      `home tuition ${city.name}`,
      `private tutor ${city.name}`,
      `verified tutor ${city.name}`,
      `best home tutor ${city.name}`,
      `tutor near me ${city.name}`,
      `CBSE tutor ${city.name}`,
      `home tutor ${city.state}`,
    ],
  });
}

// ─── City-level FAQ ────────────────────────────────────────────────────────────

function getCityFaqs(cityName: string) {
  return [
    {
      question: `How do I find a home tutor in ${cityName}?`,
      answer:   `Submit your requirement on TutorMeet — tell us the subject, class, board, and your area in ${cityName}. Our team will shortlist verified tutors near you within 48 hours.`,
    },
    {
      question: `Are TutorMeet tutors verified in ${cityName}?`,
      answer:   `Yes. Every tutor listed in ${cityName} has passed TutorMeet's multi-step verification: government ID check, education certificate review, subject knowledge assessment, and a personal interview.`,
    },
    {
      question: `What is the typical home tutor fee in ${cityName}?`,
      answer:   `Tutor fees in ${cityName} vary by subject, class level, and experience. Tutors set their own rates. On TutorMeet you can filter by fee range to find tutors within your budget.`,
    },
    {
      question: `Is the demo class free in ${cityName}?`,
      answer:   `Yes. TutorMeet offers a free demo class at your home before you commit. You only pay the tutor's regular fee once you decide to continue.`,
    },
    {
      question: `Which subjects are covered by TutorMeet tutors in ${cityName}?`,
      answer:   `TutorMeet tutors in ${cityName} cover Mathematics, Science, Physics, Chemistry, Biology, English, Hindi, Social Studies, Computer Science, and more — from Nursery to Class 12 and competitive exams.`,
    },
  ];
}

// ─── Page ─────────────────────────────────────────────────────────────────────

export default async function CityLandingPage({
  params,
}: {
  params: Promise<{ city: string }>;
}) {
  const { city: citySlug } = await params;
  const city = getCityBySlug(citySlug);

  // Unknown city slug → hard 404
  if (!city) notFound();

  const supabase  = await createClient();
  const localities = getLocalitiesForCity(citySlug);
  const faqs      = getCityFaqs(city.name);

  // Fetch verified tutors in this city (public fields only)
  const { data: tutors, count: tutorCount } = await supabase
    .from("tutor_profiles")
    .select(
      `user_id, locality, subjects, grades, boards,
       expected_fee_per_hour, years_of_experience,
       average_rating, total_reviews, knowledge_score, teaching_score,
       profiles!inner(full_name, avatar_url)`,
      { count: "exact" }
    )
    .eq("verification_status", "verified")
    .eq("onboarding_complete", true)
    .ilike("city", city.name)
    .order("knowledge_score", { ascending: false, nullsFirst: false })
    .limit(6);

  const hasSupply = (tutorCount ?? 0) >= MIN_TUTORS_FOR_PAGE;

  return (
    <>
      {/* ── Structured data ─────────────────────────────────── */}
      <script key="ld-breadcrumb" {...jsonLd(breadcrumbSchema([
        { name: "Home",          href: "/"            },
        { name: "Home Tutors",   href: "/tutors"      },
        { name: city.name,       href: `/home-tutors/${city.slug}` },
      ]))} />
      <script key="ld-local" {...jsonLd(localBusinessSchema({
        name:        `Home Tutors in ${city.name} — ${APP_NAME}`,
        description: city.description,
        url:         `/home-tutors/${city.slug}`,
        city:        city.name,
        state:       city.state,
        country:     "India",
        priceRange:  "₹₹",
      }))} />
      <script key="ld-faq" {...jsonLd(faqSchema(faqs))} />

      {/* ── Hero ─────────────────────────────────────────────── */}
      <section className="bg-brand-950 pb-0 pt-24 md:pt-32">
        <div className="absolute inset-0 bg-dot-pattern-white pointer-events-none" />
        <div className="container-page relative pb-12 md:pb-16">
          {/* Breadcrumb */}
          <nav
            aria-label="Breadcrumb"
            className="mb-5 flex items-center gap-1.5 text-xs text-brand-300"
          >
            <Link href="/" className="hover:text-white transition-colors">Home</Link>
            <span aria-hidden="true">/</span>
            <Link href="/tutors" className="hover:text-white transition-colors">Find a Tutor</Link>
            <span aria-hidden="true">/</span>
            <span className="text-white font-medium">{city.name}</span>
          </nav>

          <div className="max-w-2xl">
            <div className="mb-4 inline-flex items-center gap-2 rounded-full bg-accent-500/15 border border-accent-500/25 px-4 py-1.5 text-sm font-medium text-accent-300">
              <MapPin className="h-4 w-4" />
              {city.name}, {city.state}
            </div>

            <h1
              className="mb-4 text-3xl font-extrabold leading-tight text-white sm:text-4xl md:text-5xl"
              style={{ letterSpacing: "-0.03em" }}
            >
              Home Tutors in{" "}
              <span className="text-accent-400">{city.name}</span>
            </h1>

            <p className="mb-6 text-base leading-relaxed text-brand-200 sm:text-lg max-w-xl">
              {city.description}. Every tutor is background-checked, interviewed, and
              verified by our team before reaching you.
            </p>

            <div className="flex flex-wrap items-center gap-3">
              <Link href={`/register?role=parent&city=${encodeURIComponent(city.name)}`}>
                <Button variant="teal" size="lg">
                  Find a Tutor in {city.name}
                  <ArrowRight className="h-4 w-4" />
                </Button>
              </Link>
              <Link href="/tutors">
                <Button variant="white-outline" size="md">Browse All Tutors</Button>
              </Link>
            </div>

            {/* Trust signals */}
            <div className="mt-6 flex flex-wrap items-center gap-4 text-sm text-brand-300">
              <span className="flex items-center gap-1.5">
                <ShieldCheck className="h-4 w-4 text-accent-400" />
                Free demo class
              </span>
              <span className="flex items-center gap-1.5">
                <BadgeCheck className="h-4 w-4 text-accent-400" />
                All tutors verified
              </span>
              <span className="flex items-center gap-1.5">
                <CheckCircle2 className="h-4 w-4 text-accent-400" />
                No commitment until you choose
              </span>
            </div>
          </div>

          {/* Tutor count pill */}
          {hasSupply && tutorCount !== null && (
            <div className="mt-8 inline-flex items-center gap-2 rounded-full bg-white/10 px-4 py-2 text-sm font-medium text-white">
              <Users className="h-4 w-4 text-accent-400" />
              {tutorCount}+ verified tutor{tutorCount !== 1 ? "s" : ""} in {city.name}
            </div>
          )}
        </div>

        {/* Wave divider */}
        <div className="h-10 overflow-hidden">
          <svg viewBox="0 0 1440 40" fill="none" className="w-full" preserveAspectRatio="none">
            <path d="M0 40L1440 40L1440 0C1080 28 720 28 360 0L0 0L0 40Z" fill="white" />
          </svg>
        </div>
      </section>

      {/* ── No supply state ──────────────────────────────────── */}
      {!hasSupply && (
        <section className="section bg-white">
          <div className="container-page text-center">
            <div className="mx-auto max-w-lg">
              <div className="mb-5 mx-auto flex h-16 w-16 items-center justify-center rounded-2xl bg-brand-50 text-brand-700">
                <BookOpen className="h-8 w-8" />
              </div>
              <h2 className="mb-3 text-2xl font-bold text-navy-900">
                Coming to {city.name} soon
              </h2>
              <p className="mb-6 text-neutral-500">
                We&apos;re expanding our verified tutor network to {city.name}.
                Register your interest and we&apos;ll notify you when tutors are available.
              </p>
              <Link href={`/register?role=parent&city=${encodeURIComponent(city.name)}`}>
                <Button variant="primary" size="lg">
                  Join the Waitlist
                  <ArrowRight className="h-4 w-4" />
                </Button>
              </Link>
            </div>
          </div>
        </section>
      )}

      {/* ── Featured tutors ──────────────────────────────────── */}
      {hasSupply && tutors && tutors.length > 0 && (
        <section className="section bg-white">
          <div className="container-page">
            <div className="mb-8 flex flex-col gap-2 sm:flex-row sm:items-end sm:justify-between">
              <div>
                <h2 className="text-2xl font-bold text-navy-900 md:text-3xl" style={{ letterSpacing: "-0.025em" }}>
                  Verified Tutors in {city.name}
                </h2>
                <p className="mt-1 text-neutral-500">
                  Every tutor below has been verified, assessed and interviewed by TutorMeet.
                </p>
              </div>
              <Link href={`/tutors?city=${encodeURIComponent(city.name)}`} className="flex-shrink-0">
                <Button variant="outline" size="sm">
                  See all tutors
                  <ArrowRight className="h-4 w-4" />
                </Button>
              </Link>
            </div>

            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
              {tutors.map((tp) => {
                const profileRaw = tp.profiles as unknown;
                const profile = (Array.isArray(profileRaw) ? profileRaw[0] : profileRaw) as
                  { full_name: string; avatar_url: string | null } | null;

                return (
                  <Link
                    key={tp.user_id}
                    href={`/tutors/${tp.user_id}`}
                    className="card card-hover flex flex-col gap-4 p-5"
                  >
                    <div className="flex items-start gap-3">
                      <Avatar
                        name={profile?.full_name ?? "T"}
                        src={profile?.avatar_url}
                        size="md"
                      />
                      <div className="min-w-0 flex-1">
                        <div className="flex items-center gap-2 flex-wrap">
                          <p className="text-sm font-semibold text-navy-900 truncate">
                            {profile?.full_name}
                          </p>
                          <VerifiedBadge size="sm" />
                        </div>
                        {tp.locality && (
                          <p className="mt-0.5 flex items-center gap-1 text-xs text-neutral-400">
                            <MapPin className="h-3 w-3 flex-shrink-0" />
                            {tp.locality}
                          </p>
                        )}
                      </div>
                    </div>

                    {/* Subjects */}
                    <div className="flex flex-wrap gap-1">
                      {(tp.subjects as string[]).slice(0, 3).map((s) => (
                        <Badge key={s} variant="blue">{s}</Badge>
                      ))}
                      {(tp.subjects as string[]).length > 3 && (
                        <Badge variant="gray">+{(tp.subjects as string[]).length - 3}</Badge>
                      )}
                    </div>

                    {/* Stats row */}
                    <div className="flex items-center justify-between border-t border-neutral-100 pt-3 text-xs text-neutral-500">
                      <span>{tp.years_of_experience ?? 0} yrs exp</span>
                      {tp.average_rating && (
                        <span className="flex items-center gap-1">
                          <Star className="h-3.5 w-3.5 fill-amber-400 text-amber-400" />
                          {Number(tp.average_rating).toFixed(1)}
                          {tp.total_reviews ? ` (${tp.total_reviews})` : ""}
                        </span>
                      )}
                      {tp.expected_fee_per_hour && (
                        <span className="font-semibold text-navy-900">
                          ₹{tp.expected_fee_per_hour}/hr
                        </span>
                      )}
                    </div>
                  </Link>
                );
              })}
            </div>

            <div className="mt-8 text-center">
              <Link href={`/tutors?city=${encodeURIComponent(city.name)}`}>
                <Button variant="primary" size="md">
                  View All Tutors in {city.name}
                  <ArrowRight className="h-4 w-4" />
                </Button>
              </Link>
            </div>
          </div>
        </section>
      )}

      {/* ── Localities grid ──────────────────────────────────── */}
      {localities.length > 0 && (
        <section className="section-sm bg-neutral-50">
          <div className="container-page">
            <h2 className="mb-5 text-xl font-bold text-navy-900 sm:text-2xl" style={{ letterSpacing: "-0.02em" }}>
              Popular Areas in {city.name}
            </h2>
            <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-4">
              {localities.map((loc) => (
                <Link
                  key={loc.slug}
                  href={`/home-tutors/${city.slug}/${loc.slug}`}
                  className="flex items-center gap-2 rounded-xl border border-neutral-200 bg-white px-4 py-3 text-sm font-medium text-navy-900 transition-all hover:border-brand-300 hover:bg-brand-50 hover:text-brand-800"
                >
                  <MapPin className="h-3.5 w-3.5 flex-shrink-0 text-brand-500" />
                  <span className="truncate">Home Tutors in {loc.name}</span>
                </Link>
              ))}
            </div>
            <p className="mt-4 text-xs text-neutral-400">
              Area-level pages show tutors who have listed that locality in their profile.
            </p>
          </div>
        </section>
      )}

      {/* ── Popular subjects ─────────────────────────────────── */}
      {city.popularSubjects && city.popularSubjects.length > 0 && (
        <section className="section-sm bg-white">
          <div className="container-page">
            <h2 className="mb-5 text-xl font-bold text-navy-900 sm:text-2xl" style={{ letterSpacing: "-0.02em" }}>
              Popular Subjects in {city.name}
            </h2>
            <div className="flex flex-wrap gap-2">
              {city.popularSubjects.map((subject) => (
                <Link
                  key={subject}
                  href={`/tutors?city=${encodeURIComponent(city.name)}&subject=${encodeURIComponent(subject)}`}
                  className="tag tag-active text-sm"
                >
                  {subject} tutors in {city.name}
                </Link>
              ))}
            </div>
          </div>
        </section>
      )}

      {/* ── How it works ─────────────────────────────────────── */}
      <section className="section bg-neutral-50">
        <div className="container-page">
          <h2 className="mb-8 text-xl font-bold text-navy-900 sm:text-2xl md:text-3xl text-center" style={{ letterSpacing: "-0.025em" }}>
            How to Find a Home Tutor in {city.name}
          </h2>
          <div className="mx-auto max-w-3xl grid grid-cols-1 gap-5 sm:grid-cols-3">
            {[
              {
                step: "1",
                title: "Submit your requirement",
                desc:  `Tell us the subject, class, board, and your area in ${city.name}. Free, takes 3 minutes.`,
              },
              {
                step: "2",
                title: "We shortlist verified tutors",
                desc:  `Our team matches verified tutors in ${city.name} to your exact requirement within 48 hours.`,
              },
              {
                step: "3",
                title: "Free demo, then decide",
                desc:  "Meet your tutor in a free demo class at home. Pay only when you choose to continue.",
              },
            ].map((item) => (
              <div key={item.step} className="flex flex-col items-start rounded-2xl border border-neutral-200 bg-white p-5">
                <div className="step-number mb-3">{item.step}</div>
                <h3 className="mb-1.5 text-sm font-bold text-navy-900">{item.title}</h3>
                <p className="text-xs leading-relaxed text-neutral-500">{item.desc}</p>
              </div>
            ))}
          </div>
          <div className="mt-8 text-center">
            <Link href={`/register?role=parent&city=${encodeURIComponent(city.name)}`}>
              <Button variant="primary" size="lg">
                Get Matched with a Tutor in {city.name}
                <ArrowRight className="h-4 w-4" />
              </Button>
            </Link>
          </div>
        </div>
      </section>

      {/* ── FAQ ──────────────────────────────────────────────── */}
      <section className="section bg-white">
        <div className="container-page">
          <h2 className="mb-8 text-xl font-bold text-navy-900 sm:text-2xl md:text-3xl" style={{ letterSpacing: "-0.025em" }}>
            Frequently Asked Questions
          </h2>
          <div className="mx-auto max-w-3xl divide-y divide-neutral-200 rounded-2xl border border-neutral-200 bg-white shadow-xs">
            {faqs.map((faq, i) => (
              <details key={i} className="group px-5 py-4">
                <summary className="flex cursor-pointer list-none items-center justify-between gap-4 text-sm font-semibold text-navy-900 marker:hidden">
                  {faq.question}
                  <ArrowRight className="h-4 w-4 flex-shrink-0 text-neutral-400 transition-transform group-open:rotate-90" />
                </summary>
                <p className="mt-3 text-sm leading-relaxed text-neutral-600">
                  {faq.answer}
                </p>
              </details>
            ))}
          </div>
        </div>
      </section>

      {/* ── Final CTA ────────────────────────────────────────── */}
      <section className="section-sm bg-brand-900">
        <div className="container-page text-center">
          <h2 className="mb-3 text-2xl font-bold text-white md:text-3xl" style={{ letterSpacing: "-0.025em" }}>
            Find your perfect tutor in {city.name}
          </h2>
          <p className="mb-6 text-brand-200">
            Free demo class · No commitment · 100% verified tutors
          </p>
          <Link href={`/register?role=parent&city=${encodeURIComponent(city.name)}`}>
            <Button variant="teal" size="lg">
              Get Started — It&apos;s Free
              <ArrowRight className="h-4 w-4" />
            </Button>
          </Link>
        </div>
      </section>
    </>
  );
}
