"use client";

import { useState, useTransition } from "react";
import { useForm, useFieldArray, Controller } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { Plus, Trash2, ArrowRight, ArrowLeft } from "lucide-react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import { Select } from "@/components/ui/Select";
import { Textarea } from "@/components/ui/Textarea";
import { Alert } from "@/components/ui/Alert";
import { tutorExperienceSchema, type TutorExperienceInput } from "@/lib/validations";
import { EXPERIENCE_TYPES, SUBJECTS, GRADES } from "@/lib/constants";
import { saveTutorExperienceAction } from "@/app/actions/tutor";
import { cn } from "@/lib/utils";
import type { TeachingExperience } from "@/types/tutor";

const CURRENT_YEAR = new Date().getFullYear();
const YEARS        = Array.from({ length: CURRENT_YEAR - 1989 }, (_, i) => CURRENT_YEAR - i);

// ─── Pill multi-select ────────────────────────────────────────────────────────

function PillMulti({
  label, required, options, value, onChange, error,
}: {
  label: string; required?: boolean; options: string[];
  value: string[]; onChange: (v: string[]) => void; error?: string;
}) {
  function toggle(opt: string) {
    onChange(value.includes(opt) ? value.filter((v) => v !== opt) : [...value, opt]);
  }
  return (
    <div>
      <label className="label-base">
        {label}{required && <span className="ml-1 text-red-500">*</span>}
      </label>
      <div className="flex flex-wrap gap-1.5">
        {options.map((opt) => (
          <button
            key={opt} type="button" onClick={() => toggle(opt)} aria-pressed={value.includes(opt)}
            className={cn(
              "rounded-xl border-2 px-3 py-1 text-xs font-semibold transition-all",
              value.includes(opt)
                ? "border-brand-900 bg-brand-900 text-white"
                : "border-neutral-200 bg-white text-neutral-600 hover:border-neutral-300"
            )}
          >{opt}</button>
        ))}
      </div>
      {error && <p className="field-error">{error}</p>}
    </div>
  );
}

// ─── Empty entry factory ──────────────────────────────────────────────────────

function makeEmpty() {
  return {
    experience_type:  "" as string,
    institution_name: "" as string,
    role:             "" as string,
    subjects:         [] as string[],
    grades:           [] as string[],
    start_year:       CURRENT_YEAR - 1,
    end_year:         undefined as number | undefined,
    is_current:       false,
    description:      undefined as string | undefined,
  };
}

// ─── Props ────────────────────────────────────────────────────────────────────

interface ExperienceFormProps {
  existing:      TeachingExperience[];
  existingYears: number;
}

// ─── Component ────────────────────────────────────────────────────────────────

