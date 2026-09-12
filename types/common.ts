// ─── Generic utility types ──────────────────────────────────────────────────

export type ApiResponse<T = unknown> = {
  data: T | null;
  error: string | null;
  success: boolean;
};

export type PaginatedResponse<T> = {
  data: T[];
  total: number;
  page: number;
  pageSize: number;
  totalPages: number;
};

export type SelectOption = {
  label: string;
  value: string;
};

// ─── Indian locality / address ───────────────────────────────────────────────

export type Address = {
  line1: string;
  line2?: string;
  locality: string;
  city: string;
  state: string;
  pincode: string;
};

// ─── Curriculum boards available in India ────────────────────────────────────

export type Board =
  | "CBSE"
  | "ICSE"
  | "IB"
  | "IGCSE"
  | "State Board"
  | "Other";

// ─── Class / grade levels ────────────────────────────────────────────────────

export type Grade =
  | "Nursery"
  | "LKG"
  | "UKG"
  | "Class 1"
  | "Class 2"
  | "Class 3"
  | "Class 4"
  | "Class 5"
  | "Class 6"
  | "Class 7"
  | "Class 8"
  | "Class 9"
  | "Class 10"
  | "Class 11"
  | "Class 12"
  | "Undergraduate"
  | "Competitive Exam";

// ─── Subjects ────────────────────────────────────────────────────────────────

export type Subject =
  | "Mathematics"
  | "Science"
  | "Physics"
  | "Chemistry"
  | "Biology"
  | "English"
  | "Hindi"
  | "Social Studies"
  | "History"
  | "Geography"
  | "Economics"
  | "Accountancy"
  | "Business Studies"
  | "Computer Science"
  | "Sanskrit"
  | "Other";

// ─── Teaching modes ──────────────────────────────────────────────────────────

export type TeachingMode = "Home Visit" | "Student's Home" | "Both";

// ─── Days of week ────────────────────────────────────────────────────────────

export type DayOfWeek =
  | "Monday"
  | "Tuesday"
  | "Wednesday"
  | "Thursday"
  | "Friday"
  | "Saturday"
  | "Sunday";

// ─── Tutor discovery filter params ───────────────────────────────────────────

export type SortOption =
  | "best_match"
  | "highest_rated"
  | "most_experienced"
  | "lowest_fee"
  | "most_reviews";

export type TutorFilters = {
  city:          string;
  locality:      string;
  pincode:       string;
  subject:       string;
  grade:         string;
  board:         string;
  gender:        string;
  teaching_mode: string;
  min_fee:       string;
  max_fee:       string;
  min_experience: string;
  demo_only:     boolean;
  sort:          SortOption;
  page:          number;
};

export const DEFAULT_FILTERS: TutorFilters = {
  city:           "",
  locality:       "",
  pincode:        "",
  subject:        "",
  grade:          "",
  board:          "",
  gender:         "",
  teaching_mode:  "",
  min_fee:        "",
  max_fee:        "",
  min_experience: "",
  demo_only:      false,
  sort:           "best_match",
  page:           1,
};
