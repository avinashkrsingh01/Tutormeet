"use client";

import { useState, useTransition } from "react";
import { useForm, Controller } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { useRouter } from "next/navigation";
import {
  User,
  BookOpen,
  Calendar,
  MapPin,
  IndianRupee,
  ArrowRight,
  ArrowLeft,
  CheckCircle2,
  Clock,
  GraduationCap,
} from "lucide-react";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import { Select } from "@/components/ui/Select";
import { Textarea } from "@/components/ui/Textarea";
import { Alert } from "@/components/ui/Alert";
import { requirementSchema, type RequirementInput } from "@/lib/validations";
import {
  SUBJECTS,
  GRADES,
  BOARDS,
  TEACHING_MODES,
  DAYS_OF_WEEK,
  TIME_SLOTS,
  SESSION_DURATIONS,
} from "@/lib/constants";
import { cn } from "@/lib/utils";
import { postRequirementAction } from "@/app/actions/parent";

// ─── Pill multi-select ────────────────────────────────────────────────────────

function PillSelect({
  label,
  hint,
  options,
  value,
  onChange,
  error,
  required,
  columns = "auto",
}: {
  label: string;
  hint?: string;
  options: string[];
  value: string[];
  onChange: (v: string[]) => void;
  error?: string;
  required?: boolean;
  columns?: "auto" | 2 | 3;
}) {
  function toggle(opt: string) {
    onChange(
      value.includes(opt) ? value.filter((v) => v !== opt) : [...value, opt]
    );
  }

  return (
    <div>
      <label className="label-base">
        {label}
        {required && <span className="ml-1 text-red-500" aria-hidden="true">*</span>}
      </label>
      {hint && <p className="mb-2 text-xs text-neutral-500">{hint}</p>}
      <div
        className={cn(
          "flex flex-wrap gap-2",
          columns === 2 && "grid grid-cols-2",
          columns === 3 && "grid grid-cols-3"
        )}
      >
        {options.map((opt) => (
          <button
            key={opt}
            type="button"
            onClick={() => toggle(opt)}
            aria-pressed={value.includes(opt)}
            className={cn(
              "rounded-xl border-2 px-3 py-1.5 text-xs font-semibold transition-all duration-100",
              value.includes(opt)
                ? "border-brand-900 bg-brand-900 text-white"
                : "border-neutral-200 bg-white text-neutral-600 hover:border-neutral-300 hover:bg-neutral-50"
            )}
          >
            {opt}
          </button>
        ))}
      </div>
      {error && (
        <p className="field-error" role="alert">{error}</p>
      )}
    </div>
  );
}

// ─── Section wrapper ──────────────────────────────────────────────────────────

function FormSection({
  icon,
  title,
  description,
  children,
}: {
  icon: React.ReactNode;
  title: string;
  description?: string;
  children: React.ReactNode;
}) {
  return (
    <section className="space-y-5">
      <div className="flex items-start gap-3 border-b border-neutral-100 pb-3">
        <div className="flex h-8 w-8 flex-shrink-0 items-center justify-center rounded-lg bg-brand-50 text-brand-700">
          {icon}
        </div>
        <div>
          <h3 className="text-sm font-bold text-navy-900" style={{ letterSpacing: "-0.01em" }}>
            {title}
          </h3>
          {description && (
            <p className="text-xs text-neutral-500">{description}</p>
          )}
        </div>
      </div>
      {children}
    </section>
  );
}

// ─── Step indicator ───────────────────────────────────────────────────────────

function StepDots({ total, current }: { total: number; current: number }) {
  return (
    <div className="flex items-center justify-center gap-1.5">
      {Array.from({ length: total }).map((_, i) => (
        <div
          key={i}
          className={cn(
            "rounded-full transition-all duration-200",
            i === current
              ? "h-2 w-6 bg-brand-900"
              : i < current
              ? "h-2 w-2 bg-accent-500"
              : "h-2 w-2 bg-neutral-200"
          )}
        />
      ))}
    </div>
  );
}

// ─── Main form ────────────────────────────────────────────────────────────────

const TOTAL_STEPS = 4;

