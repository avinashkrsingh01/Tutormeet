"use client";

import { useState, useTransition } from "react";
import { useForm, Controller } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import { Select } from "@/components/ui/Select";
import { Textarea } from "@/components/ui/Textarea";
import { Alert } from "@/components/ui/Alert";
import { tutorProfileSchema, type TutorProfileInput } from "@/lib/validations";
import {
  SUBJECTS, GRADES, BOARDS,
  TEACHING_MODES, DAYS_OF_WEEK, TIME_SLOTS,
} from "@/lib/constants";
import { cn } from "@/lib/utils";

interface TutorProfileFormProps {
  userId:       string;
  profile:      { full_name: string; email: string; phone: string | null; avatar_url: string | null } | null;
  tutorProfile: Record<string, unknown> | null;
}

function PillToggle({
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
      <div className="flex flex-wrap gap-2">
        {options.map((opt) => (
          <button
            key={opt} type="button" onClick={() => toggle(opt)} aria-pressed={value.includes(opt)}
            className={cn(
              "rounded-xl border-2 px-3 py-1.5 text-xs font-semibold transition-all",
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

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <section className="space-y-5">
      <h2 className="border-b border-neutral-100 pb-2 text-sm font-bold text-navy-900">{title}</h2>
      {children}
    </section>
  );
}

export function TutorProfileForm({ userId, tutorProfile }: TutorProfileFormProps) {
  const router = useRouter();
  const [serverError, setServerError] = useState<string | null>(null);
  const [success, setSuccess]         = useState(false);
  const [isPending, startTransition]  = useTransition();

  // Read from new flattened columns (locality/city/pincode instead of address JSONB)
  const addressData = tutorProfile?.address as Record<string, string> | null;

  const {
    register, control, handleSubmit, formState: { errors },
  } = useForm<TutorProfileInput>({
    resolver: zodResolver(tutorProfileSchema),
    defaultValues: {
      subjects:             (tutorProfile?.subjects             as string[]) ?? [],
      grades:               (tutorProfile?.grades               as string[]) ?? [],
      boards:               (tutorProfile?.boards               as string[]) ?? [],
      preferred_days:       (tutorProfile?.preferred_days       as string[]) ?? [],
      preferred_time_slots: (tutorProfile?.preferred_time_slots as string[]) ?? [],
      teaching_mode:        (tutorProfile?.teaching_mode        as TutorProfileInput["teaching_mode"]) ?? "Home Visit",
      bio:                  (tutorProfile?.bio                  as string)  ?? "",
      years_of_experience:  (tutorProfile?.years_of_experience  as number)  ?? 0,
      expected_fee_per_hour:(tutorProfile?.expected_fee_per_hour as number) ?? 300,
      demo_class_available: tutorProfile?.demo_class_available !== false,
      date_of_birth:        (tutorProfile?.date_of_birth        as string)  ?? "",
      gender:               (tutorProfile?.gender               as TutorProfileInput["gender"]) ?? "male",
      // New flattened columns take priority; fall back to legacy address JSONB
      locality: (tutorProfile?.locality as string) ?? addressData?.locality ?? "",
      city:     (tutorProfile?.city     as string) ?? addressData?.city     ?? "",
      pincode:  (tutorProfile?.pincode  as string) ?? addressData?.pincode  ?? "",
    },
  });

  function onSubmit(data: TutorProfileInput) {
    setServerError(null); setSuccess(false);
    startTransition(async () => {
      const res = await fetch("/api/tutor/profile", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ ...data, user_id: userId }),
      });
      const json = await res.json();
      if (!res.ok) { setServerError(json.error ?? "Something went wrong."); return; }
      setSuccess(true);
      router.refresh();
    });
  }

  return (
    <form onSubmit={handleSubmit(onSubmit)} noValidate className="space-y-8">
      {serverError && <Alert variant="error"   message={serverError} />}
      {success     && <Alert variant="success" message="Profile saved successfully!" />}

      <Section title="Personal details">
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
          <Input label="Date of birth" type="date" required error={errors.date_of_birth?.message} {...register("date_of_birth")} />
          <Select label="Gender" required options={[
            { label: "Male", value: "male" }, { label: "Female", value: "female" }, { label: "Other", value: "other" },
          ]} error={errors.gender?.message} {...register("gender")} />
        </div>
      </Section>

      <Section title="Teaching preferences">
        <Controller control={control} name="subjects" render={({ field }) => (
          <PillToggle label="Subjects you teach" required options={SUBJECTS} value={field.value} onChange={field.onChange} error={errors.subjects?.message} />
        )} />
        <Controller control={control} name="grades" render={({ field }) => (
          <PillToggle label="Classes you teach" required options={GRADES} value={field.value} onChange={field.onChange} error={errors.grades?.message} />
        )} />
        <Controller control={control} name="boards" render={({ field }) => (
          <PillToggle label="Boards" required options={BOARDS} value={field.value} onChange={field.onChange} error={errors.boards?.message} />
        )} />
        <Select label="Teaching mode" required options={TEACHING_MODES.map((m) => ({ label: m, value: m }))} error={errors.teaching_mode?.message} {...register("teaching_mode")} />
        <Controller control={control} name="preferred_days" render={({ field }) => (
          <PillToggle label="Available days" required options={DAYS_OF_WEEK} value={field.value} onChange={field.onChange} error={errors.preferred_days?.message} />
        )} />
        <Controller control={control} name="preferred_time_slots" render={({ field }) => (
          <PillToggle label="Available time slots" required options={TIME_SLOTS} value={field.value} onChange={field.onChange} error={errors.preferred_time_slots?.message} />
        )} />
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
          <Input label="Expected fee (₹/hour)" type="number" required min={100} error={errors.expected_fee_per_hour?.message} {...register("expected_fee_per_hour", { valueAsNumber: true })} />
          <Input label="Years of experience" type="number" required min={0} max={50} error={errors.years_of_experience?.message} {...register("years_of_experience", { valueAsNumber: true })} />
        </div>
        <label className="flex items-center gap-3 cursor-pointer">
          <input type="checkbox" className="h-4 w-4 rounded border-neutral-300 text-brand-900 focus:ring-brand-700" {...register("demo_class_available")} />
          <span className="text-sm text-neutral-700">I&apos;m available for free demo classes</span>
        </label>
      </Section>

      <Section title="About you">
        <Textarea label="Teaching bio" required placeholder="Describe your teaching style and experience. Minimum 50 characters." rows={5} showCount maxLength={600} error={errors.bio?.message} {...register("bio")} />
      </Section>

      <Section title="Location">
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
          <Input label="Locality / Area" required placeholder="e.g. Indiranagar" hint="Shown on your public profile" error={errors.locality?.message} {...register("locality")} />
          <Input label="City" required placeholder="e.g. Bengaluru" error={errors.city?.message} {...register("city")} />
          <Input label="PIN code" required placeholder="560001" maxLength={6} error={errors.pincode?.message} {...register("pincode")} />
        </div>
      </Section>

      <div className="flex justify-end border-t border-neutral-100 pt-5">
        <Button type="submit" variant="primary" loading={isPending}>
          Save Profile
        </Button>
      </div>
    </form>
  );
}
