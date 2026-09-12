import type { Metadata } from "next";
import { IndianRupee } from "lucide-react";
import { APP_NAME } from "@/lib/constants";

export const metadata: Metadata = { title: `Refund Policy — ${APP_NAME}` };

function PolicySection({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div>
      <h2 className="mb-2 text-base font-bold text-navy-900">{title}</h2>
      <div className="space-y-2 text-sm leading-relaxed">{children}</div>
    </div>
  );
}

export default function RefundPage() {
  return (
    <section className="section bg-white">
      <div className="container-page">
        <div className="mx-auto max-w-3xl">
          <div className="mb-8 flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-brand-100 text-brand-700">
              <IndianRupee className="h-5 w-5" />
            </div>
            <div>
              <h1 className="text-3xl font-bold text-navy-900">Refund Policy</h1>
              <p className="text-sm text-neutral-400">Last updated: this document is a placeholder</p>
            </div>
          </div>

          <div className="mb-8 rounded-2xl border border-amber-200 bg-amber-50 px-5 py-4">
            <p className="text-sm font-semibold text-amber-900">Draft — Not legally binding</p>
            <p className="mt-1 text-xs text-amber-700">
              This page is a placeholder. The final Refund Policy will be reviewed by a qualified
              professional before public launch. Do not rely on this as a contractual commitment.
            </p>
          </div>

          <div className="space-y-6 text-neutral-700">
            <PolicySection title="Current Phase (Direct Payments)">
              <p>In the current phase of TutorMeet, fees are paid directly between parents and tutors. TutorMeet does not currently process payments on behalf of either party, and therefore cannot issue refunds for tuition fees paid directly to tutors.</p>
              <p>If you have a payment dispute with a tutor, please contact our support team who will attempt to facilitate a resolution.</p>
            </PolicySection>

            <PolicySection title="Platform Fees">
              <p>When TutorMeet introduces platform-processed payments, this policy will be updated to include specific refund conditions. Planned terms include:</p>
              <ul className="list-disc pl-5 space-y-1">
                <li>Full refund if a demo class does not take place due to the tutor&apos;s failure to attend</li>
                <li>Pro-rated refund for sessions not delivered within a prepaid period</li>
                <li>No refund for completed sessions</li>
              </ul>
            </PolicySection>

            <PolicySection title="How to Request a Refund">
              <p>To raise a payment dispute or refund request, contact us at <strong>support@tutormeet.in</strong> with your requirement ID and details of the payment.</p>
            </PolicySection>

            <PolicySection title="Contact">
              <p>For payment disputes: <strong>support@tutormeet.in</strong></p>
            </PolicySection>
          </div>
        </div>
      </div>
    </section>
  );
}
