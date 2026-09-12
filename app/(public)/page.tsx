import type { Metadata } from "next";
import Link from "next/link";
import { buildMetadata, websiteSchema, organizationSchema, faqSchema, siteLinksSearchBoxSchema, jsonLd, canonicalUrl } from "@/lib/seo";
import {
  ShieldCheck,
  Search,
  Star,
  ArrowRight,
  GraduationCap,
  Video,
  BadgeCheck,
  CheckCircle2,
  Users,
  MapPin,
  Clock,
  IndianRupee,
  ChevronDown,
  Phone,
  Quote,
  Plus,
  Minus,
  BookOpen,
  Award,
  UserCheck,
  Heart,
} from "lucide-react";
import { Button } from "@/components/ui/Button";
import { APP_NAME, APP_TAGLINE, GRADES, SUBJECTS, TIME_SLOTS } from "@/lib/constants";
import { SearchForm } from "@/components/home/SearchForm";

export const metadata: Metadata = buildMetadata({
  title:       `${APP_NAME} — Find Verified Home Tutors Near You`,
  description: "India's trusted home-tutor marketplace. Find verified, background-checked home tutors matched to your child's class, subject, location and schedule. Free demo class guaranteed.",
  canonical:   "/",
  keywords:    [
    "home tutor near me",
    "verified home tutor India",
    "home tuition",
    "find tutor online India",
    "best home tutors",
    "tutor for class 10",
    "CBSE home tutor",
  ],
});

// ─────────────────────────────────────────────────────────────────────────────
// SECTION 1 — Hero
// ─────────────────────────────────────────────────────────────────────────────

