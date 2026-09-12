import type { Board, Grade, Subject, DayOfWeek, TeachingMode } from "@/types/common";

// ─── App metadata ─────────────────────────────────────────────────────────────

export const APP_NAME = "TutorMeet";
export const APP_TAGLINE = "Find. Meet. Learn.";
export const APP_DESCRIPTION =
  "India's trusted home-tutor marketplace. Find verified, background-checked tutors in your locality.";

// ─── Indian curriculum boards ─────────────────────────────────────────────────

export const BOARDS: Board[] = [
  "CBSE",
  "ICSE",
  "IB",
  "IGCSE",
  "State Board",
  "Other",
];

// ─── Grade levels ─────────────────────────────────────────────────────────────

export const GRADES: Grade[] = [
  "Nursery",
  "LKG",
  "UKG",
  "Class 1",
  "Class 2",
  "Class 3",
  "Class 4",
  "Class 5",
  "Class 6",
  "Class 7",
  "Class 8",
  "Class 9",
  "Class 10",
  "Class 11",
  "Class 12",
  "Undergraduate",
  "Competitive Exam",
];

// ─── Subjects ─────────────────────────────────────────────────────────────────

export const SUBJECTS: Subject[] = [
  "Mathematics",
  "Science",
  "Physics",
  "Chemistry",
  "Biology",
  "English",
  "Hindi",
  "Social Studies",
  "History",
  "Geography",
  "Economics",
  "Accountancy",
  "Business Studies",
  "Computer Science",
  "Sanskrit",
  "Other",
];

// ─── Days of week ─────────────────────────────────────────────────────────────

export const DAYS_OF_WEEK: DayOfWeek[] = [
  "Monday",
  "Tuesday",
  "Wednesday",
  "Thursday",
  "Friday",
  "Saturday",
  "Sunday",
];

// ─── Teaching modes ───────────────────────────────────────────────────────────

export const TEACHING_MODES: TeachingMode[] = [
  "Home Visit",
  "Student's Home",
  "Both",
];

// ─── Time slots ───────────────────────────────────────────────────────────────

export const TIME_SLOTS: string[] = [
  "6:00 AM – 8:00 AM",
  "8:00 AM – 10:00 AM",
  "10:00 AM – 12:00 PM",
  "12:00 PM – 2:00 PM",
  "2:00 PM – 4:00 PM",
  "4:00 PM – 6:00 PM",
  "6:00 PM – 8:00 PM",
  "8:00 PM – 10:00 PM",
];

// ─── Session durations (minutes) ──────────────────────────────────────────────

export const SESSION_DURATIONS = [
  { label: "30 minutes", value: 30 },
  { label: "45 minutes", value: 45 },
  { label: "1 hour", value: 60 },
  { label: "1.5 hours", value: 90 },
  { label: "2 hours", value: 120 },
];

// ─── Route constants ──────────────────────────────────────────────────────────

export const ROUTES = {
  home: "/",
  login: "/login",
  register: "/register",
  unauthorized: "/unauthorized",

  parent: {
    dashboard: "/parent/dashboard",
    requirements: "/parent/requirements",
    newRequirement: "/parent/requirements/new",
    matches: "/parent/matches",
    demos: "/parent/demos",
    attendance: "/parent/attendance",
    reviews: "/parent/reviews",
    profile: "/parent/profile",
  },

  tutor: {
    dashboard: "/tutor/dashboard",
    profile: "/tutor/profile",
    documents: "/tutor/documents",
    assessment: "/tutor/assessment",
    status: "/tutor/status",
    students: "/tutor/students",
    attendance: "/tutor/attendance",
  },

  admin: {
    dashboard: "/admin/dashboard",
    tutors: "/admin/tutors",
    requirements: "/admin/requirements",
    matching: "/admin/matching",
    demos: "/admin/demos",
    payments: "/admin/payments",
    users: "/admin/users",
  },
} as const;

// ─── Supabase storage buckets ─────────────────────────────────────────────────

export const STORAGE_BUCKETS = {
  avatars: "avatars",
  documents: "tutor-documents",
} as const;

// ─── Tutor qualification levels ──────────────────────────────────────────────

