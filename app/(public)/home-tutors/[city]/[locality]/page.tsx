import { notFound } from "next/navigation";
import Link from "next/link";
import type { Metadata } from "next";
import { MapPin, ShieldCheck, BadgeCheck, ArrowRight, Star } from "lucide-react";
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
  LOCALITIES,
  getCityBySlug,
  getLocalityBySlug,
  MIN_TUTORS_FOR_LOCALITY,
} from "@/lib/locations";
import { APP_NAME } from "@/lib/constants";

// ─── Static params ─────────────────────────────────────────────────────────────

export async function generateStaticParams() {
  const params: { city: string; locality: string }[] = [];
  for (const [citySlug, localities] of Object.entries(LOCALITIES)) {
    for (const loc of localities) {
      params.push({ city: citySlug, locality: loc.slug });
    }
  }
  return params;
}

// ─── Metadata ─────────────────────────────────────────────────────────────────

export async function generateMetadata({
  params,
}: {
  params: Promise<{ city: string; locality: string }>;
}): Promise<Metadata> {
  const { city: citySlug, locality: localitySlug } = await params;
  const city     = getCityBySlug(citySlug);
  const locality = getLocalityBySlug(citySlug, localitySlug);

  if (!city || !locality) {
    return { title: "Not Found", robots: { index: false, follow: false } };
  }

  // Check supply at metadata generation time; if thin, canonical back to city
  // to consolidate link equity and avoid thin content penalty.
  let supabaseCount = 0;
  try {
    const { createClient: create } = await import("@/lib/supabase/server");
    const sb = await create();
    const { count } = await sb
      .from("tutor_profiles")
      .select("*", { count: "exact", head: true })
      .eq("verification_status", "verified")
      .ilike("city",     city.name)
      .ilike("locality", locality.name);
    supabaseCount = count ?? 0;
  } catch {
    supabaseCount = MIN_TUTORS_FOR_LOCALITY; // fail open
  }

  const isThin = supabaseCount < MIN_TUTORS_FOR_LOCALITY;

  // Thin locality pages point canonical to the city page to merge signals
  const canonicalPath = isThin
    ? `/home-tutors/${city.slug}`
    : `/home-tutors/${city.slug}/${locality.slug}`;

  return buildMetadata({
    title:       `Home Tutors in ${locality.name}, ${city.name} — Verified`,
    description: `Find verified home tutors in ${locality.name}, ${city.name}. Every tutor is background-checked and interviewed. Free demo class at your home.`,
    canonical:   canonicalPath,
    keywords:    [
      `home tutor ${locality.name}`,
      `home tutor ${locality.name} ${city.name}`,
      `private tutor ${locality.name}`,
      `tutor near ${locality.name}`,
      `CBSE tutor ${locality.name}`,
    ],
    // No-index thin pages — canonical is enough signal
    noIndex: isThin,
  });
}

// ─── Page ─────────────────────────────────────────────────────────────────────

