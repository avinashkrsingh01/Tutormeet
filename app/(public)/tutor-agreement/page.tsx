import type { Metadata } from "next";
import { GraduationCap } from "lucide-react";
import { APP_NAME } from "@/lib/constants";

export const metadata: Metadata = { title: `Tutor Agreement — ${APP_NAME}` };

function PolicySection({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div>
      <h2 className="mb-2 text-base font-bold text-navy-900">{title}</h2>
      <div className="space-y-2 text-sm leading-relaxed">{children}</div>
    </div>
  );
}

export default function TutorAgreementPage() {
  return (
    <section className="section bg-white">
      <div className="container-page">
        <div className="mx-auto max-w-3xl">
          <div className="mb-8 flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-accent-100 text-accent-700">
              <GraduationCap className="h-5 w-5" />
            </div>
            <div>
              <h1 className="text-3xl font-bold text-navy-900">Tutor Agreement</h1>
              <p className="text-sm text-neutral-400">Terms for tutors registered on {APP_NAME}</p>
            </div>
          </div>

          <div className="mb-8 rounded-2xl border border-amber-200 bg-amber-50 px-5 py-4">
            <p className="text-sm font-semibold text-amber-900">Draft — Not legally binding</p>
            <p className="mt-1 text-xs text-amber-700">
              This page is a placeholder. The final Tutor Agreement will be reviewed by a qualified
              legal professional before tutors are required to formally accept it.
            </p>
          </div>

          <div className="space-y-6 text-neutral-700">
            <PolicySection title="1. Tutor Responsibilities">
              <ul className="list-disc pl-5 space-y-1">
                <li>Provide accurate information during the registration and verification process.</li>
                <li>Attend all scheduled sessions punctually or provide adequate advance notice if unable to attend.</li>
                <li>Conduct all sessions professionally and in accordance with TutorMeet&apos;s safety guidelines.</li>
                <li>Never share a student&apos;s or parent&apos;s personal information with third parties.</li>
                <li>Report any safeguarding concerns immediately to TutorMeet support.</li>
              </ul>
            </PolicySection>

            <PolicySection title="2. Child Safety Obligations">
              <p>Tutors must adhere to basic safeguarding principles at all times, including:</p>
              <ul className="list-disc pl-5 space-y-1">
                <li>Never meeting a student without a parent or responsible adult being informed</li>
                <li>Maintaining appropriate professional boundaries at all times</li>
                <li>Immediately reporting any welfare concerns about a student to TutorMeet</li>
              </ul>
            </PolicySection>

            <PolicySection title="3. Verification and Conduct">
              <p>Tutors agree to undergo TutorMeet&apos;s verification process honestly. Providing false documents or misrepresenting qualifications will result in immediate removal and may be reported to relevant authorities.</p>
            </PolicySection>

            <PolicySection title="4. Platform Rules">
              <ul className="list-disc pl-5 space-y-1">
                <li>Tutors must not contact parents or students through channels outside TutorMeet to circumvent the platform.</li>
                <li>Soliciting private arrangements to avoid the platform&apos;s safety processes is a breach of this agreement.</li>
                <li>TutorMeet reserves the right to remove a tutor from the platform for any conduct breach.</li>
              </ul>
            </PolicySection>

            <PolicySection title="5. Independence">
              <p>Tutors using TutorMeet are independent service providers. Nothing in this agreement creates an employment or agency relationship between TutorMeet and the tutor.</p>
            </PolicySection>

            <PolicySection title="6. Contact">
              <p>For questions about this agreement: <strong>tutors@tutormeet.in</strong></p>
            </PolicySection>
          </div>
        </div>
      </div>
    </section>
  );
}
