/**
 * Zod validation schemas for all form inputs.
 * Used by react-hook-form + @hookform/resolvers on the client,
 * and re-used in Server Actions for server-side validation.
 */
import { z } from "zod";

// ─────────────────────────────────────────────────────────────────────────────
// AUTH
// ─────────────────────────────────────────────────────────────────────────────

export const loginSchema = z.object({
  email:    z.string().email("Enter a valid email address"),
  password: z.string().min(8, "Password must be at least 8 characters"),
});

export const registerParentSchema = z
  .object({
    full_name:        z.string().min(2, "Enter your full name"),
    email:            z.string().email("Enter a valid email address"),
    phone:            z
      .string()
      .regex(/^[6-9]\d{9}$/, "Enter a valid 10-digit Indian mobile number"),
    password:         z.string().min(8, "Password must be at least 8 characters"),
    confirm_password: z.string(),
  })
  .refine((d) => d.password === d.confirm_password, {
    message: "Passwords do not match",
    path:    ["confirm_password"],
  });

export const registerTutorSchema = z
  .object({
    full_name:        z.string().min(2, "Enter your full name"),
    email:            z.string().email("Enter a valid email address"),
    phone:            z
      .string()
      .regex(/^[6-9]\d{9}$/, "Enter a valid 10-digit Indian mobile number"),
    password:         z.string().min(8, "Password must be at least 8 characters"),
    confirm_password: z.string(),
  })
  .refine((d) => d.password === d.confirm_password, {
    message: "Passwords do not match",
    path:    ["confirm_password"],
  });

// ─────────────────────────────────────────────────────────────────────────────
// PARENT PROFILE COMPLETION
// ─────────────────────────────────────────────────────────────────────────────

export const parentProfileSchema = z.object({
  full_name: z.string().min(2, "Enter your full name"),
  phone:     z
    .string()
    .regex(/^[6-9]\d{9}$/, "Enter a valid 10-digit mobile number"),
  city:     z.string().min(2, "Enter your city"),
  locality: z.string().min(2, "Enter your locality or area"),
  communication_preference: z.enum(["whatsapp", "call", "email", "any"], {
    required_error: "Select a preferred contact method",
  }),
});

// ─────────────────────────────────────────────────────────────────────────────
// TUITION REQUIREMENT
// ─────────────────────────────────────────────────────────────────────────────

export const requirementSchema = z.object({
  student_name:   z.string().min(2, "Enter the student's name"),
  student_class:  z.string().min(1, "Select a class"),
  board:          z.string().min(1, "Select a board"),
  subjects:       z.array(z.string()).min(1, "Select at least one subject"),
  learning_goals: z.string().max(400).optional(),
  preferred_tutor_gender: z.enum(["male", "female", "no_preference"]),
  teaching_mode:  z.enum(["Home Visit", "Student's Home", "Both"]),
  preferred_days: z.array(z.string()).min(1, "Select at least one day"),
  preferred_time_slots: z.array(z.string()).min(1, "Select at least one time slot"),
  sessions_per_week:    z.number().min(1).max(7),
  session_duration_minutes: z.number().min(30).max(180),
  locality:        z.string().min(2, "Enter your locality"),
  pincode:         z.string().regex(/^\d{6}$/, "Enter a valid 6-digit pincode"),
  city:            z.string().min(2, "Enter your city"),
  budget_per_hour: z.number().min(500, "Minimum monthly budget is ₹500").nullable().optional(),
  special_requirements: z.string().max(500).optional(),
});

// ─────────────────────────────────────────────────────────────────────────────
// TUTOR ONBOARDING — STEP 1: Basic Profile
// ─────────────────────────────────────────────────────────────────────────────

export const tutorBasicProfileSchema = z.object({
  full_name:     z.string().min(2, "Enter your full name"),
  phone:         z
    .string()
    .regex(/^[6-9]\d{9}$/, "Enter a valid 10-digit Indian mobile number"),
  gender:        z.enum(["male", "female", "other"], {
    required_error: "Select your gender",
  }),
  date_of_birth: z
    .string()
    .min(1, "Enter your date of birth")
    .refine((v) => {
      const dob   = new Date(v);
      const today = new Date();
      const age   = today.getFullYear() - dob.getFullYear();
      return age >= 18 && age <= 75;
    }, "You must be between 18 and 75 years old"),
  city:     z.string().min(2, "Enter your city"),
  locality: z.string().min(2, "Enter your locality or area"),
  pincode:  z.string().regex(/^\d{6}$/, "Enter a valid 6-digit pincode"),
  state:    z.string().min(2, "Enter your state"),
  bio:      z
    .string()
    .min(50,  "Write at least 50 characters about yourself")
    .max(600, "Maximum 600 characters"),
});

// ─────────────────────────────────────────────────────────────────────────────
// TUTOR ONBOARDING — STEP 2: Education
// ─────────────────────────────────────────────────────────────────────────────

