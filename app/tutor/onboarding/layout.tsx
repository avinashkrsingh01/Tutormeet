import { redirect } from "next/navigation";
import Link from "next/link";
import { ShieldCheck } from "lucide-react";
import { createClient } from "@/lib/supabase/server";
import { APP_NAME } from "@/lib/constants";

export default async function TutorOnboardingLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) redirect("/login");

  const { data: profile } = await supabase
    .from("profiles")
    .select("role")
    .eq("id", user.id)
    .single();

  if (!profile || profile.role !== "tutor") redirect("/unauthorized");

  // If already completed onboarding, send to dashboard
  const { data: tp } = await supabase
    .from("tutor_profiles")
    .select("onboarding_complete")
    .eq("user_id", user.id)
    .maybeSingle();

  if (tp?.onboarding_complete) {
    redirect("/tutor/dashboard");
  }

  return (
    <div className="min-h-screen bg-neutral-50">
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
          <span className="ml-1 text-sm text-neutral-400">— Tutor registration</span>
        </div>
      </header>

      <main className="container-page py-8 sm:py-12">
        {children}
      </main>
    </div>
  );
}
