import type { Metadata } from "next";
import { RegisterForm } from "@/components/auth/RegisterForm";

export const metadata: Metadata = {
  title:       "Create Account",
  description: "Join TutorMeet as a parent looking for a tutor, or as a tutor wanting to teach.",
  robots:      { index: false, follow: false },
};

interface RegisterPageProps {
  searchParams: Promise<{ role?: string }>;
}

export default async function RegisterPage({ searchParams }: RegisterPageProps) {
  const { role } = await searchParams;
  const defaultRole = role === "tutor" ? "tutor" : "parent";

  return <RegisterForm defaultRole={defaultRole} />;
}
