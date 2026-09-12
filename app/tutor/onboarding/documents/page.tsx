import { redirect } from "next/navigation";
import type { Metadata } from "next";
import { createClient } from "@/lib/supabase/server";
import { OnboardingCard } from "@/components/tutor/OnboardingCard";
import { OnboardingDocumentUpload } from "@/components/tutor/onboarding/OnboardingDocumentUpload";
import type { TutorDocument } from "@/types/tutor";

export const metadata: Metadata = { title: "Verification Documents — Tutor Registration" };

export default async function TutorOnboardingDocumentsPage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  const { data: tp } = await supabase
    .from("tutor_profiles")
    .select("id, onboarding_step")
    .eq("user_id", user.id)
    .maybeSingle();

  if (!tp || !["documents", "submitted"].includes(tp.onboarding_step ?? "")) {
    redirect("/tutor/onboarding/preferences");
  }

  const { data: documents } = await supabase
    .from("tutor_documents")
    .select("id, document_type, file_name, status, uploaded_at, admin_notes")
    .eq("tutor_id", tp.id)
    .order("uploaded_at", { ascending: true });

  return (
    <OnboardingCard
      step="documents"
      title="Verification documents"
      description="Upload your identity and education documents. These are reviewed only by TutorMeet's verification team and are never shown publicly."
      maxWidth="lg"
    >
      <OnboardingDocumentUpload
        tutorProfileId={tp.id}
        existingDocuments={(documents as TutorDocument[]) ?? []}
      />
    </OnboardingCard>
  );
}
