// ============================================================
// TutorMeet — Safety & Reporting Types
// ============================================================

export type ReportTargetType = "tutor" | "parent" | "incident";

export type ReportCategory =
  // Tutor reports
  | "inappropriate_behaviour"
  | "unprofessional_conduct"
  | "no_show"
  | "abusive_language"
  | "privacy_concern"         // tutor shared private info
  | "fraud_misrepresentation"
  // Parent reports
  | "payment_dispute"
  | "abusive_language_parent"
  | "false_information"
  // General incidents
  | "child_safety_concern"    // highest priority — admin notified immediately
  | "harassment"
  | "unsafe_environment"
  | "other";

export type ReportStatus =
  | "submitted"      // Just filed
  | "acknowledged"   // Admin seen it
  | "investigating"  // Admin working on it
  | "resolved"       // Action taken
  | "closed";        // No action needed / insufficient evidence

export type SafetyReport = {
  id:             string;
  reporter_id:    string;           // user who filed the report
  target_type:    ReportTargetType;
  target_user_id: string | null;    // tutor or parent being reported (null for incidents)
  category:       ReportCategory;
  description:    string;           // reporter's account
  is_urgent:      boolean;          // child_safety_concern = always true
  status:         ReportStatus;
  // Admin only — never exposed to reporter
  admin_notes:    string | null;
  assigned_to:    string | null;
  resolved_at:    string | null;
  resolution:     string | null;
  created_at:     string;
  updated_at:     string;
};
