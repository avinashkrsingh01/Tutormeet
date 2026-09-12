"use client";

import { useState, useTransition } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import Link from "next/link";
import { Eye, EyeOff, GraduationCap, Users, ShieldCheck } from "lucide-react";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import { Alert } from "@/components/ui/Alert";
import {
  registerParentSchema,
  registerTutorSchema,
  type RegisterParentInput,
  type RegisterTutorInput,
} from "@/lib/validations";
import { registerParentAction, registerTutorAction } from "@/app/actions/auth";
import { cn } from "@/lib/utils";

type Role = "parent" | "tutor";

// ─── Role selector card ───────────────────────────────────────────────────────

function RoleCard({
  role,
  selected,
  onSelect,
}: {
  role: Role;
  selected: boolean;
  onSelect: (r: Role) => void;
}) {
  const isParent = role === "parent";
  return (
    <button
      type="button"
      onClick={() => onSelect(role)}
      aria-pressed={selected}
      className={cn(
        "flex flex-1 flex-col items-center gap-3 rounded-2xl border-2 p-5 text-center transition-all duration-150",
        selected
          ? "border-brand-900 bg-brand-50"
          : "border-neutral-200 bg-white hover:border-neutral-300 hover:bg-neutral-50"
      )}
    >
      <div
        className={cn(
          "flex h-11 w-11 items-center justify-center rounded-xl transition-colors",
          selected
            ? "bg-brand-900 text-white"
            : "bg-neutral-100 text-neutral-500"
        )}
      >
        {isParent ? (
          <Users className="h-5 w-5" />
        ) : (
          <GraduationCap className="h-5 w-5" />
        )}
      </div>
      <div>
        <p
          className={cn(
            "text-sm font-semibold",
            selected ? "text-brand-900" : "text-neutral-700"
          )}
        >
          {isParent ? "I'm a Parent" : "I'm a Tutor"}
        </p>
        <p className="mt-0.5 text-xs text-neutral-500">
          {isParent
            ? "Looking for a home tutor"
            : "Wanting to teach students"}
        </p>
      </div>
    </button>
  );
}

// ─── Shared password field ────────────────────────────────────────────────────

function PasswordInput({
  label,
  error,
  registration,
}: {
  label: string;
  error?: string;
  registration: object;
}) {
  const [show, setShow] = useState(false);
  return (
    <div className="relative">
      <Input
        label={label}
        type={show ? "text" : "password"}
        autoComplete="new-password"
        placeholder="Minimum 8 characters"
        required
        error={error}
        {...registration}
      />
      <button
        type="button"
        className="absolute right-3 top-9 text-neutral-400 hover:text-neutral-600 transition-colors"
        onClick={() => setShow(!show)}
        aria-label={show ? "Hide password" : "Show password"}
      >
        {show ? (
          <EyeOff className="h-4 w-4" />
        ) : (
          <Eye className="h-4 w-4" />
        )}
      </button>
    </div>
  );
}

// ─── Parent registration form ─────────────────────────────────────────────────

function ParentRegisterForm() {
  const [serverError, setServerError] = useState<string | null>(null);
  const [isPending, startTransition]  = useTransition();

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<RegisterParentInput>({
    resolver: zodResolver(registerParentSchema),
  });

  function onSubmit(data: RegisterParentInput) {
    setServerError(null);
    startTransition(async () => {
      const fd = new FormData();
      Object.entries(data).forEach(([k, v]) => fd.set(k, v));
      const result = await registerParentAction(fd);
      if (result?.error) setServerError(result.error);
    });
  }

  return (
    <form onSubmit={handleSubmit(onSubmit)} noValidate className="space-y-4">
      {serverError && <Alert variant="error" message={serverError} />}

      <Input
        label="Your full name"
        type="text"
        autoComplete="name"
        placeholder="e.g. Priya Sharma"
        required
        error={errors.full_name?.message}
        {...register("full_name")}
      />
      <Input
        label="Email address"
        type="email"
        autoComplete="email"
        placeholder="you@example.com"
        required
        error={errors.email?.message}
        {...register("email")}
      />
      <Input
        label="Mobile number"
        type="tel"
        autoComplete="tel"
        placeholder="10-digit number"
        required
        hint="Used to notify you when a tutor is matched"
        error={errors.phone?.message}
        {...register("phone")}
      />
      <PasswordInput
        label="Password"
        error={errors.password?.message}
        registration={register("password")}
      />
      <PasswordInput
        label="Confirm password"
        error={errors.confirm_password?.message}
        registration={register("confirm_password")}
      />

      <Button
        type="submit"
        fullWidth
        size="lg"
        loading={isPending}
        className="mt-2"
      >
        Create Parent Account
      </Button>
    </form>
  );
}

