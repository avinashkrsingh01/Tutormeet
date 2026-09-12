import type { Metadata } from "next";
import { FileText } from "lucide-react";
import { APP_NAME } from "@/lib/constants";

export const metadata: Metadata = { title: `Terms of Service — ${APP_NAME}` };

function PolicySection({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div>
      <h2 className="mb-2 text-base font-bold text-navy-900">{title}</h2>
      <div className="space-y-2 text-sm leading-relaxed">{children}</div>
    </div>
  );
}

export default function TermsPage() {
  return (
    <section className="section bg-white">
      <div className="container-page">
        <div className="mx-auto max-w-3xl">
          <div className="mb-8 flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-brand-100 text-brand-700">
              <FileText className="h-5 w-5" />
            </div>
            <div>
              <h1 className="text-3xl font-bold text-navy-900">Terms of Service</h1>
              <p className="text-sm text-neutral-400">Last updated: this document is a placeholder</p>
            </div>
          </div>

          <div className="mb-8 rounded-2xl border border-amber-200 bg-amber-50 px-5 py-4">
            <p className="text-sm font-semibold text-amber-900">Draft — Not legally binding</p>
            <p className="mt-1 text-xs text-amber-700">
              This page is a placeholder. The final Terms of Service will be drafted and reviewed
              by a qualified legal professional before TutorMeet launches publicly.
            </p>
          </div>

          <div className="space-y-6 text-neutral-700">
            <PolicySection title="1. About TutorMeet">
              <p>TutorMeet is a marketplace that connects parents and students with verified home tutors in India. We facilitate introductions, verification, and scheduling — we are not a party to the tuition arrangement itself.</p>
            </PolicySection>

            <PolicySection title="2. Eligibility">
              <ul className="list-disc pl-5 space-y-1">
                <li>You must be at least 18 years old to create an account.</li>
                <li>Tutors must hold at least the minimum qualifications required for the subjects and grades they wish to teach.</li>
                <li>You are responsible for providing accurate information during registration.</li>
              </ul>
            </PolicySection>

            <PolicySection title="3. Tutor Verification">
              <p>TutorMeet verifies tutors on a best-effort basis. Verification includes document review, knowledge assessment, and an interview. While we take reasonable steps, we do not guarantee the accuracy of every claim made by a tutor or the suitability of any match.</p>
              <p>Parents are encouraged to attend a free demo class before committing to any tutor.</p>
            </PolicySection>

            <PolicySection title="4. Parent and Student Safety">
              <p>Your child&apos;s safety is our highest priority. We screen tutors, but parents are responsible for ensuring their own safety during home visits. TutorMeet recommends:</p>
              <ul className="list-disc pl-5 space-y-1">
                <li>Always being present or having another adult present during sessions with a new tutor.</li>
                <li>Not leaving a tutor alone with a child until you are fully comfortable.</li>
                <li>Reporting any concerns immediately through our Safety Reporting feature.</li>
              </ul>
            </PolicySection>

            <PolicySection title="5. Payments">
              <p>In the current phase, fees are agreed between parents and tutors directly. TutorMeet records transactions but does not process payments on behalf of either party. A payment gateway integration is planned for a future release.</p>
            </PolicySection>

            <PolicySection title="6. Prohibited Conduct">
              <p>Users must not:</p>
              <ul className="list-disc pl-5 space-y-1">
                <li>Provide false information during registration or verification</li>
                <li>Harass, threaten, or discriminate against any user</li>
                <li>Attempt to circumvent TutorMeet by taking tuition arrangements off-platform to avoid our safety processes</li>
                <li>Share another user&apos;s private information without consent</li>
              </ul>
            </PolicySection>

            <PolicySection title="7. Suspension and Termination">
              <p>TutorMeet reserves the right to suspend or terminate any account that violates these terms or poses a risk to platform safety, without prior notice in serious cases.</p>
            </PolicySection>

            <PolicySection title="8. Limitation of Liability">
              <p>TutorMeet is a marketplace. We facilitate connections but are not responsible for the actions of tutors or parents on or off the platform. To the extent permitted by applicable law, TutorMeet&apos;s liability is limited to the platform fee charged for the relevant transaction.</p>
            </PolicySection>

            <PolicySection title="9. Contact">
              <p>For questions about these terms: <strong>legal@tutormeet.in</strong></p>
            </PolicySection>
          </div>
        </div>
      </div>
    </section>
  );
}
