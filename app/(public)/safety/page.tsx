import type { Metadata } from "next";
import Link from "next/link";
import { ShieldCheck, Phone, AlertTriangle, CheckCircle2, ArrowRight } from "lucide-react";
import { APP_NAME } from "@/lib/constants";

export const metadata: Metadata = { title: `Safety Policy — ${APP_NAME}` };

function PolicySection({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div>
      <h2 className="mb-2 text-base font-bold text-navy-900">{title}</h2>
      <div className="space-y-2 text-sm leading-relaxed">{children}</div>
    </div>
  );
}

export default function SafetyPage() {
  return (
    <section className="section bg-white">
      <div className="container-page">
        <div className="mx-auto max-w-3xl">
          {/* Header */}
          <div className="mb-8 flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-accent-100 text-accent-700">
              <ShieldCheck className="h-5 w-5" />
            </div>
            <div>
              <h1 className="text-3xl font-bold text-navy-900">Safety at TutorMeet</h1>
              <p className="text-sm text-neutral-400">
                Our commitment to parent, student, and tutor safety.
              </p>
            </div>
          </div>

          {/* Emergency */}
          <div className="mb-8 flex items-start gap-3 rounded-2xl border border-red-200 bg-red-50 px-5 py-4">
            <Phone className="mt-0.5 h-5 w-5 flex-shrink-0 text-red-600" />
            <div>
              <p className="font-bold text-red-900">In an emergency, call 112</p>
              <p className="text-sm text-red-700">
                For child safety concerns: <strong>CHILDLINE helpline 1098</strong> — free, 24 hours, 7 days.
              </p>
            </div>
          </div>

          {/* Draft notice */}
          <div className="mb-8 rounded-2xl border border-amber-200 bg-amber-50 px-5 py-4">
            <p className="text-sm font-semibold text-amber-900">Draft — Not legally binding</p>
            <p className="mt-1 text-xs text-amber-700">
              This page is a placeholder. The final Safety Policy will be reviewed by a
              qualified professional before public launch.
            </p>
          </div>

          <div className="space-y-6 text-neutral-700">
            <PolicySection title="Our Safety Commitment">
              <p>TutorMeet operates in an environment involving children and home visits. We treat the safety of students, parents, and tutors as our highest operational priority — not an afterthought.</p>
            </PolicySection>

            <PolicySection title="Tutor Screening">
              <p>Every tutor on TutorMeet undergoes a multi-step verification process before reaching parents:</p>
              <ul className="list-disc pl-5 space-y-1">
                <li>Government-issued identity verification (Aadhaar or equivalent)</li>
                <li>Education certificate review</li>
                <li>Subject knowledge assessment</li>
                <li>Personal interview conducted by our team</li>
              </ul>
              <p>Tutors who do not pass are not listed on the platform.</p>
            </PolicySection>

            <PolicySection title="Protecting Children">
              <ul className="list-disc pl-5 space-y-1">
                <li>We collect minimal information about students — only first name, class, and school (optional).</li>
                <li>Student information is never publicly visible.</li>
                <li>Tutors only receive a student&apos;s information after a confirmed enrollment.</li>
                <li>We encourage parents to always be present or nearby during initial sessions.</li>
              </ul>
            </PolicySection>

            <PolicySection title="Address Privacy">
              <p>Your home address is protected at every stage:</p>
              <ul className="list-disc pl-5 space-y-1">
                <li>During matching: tutors see only your locality name, not your full address.</li>
                <li>After a demo is confirmed: your address is shared only with the specific tutor you have agreed to meet.</li>
                <li>Full address is never visible to unconfirmed or unapproved tutors.</li>
              </ul>
            </PolicySection>

            <PolicySection title="Reporting a Concern">
              <p>If you experience or witness anything that makes you feel unsafe, please report it immediately. All reports are reviewed confidentially by our team.</p>
              <div className="mt-3 flex flex-col gap-2 sm:flex-row">
                <Link href="/parent/safety"
                  className="flex items-center gap-2 rounded-xl border border-brand-200 bg-brand-50 px-4 py-3 text-sm font-medium text-brand-800 hover:bg-brand-100 transition-colors">
                  <AlertTriangle className="h-4 w-4" />
                  Parents: Report a concern
                  <ArrowRight className="ml-auto h-4 w-4" />
                </Link>
                <Link href="/tutor/safety"
                  className="flex items-center gap-2 rounded-xl border border-neutral-200 bg-neutral-50 px-4 py-3 text-sm font-medium text-neutral-700 hover:bg-neutral-100 transition-colors">
                  <AlertTriangle className="h-4 w-4" />
                  Tutors: Report a concern
                  <ArrowRight className="ml-auto h-4 w-4" />
                </Link>
              </div>
            </PolicySection>

            <PolicySection title="Our Response">
              <ul className="list-disc pl-5 space-y-1">
                <li>Child safety reports are escalated immediately.</li>
                <li>All other reports are reviewed within 2 business days.</li>
                <li>We may suspend accounts pending investigation.</li>
                <li>Your identity is never disclosed to the person you have reported.</li>
              </ul>
            </PolicySection>

            <PolicySection title="Contact">
              <p>Safety team: <strong>safety@tutormeet.in</strong></p>
            </PolicySection>
          </div>
        </div>
      </div>
    </section>
  );
}