const stepTitles = [
  { title: "About the student",    subtitle: "Who is this tuition for?" },
  { title: "Schedule & teaching",  subtitle: "When and how should lessons happen?" },
  { title: "Location & budget",    subtitle: "Where and what's your budget?" },
  { title: "Review & submit",      subtitle: "Everything look right?" },
];

interface RequirementFormProps {
  parentCity?:     string;
  parentLocality?: string;
  isOnboarding?:   boolean;
}

export function RequirementForm({
  parentCity     = "",
  parentLocality = "",
  isOnboarding   = false,
}: RequirementFormProps) {
  const router  = useRouter();
  const [step,        setStep]        = useState(0);
  const [serverError, setServerError] = useState<string | null>(null);
  const [isPending, startTransition]  = useTransition();

  const {
    register,
    control,
    handleSubmit,
    watch,
    trigger,
    getValues,
    formState: { errors },
  } = useForm<RequirementInput>({
    resolver: zodResolver(requirementSchema),
    defaultValues: {
      student_name:            "",
      student_class:           "",
      board:                   "",
      subjects:                [],
      learning_goals:          "",
      preferred_tutor_gender:  "no_preference",
      teaching_mode:           "Home Visit",
      preferred_days:          [],
      preferred_time_slots:    [],
      sessions_per_week:       3,
      session_duration_minutes: 60,
      locality:                parentLocality,
      city:                    parentCity,
      pincode:                 "",
      budget_per_hour:         null,  // stored as monthly budget
      special_requirements:   "",
    },
  });

  // Field groups per step for validation
  const stepFields: (keyof RequirementInput)[][] = [
    ["student_name", "student_class", "board", "subjects"],
    ["teaching_mode", "preferred_tutor_gender", "preferred_days", "preferred_time_slots", "sessions_per_week", "session_duration_minutes"],
    ["locality", "city", "pincode"],
    [],
  ];

  async function goNext() {
    const valid = await trigger(stepFields[step]);
    if (valid) setStep((s) => s + 1);
  }

  function goBack() {
    setStep((s) => Math.max(0, s - 1));
  }

  function onSubmit(data: RequirementInput) {
    setServerError(null);
    startTransition(async () => {
      const result = await postRequirementAction(data);
      if ("error" in result) {
        setServerError(result.error);
        return;
      }
      router.push(`/parent/requirements/${result.id}/confirmation`);
    });
  }

  const values = getValues();

  return (
    <div className="w-full">
      {/* Step dots */}
      <div className="mb-6">
        <StepDots total={TOTAL_STEPS} current={step} />
        <div className="mt-3 text-center">
          <p className="text-base font-bold text-navy-900" style={{ letterSpacing: "-0.01em" }}>
            {stepTitles[step].title}
          </p>
          <p className="text-sm text-neutral-500">{stepTitles[step].subtitle}</p>
        </div>
      </div>

      {serverError && <Alert variant="error" message={serverError} className="mb-4" />}

      <form onSubmit={handleSubmit(onSubmit)} noValidate>

        {/* ── STEP 0: Student + subject ──────────────────────── */}
        {step === 0 && (
          <div className="space-y-6">
            <FormSection icon={<User className="h-4 w-4" />} title="Student details">
              <Input
                label="Student's name"
                type="text"
                placeholder="e.g. Arjun"
                required
                hint="First name is fine — not shown to tutors"
                error={errors.student_name?.message}
                {...register("student_name")}
              />
              <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                <Select
                  label="Class / Grade"
                  required
                  placeholder="Select class"
                  options={GRADES.map((g) => ({ label: g, value: g }))}
                  error={errors.student_class?.message}
                  {...register("student_class")}
                />
                <Select
                  label="Board"
                  required
                  placeholder="Select board"
                  options={BOARDS.map((b) => ({ label: b, value: b }))}
                  error={errors.board?.message}
                  {...register("board")}
                />
              </div>
            </FormSection>

            <FormSection
              icon={<BookOpen className="h-4 w-4" />}
              title="Subjects needed"
              description="Select one or more subjects"
            >
              <Controller
                control={control}
                name="subjects"
                render={({ field }) => (
                  <PillSelect
                    label="Subjects"
                    required
                    options={SUBJECTS}
                    value={field.value}
                    onChange={field.onChange}
                    error={errors.subjects?.message}
                  />
                )}
              />

              <Textarea
                label="Learning goals (optional)"
                placeholder="e.g. Improve problem-solving skills, prepare for board exams, build confidence in the subject..."
                rows={3}
                hint="Helps tutors understand what you're looking for"
                error={errors.learning_goals?.message}
                {...register("learning_goals")}
              />
            </FormSection>
          </div>
        )}

        {/* ── STEP 1: Schedule + teaching ───────────────────── */}
        {step === 1 && (
          <div className="space-y-6">
            <FormSection
              icon={<GraduationCap className="h-4 w-4" />}
              title="Teaching preferences"
            >
              <Select
                label="Teaching mode"
                required
                options={TEACHING_MODES.map((m) => ({ label: m, value: m }))}
                error={errors.teaching_mode?.message}
                {...register("teaching_mode")}
              />

              <div>
                <label className="label-base">
                  Preferred tutor gender
                </label>
                <Controller
                  control={control}
                  name="preferred_tutor_gender"
                  render={({ field }) => (
                    <div className="grid grid-cols-3 gap-2.5">
                      {[
                        { value: "no_preference", label: "No preference" },
                        { value: "female",        label: "Female tutor" },
                        { value: "male",          label: "Male tutor" },
                      ].map((opt) => (
                        <button
                          key={opt.value}
                          type="button"
                          onClick={() => field.onChange(opt.value)}
                          className={cn(
                            "rounded-xl border-2 px-3 py-2.5 text-xs font-semibold transition-all duration-100",
                            field.value === opt.value
                              ? "border-brand-900 bg-brand-900 text-white"
                              : "border-neutral-200 bg-white text-neutral-600 hover:border-neutral-300"
                          )}
                        >
                          {opt.label}
                        </button>
                      ))}
                    </div>
                  )}
                />
              </div>
            </FormSection>

            <FormSection
              icon={<Calendar className="h-4 w-4" />}
              title="Schedule"
              description="When should sessions happen?"
            >
              <Controller
                control={control}
                name="preferred_days"
                render={({ field }) => (
                  <PillSelect
                    label="Preferred days"
                    required
                    options={DAYS_OF_WEEK}
                    value={field.value}
                    onChange={field.onChange}
                    error={errors.preferred_days?.message}
                  />
                )}
              />

              <Controller
                control={control}
                name="preferred_time_slots"
                render={({ field }) => (
                  <PillSelect
                    label="Preferred time slots"
                    required
                    options={TIME_SLOTS}
                    value={field.value}
                    onChange={field.onChange}
                    error={errors.preferred_time_slots?.message}
                  />
                )}
              />

              <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                <Select
                  label="Sessions per week"
                  required
                  options={[1, 2, 3, 4, 5, 6, 7].map((n) => ({
                    label: `${n} session${n > 1 ? "s" : ""} / week`,
                    value: n,
                  }))}
                  error={errors.sessions_per_week?.message}
                  {...register("sessions_per_week", { valueAsNumber: true })}
                />
                <Select
                  label="Session duration"
                  required
                  options={SESSION_DURATIONS.map((d) => ({
                    label: d.label,
                    value: d.value,
                  }))}
                  error={errors.session_duration_minutes?.message}
                  {...register("session_duration_minutes", { valueAsNumber: true })}
                />
              </div>
            </FormSection>
          </div>
        )}

        {/* ── STEP 2: Location + budget ──────────────────────── */}
        {step === 2 && (
          <div className="space-y-6">
            <FormSection
              icon={<MapPin className="h-4 w-4" />}
              title="Location"
              description="We share only your locality with tutors — not your full address."
            >
              <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                <Input
                  label="Locality / Area"
                  placeholder="e.g. Koramangala"
                  required
                  error={errors.locality?.message}
                  {...register("locality")}
                />
                <Input
                  label="City"
                  placeholder="e.g. Bengaluru"
                  required
                  error={errors.city?.message}
                  {...register("city")}
                />
              </div>
              <Input
                label="PIN code"
                placeholder="6-digit pincode"
                required
                maxLength={6}
                error={errors.pincode?.message}
                {...register("pincode")}
              />
              <div className="flex items-start gap-2 rounded-xl border border-accent-200 bg-accent-50 px-4 py-3">
                <CheckCircle2 className="mt-0.5 h-4 w-4 flex-shrink-0 text-accent-600" />
                <p className="text-xs text-accent-800">
                  Your complete home address is never shared with tutors until
                  you have selected one and tuition begins.
                </p>
              </div>
            </FormSection>

            <FormSection
              icon={<IndianRupee className="h-4 w-4" />}
              title="Budget"
              description="Optional — leave blank if flexible"
            >
              <Input
                label="Monthly budget (₹)"
                type="number"
                placeholder="e.g. 4000"
                hint="Your total budget per month — helps us shortlist tutors within your range"
                error={errors.budget_per_hour?.message}
                {...register("budget_per_hour", { valueAsNumber: true })}
              />
              <Textarea
                label="Any other requirements? (optional)"
                placeholder="e.g. Tutor should speak Kannada, student has dyslexia, needs exam-focused coaching..."
                rows={3}
                error={errors.special_requirements?.message}
                {...register("special_requirements")}
              />
            </FormSection>
          </div>
        )}

        {/* ── STEP 3: Review ────────────────────────────────── */}
        {step === 3 && (
          <div className="space-y-5">
            <ReviewRow label="Student"      value={`${values.student_name} · ${values.student_class}`} />
            <ReviewRow label="Board"        value={values.board} />
            <ReviewRow label="Subjects"     value={values.subjects.join(", ")} />
            {values.learning_goals && (
              <ReviewRow label="Learning goals" value={values.learning_goals} />
            )}
            <ReviewRow label="Teaching mode"    value={values.teaching_mode} />
            <ReviewRow label="Tutor gender"     value={values.preferred_tutor_gender.replace("_", " ")} />
            <ReviewRow label="Days"             value={values.preferred_days.join(", ")} />
            <ReviewRow label="Time"             value={values.preferred_time_slots.join(", ")} />
            <ReviewRow label="Sessions / week"  value={`${values.sessions_per_week}`} />
            <ReviewRow label="Duration"         value={`${values.session_duration_minutes} min`} />
            <ReviewRow label="Location"         value={`${values.locality}, ${values.city} — ${values.pincode}`} />
            {values.budget_per_hour && (
              <ReviewRow label="Budget" value={`₹${values.budget_per_hour}/month`} />
            )}
            {values.special_requirements && (
              <ReviewRow label="Special requirements" value={values.special_requirements} />
            )}

            <div className="mt-2 flex items-start gap-2 rounded-xl border border-brand-200 bg-brand-50 px-4 py-3">
              <CheckCircle2 className="mt-0.5 h-4 w-4 flex-shrink-0 text-brand-700" />
              <p className="text-xs text-brand-800">
                Once submitted, our team will review your requirement and
                shortlist suitable verified tutors within 48 hours.
              </p>
            </div>
          </div>
        )}

        {/* ── Navigation ────────────────────────────────────── */}
        <div className="mt-8 flex items-center justify-between gap-3">
          {step > 0 ? (
            <Button
              type="button"
              variant="ghost"
              size="md"
              onClick={goBack}
              disabled={isPending}
              iconLeft={<ArrowLeft className="h-4 w-4" />}
            >
              Back
            </Button>
          ) : (
            <div />
          )}

          {step < TOTAL_STEPS - 1 ? (
            <Button
              type="button"
              variant="primary"
              size="md"
              onClick={goNext}
              iconRight={<ArrowRight className="h-4 w-4" />}
            >
              Continue
            </Button>
          ) : (
            <Button
              type="submit"
              variant="teal"
              size="md"
              loading={isPending}
              iconRight={<ArrowRight className="h-4 w-4" />}
            >
              Submit Requirement
            </Button>
          )}
        </div>
      </form>
    </div>
  );
}

// ─── Review row ───────────────────────────────────────────────────────────────

function ReviewRow({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex items-start justify-between gap-4 border-b border-neutral-100 pb-3 last:border-0">
      <span className="flex-shrink-0 text-xs font-semibold uppercase tracking-wide text-neutral-400">
        {label}
      </span>
      <span className="text-right text-sm font-medium text-navy-900">
        {value || "—"}
      </span>
    </div>
  );
}