// ─── Tutor registration form ──────────────────────────────────────────────────

function TutorRegisterForm() {
  const [serverError, setServerError] = useState<string | null>(null);
  const [isPending, startTransition]  = useTransition();

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<RegisterTutorInput>({
    resolver: zodResolver(registerTutorSchema),
  });

  function onSubmit(data: RegisterTutorInput) {
    setServerError(null);
    startTransition(async () => {
      const fd = new FormData();
      Object.entries(data).forEach(([k, v]) => fd.set(k, v));
      const result = await registerTutorAction(fd);
      if (result?.error) setServerError(result.error);
    });
  }

  return (
    <form onSubmit={handleSubmit(onSubmit)} noValidate className="space-y-4">
      {serverError && <Alert variant="error" message={serverError} />}

      <Input
        label="Your full name"
        type="text"
        autoComplete="name"
        placeholder="e.g. Rahul Verma"
        required
        error={errors.full_name?.message}
        {...register("full_name")}
      />
      <Input
        label="Email address"
        type="email"
        autoComplete="email"
        placeholder="you@example.com"
        required
        error={errors.email?.message}
        {...register("email")}
      />
      <Input
        label="Mobile number"
        type="tel"
        autoComplete="tel"
        placeholder="10-digit number"
        required
        hint="Parents will contact you on this number"
        error={errors.phone?.message}
        {...register("phone")}
      />
      <PasswordInput
        label="Password"
        error={errors.password?.message}
        registration={register("password")}
      />
      <PasswordInput
        label="Confirm password"
        error={errors.confirm_password?.message}
        registration={register("confirm_password")}
      />

      <div className="rounded-xl border border-blue-200 bg-blue-50 px-4 py-3 text-xs text-blue-700">
        After registration you&apos;ll complete your profile and go through our
        verification process before becoming a verified tutor.
      </div>

      <Button
        type="submit"
        fullWidth
        size="lg"
        loading={isPending}
        className="mt-2"
      >
        Create Tutor Account
      </Button>
    </form>
  );
}

// ─── Main export ──────────────────────────────────────────────────────────────

export function RegisterForm({
  defaultRole = "parent",
}: {
  defaultRole?: Role;
}) {
  const [role, setRole] = useState<Role>(defaultRole);

  return (
    <div className="w-full max-w-md">
      <div className="rounded-3xl border border-neutral-200 bg-white shadow-lg">
        {/* Top accent */}
        <div className="h-1 w-full rounded-t-3xl bg-gradient-to-r from-brand-900 via-brand-700 to-accent-500" />

        <div className="p-7 sm:p-8">
          {/* Header */}
          <div className="mb-7 text-center">
            <div className="mx-auto mb-3 flex h-10 w-10 items-center justify-center rounded-xl bg-brand-900 text-white">
              <ShieldCheck className="h-5 w-5" />
            </div>
            <h1
              className="text-xl font-bold text-navy-900"
              style={{ letterSpacing: "-0.02em" }}
            >
              Create your account
            </h1>
            <p className="mt-1 text-sm text-neutral-500">
              Join TutorMeet — free to use
            </p>
          </div>

          {/* Role selector */}
          <div className="mb-6 flex gap-3">
            <RoleCard role="parent" selected={role === "parent"} onSelect={setRole} />
            <RoleCard role="tutor"  selected={role === "tutor"}  onSelect={setRole} />
          </div>

          {/* Form */}
          {role === "parent" ? <ParentRegisterForm /> : <TutorRegisterForm />}

          {/* Footer links */}
          <p className="mt-6 text-center text-sm text-neutral-500">
            Already have an account?{" "}
            <Link
              href="/login"
              className="font-semibold text-brand-700 hover:text-brand-800 underline-offset-2 hover:underline"
            >
              Sign in
            </Link>
          </p>
          <p className="mt-3 text-center text-xs text-neutral-400">
            By registering you agree to our{" "}
            <Link href="/terms"   className="underline hover:text-neutral-600">Terms</Link>
            {" "}and{" "}
            <Link href="/privacy" className="underline hover:text-neutral-600">Privacy Policy</Link>.
          </p>
        </div>
      </div>
    </div>
  );
}
