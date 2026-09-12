import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { DashboardShell } from "@/components/layout/DashboardShell";
import { DashboardNav } from "@/components/layout/DashboardNav";
import { BottomNav } from "@/components/layout/BottomNav";
import type { BottomNavItem } from "@/components/layout/BottomNav";
import {
  LayoutDashboard,
  UserCircle,
  FileText,
  ClipboardCheck,
  BadgeCheck,
  Users,
  CalendarCheck,
  Star,
  HeadphonesIcon,
  IndianRupee,
} from "lucide-react";

// Full nav for desktop / tablet / mobile drawer
const navItems = [
  { label: "Dashboard",    href: "/tutor/dashboard",   icon: <LayoutDashboard  className="h-4 w-4" /> },
  { label: "My Profile",   href: "/tutor/profile",     icon: <UserCircle       className="h-4 w-4" /> },
  { label: "Documents",    href: "/tutor/documents",   icon: <FileText         className="h-4 w-4" /> },
  { label: "Assessment",   href: "/tutor/assessment",  icon: <ClipboardCheck   className="h-4 w-4" /> },
  { label: "Verification", href: "/tutor/status",      icon: <BadgeCheck       className="h-4 w-4" /> },
  { label: "My Students",  href: "/tutor/students",    icon: <Users            className="h-4 w-4" /> },
  { label: "Attendance",   href: "/tutor/attendance",  icon: <CalendarCheck    className="h-4 w-4" /> },
  { label: "Reviews",      href: "/tutor/reviews",     icon: <Star             className="h-4 w-4" /> },
  { label: "Support",      href: "/tutor/support",     icon: <HeadphonesIcon   className="h-4 w-4" /> },
];

// Bottom-nav: spec items — Home / Opportunities / Students / Earnings / Profile
const bottomNavItems: BottomNavItem[] = [
  { label: "Home",          href: "/tutor/dashboard",  icon: <LayoutDashboard  className="h-5 w-5" /> },
  { label: "Verification",  href: "/tutor/status",     icon: <BadgeCheck       className="h-5 w-5" /> },
  { label: "Students",      href: "/tutor/students",   icon: <Users            className="h-5 w-5" /> },
  { label: "Attendance",    href: "/tutor/attendance", icon: <CalendarCheck    className="h-5 w-5" /> },
  { label: "Profile",       href: "/tutor/profile",    icon: <UserCircle       className="h-5 w-5" /> },
];

export default async function TutorLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  const { data: profile } = await supabase
    .from("profiles")
    .select("full_name, email, avatar_url, role")
    .eq("id", user.id)
    .single();

  if (!profile || (profile.role !== "tutor" && profile.role !== "admin")) {
    redirect("/unauthorized");
  }

  if (profile.role === "tutor") {
    const { data: tp } = await supabase
      .from("tutor_profiles")
      .select("onboarding_complete, onboarding_step")
      .eq("user_id", user.id)
      .maybeSingle();

    if (!tp?.onboarding_complete) {
      const stepRoutes: Record<string, string> = {
        basic_profile:        "/tutor/onboarding",
        education:            "/tutor/onboarding/education",
        experience:           "/tutor/onboarding/experience",
        teaching_preferences: "/tutor/onboarding/preferences",
        documents:            "/tutor/onboarding/documents",
        submitted:            "/tutor/onboarding/submit",
      };
      const step = tp?.onboarding_step ?? "basic_profile";
      redirect(stepRoutes[step] ?? "/tutor/onboarding");
    }
  }

  return (
    <DashboardShell>
      <DashboardNav
        userName={profile.full_name}
        userEmail={profile.email}
        avatarUrl={profile.avatar_url}
        navItems={navItems}
        role="tutor"
      />
      <main className="container-page py-6 bottom-nav-spacer lg:pb-8">
        {children}
      </main>
      <BottomNav items={bottomNavItems} />
    </DashboardShell>
  );
}
