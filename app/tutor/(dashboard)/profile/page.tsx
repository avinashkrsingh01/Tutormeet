import { redirect } from "next/navigation";
import type { Metadata } from "next";
import { createClient } from "@/lib/supabase/server";
import { DashboardHeader } from "@/components/layout/DashboardShell";
import { Card } from "@/components/ui/Card";
import { Alert } from "@/components/ui/Alert";
import { TutorProfileForm } from "@/components/tutor/TutorProfileForm";

export const metadata: Metadata = { title: "My Profile" };

export default async function TutorProfilePage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  const [{ data: profile }, { data: tp }] = await Promise.all([
    supabase
      .from("profiles")
      .select("full_name, email, phone, avatar_url")
      .eq("id", user.id)
      .single(),
    supabase
      .from("tutor_profiles")
      .select(
        "gender, date_of_birth, locality, city, pincode, subjects, grades, boards, teaching_mode, preferred_days, preferred_time_slots, expected_fee_per_hour, years_of_experience, bio, demo_class_available, verification_status, knowledge_score, teaching_score"
      )
      .eq("user_id", user.id)
      .single(),
  ]);

  return (
    <div>
      <DashboardHeader
        title="My Profile"
        description="Update your teaching profile. Changes are reviewed by our team."
      />

      {tp?.verification_status === "verified" && (
        <Alert
          variant="teal"
          title="Profile changes are reviewed"
          message="As a verified tutor, significant profile changes may trigger a brief re-review before they appear publicly."
          className="mb-6"
        />
      )}

      <Card>
        <TutorProfileForm
          userId={user.id}
          profile={profile}
          tutorProfile={tp as Record<string, unknown> | null}
        />
      </Card>
    </div>
  );
}
