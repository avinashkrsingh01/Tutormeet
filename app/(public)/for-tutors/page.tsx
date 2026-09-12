import type { Metadata } from "next";
import Link from "next/link";
import {
  UserPlus, FileText, ClipboardCheck, BadgeCheck, BookOpen,
  IndianRupee, CalendarCheck, TrendingUp, ArrowRight, CheckCircle2, Star,
} from "lucide-react";
import { Button } from "@/components/ui/Button";
import { buildMetadata, faqSchema, breadcrumbSchema, jsonLd } from "@/lib/seo";

export const metadata: Metadata = buildMetadata({
  title:       "Become a Verified Home Tutor — Join TutorMeet",
  description: "Register as a home tutor on TutorMeet, get verified, and receive matched students in your area. Free to join. Students come to you.",
  canonical:   "/for-tutors",
  keywords:    [
    "become a home tutor India",
    "register as tutor online",
    "tutor jobs near me",
    "earn as home tutor",
    "verified tutor network India",
    "teach from home India",
    "private tutor registration",
  ],
});

const steps = [
  {
    icon: <UserPlus className="h-6 w-6" />,
    title: "Register & create profile",
    desc: "Create your tutor profile. Add your subjects, grades, location, availability, and fee expectations.",
  },
  {
    icon: <FileText className="h-6 w-6" />,
    title: "Upload documents",
    desc: "Upload your identity proof and education certificates securely. Reviewed only by our verification team.",
  },
  {
    icon: <ClipboardCheck className="h-6 w-6" />,
    title: "Take knowledge assessment",
    desc: "A short subject assessment conducted by TutorMeet to confirm your teaching knowledge.",
  },
  {
    icon: <BadgeCheck className="h-6 w-6" />,
    title: "Get verified",
    desc: "Our team reviews your application and conducts a brief interview. Once approved, you're verified.",
  },
  {
    icon: <BookOpen className="h-6 w-6" />,
    title: "Receive student matches",
    desc: "Parents submit requirements, we match you. You accept or decline — full control over your schedule.",
  },
];

const benefits = [
  {
    icon: <TrendingUp className="h-6 w-6" />,
    title: "Students come to you",
    desc: "No marketing, no self-promotion. TutorMeet handles matchmaking so you focus on teaching.",
  },
  {
    icon: <BadgeCheck className="h-6 w-6" />,
    title: "Verified badge builds trust",
    desc: "The TutorMeet verified badge signals to parents that you've been rigorously screened.",
  },
  {
    icon: <IndianRupee className="h-6 w-6" />,
    title: "Set your own fee",
    desc: "You decide your hourly rate. TutorMeet never takes a cut from your tuition fees.",
  },
  {
    icon: <CalendarCheck className="h-6 w-6" />,
    title: "Manage your schedule",
    desc: "Accept or decline student requests. Mark attendance. Track your sessions — all in one place.",
  },
  {
    icon: <Star className="h-6 w-6" />,
    title: "Build your reputation",
    desc: "Earn verified reviews from parents. The more you teach, the stronger your profile.",
  },
];

const eligibility = [
  "Minimum graduation in any discipline",
  "Valid government-issued photo ID",
  "Subject proficiency in the grades you want to teach",
  "Willingness to undergo a knowledge assessment and interview",
  "Availability for at least 5 hours per week",
];

const faqs = [
  {
    q: "Is registration free?",
    a: "Yes. Creating a tutor profile and going through verification is completely free. TutorMeet does not charge tutors any registration or listing fee.",
  },
  {
    q: "How long does verification take?",
    a: "Typically 3–5 working days after you submit all documents and complete the assessment.",
  },
  {
    q: "Do I need a degree to register?",
    a: "You need at least a graduation degree. For school-level tutoring up to Class 10, relevant qualifications and strong subject knowledge are assessed.",
  },
  {
    q: "Can I teach multiple subjects?",
    a: "Yes. You can list all the subjects and grades you're qualified to teach. Each subject may require a separate knowledge assessment.",
  },
  {
    q: "How do I get paid?",
    a: "For the MVP, payment is directly between you and the parent. TutorMeet provides the attendance and session record to support payment clarity.",
  },
];

