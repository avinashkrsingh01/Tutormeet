"use client";

import { useState, useTransition } from "react";
import { useForm, useFieldArray } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { Plus, Trash2, ArrowRight, ArrowLeft, GraduationCap } from "lucide-react";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import { Select } from "@/components/ui/Select";
import { Alert } from "@/components/ui/Alert";
import { tutorEducationSchema, type TutorEducationInput } from "@/lib/validations";
import { QUALIFICATION_LEVELS } from "@/lib/constants";
import { saveTutorEducationAction } from "@/app/actions/tutor";
import { useRouter } from "next/navigation";
import type { EducationQualification } from "@/types/tutor";
import { cn } from "@/lib/utils";

const CURRENT_YEAR = new Date().getFullYear();
const YEARS = Array.from({ length: CURRENT_YEAR - 1969 }, (_, i) => CURRENT_YEAR - i);

const emptyEntry = (): Omit<EducationQualification, "id"> => ({
  degree:                  "",
  qualification_level:     "Other" as const,
  institution:             "",
  board_or_university:     "",
  year_of_passing:         CURRENT_YEAR,
  percentage_or_grade:     "",
  subject_specialisation:  "",
});

interface EducationFormProps {
  existing: EducationQualification[];
}

export function EducationForm({ existing }: EducationFormProps) {
  const router = useRouter();
  const [serverError, setServerError] = useState<string | null>(null);
  const [isPending, startTransition]  = useTransition();

  const initial = existing.length > 0
    ? existing.map(({ id: _id, ...rest }) => rest)
    : [emptyEntry()];

  const {
    register,
    control,
    handleSubmit,
    formState: { errors },
  } = useForm<TutorEducationInput>({
    resolver: zodResolver(tutorEducationSchema),
    defaultValues: { education: initial },
  });

  const { fields, append, remove } = useFieldArray({
    control,
    name: "education",
  });

  function onSubmit(data: TutorEducationInput) {
    setServerError(null);
    startTransition(async () => {
      const result = await saveTutorEducationAction(data);
      if (result?.error) setServerError(result.error);
    });
  }

  const eduErrors = errors.education;

  return (
    <form onSubmit={handleSubmit(onSubmit)} noValidate className="space-y-6">
      {serverError && <Alert variant="error" message={serverError} />}

      {fields.map((field, i) => (
        <div
          key={field.id}
          className={cn(
            "relative rounded-2xl border p-5 sm:p-6",
            eduErrors?.[i] ? "border-red-200 bg-red-50/30" : "border-neutral-200 bg-neutral-50"
          )}
        >
          {/* Entry header */}
          <div className="mb-4 flex items-center justify-between">
            <div className="flex items-center gap-2">
              <div className="flex h-7 w-7 items-center justify-center rounded-lg bg-brand-900 text-white text-xs font-bold">
                {i + 1}
              </div>
              <span className="text-sm font-semibold text-navy-900">
                {i === 0 ? "Highest qualification" : `Additional qualification ${i + 1}`}
              </span>
            </div>
            {fields.length > 1 && (
              <button
                type="button"
                onClick={() => remove(i)}
                className="rounded-lg p-1.5 text-neutral-400 hover:bg-red-50 hover:text-red-500 transition-colors"
                aria-label="Remove qualification"
              >
                <Trash2 className="h-4 w-4" />
              </button>
            )}
          </div>

          <div className="space-y-4">
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
              <Select
                label="Qualification level"
                required
                placeholder="Select level"
                options={QUALIFICATION_LEVELS.map((q) => ({ label: q, value: q }))}
                error={eduErrors?.[i]?.qualification_level?.message}
                {...register(`education.${i}.qualification_level`)}
              />
              <Input
                label="Degree / Course name"
                placeholder="e.g. B.Sc Mathematics"
                required
                error={eduErrors?.[i]?.degree?.message}
                {...register(`education.${i}.degree`)}
              />
            </div>

            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
              <Input
                label="College / University"
                placeholder="e.g. Delhi University"
                required
                error={eduErrors?.[i]?.institution?.message}
                {...register(`education.${i}.institution`)}
              />
              <Input
                label="Board / University affiliation"
                placeholder="e.g. University of Delhi"
                required
                error={eduErrors?.[i]?.board_or_university?.message}
                {...register(`education.${i}.board_or_university`)}
              />
            </div>

            <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
              <Select
                label="Year of passing"
                required
                options={YEARS.map((y) => ({ label: String(y), value: y }))}
                error={eduErrors?.[i]?.year_of_passing?.message}
                {...register(`education.${i}.year_of_passing`, { valueAsNumber: true })}
              />
              <Input
                label="Grade / Percentage"
                placeholder="e.g. 78% or A+"
                required
                error={eduErrors?.[i]?.percentage_or_grade?.message}
                {...register(`education.${i}.percentage_or_grade`)}
              />
              <Input
                label="Subject specialisation"
                placeholder="e.g. Mathematics"
                required
                hint="Main subjects studied"
                error={eduErrors?.[i]?.subject_specialisation?.message}
                {...register(`education.${i}.subject_specialisation`)}
              />
            </div>
          </div>
        </div>
      ))}

      {/* Add another */}
      <button
        type="button"
        onClick={() => append(emptyEntry())}
        className="flex w-full items-center justify-center gap-2 rounded-2xl border-2 border-dashed border-neutral-300 py-4 text-sm font-medium text-neutral-500 hover:border-brand-300 hover:bg-brand-50 hover:text-brand-700 transition-all duration-150"
      >
        <Plus className="h-4 w-4" />
        Add another qualification
      </button>

      {typeof eduErrors?.message === "string" && (
        <p className="field-error">{eduErrors.message}</p>
      )}

      <div className="flex justify-between border-t border-neutral-100 pt-5">
        <Button
          type="button"
          variant="ghost"
          size="md"
          onClick={() => router.push("/tutor/onboarding")}
          disabled={isPending}
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
