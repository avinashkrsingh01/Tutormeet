// ============================================================
// TutorMeet — Admin Types & Role System
// ============================================================

// ─── Admin role tiers ─────────────────────────────────────────────────────────

export type AdminRole =
  | "super_admin"         // Full access to everything including settings
  | "verification_admin"  // Can verify/reject tutors and review documents
  | "operations_admin"    // Can match tutors, schedule demos, manage requirements
  | "support_admin";      // Can view tickets and basic user info only

// ─── Permission matrix ────────────────────────────────────────────────────────

export type AdminPermission =
  // Dashboard
  | "view_dashboard"
  // Tutors
  | "view_tutors"
  | "verify_tutors"          // approve / reject / request more info
  | "view_tutor_documents"   // sensitive — verification_admin + super_admin only
  | "suspend_tutors"
  // Parents
  | "view_parents"
  | "view_parent_contact"    // phone numbers — operations + super only
  // Students
  | "view_students"
  // Requirements
  | "view_requirements"
  | "manage_requirements"    // status changes, notes
  // Matching
  | "run_matching_engine"
  | "shortlist_tutors"
  | "assign_tutors"
  // Demos
  | "view_demos"
  | "schedule_demos"
  | "manage_demos"
  // Enrollments
  | "view_enrollments"
  | "manage_enrollments"
  // Payments
  | "view_payments"
  | "manage_payments"        // super_admin only
  // Reviews
  | "view_reviews"
  | "moderate_reviews"
  // Support
  | "view_support_tickets"
  | "respond_support_tickets"
  // Admin management
  | "view_admin_logs"        // super_admin only
  | "manage_admins"          // super_admin only
  | "manage_settings";       // super_admin only

export const ROLE_PERMISSIONS: Record<AdminRole, AdminPermission[]> = {
  super_admin: [
    "view_dashboard",
    "view_tutors", "verify_tutors", "view_tutor_documents", "suspend_tutors",
    "view_parents", "view_parent_contact",
    "view_students",
    "view_requirements", "manage_requirements",
    "run_matching_engine", "shortlist_tutors", "assign_tutors",
    "view_demos", "schedule_demos", "manage_demos",
    "view_enrollments", "manage_enrollments",
    "view_payments", "manage_payments",
    "view_reviews", "moderate_reviews",
    "view_support_tickets", "respond_support_tickets",
    "view_admin_logs", "manage_admins", "manage_settings",
  ],
  verification_admin: [
    "view_dashboard",
    "view_tutors", "verify_tutors", "view_tutor_documents",
    "view_parents",
    "view_students",
    "view_requirements",
    "view_demos",
    "view_enrollments",
    "view_reviews",
    "view_support_tickets",
    "view_admin_logs",
  ],
  operations_admin: [
    "view_dashboard",
    "view_tutors",
    "view_parents", "view_parent_contact",
    "view_students",
    "view_requirements", "manage_requirements",
    "run_matching_engine", "shortlist_tutors", "assign_tutors",
    "view_demos", "schedule_demos", "manage_demos",
    "view_enrollments", "manage_enrollments",
    "view_payments",
    "view_reviews", "moderate_reviews",
    "view_support_tickets", "respond_support_tickets",
  ],
  support_admin: [
    "view_dashboard",
    "view_tutors",
    "view_parents",
    "view_students",
    "view_requirements",
    "view_demos",
    "view_enrollments",
    "view_reviews",
    "view_support_tickets", "respond_support_tickets",
  ],
};

export function hasPermission(role: AdminRole, permission: AdminPermission): boolean {
  return ROLE_PERMISSIONS[role]?.includes(permission) ?? false;
}

export function getAdminRoleLabel(role: AdminRole): string {
  const labels: Record<AdminRole, string> = {
    super_admin:         "Super Admin",
    verification_admin:  "Verification Admin",
    operations_admin:    "Operations Admin",
    support_admin:       "Support Admin",
  };
  return labels[role] ?? role;
}

// ─── Nav visibility per role ──────────────────────────────────────────────────

export type AdminNavSection =
  | "dashboard" | "tutors" | "parents" | "students"
  | "requirements" | "matches" | "demos" | "enrollments"
  | "payments" | "reviews" | "support" | "safety"
  | "verification" | "reports" | "settings";

export const NAV_PERMISSIONS: Record<AdminNavSection, AdminPermission> = {
  dashboard:    "view_dashboard",
  tutors:       "view_tutors",
  parents:      "view_parents",
  students:     "view_students",
  requirements: "view_requirements",
  matches:      "shortlist_tutors",
  demos:        "view_demos",
  enrollments:  "view_enrollments",
  payments:     "view_payments",
  reviews:      "view_reviews",
  support:      "view_support_tickets",
  safety:       "view_support_tickets",  // safety reports share support permission tier
  verification: "verify_tutors",
  reports:      "view_admin_logs",
  settings:     "manage_settings",
};

// ─── Dashboard stats ──────────────────────────────────────────────────────────

export type DashboardStats = {
  new_tutor_applications:  number;
  pending_verification:    number;
  new_parent_requests:     number;
  pending_matches:         number;
  demos_today:             number;
  active_students:         number;
  active_tutors:           number;
  total_enrollments:       number;
};

// ─── Admin profile (enriched with role) ──────────────────────────────────────

export type AdminProfile = {
  id:         string;
  full_name:  string;
  email:      string;
  avatar_url: string | null;
  role:       "admin";
  admin_role: AdminRole;
};

// ─── Admin action log ─────────────────────────────────────────────────────────

export type AdminActionType =
  | "tutor_approved"      | "tutor_rejected"       | "tutor_suspended"
  | "tutor_reinstated"    | "document_approved"    | "document_rejected"
  | "assessment_scheduled"| "assessment_scored"
  | "interview_scheduled" | "interview_scored"
  | "tutor_matched"       | "tutor_match_removed"
  | "demo_scheduled"      | "demo_cancelled"
  | "requirement_closed"  | "requirement_matched"
  | "user_suspended"      | "user_reinstated"
  | "review_approved"     | "review_rejected"
  | "payment_dispute_resolved"
  | "info_requested";     // new: admin asked tutor for more info

export type AdminActionLog = {
  id:          string;
  admin_id:    string;
  action_type: AdminActionType;
  target_id:   string;
  target_type: "tutor" | "parent" | "student" | "requirement" |
               "document" | "match" | "demo" | "enrollment" |
               "review" | "payment" | "ticket";
  notes:       string | null;
  metadata:    Record<string, unknown> | null;
  created_at:  string;
};