export default function ForTutorsPage() {
  return (
    <>
      <script key="ld-breadcrumb" {...jsonLd(breadcrumbSchema([
        { name: "Home",       href: "/" },
        { name: "For Tutors", href: "/for-tutors" },
      ]))} />
      <script key="ld-faq" {...jsonLd(faqSchema(faqs.map((f) => ({ question: f.q, answer: f.a }))))} />
      {/* Hero */}
      <section className="bg-gradient-to-b from-slate-900 to-brand-900 py-16 text-white md:py-24">
        <div className="container-page text-center">
          <span className="mb-4 inline-flex items-center gap-2 rounded-full bg-white/10 px-4 py-1.5 text-sm font-medium text-white/90">
            <BadgeCheck className="h-4 w-4" />
            Verified tutor network
          </span>
          <h1 className="mb-6 text-4xl font-extrabold md:text-5xl">
            Teach more.{" "}
            <span className="text-accent-400">Earn more.</span>
          </h1>
          <p className="mx-auto mb-10 max-w-2xl text-lg text-blue-200">
            Join TutorMeet&apos;s growing network of verified home tutors. We
            match you with students who need exactly what you teach — so you can
            focus on what matters.
          </p>
          <div className="flex flex-col items-center gap-4 sm:flex-row sm:justify-center">
            <Link href="/register?role=tutor">
              <Button
                size="lg"
                className="bg-accent-500 text-white hover:bg-accent-600 focus:ring-accent-400"
              >
                Apply Now — It&apos;s Free
                <ArrowRight className="h-4 w-4" />
              </Button>
            </Link>
            <Link href="/login">
              <Button
                size="lg"
                variant="ghost"
                className="border border-white/30 text-white hover:bg-white/10"
              >
                Already registered? Sign in
              </Button>
            </Link>
          </div>
        </div>
      </section>

      {/* How verification works */}
      <section className="section bg-white">
        <div className="container-page">
          <h2 className="mb-12 text-center text-3xl font-bold text-slate-900">
            Your path to becoming a verified tutor
          </h2>
          <div className="grid grid-cols-1 gap-6 md:grid-cols-5">
            {steps.map((step, i) => (
              <div
                key={step.title}
                className="flex flex-col items-center text-center"
              >
                <div className="mb-4 flex h-12 w-12 items-center justify-center rounded-full bg-brand-600 text-white">
                  {step.icon}
                </div>
                <div className="mb-1 text-xs font-semibold uppercase tracking-wide text-brand-500">
                  Step {i + 1}
                </div>
                <h3 className="mb-2 text-sm font-semibold text-slate-900">
                  {step.title}
                </h3>
                <p className="text-xs leading-relaxed text-gray-500">
                  {step.desc}
                </p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Benefits */}
      <section className="section bg-gray-50">
        <div className="container-page">
          <h2 className="mb-12 text-center text-3xl font-bold text-slate-900">
            Why tutors choose TutorMeet
          </h2>
          <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3">
            {benefits.map((b) => (
              <div key={b.title} className="card p-6">
                <div className="mb-4 flex h-11 w-11 items-center justify-center rounded-xl bg-brand-100 text-brand-600">
                  {b.icon}
                </div>
                <h3 className="mb-2 font-semibold text-slate-900">{b.title}</h3>
                <p className="text-sm leading-relaxed text-gray-500">{b.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Eligibility */}
      <section className="section bg-brand-900">
        <div className="container-page">
          <div className="mx-auto max-w-2xl text-center">
            <h2 className="mb-4 text-3xl font-bold text-white">
              Who can apply?
            </h2>
            <p className="mb-10 text-blue-200">
              We maintain high standards so parents can trust every tutor on the
              platform.
            </p>
            <ul className="space-y-4 text-left">
              {eligibility.map((item) => (
                <li
                  key={item}
                  className="flex items-start gap-3 rounded-lg bg-white/10 px-5 py-4 text-sm text-white"
                >
                  <CheckCircle2 className="mt-0.5 h-5 w-5 flex-shrink-0 text-accent-400" />
                  {item}
                </li>
              ))}
            </ul>
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
      <section className="section bg-gray-50">
        <div className="container-page text-center">
          <h2 className="mb-4 text-3xl font-bold text-slate-900">
            Ready to join the network?
          </h2>
          <p className="mb-8 text-gray-500">
            Free to register. Get verified in 3–5 days. Start receiving students.
          </p>
          <Link href="/register?role=tutor">
            <Button size="lg" className="bg-accent-500 text-white hover:bg-accent-600">
              Apply as a Tutor
              <ArrowRight className="h-4 w-4" />
            </Button>
          </Link>
        </div>
      </section>
    </>
  );
}
