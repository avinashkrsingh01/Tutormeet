import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { getAdminProfile } from "@/lib/admin-auth";
import { hasPermission, NAV_PERMISSIONS, getAdminRoleLabel } from "@/types/admin";
import { DashboardShell } from "@/components/layout/DashboardShell";
import { DashboardNav } from "@/components/layout/DashboardNav";
import type { NavItem } from "@/components/layout/DashboardNav";
import {
  LayoutDashboard, Users, User, GraduationCap,
  ClipboardList, Shuffle, Video, BookOpen,
  CreditCard, Star, HeadphonesIcon,
  BadgeCheck, BarChart3, Settings, ShieldAlert,
} from "lucide-react";

// Full nav definition — filtered per role below
const ALL_NAV: { section: keyof typeof NAV_PERMISSIONS; item: NavItem }[] = [
  { section: "dashboard",    item: { label: "Dashboard",     href: "/admin/dashboard",    icon: <LayoutDashboard className="h-4 w-4" /> } },
  { section: "verification", item: { label: "Verification",  href: "/admin/verification", icon: <BadgeCheck className="h-4 w-4" /> } },
  { section: "tutors",       item: { label: "Tutors",        href: "/admin/tutors",       icon: <GraduationCap className="h-4 w-4" /> } },
  { section: "parents",      item: { label: "Parents",       href: "/admin/parents",      icon: <Users className="h-4 w-4" /> } },
  { section: "students",     item: { label: "Students",      href: "/admin/students",     icon: <User className="h-4 w-4" /> } },
  { section: "requirements", item: { label: "Requirements",  href: "/admin/requirements", icon: <ClipboardList className="h-4 w-4" /> } },
  { section: "matches",      item: { label: "Matches",       href: "/admin/matching",     icon: <Shuffle className="h-4 w-4" /> } },
  { section: "demos",        item: { label: "Demo Classes",  href: "/admin/demos",        icon: <Video className="h-4 w-4" /> } },
  { section: "enrollments",  item: { label: "Active Tuition",href: "/admin/enrollments",  icon: <BookOpen className="h-4 w-4" /> } },
  { section: "payments",     item: { label: "Payments",      href: "/admin/payments",     icon: <CreditCard className="h-4 w-4" /> } },
  { section: "reviews",      item: { label: "Reviews",       href: "/admin/reviews",      icon: <Star className="h-4 w-4" /> } },
  { section: "support",      item: { label: "Support",       href: "/admin/support",      icon: <HeadphonesIcon className="h-4 w-4" /> } },
  { section: "safety",       item: { label: "Safety",        href: "/admin/safety",       icon: <ShieldAlert className="h-4 w-4" /> } },
  { section: "reports",      item: { label: "Reports",       href: "/admin/reports",      icon: <BarChart3 className="h-4 w-4" /> } },
  { section: "settings",     item: { label: "Settings",      href: "/admin/settings",     icon: <Settings className="h-4 w-4" /> } },
];

export default async function AdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) redirect("/login");

  const adminProfile = await getAdminProfile();
  if (!adminProfile) redirect("/unauthorized");

  // Filter nav items based on role permissions
  const navItems: NavItem[] = ALL_NAV
    .filter(({ section }) => {
      const perm = NAV_PERMISSIONS[section];
      return hasPermission(adminProfile.admin_role, perm);
    })
    .map(({ item }) => item);

  const roleLabel = getAdminRoleLabel(adminProfile.admin_role);

  return (
    <DashboardShell>
      <DashboardNav
        userName={adminProfile.full_name}
        userEmail={adminProfile.email}
        avatarUrl={adminProfile.avatar_url}
        navItems={navItems}
        role="admin"
        roleLabel={roleLabel}
      />
      {/* Admin has no bottom nav — tablet icon-only top bar is sufficient */}
      <main className="container-page py-6 sm:py-8">{children}</main>
    </DashboardShell>
  );
}
