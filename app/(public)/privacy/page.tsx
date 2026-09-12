import type { Metadata } from "next";
import { ShieldCheck } from "lucide-react";
import { APP_NAME } from "@/lib/constants";

export const metadata: Metadata = { title: `Privacy Policy — ${APP_NAME}` };

export default function PrivacyPage() {
  return (
    <section className="section bg-white">
      <div className="container-page">
        <div className="mx-auto max-w-3xl">
          <div className="mb-8 flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-brand-100 text-brand-700">
              <ShieldCheck className="h-5 w-5" />
            </div>
            <div>
              <h1 className="text-3xl font-bold text-navy-900">Privacy Policy</h1>
              <p className="text-sm text-neutral-400">Last updated: this document is a placeholder</p>
            </div>
          </div>

          <div className="rounded-2xl border border-amber-200 bg-amber-50 px-5 py-4 mb-8">
            <p className="text-sm font-semibold text-amber-900">Draft — Not legally binding</p>
            <p className="mt-1 text-xs text-amber-700">
              This page is a placeholder. The final Privacy Policy will be drafted and reviewed by a
              qualified legal professional before TutorMeet launches publicly. Do not rely on this
              page as a legal document.
            </p>
          </div>

          <div className="prose prose-sm prose-neutral max-w-none space-y-6 text-neutral-700">
            <PolicySection title="1. Information We Collect">
              <p>TutorMeet collects information you provide directly, including:</p>
              <ul>
                <li><strong>Parents:</strong> Name, email address, phone number, city, and locality.</li>
                <li><strong>Students:</strong> First name, class/grade, and school (optional). We do not require sensitive personal data about children beyond what is necessary to match a tutor.</li>
                <li><strong>Tutors:</strong> Name, email, phone, qualification documents, identity documents, and teaching history. These are used solely for verification and are never publicly accessible.</li>
              </ul>
              <p>We apply data minimisation — we collect only what is necessary for the service to function.</p>
            </PolicySection>

            <PolicySection title="2. How We Use Your Information">
              <ul>
                <li>To match parents with suitable verified tutors in their area</li>
                <li>To verify tutor identity, qualifications, and teaching ability</li>
                <li>To communicate about your requirements, matches, and demo classes</li>
                <li>To improve the platform and prevent misuse</li>
              </ul>
              <p>We do not sell your personal information to third parties.</p>
            </PolicySection>

            <PolicySection title="3. Children&apos;s Information">
              <p>TutorMeet takes the privacy of children seriously. We collect only a student&apos;s first name, class, and school (optional) — the minimum needed to find an appropriate tutor. This information is never shared publicly and is only accessible to the parent account and the assigned tutor after a confirmed enrollment.</p>
              <p>Parents are in control of all information entered on behalf of their children.</p>
            </PolicySection>

            <PolicySection title="4. Location &amp; Address">
              <p>Your full home address is never shared publicly. Tutors see only your <strong>locality</strong> (neighbourhood/area name) during the matching phase. Your complete address is only shared with a tutor after you have personally selected them and a tuition enrollment is confirmed.</p>
              <p>Tutors&apos; exact addresses are similarly protected — only their locality and city are publicly visible.</p>
            </PolicySection>

            <PolicySection title="5. Tutor Documents">
              <p>Identity documents and qualification certificates uploaded by tutors are stored in a private, secure storage bucket. These files are accessible only to TutorMeet&apos;s authorised verification team and to the tutor who uploaded them. They are never accessible to parents, students, or other tutors.</p>
            </PolicySection>

            <PolicySection title="6. Data Security">
              <p>We use industry-standard security practices including encrypted connections (HTTPS), row-level security in our database, and access controls that limit which team members can access sensitive data. No raw card numbers or government ID numbers are stored in our database.</p>
            </PolicySection>

            <PolicySection title="7. Your Rights">
              <p>You may request access to, correction of, or deletion of your personal data by contacting us at <strong>privacy@tutormeet.in</strong>. We will respond within a reasonable timeframe.</p>
            </PolicySection>

            <PolicySection title="8. Contact">
              <p>For privacy-related questions, contact: <strong>privacy@tutormeet.in</strong></p>
            </PolicySection>
          </div>
        </div>
      </div>
    </section>
  );
}

function PolicySection({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div>
      <h2 className="text-base font-bold text-navy-900 mb-2">{title}</h2>
      <div className="space-y-2 text-sm leading-relaxed">{children}</div>
    </div>
  );
}