export const tutorEducationEntrySchema = z.object({
  degree:                  z.string().min(2, "Enter your degree name"),
  qualification_level:     z.string().min(1, "Select qualification level"),
  institution:             z.string().min(2, "Enter your college or university"),
  board_or_university:     z.string().min(2, "Enter the board or university name"),
  year_of_passing:         z
    .number()
    .min(1970, "Enter a valid year")
    .max(new Date().getFullYear(), "Year cannot be in the future"),
  percentage_or_grade:     z.string().min(1, "Enter your grade or percentage"),
  subject_specialisation:  z.string().min(2, "Enter your subject specialisation"),
});

export const tutorEducationSchema = z.object({
  education: z
    .array(tutorEducationEntrySchema)
    .min(1, "Add at least one qualification"),
});

// ─────────────────────────────────────────────────────────────────────────────
// TUTOR ONBOARDING — STEP 3: Teaching Experience
// ─────────────────────────────────────────────────────────────────────────────

export const tutorExperienceEntrySchema = z.object({
  experience_type:  z.string().min(1, "Select experience type"),
  institution_name: z.string().min(2, "Enter the institution name"),
  role:             z.string().min(2, "Enter your role"),
  subjects:         z.array(z.string()).min(1, "Select at least one subject"),
  grades:           z.array(z.string()).min(1, "Select at least one class"),
  start_year:       z
    .number()
    .min(1990, "Enter a valid start year")
    .max(new Date().getFullYear(), "Start year cannot be in the future"),
  end_year:         z.number().nullable().optional(),
  is_current:       z.boolean(),
  description:      z.string().max(300).optional(),
});

export const tutorExperienceSchema = z.object({
  years_of_experience: z.number().min(0).max(50),
  experience:          z.array(tutorExperienceEntrySchema),
  // Fresher flag — if true, experience array can be empty
  is_fresher:          z.boolean(),
});

// ─────────────────────────────────────────────────────────────────────────────
// TUTOR ONBOARDING — STEP 4: Teaching Preferences
// ─────────────────────────────────────────────────────────────────────────────

export const tutorPreferencesSchema = z.object({
  subjects:               z.array(z.string()).min(1, "Select at least one subject"),
  grades:                 z.array(z.string()).min(1, "Select at least one class"),
  boards:                 z.array(z.string()).min(1, "Select at least one board"),
  teaching_mode:          z.enum(["Home Visit", "Student's Home", "Both"]),
  preferred_days:         z.array(z.string()).min(1, "Select at least one day"),
  preferred_time_slots:   z.array(z.string()).min(1, "Select at least one time slot"),
  expected_fee_per_hour:  z.number().min(100, "Minimum ₹100/hour"),
  demo_class_available:   z.boolean(),
  max_travel_distance_km: z.number().min(1).max(50).nullable().optional(),
});

// ─────────────────────────────────────────────────────────────────────────────
// LEGACY — kept for backwards compat with existing API route
// ─────────────────────────────────────────────────────────────────────────────

export const tutorProfileSchema = z.object({
  date_of_birth:          z.string().min(1, "Enter your date of birth"),
  gender:                 z.enum(["male", "female", "other"]),
  subjects:               z.array(z.string()).min(1, "Select at least one subject"),
  grades:                 z.array(z.string()).min(1, "Select at least one grade"),
  boards:                 z.array(z.string()).min(1, "Select at least one board"),
  teaching_mode:          z.enum(["Home Visit", "Student's Home", "Both"]),
  preferred_days:         z.array(z.string()).min(1, "Select at least one day"),
  preferred_time_slots:   z.array(z.string()).min(1, "Select at least one time slot"),
  expected_fee_per_hour:  z.number().min(100, "Minimum fee is ₹100/hour"),
  bio:                    z.string().min(50).max(600),
  years_of_experience:    z.number().min(0).max(50),
  locality:               z.string().min(2, "Enter your locality"),
  city:                   z.string().min(2, "Enter your city"),
  pincode:                z.string().regex(/^\d{6}$/, "Enter a valid 6-digit pincode"),
  demo_class_available:   z.boolean(),
});

// ─────────────────────────────────────────────────────────────────────────────
// INFERRED TYPES
// ─────────────────────────────────────────────────────────────────────────────

export type LoginInput                  = z.infer<typeof loginSchema>;
export type RegisterParentInput         = z.infer<typeof registerParentSchema>;
export type RegisterTutorInput          = z.infer<typeof registerTutorSchema>;
export type ParentProfileInput          = z.infer<typeof parentProfileSchema>;
export type RequirementInput            = z.infer<typeof requirementSchema>;
export type TutorBasicProfileInput      = z.infer<typeof tutorBasicProfileSchema>;
export type TutorEducationEntryInput    = z.infer<typeof tutorEducationEntrySchema>;
export type TutorEducationInput         = z.infer<typeof tutorEducationSchema>;
export type TutorExperienceEntryInput   = z.infer<typeof tutorExperienceEntrySchema>;
export type TutorExperienceInput        = z.infer<typeof tutorExperienceSchema>;
export type TutorPreferencesInput       = z.infer<typeof tutorPreferencesSchema>;
export type TutorProfileInput           = z.infer<typeof tutorProfileSchema>;
