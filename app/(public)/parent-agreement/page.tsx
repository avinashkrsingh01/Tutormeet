import type { Metadata } from "next";
import { Users } from "lucide-react";
import { APP_NAME } from "@/lib/constants";

export const metadata: Metadata = { title: `Parent Agreement — ${APP_NAME}` };

function PolicySection({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div>
      <h2 className="mb-2 text-base font-bold text-navy-900">{title}</h2>
      <div className="space-y-2 text-sm leading-relaxed">{children}</div>
    </div>
  );
}

export default function ParentAgreementPage() {
  return (
    <section className="section bg-white">
      <div className="container-page">
        <div className="mx-auto max-w-3xl">
          <div className="mb-8 flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-brand-100 text-brand-700">
              <Users className="h-5 w-5" />
            </div>
            <div>
              <h1 className="text-3xl font-bold text-navy-900">Parent Agreement</h1>
              <p className="text-sm text-neutral-400">Terms for parents and guardians on {APP_NAME}</p>
            </div>
          </div>

          <div className="mb-8 rounded-2xl border border-amber-200 bg-amber-50 px-5 py-4">
            <p className="text-sm font-semibold text-amber-900">Draft — Not legally binding</p>
            <p className="mt-1 text-xs text-amber-700">
              This page is a placeholder. The final Parent Agreement will be reviewed by a
              qualified legal professional before it is formally presented to parents at registration.
            </p>
          </div>

          <div className="space-y-6 text-neutral-700">
            <PolicySection title="1. Your Role as a Parent or Guardian">
              <p>By using TutorMeet, you confirm that you are a parent or legal guardian of the student(s) for whom you are seeking tuition. You are responsible for the accuracy of the information you provide about your child.</p>
            </PolicySection>

            <PolicySection title="2. Child Safety">
              <p>While TutorMeet verifies tutors, parents are responsible for supervising sessions, especially in the home environment. We recommend:</p>
              <ul className="list-disc pl-5 space-y-1">
                <li>Being present during the first few sessions with any new tutor.</li>
                <li>Never leaving a tutor alone with your child until you are fully comfortable.</li>
                <li>Reporting any concerns through our Safety Reporting feature immediately.</li>
              </ul>
            </PolicySection>

            <PolicySection title="3. Accurate Information">
              <p>You agree to provide accurate information about your child&apos;s academic requirements. Misrepresentation may result in poor tutor matches and does not entitle you to a refund of any fees paid.</p>
            </PolicySection>

            <PolicySection title="4. Demo Classes">
              <p>Demo classes are offered free of charge as a way for you to meet a tutor before committing. The demo class is not a substitute for your own assessment of a tutor&apos;s suitability.</p>
            </PolicySection>

            <PolicySection title="5. Payments">
              <p>In the current phase, fees are agreed and paid directly between you and your tutor. TutorMeet is not a party to the payment arrangement and is not responsible for disputes about fees unless they are processed through our platform payment system (available in a future release).</p>
            </PolicySection>

            <PolicySection title="6. Conduct">
              <p>Parents must treat tutors with respect. Abusive conduct toward tutors — including abusive messages, payment withholding without cause, or harassment — may result in account suspension.</p>
            </PolicySection>

            <PolicySection title="7. Contact">
              <p>For questions: <strong>support@tutormeet.in</strong></p>
            </PolicySection>
          </div>
        </div>
      </div>
    </section>
  );
}