export default async function LocalityLandingPage({
  params,
}: {
  params: Promise<{ city: string; locality: string }>;
}) {
  const { city: citySlug, locality: localitySlug } = await params;

  const city     = getCityBySlug(citySlug);
  const locality = getLocalityBySlug(citySlug, localitySlug);

  // Unknown city or locality → hard 404
  if (!city || !locality) notFound();

  const supabase = await createClient();

  const { data: tutors, count: tutorCount } = await supabase
    .from("tutor_profiles")
    .select(
      `user_id, locality, subjects, grades,
       expected_fee_per_hour, years_of_experience,
       average_rating, total_reviews,
       profiles!inner(full_name, avatar_url)`,
      { count: "exact" }
    )
    .eq("verification_status", "verified")
    .eq("onboarding_complete", true)
    .ilike("city",     city.name)
    .ilike("locality", locality.name)
    .order("knowledge_score", { ascending: false, nullsFirst: false })
    .limit(6);

  const hasSupply = (tutorCount ?? 0) >= MIN_TUTORS_FOR_LOCALITY;

  const faqs = [
    {
      question: `How do I find a home tutor in ${locality.name}, ${city.name}?`,
      answer:   `Submit your requirement on TutorMeet with your subject, class, and ${locality.name} area. We'll shortlist verified tutors near you within 48 hours.`,
    },
    {
      question: `Are tutors in ${locality.name} verified?`,
      answer:   `Yes. All TutorMeet tutors in ${locality.name} have passed identity verification, education certificate review, and a personal interview.`,
    },
    {
      question: `Is a demo class available in ${locality.name}?`,
      answer:   `Yes. Every tutor match comes with a free demo class at your home in ${locality.name} before you commit.`,
    },
  ];

  return (
    <>
      {/* Structured data */}
      <script key="ld-breadcrumb" {...jsonLd(breadcrumbSchema([
        { name: "Home",             href: "/"                                          },
        { name: "Home Tutors",      href: "/tutors"                                    },
        { name: city.name,          href: `/home-tutors/${city.slug}`                  },
        { name: locality.name,      href: `/home-tutors/${city.slug}/${locality.slug}` },
      ]))} />
      {hasSupply && (
        <script key="ld-local" {...jsonLd(localBusinessSchema({
          name:        `Home Tutors in ${locality.name}, ${city.name} — ${APP_NAME}`,
          description: `Verified home tutors serving ${locality.name} in ${city.name}.`,
          url:         `/home-tutors/${city.slug}/${locality.slug}`,
          city:        city.name,
          state:       city.state,
          country:     "India",
        }))} />
      )}
      {hasSupply && <script key="ld-faq" {...jsonLd(faqSchema(faqs))} />}

      {/* Hero */}
      <section className="bg-brand-950 pb-0 pt-24 md:pt-32">
        <div className="absolute inset-0 bg-dot-pattern-white pointer-events-none" />
        <div className="container-page relative pb-12">
          {/* Breadcrumb */}
          <nav aria-label="Breadcrumb" className="mb-5 flex flex-wrap items-center gap-1.5 text-xs text-brand-300">
            <Link href="/" className="hover:text-white transition-colors">Home</Link>
            <span aria-hidden="true">/</span>
            <Link href="/tutors" className="hover:text-white transition-colors">Find a Tutor</Link>
            <span aria-hidden="true">/</span>
            <Link href={`/home-tutors/${city.slug}`} className="hover:text-white transition-colors">{city.name}</Link>
            <span aria-hidden="true">/</span>
            <span className="text-white font-medium">{locality.name}</span>
          </nav>

          <div className="max-w-2xl">
            <div className="mb-4 inline-flex items-center gap-2 rounded-full bg-accent-500/15 border border-accent-500/25 px-4 py-1.5 text-sm font-medium text-accent-300">
              <MapPin className="h-4 w-4" />
              {locality.name}, {city.name}
            </div>

            <h1
              className="mb-4 text-3xl font-extrabold leading-tight text-white sm:text-4xl md:text-5xl"
              style={{ letterSpacing: "-0.03em" }}
            >
              Home Tutors in{" "}
              <span className="text-accent-400">{locality.name}</span>
            </h1>

            <p className="mb-6 text-base leading-relaxed text-brand-200 sm:text-lg max-w-xl">
              Verified home tutors serving {locality.name}, {city.name}.
              Background-checked, interviewed, and ready to teach at your home.
            </p>

            <div className="flex flex-wrap gap-3">
              <Link href={`/register?role=parent&city=${encodeURIComponent(city.name)}&locality=${encodeURIComponent(locality.name)}`}>
                <Button variant="teal" size="lg">
                  Find a Tutor in {locality.name}
                  <ArrowRight className="h-4 w-4" />
                </Button>
              </Link>
              <Link href={`/home-tutors/${city.slug}`}>
                <Button variant="white-outline" size="md">
                  All tutors in {city.name}
                </Button>
              </Link>
            </div>

            <div className="mt-6 flex flex-wrap items-center gap-4 text-sm text-brand-300">
              <span className="flex items-center gap-1.5">
                <ShieldCheck className="h-4 w-4 text-accent-400" />Free demo class
              </span>
              <span className="flex items-center gap-1.5">
                <BadgeCheck className="h-4 w-4 text-accent-400" />All tutors verified
              </span>
            </div>
          </div>
        </div>
        <div className="h-10 overflow-hidden">
          <svg viewBox="0 0 1440 40" fill="none" className="w-full" preserveAspectRatio="none">
            <path d="M0 40L1440 40L1440 0C1080 28 720 28 360 0L0 0L0 40Z" fill="white" />
          </svg>
        </div>
      </section>

      {/* No supply — redirect users to city page */}
      {!hasSupply ? (
        <section className="section bg-white">
          <div className="container-page text-center">
            <div className="mx-auto max-w-md">
              <h2 className="mb-3 text-xl font-bold text-navy-900">
                Expanding to {locality.name} soon
              </h2>
              <p className="mb-6 text-neutral-500">
                We don&apos;t have enough verified tutors in {locality.name} yet,
                but we have tutors across {city.name}.
              </p>
              <Link href={`/home-tutors/${city.slug}`}>
                <Button variant="primary">
                  View all tutors in {city.name}
                  <ArrowRight className="h-4 w-4" />
                </Button>
              </Link>
            </div>
          </div>
        </section>
      ) : (
        <section className="section bg-white">
          <div className="container-page">
            <div className="mb-8 flex flex-col gap-2 sm:flex-row sm:items-end sm:justify-between">
              <div>
                <h2 className="text-2xl font-bold text-navy-900" style={{ letterSpacing: "-0.025em" }}>
                  Verified Tutors in {locality.name}
                </h2>
                <p className="mt-1 text-sm text-neutral-500">
                  {tutorCount} tutor{tutorCount !== 1 ? "s" : ""} available in this area
                </p>
              </div>
              <Link href={`/tutors?city=${encodeURIComponent(city.name)}&locality=${encodeURIComponent(locality.name)}`}>
                <Button variant="outline" size="sm">
                  See all <ArrowRight className="h-3.5 w-3.5" />
                </Button>
              </Link>
            </div>

            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
              {(tutors ?? []).map((tp) => {
                const profileRaw = tp.profiles as unknown;
                const profile = (Array.isArray(profileRaw) ? profileRaw[0] : profileRaw) as
                  { full_name: string; avatar_url: string | null } | null;

                return (
                  <Link key={tp.user_id} href={`/tutors/${tp.user_id}`}
                    className="card card-hover flex flex-col gap-4 p-5">
                    <div className="flex items-start gap-3">
                      <Avatar name={profile?.full_name ?? "T"} src={profile?.avatar_url} size="md" />
                      <div className="min-w-0 flex-1">
                        <div className="flex flex-wrap items-center gap-2">
                          <p className="text-sm font-semibold text-navy-900 truncate">{profile?.full_name}</p>
                          <VerifiedBadge size="sm" />
                        </div>
                        <p className="mt-0.5 flex items-center gap-1 text-xs text-neutral-400">
                          <MapPin className="h-3 w-3" />{tp.locality ?? locality.name}
                        </p>
                      </div>
                    </div>
                    <div className="flex flex-wrap gap-1">
                      {(tp.subjects as string[]).slice(0, 3).map((s) => (
                        <Badge key={s} variant="blue">{s}</Badge>
                      ))}
                    </div>
                    <div className="flex items-center justify-between border-t border-neutral-100 pt-3 text-xs text-neutral-500">
                      <span>{tp.years_of_experience ?? 0} yrs exp</span>
                      {tp.average_rating && (
                        <span className="flex items-center gap-1">
                          <Star className="h-3.5 w-3.5 fill-amber-400 text-amber-400" />
                          {Number(tp.average_rating).toFixed(1)}
                        </span>
                      )}
                      {tp.expected_fee_per_hour && (
                        <span className="font-semibold text-navy-900">₹{tp.expected_fee_per_hour}/hr</span>
                      )}
                    </div>
                  </Link>
                );
              })}
            </div>

            <div className="mt-8 text-center">
              <Link href={`/register?role=parent&city=${encodeURIComponent(city.name)}&locality=${encodeURIComponent(locality.name)}`}>
                <Button variant="primary" size="lg">
                  Find a Tutor in {locality.name}
                  <ArrowRight className="h-4 w-4" />
                </Button>
              </Link>
            </div>
          </div>
        </section>
      )}

      {/* FAQ */}
      {hasSupply && (
        <section className="section bg-neutral-50">
          <div className="container-page">
            <h2 className="mb-6 text-xl font-bold text-navy-900 sm:text-2xl" style={{ letterSpacing: "-0.025em" }}>
              FAQs — Home Tutors in {locality.name}
            </h2>
            <div className="mx-auto max-w-2xl divide-y divide-neutral-200 rounded-2xl border border-neutral-200 bg-white shadow-xs">
              {faqs.map((faq, i) => (
                <details key={i} className="group px-5 py-4">
                  <summary className="flex cursor-pointer list-none items-center justify-between gap-4 text-sm font-semibold text-navy-900 marker:hidden">
                    {faq.question}
                    <ArrowRight className="h-4 w-4 flex-shrink-0 text-neutral-400 transition-transform group-open:rotate-90" />
                  </summary>
                  <p className="mt-3 text-sm leading-relaxed text-neutral-600">{faq.answer}</p>
                </details>
              ))}
            </div>
          </div>
        </section>
      )}
    </>
  );
}
