"use client";

import { useState, useTransition } from "react";
import { useForm, Controller } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { ArrowRight, ArrowLeft, BookOpen, Calendar, IndianRupee } from "lucide-react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import { Select } from "@/components/ui/Select";
import { Alert } from "@/components/ui/Alert";
import { tutorPreferencesSchema, type TutorPreferencesInput } from "@/lib/validations";
import {
  SUBJECTS, GRADES, BOARDS, TEACHING_MODES,
  DAYS_OF_WEEK, TIME_SLOTS, TRAVEL_DISTANCES,
} from "@/lib/constants";
import { saveTutorPreferencesAction } from "@/app/actions/tutor";
import { cn } from "@/lib/utils";

function FormSection({
  icon,
  title,
  children,
}: {
  icon: React.ReactNode;
  title: string;
  children: React.ReactNode;
}) {
  return (
    <section className="space-y-4">
      <div className="flex items-center gap-2 border-b border-neutral-100 pb-3">
        <span className="text-brand-700">{icon}</span>
        <h3 className="text-sm font-bold text-navy-900">{title}</h3>
      </div>
      {children}
    </section>
  );
}

function PillGrid({
  label,
  required,
  options,
  value,
  onChange,
  error,
}: {
  label: string;
  required?: boolean;
  options: string[];
  value: string[];
  onChange: (v: string[]) => void;
  error?: string;
}) {
  function toggle(opt: string) {
    onChange(value.includes(opt) ? value.filter((v) => v !== opt) : [...value, opt]);
  }
  return (
    <div>
      <label className="label-base">
        {label}{required && <span className="ml-1 text-red-500">*</span>}
      </label>
      <div className="flex flex-wrap gap-2">
        {options.map((opt) => (
          <button
            key={opt}
            type="button"
            onClick={() => toggle(opt)}
            aria-pressed={value.includes(opt)}
            className={cn(
              "rounded-xl border-2 px-3 py-1.5 text-xs font-semibold transition-all",
              value.includes(opt)
                ? "border-brand-900 bg-brand-900 text-white"
                : "border-neutral-200 bg-white text-neutral-600 hover:border-neutral-300"
            )}
          >
            {opt}
          </button>
        ))}
      </div>
      {error && <p className="field-error">{error}</p>}
    </div>
  );
}

export function PreferencesForm({
  defaultValues,
}: {
  defaultValues: TutorPreferencesInput;
}) {
  const router = useRouter();
  const [serverError, setServerError] = useState<string | null>(null);
  const [isPending, startTransition]  = useTransition();

  const {
    register,
    control,
    handleSubmit,
    formState: { errors },
  } = useForm<TutorPreferencesInput>({
    resolver: zodResolver(tutorPreferencesSchema),
    defaultValues,
  });

  function onSubmit(data: TutorPreferencesInput) {
    setServerError(null);
    startTransition(async () => {
      const result = await saveTutorPreferencesAction(data);
      if (result?.error) setServerError(result.error);
    });
  }

  return (
    <form onSubmit={handleSubmit(onSubmit)} noValidate className="space-y-7">
      {serverError && <Alert variant="error" message={serverError} />}

      {/* What you teach */}
      <FormSection icon={<BookOpen className="h-4 w-4" />} title="What you teach">
        <Controller
          control={control}
          name="subjects"
          render={({ field }) => (
            <PillGrid
              label="Subjects"
              required
              options={SUBJECTS}
              value={field.value}
              onChange={field.onChange}
              error={errors.subjects?.message}
            />
          )}
        />
        <Controller
          control={control}
          name="grades"
          render={({ field }) => (
            <PillGrid
              label="Classes / Grades"
              required
              options={GRADES}
              value={field.value}
              onChange={field.onChange}
              error={errors.grades?.message}
            />
          )}
        />
        <Controller
          control={control}
          name="boards"
          render={({ field }) => (
            <PillGrid
              label="Boards"
              required
              options={BOARDS}
              value={field.value}
              onChange={field.onChange}
              error={errors.boards?.message}
            />
          )}
        />

        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
          <Select
            label="Teaching mode"
            required
            options={TEACHING_MODES.map((m) => ({ label: m, value: m }))}
            error={errors.teaching_mode?.message}
            {...register("teaching_mode")}
          />
          <Select
            label="Maximum travel distance"
            placeholder="Select distance"
            options={TRAVEL_DISTANCES.map((d) => ({ label: d.label, value: d.value }))}
            hint="How far can you travel for home tuition?"
            error={errors.max_travel_distance_km?.message}
            {...register("max_travel_distance_km", { valueAsNumber: true })}
          />
        </div>
      </FormSection>

      {/* Availability */}
      <FormSection icon={<Calendar className="h-4 w-4" />} title="Availability">
        <Controller
          control={control}
          name="preferred_days"
          render={({ field }) => (
            <PillGrid
              label="Available days"
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
            <PillGrid
              label="Available time slots"
              required
              options={TIME_SLOTS}
              value={field.value}
              onChange={field.onChange}
              error={errors.preferred_time_slots?.message}
            />
          )}
        />
      </FormSection>

      {/* Fee */}
      <FormSection icon={<IndianRupee className="h-4 w-4" />} title="Fee &amp; demo">
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
          <Input
            label="Expected fee per hour (₹)"
            type="number"
            required
            min={100}
            placeholder="e.g. 500"
            hint="Minimum ₹100/hour"
            error={errors.expected_fee_per_hour?.message}
            {...register("expected_fee_per_hour", { valueAsNumber: true })}
          />
          <div className="flex items-end pb-1">
            <label className="flex items-start gap-3 cursor-pointer">
              <input
                type="checkbox"
                className="mt-0.5 h-4 w-4 rounded border-neutral-300 text-brand-900"
                {...register("demo_class_available")}
              />
              <div>
                <p className="text-sm font-semibold text-navy-900">
                  Available for free demo class
                </p>
                <p className="text-xs text-neutral-500">
                  Highly recommended — builds parent trust
                </p>
              </div>
            </label>
          </div>
        </div>
      </FormSection>

      <div className="flex justify-between border-t border-neutral-100 pt-5">
        <Button
          type="button"
          variant="ghost"
          size="md"
          onClick={() => router.push("/tutor/onboarding/experience")}
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
