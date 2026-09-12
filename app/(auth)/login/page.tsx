import type { Metadata } from "next";
import { LoginForm } from "@/components/auth/LoginForm";

export const metadata: Metadata = {
  title:       "Sign In",
  description: "Sign in to your TutorMeet account.",
  // Auth pages must not be indexed — they are session-gated and have no SEO value.
  robots: { index: false, follow: false },
};

interface LoginPageProps {
  searchParams: Promise<{ redirectTo?: string; error?: string }>;
}

export default async function LoginPage({ searchParams }: LoginPageProps) {
  const { redirectTo, error } = await searchParams;

  // Validate redirectTo server-side before passing to the client component —
  // the same isSafeRedirect rule used in /auth/callback
  const safeRedirect =
    redirectTo &&
    redirectTo.startsWith("/") &&
    !redirectTo.startsWith("//") &&
    !redirectTo.includes("://")
      ? redirectTo
      : undefined;

  return <LoginForm redirectTo={safeRedirect} callbackError={error} />;
}
