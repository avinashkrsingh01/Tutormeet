import type { Board, Grade, Subject, TeachingMode, DayOfWeek } from "./common";

// ─────────────────────────────────────────────────────────────────────────────
// Verification status pipeline
// ─────────────────────────────────────────────────────────────────────────────

export type TutorVerificationStatus =
  | "draft"               // Registered, onboarding not yet started
  | "pending"             // Onboarding in progress — incomplete
  | "profile_submitted"   // All 6 steps complete, awaiting admin review
  | "documents_pending"   // Admin requests additional documents
  | "under_review"        // Admin actively reviewing
  | "assessment_pending"  // Knowledge assessment not yet taken
  | "interview_pending"   // Assessment passed, interview scheduled
  | "verified"            // Fully verified and active
  | "rejected"            // Failed verification
  | "suspended";          // Was verified but suspended

// ─────────────────────────────────────────────────────────────────────────────
// Education
// ─────────────────────────────────────────────────────────────────────────────

export type Qualification =
  | "10th / SSC"
  | "12th / HSC"
  | "Diploma"
  | "Bachelor's Degree"
  | "Master's Degree"
  | "M.Phil"
  | "Ph.D"
  | "B.Ed"
  | "M.Ed"
  | "Other";

export type EducationQualification = {
  id:                  string;
  degree:              string;        // Exact degree name e.g. "B.Sc Mathematics"
  qualification_level: Qualification; // Highest level
  institution:         string;
  board_or_university: string;
  year_of_passing:     number;
  percentage_or_grade: string;
  subject_specialisation: string;     // e.g. "Mathematics, Physics"
};

// ─────────────────────────────────────────────────────────────────────────────
// Teaching experience
// ─────────────────────────────────────────────────────────────────────────────

export type ExperienceType =
  | "school_teacher"
  | "coaching_institute"
  | "home_tutor"
  | "online_tutor"
  | "college_lecturer"
  | "other";

export type TeachingExperience = {
  id:               string;
  experience_type:  ExperienceType;
  institution_name: string;
  role:             string;
  subjects:         Subject[];
  grades:           Grade[];
  start_year:       number;
  end_year:         number | null;    // null = current
  is_current:       boolean;
  description:      string | null;
};

// ─────────────────────────────────────────────────────────────────────────────
// Onboarding step tracking
// ─────────────────────────────────────────────────────────────────────────────

export type OnboardingStep =
  | "basic_profile"
  | "education"
  | "experience"
  | "teaching_preferences"
  | "documents"
  | "submitted";

export type TutorOnboardingState = {
  current_step:   OnboardingStep;
  steps_complete: OnboardingStep[];
};

// ─────────────────────────────────────────────────────────────────────────────
// Core tutor profile
// ─────────────────────────────────────────────────────────────────────────────

export type TutorProfile = {
  id:      string;
  user_id: string;
  verification_status: TutorVerificationStatus;
  onboarding_step:     OnboardingStep | null;

  // Personal (private — not shown publicly)
  date_of_birth:  string | null;
  gender:         "male" | "female" | "other" | null;

  // Location (locality + city shown publicly; full address stays private)
  locality:  string | null;
  city:      string | null;
  pincode:   string | null;     // private
  state:     string | null;

  // Profile photo
  avatar_url: string | null;

  // Teaching info (public)
  subjects:             Subject[];
  grades:               Grade[];
  boards:               Board[];
  teaching_mode:        TeachingMode | null;
  preferred_days:       DayOfWeek[];
  preferred_time_slots: string[];
  expected_fee_per_hour: number | null;
  demo_class_available: boolean;
  max_travel_distance_km: number | null;   // new

  // Background (public excerpts; raw data stays private)
  bio:                 string | null;
  years_of_experience: number | null;
  education:           EducationQualification[];
  experience:          TeachingExperience[];

  // Scores (public — computed by admin after assessment/interview)
  knowledge_score:  number | null;   // 0-100
  teaching_score:   number | null;   // 0-100

  // Verification flags (private — admin only)
  identity_verified:  boolean;
  education_verified: boolean;
  admin_notes:        string | null;
  verified_at:        string | null;
  verified_by:        string | null;

  // Stats
  average_rating:  number | null;
  total_reviews:   number;
  total_students:  number;

  created_at: string;
  updated_at: string;
};

// ─────────────────────────────────────────────────────────────────────────────
// Documents
// ─────────────────────────────────────────────────────────────────────────────

export type DocumentType =
  | "aadhaar"
  | "pan"
  | "passport"
  | "driving_licence"
  | "degree_certificate"
  | "marksheet"
  | "experience_letter"
  | "teaching_certificate"
  | "profile_photo"
  | "other";

export type DocumentStatus = "pending" | "approved" | "rejected";

export type TutorDocument = {
  id:           string;
  tutor_id:     string;
  document_type: DocumentType;
  file_url:     string;    // PRIVATE — never exposed publicly
  file_name:    string;
  status:       DocumentStatus;
  admin_notes:  string | null;
  uploaded_at:  string;
  reviewed_at:  string | null;
  reviewed_by:  string | null;
};

// ─────────────────────────────────────────────────────────────────────────────
// Assessment
// ─────────────────────────────────────────────────────────────────────────────

export type AssessmentStatus =
  | "not_started"
  | "scheduled"
  | "in_progress"
  | "completed"
  | "passed"
  | "failed";

export type TutorAssessment = {
  id:           string;
  tutor_id:     string;
  subject:      Subject;
  score:        number | null;
  max_score:    number;
  status:       AssessmentStatus;
  scheduled_at: string | null;
  started_at:   string | null;
  completed_at: string | null;
};

// ─────────────────────────────────────────────────────────────────────────────
// Public tutor profile (safe to display — no PII)
// ─────────────────────────────────────────────────────────────────────────────

export type PublicTutorProfile = {
  id:                    string;
  full_name:             string;
  avatar_url:            string | null;
  // Location — locality + city only, no pincode or full address
  locality:              string | null;
  city:                  string | null;
  // Teaching
  subjects:              Subject[];
  grades:                Grade[];
  boards:                Board[];
  teaching_mode:         TeachingMode | null;
  years_of_experience:   number | null;
  expected_fee_per_hour: number | null;
  demo_class_available:  boolean;
  max_travel_distance_km: number | null;
  // Bio
  bio:                   string | null;
  // Scores (admin-assigned after assessment)
  knowledge_score:       number | null;
  teaching_score:        number | null;
  // Social proof
  average_rating:        number | null;
  total_reviews:         number;
  total_students:        number;
  // Verified flag
  is_verified:           boolean;
  verified_at:           string | null;
};

// ─────────────────────────────────────────────────────────────────────────────
// Tutor card (compact — for lists/matches)
// ─────────────────────────────────────────────────────────────────────────────

export type TutorCard = {
  id:                    string;
  full_name:             string;
  avatar_url:            string | null;
  subjects:              Subject[];
  grades:                Grade[];
  boards:                Board[];
  teaching_mode:         TeachingMode | null;
  years_of_experience:   number | null;
  expected_fee_per_hour: number | null;
  average_rating:        number | null;
  total_reviews:         number;
  locality:              string | null;
  city:                  string | null;
  demo_class_available:  boolean;
  bio:                   string | null;
  knowledge_score:       number | null;
  teaching_score:        number | null;
};
