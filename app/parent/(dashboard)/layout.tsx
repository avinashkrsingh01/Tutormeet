import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { DashboardShell } from "@/components/layout/DashboardShell";
import { DashboardNav } from "@/components/layout/DashboardNav";
import { BottomNav } from "@/components/layout/BottomNav";
import type { BottomNavItem } from "@/components/layout/BottomNav";
import {
  LayoutDashboard,
  ClipboardList,
  Users,
  Video,
  CalendarCheck,
  Star,
  UserCircle,
  CreditCard,
  HeadphonesIcon,
  BookOpen,
} from "lucide-react";

// Full nav for desktop top-bar / tablet icon-row / mobile drawer
const navItems = [
  { label: "Dashboard",          href: "/parent/dashboard",    icon: <LayoutDashboard className="h-4 w-4" /> },
  { label: "My Requirements",    href: "/parent/requirements", icon: <ClipboardList   className="h-4 w-4" /> },
  { label: "Recommended Tutors", href: "/parent/matches",      icon: <Users           className="h-4 w-4" /> },
  { label: "Demo Classes",       href: "/parent/demos",        icon: <Video           className="h-4 w-4" /> },
  { label: "My Tutor",           href: "/parent/my-tutor",     icon: <BookOpen        className="h-4 w-4" /> },
  { label: "Attendance",         href: "/parent/attendance",   icon: <CalendarCheck   className="h-4 w-4" /> },
  { label: "Payments",           href: "/parent/payments",     icon: <CreditCard      className="h-4 w-4" /> },
  { label: "Reviews",            href: "/parent/reviews",      icon: <Star            className="h-4 w-4" /> },
  { label: "Support",            href: "/parent/support",      icon: <HeadphonesIcon  className="h-4 w-4" /> },
  { label: "Profile",            href: "/parent/profile",      icon: <UserCircle      className="h-4 w-4" /> },
];

// Bottom-nav: 5 most-used destinations (spec: Home / Find Tutor / My Classes / Messages / Profile)
const bottomNavItems: BottomNavItem[] = [
  { label: "Home",        href: "/parent/dashboard",    icon: <LayoutDashboard className="h-5 w-5" /> },
  { label: "Find Tutor",  href: "/parent/matches",      icon: <Users           className="h-5 w-5" /> },
  { label: "My Classes",  href: "/parent/demos",        icon: <Video           className="h-5 w-5" /> },
  { label: "Attendance",  href: "/parent/attendance",   icon: <CalendarCheck   className="h-5 w-5" /> },
  { label: "Profile",     href: "/parent/profile",      icon: <UserCircle      className="h-5 w-5" /> },
];

export default async function ParentLayout({
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

  if (!profile || (profile.role !== "parent" && profile.role !== "admin")) {
    redirect("/unauthorized");
  }

  if (profile.role === "parent") {
    const { data: parentProfile } = await supabase
      .from("parent_profiles")
      .select("onboarding_complete")
      .eq("user_id", user.id)
      .maybeSingle();

    if (!parentProfile?.onboarding_complete) {
      redirect("/parent/onboarding");
    }
  }

  return (
    <DashboardShell>
      <DashboardNav
        userName={profile.full_name}
        userEmail={profile.email}
        avatarUrl={profile.avatar_url}
        navItems={navItems}
        role="parent"
      />
      {/*
        bottom-nav-spacer: adds padding-bottom on mobile so content
        isn't hidden behind the fixed bottom nav bar (< lg).
        lg:pb-0 removes it on desktop where the bottom nav is hidden.
      */}
      <main className="container-page py-6 bottom-nav-spacer lg:pb-8">
        {children}
      </main>
      <BottomNav items={bottomNavItems} />
    </DashboardShell>
  );
}
