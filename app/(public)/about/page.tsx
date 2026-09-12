import type { Metadata } from "next";
import Link from "next/link";
import { ShieldCheck, Target, Heart, ArrowRight } from "lucide-react";
import { Button } from "@/components/ui/Button";
import { buildMetadata, breadcrumbSchema, organizationSchema, jsonLd } from "@/lib/seo";

export const metadata: Metadata = buildMetadata({
  title:       "About TutorMeet — India's Trusted Home Tutor Marketplace",
  description: "TutorMeet connects parents and students with verified, background-checked home tutors in India. Built on trust, matching, and ongoing support — not just a listing service.",
  canonical:   "/about",
  keywords:    [
    "about TutorMeet",
    "TutorMeet India",
    "home tutor marketplace India",
    "verified tutor platform",
    "tutor matching service",
  ],
});

const values = [
  {
    icon: <ShieldCheck className="h-6 w-6" />,
    title: "Trust above all",
    desc: "Every tutor is verified before they reach a parent. Identity, education, and teaching ability — all checked.",
  },
  {
    icon: <Target className="h-6 w-6" />,
    title: "Matching, not listing",
    desc: "We don't dump a list of 200 tutors on you. Our team shortlists tutors that genuinely fit your child's needs.",
  },
  {
    icon: <Heart className="h-6 w-6" />,
    title: "Outcome over transaction",
    desc: "We care about the quality of learning, not just filling a slot. Ongoing support is part of the service.",
  },
];

export default function AboutPage() {
  return (
    <>
      <script key="ld-organization" {...jsonLd(organizationSchema())} />
      <script key="ld-breadcrumb"   {...jsonLd(breadcrumbSchema([
        { name: "Home",  href: "/" },
        { name: "About", href: "/about" },
      ]))} />
      {/* Hero */}
      <section className="section bg-white">
        <div className="container-page">
          <div className="mx-auto max-w-3xl text-center">
            <h1 className="mb-6 text-4xl font-extrabold text-slate-900 md:text-5xl">
              About TutorMeet
            </h1>
            <p className="text-lg leading-relaxed text-gray-500">
              TutorMeet is a trusted home-tutor marketplace for India. We
              connect parents and students with verified, background-checked
              tutors — and stay involved throughout the tuition journey.
            </p>
          </div>
        </div>
      </section>

      {/* Mission */}
      <section className="section bg-brand-50">
        <div className="container-page">
          <div className="mx-auto max-w-3xl">
            <h2 className="mb-6 text-3xl font-bold text-slate-900">
              Our mission
            </h2>
            <p className="mb-4 text-lg leading-relaxed text-gray-600">
              Every parent deserves to find a tutor they can trust with their
              child&apos;s education. And every qualified tutor deserves a
              platform that helps them reach the right students — without having
              to hustle for every opportunity.
            </p>
            <p className="text-lg leading-relaxed text-gray-600">
              TutorMeet was built to solve both sides of that problem. We sell
              trust, verification, and matching — not just a listing service.
            </p>
          </div>
        </div>
      </section>

      {/* Values */}
      <section className="section bg-white">
        <div className="container-page">
          <h2 className="mb-10 text-center text-3xl font-bold text-slate-900">
            What we stand for
          </h2>
          <div className="grid grid-cols-1 gap-6 md:grid-cols-3">
            {values.map((v) => (
              <div key={v.title} className="card p-6 text-center">
                <div className="mx-auto mb-4 flex h-12 w-12 items-center justify-center rounded-xl bg-brand-100 text-brand-600">
                  {v.icon}
                </div>
                <h3 className="mb-2 font-semibold text-slate-900">{v.title}</h3>
                <p className="text-sm leading-relaxed text-gray-500">{v.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA */}
      <section className="section bg-gray-50">
        <div className="container-page text-center">
          <h2 className="mb-4 text-3xl font-bold text-slate-900">
            Join TutorMeet today
          </h2>
          <p className="mb-8 text-gray-500">
            Whether you&apos;re a parent looking for the right tutor or a
            teacher wanting to grow your student base — TutorMeet is for you.
          </p>
          <div className="flex flex-col items-center gap-4 sm:flex-row sm:justify-center">
            <Link href="/register?role=parent">
              <Button size="lg">
                Find a Tutor <ArrowRight className="h-4 w-4" />
              </Button>
            </Link>
            <Link href="/register?role=tutor">
              <Button size="lg" variant="secondary">
                Become a Tutor
              </Button>
            </Link>
          </div>
        </div>
      </section>
    </>
  );
}
