import type { Metadata } from "next";
import Link from "next/link";
import {
  ClipboardList, Search, Video, GraduationCap,
  ShieldCheck, Star, CalendarCheck, MessageCircle,
  ArrowRight, CheckCircle2,
} from "lucide-react";
import { Button } from "@/components/ui/Button";
import { buildMetadata, faqSchema, breadcrumbSchema, jsonLd } from "@/lib/seo";

export const metadata: Metadata = buildMetadata({
  title:       "For Parents — Find a Verified Home Tutor for Your Child",
  description: "Learn how TutorMeet helps parents find verified, qualified home tutors matched to their child's exact class, subject, board and location. Free demo class included.",
  canonical:   "/for-parents",
  keywords:    [
    "find home tutor for child",
    "home tuition for kids India",
    "verified tutor for CBSE",
    "how to find private tutor",
    "best home tutors India",
    "tutor matching service India",
  ],
});

const steps = [
  {
    icon: <ClipboardList className="h-6 w-6" />,
    title: "Submit your requirement",
    desc: "Tell us the subject, grade, board, location, schedule, and budget. Takes 3 minutes. No account needed to start.",
  },
  {
    icon: <Search className="h-6 w-6" />,
    title: "We match the right tutors",
    desc: "Our team reviews verified tutors in your locality and shortlists those who match your child's exact requirements.",
  },
  {
    icon: <Video className="h-6 w-6" />,
    title: "Free demo class",
    desc: "Meet your shortlisted tutors. Attend a free demo session at home before making any commitment.",
  },
  {
    icon: <GraduationCap className="h-6 w-6" />,
    title: "Start tuition",
    desc: "Choose your tutor and begin. TutorMeet handles attendance tracking, reviews, and ongoing support.",
  },
];

const trustItems = [
  "Government-issued ID verified",
  "Education certificates checked",
  "Subject knowledge tested",
  "Personal interview conducted",
  "Teaching assessment completed",
  "Background screened",
];

const features = [
  {
    icon: <ShieldCheck className="h-6 w-6" />,
    title: "100% verified tutors",
    desc: "Every tutor on TutorMeet passes a rigorous multi-step verification before getting listed.",
  },
  {
    icon: <Star className="h-6 w-6" />,
    title: "Real parent reviews",
    desc: "Ratings and reviews from verified parents only — not fabricated testimonials.",
  },
  {
    icon: <CalendarCheck className="h-6 w-6" />,
    title: "Attendance tracking",
    desc: "Monitor your child's sessions through the parent dashboard. Know exactly what's happening.",
  },
  {
    icon: <MessageCircle className="h-6 w-6" />,
    title: "Ongoing support",
    desc: "TutorMeet support is available if you ever have concerns about your tutor.",
  },
];

const faqs = [
  {
    q: "Is TutorMeet free for parents?",
    a: "Yes. Finding a tutor, attending a demo class, and using the parent portal is completely free. You only pay the tutor's fee directly.",
  },
  {
    q: "How long does matching take?",
    a: "We aim to shortlist suitable tutors within 48 hours of receiving your requirement.",
  },
  {
    q: "Can I change my tutor later?",
    a: "Yes. If you're not satisfied, contact TutorMeet support and we'll find a replacement.",
  },
  {
    q: "Which subjects and grades do you cover?",
    a: "All major subjects from Nursery to Class 12, undergraduate tutoring, and competitive exam preparation (JEE, NEET, etc.).",
  },
  {
    q: "Do tutors come home or does my child go to them?",
    a: "You choose. TutorMeet supports home visits by the tutor, sessions at the tutor's home, or both.",
  },
];

