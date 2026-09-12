"use client";

import { useState, useTransition } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { MapPin, Phone, MessageCircle, ArrowRight } from "lucide-react";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import { Alert } from "@/components/ui/Alert";
import { cn } from "@/lib/utils";
import { parentProfileSchema, type ParentProfileInput } from "@/lib/validations";
import { completeParentProfileAction } from "@/app/actions/parent";

type ContactMethod = ParentProfileInput["communication_preference"];

const contactMethods: { value: ContactMethod; label: string; sub: string }[] = [
  { value: "whatsapp", label: "WhatsApp",     sub: "Send me a WhatsApp message" },
  { value: "call",     label: "Phone Call",   sub: "Call me on my mobile" },
  { value: "email",    label: "Email",        sub: "Send me an email" },
  { value: "any",      label: "Any",          sub: "I&apos;m fine with any" },
];

interface ProfileCompletionFormProps {
  defaultName:  string;
  defaultPhone: string;
}

export function ProfileCompletionForm({
  defaultName,
  defaultPhone,
}: ProfileCompletionFormProps) {
  const [serverError, setServerError] = useState<string | null>(null);
  const [isPending, startTransition]  = useTransition();

  const {
    register,
    handleSubmit,
    setValue,
    watch,
    formState: { errors },
  } = useForm<ParentProfileInput>({
    resolver: zodResolver(parentProfileSchema),
    defaultValues: {
      full_name:                defaultName,
      phone:                    defaultPhone,
      city:                     "",
      locality:                 "",
      communication_preference: "whatsapp",
    },
  });

  const selectedContact = watch("communication_preference");

  function onSubmit(data: ParentProfileInput) {
    setServerError(null);
    startTransition(async () => {
      const fd = new FormData();
      Object.entries(data).forEach(([k, v]) => fd.set(k, String(v)));
      const result = await completeParentProfileAction(fd);
      if (result?.error) setServerError(result.error);
    });
  }

  return (
    <form onSubmit={handleSubmit(onSubmit)} noValidate className="space-y-6">
      {serverError && <Alert variant="error" message={serverError} />}

      {/* ── Personal ──────────────────────────────────────────── */}
      <section>
        <h3 className="mb-4 flex items-center gap-2 text-sm font-semibold text-navy-900">
          <Phone className="h-4 w-4 text-brand-700" />
          Your details
        </h3>
        <div className="space-y-4">
          <Input
            label="Full name"
            type="text"
            autoComplete="name"
            required
            error={errors.full_name?.message}
            {...register("full_name")}
          />
          <Input
            label="Mobile number"
            type="tel"
            autoComplete="tel"
            required
            hint="10-digit Indian mobile number"
            error={errors.phone?.message}
            {...register("phone")}
          />
        </div>
      </section>

      {/* ── Location ──────────────────────────────────────────── */}
      <section>
        <h3 className="mb-4 flex items-center gap-2 text-sm font-semibold text-navy-900">
          <MapPin className="h-4 w-4 text-brand-700" />
          Your location
        </h3>
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
          <Input
            label="City"
            type="text"
            autoComplete="address-level2"
            placeholder="e.g. Bengaluru"
            required
            error={errors.city?.message}
            {...register("city")}
          />
          <Input
            label="Locality / Area"
            type="text"
            placeholder="e.g. Koramangala"
            required
            hint="Used to find tutors near you"
            error={errors.locality?.message}
            {...register("locality")}
          />
        </div>
      </section>

      {/* ── Communication ─────────────────────────────────────── */}
      <section>
        <h3 className="mb-1.5 flex items-center gap-2 text-sm font-semibold text-navy-900">
          <MessageCircle className="h-4 w-4 text-brand-700" />
          Preferred contact method
        </h3>
        <p className="mb-3 text-xs text-neutral-500">
          How would you like us to reach you when a tutor is matched?
        </p>

        <div className="grid grid-cols-2 gap-2.5 sm:grid-cols-4">
          {contactMethods.map((m) => (
            <button
              key={m.value}
              type="button"
              onClick={() => setValue("communication_preference", m.value, { shouldValidate: true })}
              className={cn(
                "flex flex-col items-center gap-1.5 rounded-xl border-2 px-3 py-3 text-center transition-all duration-150",
                selectedContact === m.value
                  ? "border-brand-900 bg-brand-50"
                  : "border-neutral-200 bg-white hover:border-neutral-300"
              )}
            >
              <span
                className={cn(
                  "text-xs font-semibold",
                  selectedContact === m.value ? "text-brand-900" : "text-neutral-700"
                )}
              >
                {m.label}
              </span>
            </button>
          ))}
        </div>

        {errors.communication_preference && (
          <p className="mt-1.5 text-xs font-medium text-red-600" role="alert">
            {errors.communication_preference.message}
          </p>
        )}
      </section>

      <Button type="submit" fullWidth size="lg" loading={isPending}>
        Save &amp; Continue
        <ArrowRight className="h-4 w-4" />
      </Button>
    </form>
  );
}