function HeroSection() {
  return (
    <section className="relative overflow-hidden bg-brand-950">
      {/* Dot pattern */}
      <div className="absolute inset-0 bg-dot-pattern-white" />

      {/* Radial teal glow */}
      <div
        className="pointer-events-none absolute inset-x-0 top-0 h-[600px]"
        style={{
          background:
            "radial-gradient(ellipse 70% 55% at 50% -5%, rgb(20 184 166 / 0.14), transparent)",
        }}
      />

      <div className="container-page relative pb-0 pt-28 md:pt-36">
        <div className="grid grid-cols-1 gap-12 lg:grid-cols-2 lg:gap-16 lg:items-start">

          {/* ── Left column — copy ────────────────────────────────── */}
          <div className="flex flex-col items-start">
            {/* Brand + tagline pill */}
            <div className="mb-6 flex items-center gap-3">
              <span className="hero-pill">
                <ShieldCheck className="h-4 w-4 text-accent-400" aria-hidden="true" />
                Every tutor is verified &amp; background-checked
              </span>
            </div>

            {/* Brand name */}
            <p className="mb-2 text-sm font-semibold uppercase tracking-widest text-accent-400"
              style={{ letterSpacing: "0.15em" }}>
              {APP_NAME} — {APP_TAGLINE}
            </p>

            {/* Headline */}
            <h1
              className="mb-5 text-4xl font-extrabold leading-[1.06] text-white sm:text-5xl lg:text-6xl"
              style={{ letterSpacing: "-0.03em" }}
            >
              Find a{" "}
              <span className="relative inline-block">
                <span className="relative z-10 text-accent-400">Trusted</span>
                <span
                  className="absolute -bottom-1 left-0 right-0 h-[3px] rounded-full bg-accent-500 opacity-50"
                  aria-hidden="true"
                />
              </span>{" "}
              Tutor{" "}
              <br className="hidden sm:block" />
              Near You
            </h1>

            {/* Sub-headline */}
            <p className="mb-8 max-w-lg text-lg leading-relaxed text-brand-200">
              Connect with verified home tutors who match your child&apos;s
              class, subject, location, schedule and learning needs.
            </p>

            {/* CTAs */}
            <div className="flex flex-wrap gap-3">
              <Link href="/register?role=parent">
                <Button variant="teal" size="lg">
                  Find a Tutor
                  <ArrowRight className="h-4 w-4" aria-hidden="true" />
                </Button>
              </Link>
              <Link href="/register?role=tutor">
                <Button variant="white-outline" size="lg">
                  Become a Tutor
                </Button>
              </Link>
            </div>

            {/* Trust micro-copy */}
            <p className="mt-5 flex items-center gap-2 text-sm text-brand-300">
              <CheckCircle2 className="h-4 w-4 text-accent-500 flex-shrink-0" aria-hidden="true" />
              Free demo class · No commitment until you choose · 100% verified tutors
            </p>
          </div>

          {/* ── Right column — search form card ───────────────────── */}
          <div className="relative pb-0 lg:pb-0">
            <SearchForm />
          </div>
        </div>
      </div>

      {/* Wave divider */}
      <div className="relative mt-16 h-12 overflow-hidden">
        <svg
          viewBox="0 0 1440 48"
          fill="none"
          xmlns="http://www.w3.org/2000/svg"
          className="absolute bottom-0 w-full"
          preserveAspectRatio="none"
        >
          <path
            d="M0 48L60 42.7C120 37.3 240 26.7 360 24C480 21.3 600 26.7 720 29.3C840 32 960 32 1080 29.3C1200 26.7 1320 21.3 1380 18.7L1440 16V48H0Z"
            fill="white"
          />
        </svg>
      </div>
    </section>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// SECTION 2 — Stats
// ─────────────────────────────────────────────────────────────────────────────

const stats = [
  {
    value: "—",
    label: "Verified Tutors",
    sub: "Growing network",
    icon: <Award className="h-6 w-6" />,
  },
  {
    value: "—",
    label: "Students Helped",
    sub: "Across all grades",
    icon: <Users className="h-6 w-6" />,
  },
  {
    value: "—",
    label: "Cities",
    sub: "Starting with Bengaluru",
    icon: <MapPin className="h-6 w-6" />,
  },
  {
    value: "—",
    label: "Successful Matches",
    sub: "Tutor–student pairs",
    icon: <Heart className="h-6 w-6" />,
  },
];

function StatsSection() {
  return (
    <section className="border-b border-neutral-100 bg-white py-12">
      <div className="container-page">
        <div className="grid grid-cols-2 gap-5 lg:grid-cols-4">
          {stats.map((stat) => (
            <div
              key={stat.label}
              className="flex flex-col items-center gap-2 rounded-2xl border border-neutral-100 bg-neutral-50 p-6 text-center"
            >
              <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-brand-50 text-brand-700">
                {stat.icon}
              </div>
              <p
                className="text-3xl font-extrabold text-navy-900"
                style={{ letterSpacing: "-0.03em" }}
                aria-label={`${stat.value} ${stat.label}`}
              >
                {stat.value}
              </p>
              <div>
                <p className="text-sm font-semibold text-navy-900">{stat.label}</p>
                <p className="text-xs text-neutral-400">{stat.sub}</p>
              </div>
            </div>
          ))}
        </div>
        <p className="mt-4 text-center text-xs text-neutral-400">
          — Placeholder values. Real statistics will be displayed once TutorMeet launches.
        </p>
      </div>
    </section>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// SECTION 3 — Why Parents Choose TutorMeet
// ─────────────────────────────────────────────────────────────────────────────

const trustCards = [
  {
    icon: <BadgeCheck className="h-6 w-6" />,
    title: "Verified Tutors",
    desc: "Identity, education and experience reviewed. Every tutor on TutorMeet passes our multi-step verification before reaching you.",
    accent: "bg-accent-50 text-accent-700 border-accent-100",
    iconBg: "bg-accent-100 text-accent-700",
  },
  {
    icon: <MapPin className="h-6 w-6" />,
    title: "Local Matching",
    desc: "Find tutors who are available near you. We match based on your exact locality, pincode, and preferred travel distance.",
    accent: "bg-brand-50 text-brand-700 border-brand-100",
    iconBg: "bg-brand-100 text-brand-700",
  },
  {
    icon: <Video className="h-6 w-6" />,
    title: "Demo Classes",
    desc: "Meet your tutor before committing. Every match includes a free demo class at home — no payment until you're satisfied.",
    accent: "bg-blue-50 text-blue-700 border-blue-100",
    iconBg: "bg-blue-100 text-blue-700",
  },
  {
    icon: <ShieldCheck className="h-6 w-6" />,
    title: "Safe &amp; Trusted",
    desc: "Built around parent and student safety. All tutors are background-screened, and our team provides ongoing support throughout.",
    accent: "bg-emerald-50 text-emerald-700 border-emerald-100",
    iconBg: "bg-emerald-100 text-emerald-700",
  },
];

function WhySection() {
  return (
    <section className="section bg-white">
      <div className="container-page">
        {/* Header */}
        <div className="mb-14 text-center">
          <div className="mb-4 flex justify-center">
            <span className="eyebrow">
              <Star className="h-3.5 w-3.5" aria-hidden="true" />
              Trusted by parents
            </span>
          </div>
          <h2
            className="heading-lg text-balance"
            style={{ letterSpacing: "-0.025em" }}
          >
            Why Parents Choose TutorMeet
          </h2>
          <p className="body-md mx-auto mt-3 max-w-xl text-balance">
            We built verification and safety into every step — not as an
            afterthought, but as the foundation.
          </p>
        </div>

        {/* Cards */}
        <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-4">
          {trustCards.map((card) => (
            <div
              key={card.title}
              className={`flex flex-col gap-4 rounded-2xl border p-6 transition-all duration-200 hover:shadow-sm ${card.accent}`}
            >
              <div
                className={`flex h-12 w-12 items-center justify-center rounded-xl ${card.iconBg}`}
              >
                {card.icon}
              </div>
              <div>
                <h3
                  className="mb-2 text-sm font-bold text-navy-900 leading-snug"
                  style={{ letterSpacing: "-0.01em" }}
                  dangerouslySetInnerHTML={{ __html: card.title }}
                />
                <p className="text-sm leading-relaxed text-neutral-600">
                  {card.desc}
                </p>
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// SECTION 4 — How TutorMeet Works
// ─────────────────────────────────────────────────────────────────────────────

const steps = [
  {
    number: "1",
    icon: <BookOpen className="h-5 w-5" />,
    title: "Tell Us What You Need",
    desc: "Share your child's class, subjects, location, preferred schedule and budget. Takes under 3 minutes.",
    color: "bg-brand-900",
  },
  {
    number: "2",
    icon: <Search className="h-5 w-5" />,
    title: "We Find Suitable Tutors",
    desc: "Our team reviews verified tutors in your area and shortlists those that match your exact requirements.",
    color: "bg-brand-700",
  },
  {
    number: "3",
    icon: <UserCheck className="h-5 w-5" />,
    title: "Meet Your Tutor",
    desc: "Attend a free demo class at home. Meet your shortlisted tutors before making any commitment.",
    color: "bg-accent-600",
  },
  {
    number: "4",
    icon: <GraduationCap className="h-5 w-5" />,
    title: "Start Learning",
    desc: "Choose your tutor and begin. TutorMeet handles attendance tracking, reviews, and ongoing support.",
    color: "bg-accent-500",
  },
];

function HowItWorksSection() {
  return (
    <section className="section bg-neutral-50">
      <div className="container-page">
        {/* Header */}
        <div className="mb-14 text-center">
          <div className="mb-4 flex justify-center">
            <span className="eyebrow-navy">How It Works</span>
          </div>
          <h2
            className="heading-lg text-balance"
            style={{ letterSpacing: "-0.025em" }}
          >
            How TutorMeet Works
          </h2>
          <p className="body-md mx-auto mt-3 max-w-xl text-balance">
            From your first request to your first class — in under 48 hours.
          </p>
        </div>

        {/* Steps */}
        <div className="relative grid grid-cols-1 gap-8 md:grid-cols-2 lg:grid-cols-4">
          {/* Connector line — desktop */}
          <div
            className="pointer-events-none absolute top-[20px] hidden h-px bg-neutral-200 lg:block"
            style={{ left: "13%", right: "13%" }}
            aria-hidden="true"
          />

          {steps.map((step) => (
            <div
              key={step.number}
              className="flex flex-col items-center text-center"
            >
              {/* Circle with number */}
              <div className="relative z-10 mb-5">
                <div
                  className={`flex h-10 w-10 items-center justify-center rounded-full text-sm font-extrabold text-white shadow-md ${step.color}`}
                >
                  {step.number}
                </div>
              </div>

              {/* Icon box */}
              <div className="mb-4 flex h-12 w-12 items-center justify-center rounded-2xl border border-neutral-200 bg-white shadow-xs text-brand-700">
                {step.icon}
              </div>

              <h3
                className="mb-2 text-sm font-bold text-navy-900"
                style={{ letterSpacing: "-0.01em" }}
              >
                {step.title}
              </h3>
              <p className="text-sm leading-relaxed text-neutral-500">
                {step.desc}
              </p>
            </div>
          ))}
        </div>

        {/* CTA */}
        <div className="mt-12 flex justify-center">
          <Link href="/register?role=parent">
            <Button variant="primary" size="lg">
              Get Started — It&apos;s Free
              <ArrowRight className="h-4 w-4" aria-hidden="true" />
            </Button>
          </Link>
        </div>
      </div>
    </section>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// SECTION 5 — Sample tutor profiles
// ─────────────────────────────────────────────────────────────────────────────

const sampleTutors = [
  {
    name:     "Priya Nair",
    initials: "PN",
    subjects: ["Mathematics", "Physics"],
    grade:    "Class 9–12",
    exp:      "6 yrs",
    fee:      "₹600/hr",
    location: "Indiranagar, Bengaluru",
    rating:   4.9,
    reviews:  38,
    color:    "bg-brand-100 text-brand-800",
  },
  {
    name:     "Rahul Sharma",
    initials: "RS",
    subjects: ["English", "Social Studies"],
    grade:    "Class 5–8",
    exp:      "4 yrs",
    fee:      "₹400/hr",
    location: "Koramangala, Bengaluru",
    rating:   4.8,
    reviews:  24,
    color:    "bg-accent-100 text-accent-800",
  },
  {
    name:     "Ananya Iyer",
    initials: "AI",
    subjects: ["Chemistry", "Biology"],
    grade:    "Class 11–12",
    exp:      "8 yrs",
    fee:      "₹750/hr",
    location: "HSR Layout, Bengaluru",
    rating:   5.0,
    reviews:  51,
    color:    "bg-purple-100 text-purple-800",
  },
];

function SampleTutorsSection() {
  return (
    <section className="section bg-white">
      <div className="container-page">
        <div className="mb-12 text-center">
          <div className="mb-4 flex justify-center">
            <span className="eyebrow">
              <BadgeCheck className="h-3.5 w-3.5" aria-hidden="true" />
              Sample profiles
            </span>
          </div>
          <h2
            className="heading-lg text-balance"
            style={{ letterSpacing: "-0.025em" }}
          >
            The quality you can expect
          </h2>
          <p className="body-md mx-auto mt-3 max-w-md text-balance">
            Every tutor on TutorMeet has passed our rigorous multi-step
            verification process. Here&apos;s what the profiles look like.
          </p>
        </div>

        <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-3">
          {sampleTutors.map((tutor) => (
            <div
              key={tutor.name}
              className="flex flex-col overflow-hidden rounded-2xl border border-neutral-200 bg-white shadow-xs transition-all duration-200 hover:border-brand-200 hover:shadow-md"
            >
              {/* Top accent strip */}
              <div className="h-1 w-full bg-gradient-to-r from-brand-900 via-brand-700 to-accent-500" />

              <div className="flex flex-1 flex-col gap-4 p-5">
                {/* Header */}
                <div className="flex items-center gap-3.5">
                  <div
                    className={`flex h-12 w-12 flex-shrink-0 items-center justify-center rounded-full text-sm font-bold ${tutor.color}`}
                  >
                    {tutor.initials}
                  </div>
                  <div className="min-w-0">
                    <div className="flex flex-wrap items-center gap-2">
                      <p className="text-sm font-bold text-navy-900">{tutor.name}</p>
                      <span className="verified-badge">
                        <BadgeCheck className="h-3 w-3" />
                        Verified
                      </span>
                    </div>
                    <p className="mt-0.5 flex items-center gap-1 text-xs text-neutral-400">
                      <MapPin className="h-3 w-3 flex-shrink-0" />
                      {tutor.location}
                    </p>
                  </div>
                </div>

                {/* Subject tags */}
                <div className="flex flex-wrap gap-1.5">
                  {tutor.subjects.map((s) => (
                    <span key={s} className="tag">{s}</span>
                  ))}
                  <span className="tag text-neutral-400">{tutor.grade}</span>
                </div>

                {/* Stats row */}
                <div className="flex items-center gap-4 border-t border-neutral-100 pt-3 text-xs">
                  <span className="flex items-center gap-1 text-neutral-500">
                    <Clock className="h-3.5 w-3.5 text-neutral-400" />
                    {tutor.exp}
                  </span>
                  <span className="flex items-center gap-1 font-semibold text-navy-800">
                    <IndianRupee className="h-3.5 w-3.5 text-neutral-400" />
                    {tutor.fee}
                  </span>
                  <span className="ml-auto flex items-center gap-1">
                    <Star className="h-3.5 w-3.5 fill-amber-400 text-amber-400" />
                    <span className="font-semibold text-navy-900">{tutor.rating}</span>
                    <span className="text-neutral-400">({tutor.reviews})</span>
                  </span>
                </div>
              </div>
            </div>
          ))}
        </div>

        <p className="mt-6 text-center text-xs text-neutral-400">
          Sample profiles for illustration only. Real matched tutors will be shortlisted
          based on your specific requirement.
        </p>
      </div>
    </section>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// SECTION 6 — For Tutors
// ─────────────────────────────────────────────────────────────────────────────

function ForTutorsSection() {
  const benefits = [
    "Free registration — no listing or commission fee",
    "TutorMeet Verified badge builds parent trust instantly",
    "Students come to you — no cold calling or marketing",
    "Track attendance, sessions, and earnings in one place",
    "Get matched with students who need exactly what you teach",
  ];

  return (
    <section className="section bg-neutral-50">
      <div className="container-page">
        <div className="overflow-hidden rounded-3xl bg-brand-900">
          <div className="relative bg-dot-pattern-white">
            <div className="relative z-10 grid grid-cols-1 gap-12 p-8 md:grid-cols-2 md:items-center md:p-12 lg:gap-16 lg:p-16">

              {/* Left — copy */}
              <div>
                <span className="eyebrow mb-6 inline-flex">
                  <GraduationCap className="h-3.5 w-3.5" aria-hidden="true" />
                  Are You a Teacher?
                </span>

                <h2
                  className="mb-4 text-3xl font-extrabold leading-tight text-white md:text-4xl"
                  style={{ letterSpacing: "-0.025em" }}
                >
                  Join TutorMeet and{" "}
                  <span className="text-accent-400">connect with students</span>{" "}
                  looking for tutors in your area.
                </h2>

                <p className="mb-8 text-base leading-relaxed text-brand-200">
                  Whether you&apos;re an experienced tutor or just starting
                  out, TutorMeet gives you the tools and the students to build
                  a thriving teaching career.
                </p>

                <ul className="mb-8 space-y-3">
                  {benefits.map((b) => (
                    <li
                      key={b}
                      className="flex items-start gap-3 text-sm text-brand-100"
                    >
                      <CheckCircle2
                        className="mt-0.5 h-4 w-4 flex-shrink-0 text-accent-400"
                        aria-hidden="true"
                      />
                      {b}
                    </li>
                  ))}
                </ul>

                <Link href="/register?role=tutor">
                  <Button variant="teal" size="lg">
                    Become a Tutor
                    <ArrowRight className="h-4 w-4" aria-hidden="true" />
                  </Button>
                </Link>
              </div>

              {/* Right — mini stats */}
              <div className="grid grid-cols-2 gap-4">
                {[
                  { label: "Registration",  value: "Free",  sub: "No listing fee ever" },
                  { label: "Demo class",    value: "Free",  sub: "Build trust fast" },
                  { label: "Verification",  value: "~5 days", sub: "After documents" },
                  { label: "First match",   value: "Soon",  sub: "After verification" },
                ].map((item) => (
                  <div
                    key={item.label}
                    className="flex flex-col items-center rounded-2xl border border-white/10 bg-white/5 px-4 py-5 text-center backdrop-blur-sm"
                  >
                    <span
                      className="text-2xl font-extrabold text-white"
                      style={{ letterSpacing: "-0.03em" }}
                    >
                      {item.value}
                    </span>
                    <span className="mt-1 text-xs font-semibold text-brand-300">
                      {item.label}
                    </span>
                    <span className="text-2xs text-brand-400">{item.sub}</span>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// SECTION 7 — Testimonials
// ─────────────────────────────────────────────────────────────────────────────

const testimonials = [
  {
    quote:
      "TutorMeet found us an excellent Maths tutor for our daughter within two days. The verification process gave us complete confidence — we knew exactly who was coming home.",
    name:    "Meera Krishnamurthy",
    role:    "Parent · Koramangala, Bengaluru",
    initial: "MK",
    color:   "bg-brand-100 text-brand-800",
    rating:  5,
  },
  {
    quote:
      "As a tutor, I was tired of platforms that take huge commissions. TutorMeet sent me genuine students in my area within a week of getting verified. No commission, no gimmicks.",
    name:    "Suresh Patel",
    role:    "Tutor · Mathematics · HSR Layout",
    initial: "SP",
    color:   "bg-accent-100 text-accent-800",
    rating:  5,
  },
  {
    quote:
      "The free demo class was a game-changer. We tried two tutors before choosing the one who clicked with our son. No pressure, no payment until we were sure. Highly recommend.",
    name:    "Anjali & Rajesh Nambiar",
    role:    "Parents · Indiranagar, Bengaluru",
    initial: "AN",
    color:   "bg-purple-100 text-purple-800",
    rating:  5,
  },
];

function TestimonialsSection() {
  return (
    <section className="section bg-white">
      <div className="container-page">
        {/* Header */}
        <div className="mb-12 text-center">
          <div className="mb-4 flex justify-center">
            <span className="eyebrow">
              <Star className="h-3.5 w-3.5" aria-hidden="true" />
              What people say
            </span>
          </div>
          <h2
            className="heading-lg text-balance"
            style={{ letterSpacing: "-0.025em" }}
          >
            Trusted by parents and tutors
          </h2>
          <p className="body-md mx-auto mt-3 max-w-md text-balance">
            Real feedback from our community.
          </p>
        </div>

        <div className="grid grid-cols-1 gap-5 md:grid-cols-3">
          {testimonials.map((t) => (
            <div
              key={t.name}
              className="flex flex-col gap-5 rounded-2xl border border-neutral-200 bg-white p-6 shadow-xs"
            >
              {/* Stars */}
              <div className="flex gap-0.5">
                {Array.from({ length: t.rating }).map((_, i) => (
                  <Star
                    key={i}
                    className="h-4 w-4 fill-amber-400 text-amber-400"
                    aria-hidden="true"
                  />
                ))}
              </div>

              {/* Quote */}
              <div className="relative flex-1">
                <Quote
                  className="absolute -left-1 -top-1 h-6 w-6 text-neutral-100"
                  aria-hidden="true"
                />
                <p className="relative text-sm leading-relaxed text-neutral-600 italic">
                  &ldquo;{t.quote}&rdquo;
                </p>
              </div>

              {/* Attribution */}
              <div className="flex items-center gap-3 border-t border-neutral-100 pt-4">
                <div
                  className={`flex h-9 w-9 flex-shrink-0 items-center justify-center rounded-full text-xs font-bold ${t.color}`}
                >
                  {t.initial}
                </div>
                <div>
                  <p className="text-sm font-semibold text-navy-900">{t.name}</p>
                  <p className="text-xs text-neutral-400">{t.role}</p>
                </div>
              </div>
            </div>
          ))}
        </div>

        <p className="mt-6 text-center text-xs text-neutral-400">
          Sample testimonials for illustration only. Real reviews will appear once TutorMeet launches.
        </p>
      </div>
    </section>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// SECTION 8 — FAQ
// ─────────────────────────────────────────────────────────────────────────────

const faqs = [
  {
    q: "Is TutorMeet free for parents?",
    a: "Yes. Finding a tutor, attending a demo class, and using the parent portal is completely free. You pay only the tutor's agreed fee directly.",
  },
  {
    q: "How are tutors verified on TutorMeet?",
    a: "Every tutor submits government-issued ID, education certificates, and experience documents. Our team reviews these, conducts a knowledge assessment, and completes a personal interview before granting verified status.",
  },
  {
    q: "How long does matching take?",
    a: "We aim to shortlist suitable tutors within 48 hours of receiving your requirement. For specific subjects or unusual timings, it may take slightly longer.",
  },
  {
    q: "What is a demo class?",
    a: "A free introductory session at your home between your child and the shortlisted tutor. It helps you evaluate teaching style and compatibility before committing — with no payment required.",
  },
  {
    q: "Can I change my tutor later?",
    a: "Yes. If the tutor isn't working out, contact TutorMeet support and we'll find a replacement from our verified network.",
  },
  {
    q: "Which subjects and grades do you cover?",
    a: "We cover all major subjects from Nursery to Class 12, undergraduate tutoring, and competitive exam preparation including JEE, NEET, and board exams across CBSE, ICSE, State Board, IB, and IGCSE.",
  },
  {
    q: "Is TutorMeet available in my city?",
    a: "TutorMeet is launching in Bengaluru first and will expand to other cities. Join the waitlist to be notified when we launch in your city.",
  },
  {
    q: "How does TutorMeet handle payments?",
    a: "In the current phase, fees are paid directly between parents and tutors. TutorMeet provides session records and attendance tracking to support payment clarity. Integrated payments are planned for a future release.",
  },
];

function FAQSection() {
  return (
    <section className="section bg-neutral-50">
      <div className="container-page">
        <div className="mb-12 text-center">
          <div className="mb-4 flex justify-center">
            <span className="eyebrow-navy">FAQ</span>
          </div>
          <h2
            className="heading-lg text-balance"
            style={{ letterSpacing: "-0.025em" }}
          >
            Frequently Asked Questions
          </h2>
          <p className="body-md mx-auto mt-3 max-w-md text-balance">
            Everything you need to know before getting started.
          </p>
        </div>

        <div className="mx-auto max-w-3xl divide-y divide-neutral-200 rounded-2xl border border-neutral-200 bg-white shadow-xs">
          {faqs.map((faq, i) => (
            <FAQItem key={i} question={faq.q} answer={faq.a} />
          ))}
        </div>

        <p className="mt-8 text-center text-sm text-neutral-500">
          Still have questions?{" "}
          <Link
            href="/about#contact"
            className="font-semibold text-brand-600 hover:text-brand-700 underline-offset-2 hover:underline"
          >
            Contact our team
          </Link>
        </p>
      </div>
    </section>
  );
}

// FAQ item — server-rendered using details/summary for no-JS accordion
function FAQItem({ question, answer }: { question: string; answer: string }) {
  return (
    <details className="group px-6 py-5">
      <summary className="flex cursor-pointer list-none items-start justify-between gap-4 text-sm font-semibold text-navy-900 [&::-webkit-details-marker]:hidden">
        <span className="leading-snug">{question}</span>
        <span className="mt-0.5 flex-shrink-0 text-neutral-400 transition-transform group-open:rotate-180">
          <ChevronDown className="h-5 w-5" />
        </span>
      </summary>
      <p className="mt-3 text-sm leading-relaxed text-neutral-500">{answer}</p>
    </details>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// SECTION 9 — Final CTA
// ─────────────────────────────────────────────────────────────────────────────

function FinalCTASection() {
  return (
    <section className="section bg-white">
      <div className="container-page">
        <div className="mx-auto max-w-2xl text-center">
          <div className="mb-5 flex justify-center">
            <span className="eyebrow">
              <ShieldCheck className="h-3.5 w-3.5" aria-hidden="true" />
              Get started today
            </span>
          </div>

          <h2
            className="heading-lg mb-4 text-balance"
            style={{ letterSpacing: "-0.025em" }}
          >
            Ready to find the right tutor?
          </h2>

          <p className="body-md mb-10 text-balance">
            Submit your requirement in 3 minutes. Our team shortlists verified
            tutors within 48 hours — completely free.
          </p>

          <div className="flex flex-col items-center gap-3 sm:flex-row sm:justify-center">
            <Link href="/register?role=parent">
              <Button variant="primary" size="lg">
                Find a Tutor — It&apos;s Free
                <ArrowRight className="h-4 w-4" aria-hidden="true" />
              </Button>
            </Link>
            <Link href="/for-parents">
              <Button variant="ghost" size="lg">
                Learn how it works
              </Button>
            </Link>
          </div>

          <p className="mt-8 flex flex-wrap items-center justify-center gap-x-5 gap-y-2 text-sm text-neutral-400">
            <span className="flex items-center gap-1.5">
              <CheckCircle2 className="h-4 w-4 text-accent-500" aria-hidden="true" />
              No signup to browse
            </span>
            <span className="flex items-center gap-1.5">
              <CheckCircle2 className="h-4 w-4 text-accent-500" aria-hidden="true" />
              Free demo class
            </span>
            <span className="flex items-center gap-1.5">
              <CheckCircle2 className="h-4 w-4 text-accent-500" aria-hidden="true" />
              No commitment until you choose
            </span>
          </p>
        </div>
      </div>
    </section>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// PAGE
// ─────────────────────────────────────────────────────────────────────────────

export default function HomePage() {
  return (
    <>
      {/* Structured data — site-wide search box hint for Google */}
      <script key="ld-searchbox" {...jsonLd(siteLinksSearchBoxSchema())} />
      {/* FAQ structured data drawn from the FAQ section below */}
      <script key="ld-faq" {...jsonLd(faqSchema(faqs.map((f) => ({ question: f.q, answer: f.a }))))} />
      <HeroSection />
      <StatsSection />
      <WhySection />
      <HowItWorksSection />
      <SampleTutorsSection />
      <ForTutorsSection />
      <TestimonialsSection />
      <FAQSection />
      <FinalCTASection />
    </>
  );
}