export const QUALIFICATION_LEVELS = [
  "10th / SSC",
  "12th / HSC",
  "Diploma",
  "Bachelor's Degree",
  "Master's Degree",
  "M.Phil",
  "Ph.D",
  "B.Ed",
  "M.Ed",
  "Other",
] as const;

// ─── Tutor experience types ───────────────────────────────────────────────────

export const EXPERIENCE_TYPES = [
  { value: "school_teacher",      label: "School Teacher" },
  { value: "coaching_institute",  label: "Coaching Institute" },
  { value: "home_tutor",          label: "Home Tutor" },
  { value: "online_tutor",        label: "Online Tutor" },
  { value: "college_lecturer",    label: "College / University Lecturer" },
  { value: "other",               label: "Other" },
] as const;

// ─── Indian states ────────────────────────────────────────────────────────────

export const INDIAN_STATES = [
  "Andhra Pradesh",
  "Arunachal Pradesh",
  "Assam",
  "Bihar",
  "Chhattisgarh",
  "Goa",
  "Gujarat",
  "Haryana",
  "Himachal Pradesh",
  "Jharkhand",
  "Karnataka",
  "Kerala",
  "Madhya Pradesh",
  "Maharashtra",
  "Manipur",
  "Meghalaya",
  "Mizoram",
  "Nagaland",
  "Odisha",
  "Punjab",
  "Rajasthan",
  "Sikkim",
  "Tamil Nadu",
  "Telangana",
  "Tripura",
  "Uttar Pradesh",
  "Uttarakhand",
  "West Bengal",
  "Andaman and Nicobar Islands",
  "Chandigarh",
  "Delhi",
  "Jammu and Kashmir",
  "Ladakh",
  "Lakshadweep",
  "Puducherry",
] as const;

// ─── Tutor onboarding steps ───────────────────────────────────────────────────

export const TUTOR_ONBOARDING_STEPS = [
  { key: "basic_profile",         label: "Basic Profile",         description: "Your personal details" },
  { key: "education",             label: "Education",             description: "Qualifications" },
  { key: "experience",            label: "Experience",            description: "Teaching history" },
  { key: "teaching_preferences",  label: "Preferences",           description: "What you teach" },
  { key: "documents",             label: "Documents",             description: "Verification docs" },
  { key: "submitted",             label: "Submit",                description: "Review & apply" },
] as const;

export type TutorOnboardingStepKey = typeof TUTOR_ONBOARDING_STEPS[number]["key"];

// ─── Document type labels ─────────────────────────────────────────────────────

export const DOCUMENT_TYPE_LABELS: Record<string, string> = {
  aadhaar:               "Aadhaar Card",
  pan:                   "PAN Card",
  passport:              "Passport",
  driving_licence:       "Driving Licence",
  degree_certificate:    "Degree Certificate",
  marksheet:             "Marksheet / Transcript",
  experience_letter:     "Experience Letter",
  teaching_certificate:  "Teaching Certificate / B.Ed",
  profile_photo:         "Profile Photo",
  other:                 "Other Document",
};

// ─── Required documents for verification ─────────────────────────────────────

export const REQUIRED_DOCUMENTS = [
  {
    type:     "aadhaar" as const,
    label:    "Aadhaar Card",
    hint:     "Government-issued identity proof",
    required: true,
  },
  {
    type:     "degree_certificate" as const,
    label:    "Degree Certificate",
    hint:     "Your highest academic qualification",
    required: true,
  },
  {
    type:     "marksheet" as const,
    label:    "Marksheet / Transcript",
    hint:     "Academic marksheet for your highest degree",
    required: true,
  },
  {
    type:     "experience_letter" as const,
    label:    "Experience Letter",
    hint:     "If available — from a school, institute or employer",
    required: false,
  },
] as const;

// ─── Travel distance options ──────────────────────────────────────────────────

export const TRAVEL_DISTANCES = [
  { label: "Up to 2 km",  value: 2  },
  { label: "Up to 5 km",  value: 5  },
  { label: "Up to 10 km", value: 10 },
  { label: "Up to 15 km", value: 15 },
  { label: "Up to 20 km", value: 20 },
  { label: "Up to 30 km", value: 30 },
  { label: "Up to 50 km", value: 50 },
] as const;