export default function ForParentsPage() {
  return (
    <>
      <script key="ld-breadcrumb" {...jsonLd(breadcrumbSchema([
        { name: "Home",        href: "/" },
        { name: "For Parents", href: "/for-parents" },
      ]))} />
      <script key="ld-faq" {...jsonLd(faqSchema(faqs.map((f) => ({ question: f.q, answer: f.a }))))} />
      {/* Hero */}
      <section className="bg-gradient-to-b from-brand-50 to-white py-16 md:py-24">
        <div className="container-page text-center">
          <span className="mb-4 inline-flex items-center gap-2 rounded-full bg-brand-100 px-4 py-1.5 text-sm font-medium text-brand-700">
            <ShieldCheck className="h-4 w-4" />
            Every tutor is verified
          </span>
          <h1 className="mb-6 text-4xl font-extrabold text-slate-900 md:text-5xl">
            Find the right home tutor{" "}
            <span className="text-brand-600">for your child</span>
          </h1>
          <p className="mx-auto mb-10 max-w-2xl text-lg text-gray-500">
            TutorMeet is not just a tutor directory. We vet every tutor, match
            them to your requirement, and support you throughout the tuition
            journey.
          </p>
          <Link href="/register?role=parent">
            <Button size="lg">
              Submit Your Requirement
              <ArrowRight className="h-4 w-4" />
            </Button>
          </Link>
        </div>
      </section>

      {/* How it works */}
      <section className="section bg-white">
        <div className="container-page">
          <h2 className="mb-12 text-center text-3xl font-bold text-slate-900">
            How it works
          </h2>
          <div className="grid grid-cols-1 gap-8 sm:grid-cols-2 lg:grid-cols-4">
            {steps.map((step, i) => (
              <div
                key={step.title}
                className="flex flex-col items-start rounded-xl border border-gray-100 bg-gray-50 p-6"
              >
                <div className="mb-4 flex h-11 w-11 items-center justify-center rounded-full bg-brand-600 text-white">
                  {step.icon}
                </div>
                <div className="mb-1 text-xs font-semibold uppercase tracking-wide text-brand-500">
                  Step {i + 1}
                </div>
                <h3 className="mb-2 font-semibold text-slate-900">
                  {step.title}
                </h3>
                <p className="text-sm leading-relaxed text-gray-500">
                  {step.desc}
                </p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Trust section */}
      <section className="section bg-brand-900">
        <div className="container-page">
          <div className="grid grid-cols-1 gap-10 md:grid-cols-2 md:items-center">
            <div>
              <h2 className="mb-4 text-3xl font-bold text-white">
                What TutorMeet verifies for every tutor
              </h2>
              <p className="mb-8 text-blue-200">
                Before a tutor appears on TutorMeet, they complete a thorough
                multi-step verification conducted by our team.
              </p>
              <ul className="grid grid-cols-1 gap-3 sm:grid-cols-2">
                {trustItems.map((item) => (
                  <li
                    key={item}
                    className="flex items-center gap-2 text-sm text-blue-100"
                  >
                    <CheckCircle2 className="h-4 w-4 flex-shrink-0 text-accent-400" />
                    {item}
                  </li>
                ))}
              </ul>
            </div>
            <div className="grid grid-cols-2 gap-4">
              {features.map((f) => (
                <div
                  key={f.title}
                  className="rounded-xl bg-white/10 p-5 backdrop-blur-sm"
                >
                  <div className="mb-3 text-accent-400">{f.icon}</div>
                  <h3 className="mb-1 text-sm font-semibold text-white">
                    {f.title}
                  </h3>
                  <p className="text-xs leading-relaxed text-blue-200">
                    {f.desc}
                  </p>
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* FAQ */}
      <section className="section bg-white">
        <div className="container-page">
          <h2 className="mb-10 text-center text-3xl font-bold text-slate-900">
            Frequently asked questions
          </h2>
          <div className="mx-auto max-w-2xl divide-y divide-gray-100">
            {faqs.map((faq) => (
              <div key={faq.q} className="py-5">
                <h3 className="mb-2 font-semibold text-slate-900">{faq.q}</h3>
                <p className="text-sm leading-relaxed text-gray-500">{faq.a}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA */}
      <section className="section bg-brand-50">
        <div className="container-page text-center">
          <h2 className="mb-4 text-3xl font-bold text-slate-900">
            Ready to find your tutor?
          </h2>
          <p className="mb-8 text-gray-500">
            It&apos;s free. Takes 3 minutes. No commitment until you choose.
          </p>
          <Link href="/register?role=parent">
            <Button size="lg">
              Get Started — Free
              <ArrowRight className="h-4 w-4" />
            </Button>
          </Link>
        </div>
      </section>
    </>
  );
}
