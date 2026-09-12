import { redirect, notFound } from "next/navigation";
import Link from "next/link";
import type { Metadata } from "next";
import { createClient } from "@/lib/supabase/server";
import { Button } from "@/components/ui/Button";
import {
  CheckCircle2,
  Clock,
  ShieldCheck,
  Search,
  Video,
  ArrowRight,
  LayoutDashboard,
} from "lucide-react";

export const metadata: Metadata = { title: "Requirement Received — TutorMeet" };

interface PageProps {
  params: Promise<{ id: string }>;
}

export default async function RequirementConfirmationPage({ params }: PageProps) {
  const { id } = await params;
  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) redirect("/login");

  const { data: req } = await supabase
    .from("tuition_requirements")
    .select("id, grade, subjects, student_name, status, city, created_at")
    .eq("id", id)
    .eq("parent_id", user.id)
    .single();

  if (!req) notFound();

  // Only show confirmation for freshly submitted requirements
  if (req.status !== "submitted" && req.status !== "matching") {
    redirect(`/parent/requirements/${id}`);
  }

  const subjects = (req.subjects as string[]).join(", ");

  const nextSteps = [
    {
      icon: <ShieldCheck className="h-5 w-5" />,
      title: "We review your requirement",
      desc:  "Our team reads your requirement and understands what your child needs.",
      time:  "Within a few hours",
    },
    {
      icon: <Search className="h-5 w-5" />,
      title: "We shortlist verified tutors",
      desc:  "We find tutors in your area who match the class, subjects, schedule, and budget.",
      time:  "Within 24–48 hours",
    },
    {
      icon: <Video className="h-5 w-5" />,
      title: "You meet your tutors",
      desc:  "We schedule a free demo class at your home. No commitment needed.",
      time:  "After shortlisting",
    },
  ];

  return (
    <div className="mx-auto w-full max-w-2xl py-8">

      {/* ── Success card ─────────────────────────────────────── */}
      <div className="overflow-hidden rounded-3xl border border-neutral-200 bg-white shadow-lg">
        {/* Green top strip */}
        <div className="h-1.5 w-full bg-gradient-to-r from-accent-500 to-accent-400" />

        <div className="px-7 pb-8 pt-8 sm:px-10 sm:pt-10">
          {/* Icon + headline */}
          <div className="mb-6 flex flex-col items-center text-center">
            <div className="mb-4 flex h-16 w-16 items-center justify-center rounded-2xl bg-accent-50 text-accent-600 shadow-sm">
              <CheckCircle2 className="h-8 w-8" strokeWidth={1.5} />
            </div>
            <h1
              className="text-2xl font-extrabold text-navy-900"
              style={{ letterSpacing: "-0.025em" }}
            >
              Your tuition requirement
              <br />has been received.
            </h1>
            <p className="mt-3 max-w-sm text-sm leading-relaxed text-neutral-500">
              We&apos;re finding suitable verified tutors for you. You&apos;ll
              hear from us within 48 hours.
            </p>
          </div>

          {/* Requirement summary pill */}
          <div className="mb-8 rounded-2xl border border-neutral-200 bg-neutral-50 px-5 py-4">
            <p className="mb-0.5 text-xs font-semibold uppercase tracking-wide text-neutral-400">
              Requirement summary
            </p>
            <p className="text-sm font-semibold text-navy-900">
              {req.student_name
                ? `${req.student_name} · `
                : ""}{req.grade} — {subjects}
            </p>
            <p className="mt-0.5 text-xs text-neutral-500">{req.city}</p>
            <div className="mt-3 flex items-center gap-2">
              <span className="flex items-center gap-1.5 rounded-full bg-amber-100 px-2.5 py-0.5 text-xs font-semibold text-amber-800">
                <Clock className="h-3 w-3" />
                Finding tutors
              </span>
              <span className="text-xs text-neutral-400">
                Submitted just now
              </span>
            </div>
          </div>

          {/* What happens next */}
          <div className="mb-8">
            <h2 className="mb-4 text-sm font-bold text-navy-900">
              What happens next
            </h2>
            <div className="space-y-4">
              {nextSteps.map((step, i) => (
                <div key={i} className="flex items-start gap-4">
                  <div className="flex h-9 w-9 flex-shrink-0 items-center justify-center rounded-xl bg-brand-50 text-brand-700">
                    {step.icon}
                  </div>
                  <div className="min-w-0 flex-1">
                    <div className="flex flex-wrap items-start justify-between gap-1">
                      <p className="text-sm font-semibold text-navy-900">
                        {step.title}
                      </p>
                      <span className="flex-shrink-0 rounded-full bg-neutral-100 px-2 py-0.5 text-xs font-medium text-neutral-500">
                        {step.time}
                      </span>
                    </div>
                    <p className="mt-0.5 text-xs leading-relaxed text-neutral-500">
                      {step.desc}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Privacy note */}
          <div className="mb-8 flex items-start gap-2.5 rounded-xl border border-accent-200 bg-accent-50 px-4 py-3">
            <ShieldCheck className="mt-0.5 h-4 w-4 flex-shrink-0 text-accent-700" />
            <p className="text-xs leading-relaxed text-accent-800">
              Your full home address is never shared with tutors until you have
              personally selected one and tuition begins.
            </p>
          </div>

          {/* CTAs */}
          <div className="flex flex-col gap-3 sm:flex-row">
            <Link href="/parent/dashboard" className="flex-1">
              <Button variant="primary" fullWidth size="lg">
                <LayoutDashboard className="h-4 w-4" />
                Go to Dashboard
              </Button>
            </Link>
            <Link href="/parent/requirements/new" className="flex-1">
              <Button variant="outline" fullWidth size="lg">
                Post Another
                <ArrowRight className="h-4 w-4" />
              </Button>
            </Link>
          </div>
        </div>
      </div>

      {/* Support note */}
      <p className="mt-5 text-center text-sm text-neutral-500">
        Questions?{" "}
        <Link
          href="/parent/support"
          className="font-semibold text-brand-700 underline-offset-2 hover:underline"
        >
          Contact our support team
        </Link>
      </p>
    </div>
  );
}
