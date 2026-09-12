import type { Address } from "./common";

// ─── Communication preference ─────────────────────────────────────────────────

export type CommunicationPreference = "whatsapp" | "call" | "email" | "any";

// ─── Student (child of parent) ────────────────────────────────────────────────

export type Student = {
  id: string;
  parent_id: string;
  full_name: string;
  date_of_birth: string | null;
  gender: "male" | "female" | "other" | null;
  current_grade: string | null;
  school_name: string | null;
  created_at: string;
};

// ─── Parent profile (mirrors `parent_profiles` table) ────────────────────────

export type ParentProfile = {
  id: string;       // UUID — matches profiles.id
  user_id: string;
  city: string | null;
  locality: string | null;
  communication_preference: CommunicationPreference | null;
  onboarding_complete: boolean;
  address: Address | null;
  students: Student[];
  created_at: string;
  updated_at: string;
};
