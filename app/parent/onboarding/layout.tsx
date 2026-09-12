import Link from "next/link";
import { ShieldCheck } from "lucide-react";
import { APP_NAME } from "@/lib/constants";

export default function OnboardingLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="flex min-h-screen flex-col bg-neutral-50">
      {/* Minimal header */}
      <header className="border-b border-neutral-100 bg-white">
        <div className="container-page flex h-14 items-center gap-3">
          <Link
            href="/"
            className="flex items-center gap-2 group"
            aria-label="TutorMeet home"
          >
            <div className="flex h-7 w-7 items-center justify-center rounded-lg bg-brand-900 text-white transition-colors group-hover:bg-brand-800">
              <ShieldCheck className="h-3.5 w-3.5" />
            </div>
            <span
              className="text-base font-bold text-navy-900"
              style={{ letterSpacing: "-0.02em" }}
            >
              {APP_NAME}
            </span>
          </Link>
          <span className="ml-1 text-sm text-neutral-400">— Getting started</span>
        </div>
      </header>

      <main className="flex flex-1 items-start justify-center px-4 py-10 sm:py-14">
        {children}
      </main>
    </div>
  );
}
