import { redirect } from "next/navigation";
import Link from "next/link";
import { createClient } from "@/lib/supabase/server";
import { DashboardHeader } from "@/components/layout/DashboardShell";
import { Card, CardHeader, CardTitle } from "@/components/ui/Card";
import { Avatar } from "@/components/ui/Avatar";
import { Badge } from "@/components/ui/Badge";
import { Button } from "@/components/ui/Button";
import { formatDate } from "@/lib/utils";
import {
  UserCircle,
  Phone,
  Mail,
  MapPin,
  MessageCircle,
  GraduationCap,
  Plus,
  Pencil,
} from "lucide-react";
import type { Metadata } from "next";

export const metadata: Metadata = { title: "My Profile" };

const contactLabels: Record<string, string> = {
  whatsapp: "WhatsApp",
  call:     "Phone Call",
  email:    "Email",
  any:      "Any method",
};

export default async function ParentProfilePage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  const [{ data: profile }, { data: parentProfile }, { data: students }] =
    await Promise.all([
      supabase
        .from("profiles")
        .select("full_name, email, phone, avatar_url, created_at")
        .eq("id", user.id)
        .single(),
      supabase
        .from("parent_profiles")
        .select("city, locality, communication_preference")
        .eq("user_id", user.id)
        .maybeSingle(),
      supabase
        .from("students")
        .select("id, full_name, current_grade, school_name, gender, created_at")
        .eq("parent_id", user.id)
        .order("created_at", { ascending: true }),
    ]);

  if (!profile) redirect("/login");

  return (
    <div>
      <DashboardHeader
        title="My Profile"
        description="Manage your account and student details."
      />

      <div className="grid grid-cols-1 gap-5 lg:grid-cols-3">

        {/* ── Account card ──────────────────────────────────── */}
        <Card padding="md" className="lg:col-span-1">
          <div className="flex flex-col items-center gap-4 text-center">
            <Avatar
              name={profile.full_name}
              src={profile.avatar_url}
              size="xl"
            />
            <div>
              <p className="text-lg font-bold text-navy-900" style={{ letterSpacing: "-0.02em" }}>
                {profile.full_name}
              </p>
              <Badge variant="navy" className="mt-1">Parent</Badge>
            </div>
          </div>

          {/* Contact details */}
          <div className="mt-5 space-y-3 border-t border-neutral-100 pt-5">
            <div className="flex items-center gap-3 text-sm">
              <Mail className="h-4 w-4 flex-shrink-0 text-neutral-400" />
              <span className="truncate text-neutral-700">{profile.email}</span>
            </div>
            {profile.phone && (
              <div className="flex items-center gap-3 text-sm">
                <Phone className="h-4 w-4 flex-shrink-0 text-neutral-400" />
                <span className="text-neutral-700">{profile.phone}</span>
              </div>
            )}
            {parentProfile?.city && (
              <div className="flex items-center gap-3 text-sm">
                <MapPin className="h-4 w-4 flex-shrink-0 text-neutral-400" />
                <span className="text-neutral-700">
                  {parentProfile.locality && `${parentProfile.locality}, `}
                  {parentProfile.city}
                </span>
              </div>
            )}
            {parentProfile?.communication_preference && (
              <div className="flex items-center gap-3 text-sm">
                <MessageCircle className="h-4 w-4 flex-shrink-0 text-neutral-400" />
                <span className="text-neutral-700">
                  Prefers:{" "}
                  {contactLabels[parentProfile.communication_preference] ??
                    parentProfile.communication_preference}
                </span>
              </div>
            )}
          </div>

          <p className="mt-4 text-center text-xs text-neutral-400">
            Member since {formatDate(profile.created_at)}
          </p>
        </Card>

        {/* ── Students card ─────────────────────────────────── */}
        <Card padding="none" className="lg:col-span-2">
          <div className="flex items-center justify-between border-b border-neutral-100 px-5 py-4">
            <CardTitle>
              Students
              <span className="ml-2 text-xs font-medium text-neutral-400">
                ({students?.length ?? 0})
              </span>
            </CardTitle>
            <Link href="/parent/students/new">
              <Button size="xs" variant="ghost" iconLeft={<Plus className="h-3.5 w-3.5" />}>
                Add Student
              </Button>
            </Link>
          </div>

          {!students || students.length === 0 ? (
            <div className="px-5 py-8 text-center">
              <div className="mx-auto mb-3 flex h-12 w-12 items-center justify-center rounded-xl bg-neutral-100 text-neutral-400">
                <GraduationCap className="h-6 w-6" />
              </div>
              <p className="text-sm font-semibold text-navy-900">No students added</p>
              <p className="mt-1 text-xs text-neutral-500">
                Students are auto-created when you post a requirement.
              </p>
            </div>
          ) : (
            <ul className="divide-y divide-neutral-50">
              {students.map((student) => (
                <li key={student.id} className="flex items-start justify-between gap-4 px-5 py-4">
                  <div className="flex items-center gap-3">
                    <Avatar name={student.full_name} size="sm" />
                    <div>
                      <p className="text-sm font-semibold text-navy-900">
                        {student.full_name}
                      </p>
                      <div className="flex flex-wrap gap-x-2 gap-y-0.5 text-xs text-neutral-500">
                        {student.current_grade && (
                          <span>{student.current_grade}</span>
                        )}
                        {student.school_name && (
                          <span>· {student.school_name}</span>
                        )}
                        {student.gender && (
                          <span className="capitalize">· {student.gender}</span>
                        )}
                      </div>
                    </div>
                  </div>
                </li>
              ))}
            </ul>
          )}
        </Card>

        {/* ── Account settings note ─────────────────────────── */}
        <Card padding="md" className="lg:col-span-3">
          <div className="flex items-start gap-3">
            <UserCircle className="h-5 w-5 flex-shrink-0 text-neutral-400" />
            <div>
              <p className="text-sm font-semibold text-navy-900">Account settings</p>
              <p className="mt-0.5 text-xs text-neutral-500">
                To update your email, phone, or password, please contact{" "}
                <Link
                  href="/parent/support"
                  className="font-semibold text-brand-700 underline-offset-2 hover:underline"
                >
                  TutorMeet support
                </Link>
                . Profile editing will be available in a future update.
              </p>
            </div>
          </div>
        </Card>
      </div>
    </div>
  );
}
