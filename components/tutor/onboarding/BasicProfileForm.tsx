"use client";

import { useState, useTransition } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { ArrowRight, User, MapPin, FileText, Camera } from "lucide-react";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import { Select } from "@/components/ui/Select";
import { Textarea } from "@/components/ui/Textarea";
import { Alert } from "@/components/ui/Alert";
import { tutorBasicProfileSchema, type TutorBasicProfileInput } from "@/lib/validations";
import { INDIAN_STATES } from "@/lib/constants";
import { saveTutorBasicProfileAction } from "@/app/actions/tutor";

interface BasicProfileFormProps {
  defaultValues: TutorBasicProfileInput;
}

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

export function BasicProfileForm({ defaultValues }: BasicProfileFormProps) {
  const [serverError, setServerError] = useState<string | null>(null);
  const [isPending, startTransition]  = useTransition();

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<TutorBasicProfileInput>({
    resolver: zodResolver(tutorBasicProfileSchema),
    defaultValues,
  });

  function onSubmit(data: TutorBasicProfileInput) {
    setServerError(null);
    startTransition(async () => {
      const fd = new FormData();
      Object.entries(data).forEach(([k, v]) => fd.set(k, String(v)));
      const result = await saveTutorBasicProfileAction(fd);
      if (result?.error) setServerError(result.error);
    });
  }

  return (
    <form onSubmit={handleSubmit(onSubmit)} noValidate className="space-y-7">
      {serverError && <Alert variant="error" message={serverError} />}

      {/* Personal details */}
      <FormSection icon={<User className="h-4 w-4" />} title="Personal details">
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
          <Input
            label="Full name"
            type="text"
            autoComplete="name"
            required
            placeholder="e.g. Rahul Sharma"
            error={errors.full_name?.message}
            {...register("full_name")}
          />
          <Input
            label="Mobile number"
            type="tel"
            autoComplete="tel"
            required
            placeholder="10-digit number"
            hint="Parents contact you on this — will never be public"
            error={errors.phone?.message}
            {...register("phone")}
          />
        </div>

        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
          <Select
            label="Gender"
            required
            options={[
              { label: "Male",   value: "male"   },
              { label: "Female", value: "female" },
              { label: "Other",  value: "other"  },
            ]}
            error={errors.gender?.message}
            {...register("gender")}
          />
          <Input
            label="Date of birth"
            type="date"
            required
            hint="You must be at least 18 years old"
            error={errors.date_of_birth?.message}
            {...register("date_of_birth")}
          />
        </div>
      </FormSection>

      {/* Location */}
      <FormSection icon={<MapPin className="h-4 w-4" />} title="Your location">
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
          <Input
            label="City"
            type="text"
            autoComplete="address-level2"
            required
            placeholder="e.g. Bengaluru"
            error={errors.city?.message}
            {...register("city")}
          />
          <Input
            label="Locality / Area"
            type="text"
            required
            placeholder="e.g. Indiranagar"
            hint="Only locality is shown publicly — not full address"
            error={errors.locality?.message}
            {...register("locality")}
          />
        </div>
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
          <Input
            label="PIN code"
            type="text"
            required
            placeholder="6-digit pincode"
            maxLength={6}
            error={errors.pincode?.message}
            {...register("pincode")}
          />
          <Select
            label="State"
            required
            placeholder="Select state"
            options={INDIAN_STATES.map((s) => ({ label: s, value: s }))}
            error={errors.state?.message}
            {...register("state")}
          />
        </div>
      </FormSection>

      {/* Bio */}
      <FormSection icon={<FileText className="h-4 w-4" />} title="Teaching bio">
        <Textarea
          label="About you"
          required
          placeholder="Describe your teaching style, what motivates you to teach, and why students enjoy learning with you. Minimum 50 characters."
          rows={5}
          showCount
          maxLength={600}
          hint="This is your public introduction — make it compelling"
          error={errors.bio?.message}
          {...register("bio")}
        />
      </FormSection>

      <div className="flex justify-end border-t border-neutral-100 pt-5">
        <Button type="submit" variant="primary" size="lg" loading={isPending}>
          Save &amp; Continue
          <ArrowRight className="h-4 w-4" />
        </Button>
      </div>
    </form>
  );
}