export function ExperienceForm({ existing, existingYears }: ExperienceFormProps) {
  const router = useRouter();
  const [serverError, setServerError] = useState<string | null>(null);
  const [isPending, startTransition]  = useTransition();

  // Convert DB records to form shape (null → undefined to satisfy Zod)
  const initial = existing.length > 0
    ? existing.map(({ id: _id, ...rest }) => ({
        experience_type:  rest.experience_type  as string,
        institution_name: rest.institution_name,
        role:             rest.role,
        subjects:         rest.subjects         as string[],
        grades:           rest.grades           as string[],
        start_year:       rest.start_year,
        end_year:         rest.end_year         ?? undefined,
        is_current:       rest.is_current,
        description:      rest.description      ?? undefined,
      }))
    : [makeEmpty()];

  const {
    register, control, handleSubmit, watch, formState: { errors },
  } = useForm<TutorExperienceInput>({
    resolver: zodResolver(tutorExperienceSchema),
    defaultValues: {
      years_of_experience: existingYears,
      is_fresher:          existing.length === 0 && existingYears === 0,
      experience:          initial,
    },
  });

  const { fields, append, remove } = useFieldArray({ control, name: "experience" });
  const isFresher = watch("is_fresher");

  const handleValid = (data: TutorExperienceInput) => {
    setServerError(null);
    startTransition(async () => {
      const result = await saveTutorExperienceAction(data);
      if (result?.error) setServerError(result.error);
    });
  };

  const expErrors = errors.experience as any;

  return (
    <form onSubmit={handleSubmit(handleValid)} noValidate className="space-y-6">
      {serverError && <Alert variant="error" message={serverError} />}

      {/* Fresher toggle */}
      <div className={cn(
        "flex items-start gap-3 rounded-2xl border-2 p-4 transition-colors",
        isFresher ? "border-accent-300 bg-accent-50" : "border-neutral-200 bg-neutral-50"
      )}>
        <input
          id="is_fresher" type="checkbox"
          className="mt-0.5 h-4 w-4 rounded border-neutral-300 text-accent-600 focus:ring-accent-500"
          {...register("is_fresher")}
        />
        <label htmlFor="is_fresher" className="cursor-pointer">
          <p className="text-sm font-semibold text-navy-900">I am a fresher</p>
          <p className="text-xs text-neutral-500">
            I don&apos;t have prior teaching experience — this is my first role.
          </p>
        </label>
      </div>

      {/* Total years */}
      <div className="grid grid-cols-2 gap-4 sm:grid-cols-4">
        <Input
          label="Total years of experience"
          type="number" min={0} max={50}
          required={!isFresher}
          hint={isFresher ? "Leave as 0" : ""}
          error={errors.years_of_experience?.message}
          {...register("years_of_experience", { valueAsNumber: true })}
        />
      </div>

      {/* Experience entries */}
      {!isFresher && (
        <div className="space-y-5">
          {fields.map((field, i) => {
            const isCurrent = watch(`experience.${i}.is_current`);

            return (
              <div
                key={field.id}
                className={cn(
                  "rounded-2xl border p-5 sm:p-6",
                  expErrors?.[i] ? "border-red-200 bg-red-50/30" : "border-neutral-200 bg-neutral-50"
                )}
              >
                {/* Entry header */}
                <div className="mb-4 flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <div className="flex h-7 w-7 items-center justify-center rounded-lg bg-brand-900 text-white text-xs font-bold">
                      {i + 1}
                    </div>
                    <span className="text-sm font-semibold text-navy-900">Experience {i + 1}</span>
                  </div>
                  {fields.length > 1 && (
                    <button
                      type="button" onClick={() => remove(i)}
                      className="rounded-lg p-1.5 text-neutral-400 hover:bg-red-50 hover:text-red-500 transition-colors"
                    >
                      <Trash2 className="h-4 w-4" />
                    </button>
                  )}
                </div>

                <div className="space-y-4">
                  {/* Type + institution */}
                  <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                    <Select
                      label="Experience type" required placeholder="Select type"
                      options={EXPERIENCE_TYPES.map((e) => ({ label: e.label, value: e.value }))}
                      error={expErrors?.[i]?.experience_type?.message}
                      {...register(`experience.${i}.experience_type`)}
                    />
                    <Input
                      label="Institution / Organisation" placeholder="e.g. Delhi Public School" required
                      error={expErrors?.[i]?.institution_name?.message}
                      {...register(`experience.${i}.institution_name`)}
                    />
                  </div>

                  {/* Role */}
                  <Input
                    label="Your role" placeholder="e.g. Mathematics Teacher, Home Tutor" required
                    error={expErrors?.[i]?.role?.message}
                    {...register(`experience.${i}.role`)}
                  />

                  {/* Subjects + grades */}
                  <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                    <Controller
                      control={control} name={`experience.${i}.subjects`}
                      render={({ field }) => (
                        <PillMulti label="Subjects taught" required options={SUBJECTS}
                          value={field.value as string[]} onChange={field.onChange}
                          error={expErrors?.[i]?.subjects?.message}
                        />
                      )}
                    />
                    <Controller
                      control={control} name={`experience.${i}.grades`}
                      render={({ field }) => (
                        <PillMulti label="Classes taught" required options={GRADES}
                          value={field.value as string[]} onChange={field.onChange}
                          error={expErrors?.[i]?.grades?.message}
                        />
                      )}
                    />
                  </div>

                  {/* Years + current flag */}
                  <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
                    <Select
                      label="Start year" required
                      options={YEARS.map((y) => ({ label: String(y), value: y }))}
                      error={expErrors?.[i]?.start_year?.message}
                      {...register(`experience.${i}.start_year`, { valueAsNumber: true })}
                    />
                    <Select
                      label="End year"
                      options={[
                        { label: "Present", value: 0 },
                        ...YEARS.map((y) => ({ label: String(y), value: y })),
                      ]}
                      hint={isCurrent ? "Currently working here" : ""}
                      {...register(`experience.${i}.end_year`, {
                        setValueAs: (v) => (v === "0" || v === 0 ? undefined : Number(v) || undefined),
                      })}
                    />
                    <div className="flex items-end pb-1">
                      <label className="flex items-center gap-2 text-sm text-neutral-700 cursor-pointer">
                        <input type="checkbox" className="h-4 w-4 rounded border-neutral-300"
                          {...register(`experience.${i}.is_current`)} />
                        Currently here
                      </label>
                    </div>
                  </div>

                  {/* Description */}
                  <Textarea
                    label="Description (optional)"
                    placeholder="Brief description of your role and responsibilities..."
                    rows={2}
                    error={expErrors?.[i]?.description?.message}
                    {...register(`experience.${i}.description`)}
                  />
                </div>
              </div>
            );
          })}

          {/* Add another */}
          <button
            type="button" onClick={() => append(makeEmpty())}
            className="flex w-full items-center justify-center gap-2 rounded-2xl border-2 border-dashed border-neutral-300 py-4 text-sm font-medium text-neutral-500 hover:border-brand-300 hover:bg-brand-50 hover:text-brand-700 transition-all duration-150"
          >
            <Plus className="h-4 w-4" />
            Add another experience
          </button>
        </div>
      )}

      {/* Navigation */}
      <div className="flex justify-between border-t border-neutral-100 pt-5">
        <Button
          type="button" variant="ghost" size="md" disabled={isPending}
          onClick={() => router.push("/tutor/onboarding/education")}
          iconLeft={<ArrowLeft className="h-4 w-4" />}
        >
          Back
        </Button>
        <Button type="submit" variant="primary" size="lg" loading={isPending}>
          Save &amp; Continue
          <ArrowRight className="h-4 w-4" />
        </Button>
      </div>
    </form>
  );
}
