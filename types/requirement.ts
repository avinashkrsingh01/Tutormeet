import type { Board, Grade, Subject, TeachingMode, DayOfWeek } from "./common";

// ─── Tuition requirement status pipeline ─────────────────────────────────────

export type RequirementStatus =
  | "draft"          // Parent saved but not submitted
  | "submitted"      // Submitted, awaiting admin matching
  | "matching"       // Admin is finding tutors
  | "shortlisted"    // Tutors shortlisted, shown to parent
  | "demo_scheduled" // Demo class arranged
  | "tutor_selected" // Parent has selected a tutor
  | "active"         // Tuition is ongoing
  | "completed"      // Tuition completed
  | "cancelled";     // Cancelled by parent or admin

// ─── Core requirement record ──────────────────────────────────────────────────

export type TuitionRequirement = {
  id: string;
  parent_id: string;
  student_id: string;

  // What they need
  subjects: Subject[];
  grade: Grade;
  board: Board;
  teaching_mode: TeachingMode;

  // Schedule
  preferred_days: DayOfWeek[];
  preferred_time_slots: string[];
  sessions_per_week: number;
  session_duration_minutes: number;

  // Location (locality only shown to tutors — not full address)
  locality: string;
  city: string;
  pincode: string;

  // Preferences
  preferred_tutor_gender: "male" | "female" | "no_preference";
  learning_goals: string | null;
  budget_per_hour: number | null;
  special_requirements: string | null;

  status: RequirementStatus;
  admin_notes: string | null;

  created_at: string;
  updated_at: string;
};

// ─── Tutor–requirement match ──────────────────────────────────────────────────

export type MatchStatus =
  | "suggested"    // Admin added tutor to shortlist
  | "sent"         // Parent has been notified
  | "viewed"       // Parent viewed tutor profile
  | "demo_requested"
  | "demo_scheduled"
  | "demo_completed"
  | "selected"     // Parent chose this tutor
  | "rejected";    // Parent rejected this tutor

export type TutorMatch = {
  id: string;
  requirement_id: string;
  tutor_id: string;
  match_status: MatchStatus;
  admin_notes: string | null;
  created_at: string;
  updated_at: string;
};

// ─── Demo class ───────────────────────────────────────────────────────────────

export type DemoStatus =
  | "requested"      // Parent requested, awaiting admin/tutor action
  | "tutor_accepted" // Tutor confirmed availability
  | "scheduled"      // Admin scheduled with date/time/location
  | "completed"      // Session happened
  | "cancelled"      // Cancelled by any party
  | "no_show";       // Tutor or parent didn't show

export type DemoDeliveryMethod = "home_visit" | "online" | "tutor_location";

export type DemoClass = {
  id:              string;
  match_id:        string | null;
  requirement_id:  string;
  tutor_id:        string;
  parent_id:       string;
  student_id:      string | null;
  student_name:    string | null;   // denormalised for display
  scheduled_at:    string | null;
  duration_minutes: number;
  delivery_method:  DemoDeliveryMethod | null;
  meeting_link:    string | null;   // for online demos
  // SECURITY: venue_address only shown to confirmed parties — NOT in public API
  venue_address:   string | null;
  status:          DemoStatus;
  // Parent feedback
  parent_rating:       number | null;    // 1–5
  parent_feedback:     string | null;
  was_tutor_punctual:  boolean | null;
  was_explanation_clear: boolean | null;
  wants_to_continue:   boolean | null;
  // Tutor feedback
  tutor_feedback:      string | null;
  // Admin
  admin_notes:         string | null;
  scheduled_by:        string | null;
  created_at:          string;
  updated_at:          string;
};

// ─── Attendance ───────────────────────────────────────────────────────────────

export type AttendanceStatus = "present" | "absent" | "cancelled";

export type AttendanceRecord = {
  id: string;
  requirement_id: string;
  tutor_id: string;
  student_id: string;
  date: string;          // ISO date string
  status: AttendanceStatus;
  session_duration_minutes: number;
  marked_by: "tutor" | "parent" | "admin";
  notes: string | null;
  created_at: string;
};

// ─── Review ───────────────────────────────────────────────────────────────────

export type ReviewStatus =
  | "pending"      // Submitted, awaiting admin publish decision
  | "published"    // Approved and visible on tutor public profile
  | "hidden"       // Admin hid it (inappropriate / privacy concern)
  | "reported"     // Flagged by tutor for admin investigation
  | "investigating"; // Admin is reviewing a report

export type Review = {
  id:             string;
  tutor_id:       string;   // tutor_profiles.id (NOT user_id — can't self-review)
  parent_id:      string;   // profiles.id of parent
  student_id:     string;   // students.id
  enrollment_id:  string | null;   // verified via enrollment
  demo_class_id:  string | null;   // verified via completed demo

  // Category ratings (1–5 each)
  rating_teaching_quality:  number;
  rating_subject_knowledge: number;
  rating_punctuality:       number;
  rating_communication:     number;
  rating_professionalism:   number;

  // Overall (computed average or manual)
  overall_rating:   number;

  // Content
  comment:          string | null;

  // Status
  status:           ReviewStatus;
  is_published:     boolean;       // derived from status === "published"
  published_at:     string | null;

  // Verification proof (one of these must be set)
  is_verified_review: boolean;    // set TRUE only when eligibility confirmed

  // Admin moderation
  admin_notes:      string | null;  // PRIVATE
  report_reason:    string | null;  // if status = reported/investigating
  reported_at:      string | null;
  moderated_by:     string | null;
  moderated_at:     string | null;

  created_at:  string;
  updated_at:  string;
};
