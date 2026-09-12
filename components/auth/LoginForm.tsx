"use client";

import { useState, useTransition } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import Link from "next/link";
import { Eye, EyeOff, ShieldCheck } from "lucide-react";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import { Alert } from "@/components/ui/Alert";
import { loginSchema, type LoginInput } from "@/lib/validations";
import { loginAction } from "@/app/actions/auth";
import { APP_NAME } from "@/lib/constants";

interface LoginFormProps {
  /** Safe relative redirect path set by the middleware when bouncing unauthenticated users */
  redirectTo?:    string;
  /** Error code from the auth callback (e.g. "auth_callback_failed") */
  callbackError?: string;
}

const CALLBACK_ERRORS: Record<string, string> = {
  auth_callback_failed: "Email confirmation failed. Please try signing in again.",
};

export function LoginForm({ redirectTo, callbackError }: LoginFormProps) {
  const [serverError, setServerError] = useState<string | null>(
    callbackError ? (CALLBACK_ERRORS[callbackError] ?? "An error occurred. Please try again.") : null
  );
  const [showPassword, setShowPassword] = useState(false);
  const [isPending, startTransition]    = useTransition();

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<LoginInput>({
    resolver: zodResolver(loginSchema),
  });

  function onSubmit(data: LoginInput) {
    setServerError(null);
    startTransition(async () => {
      const formData = new FormData();
      formData.set("email",      data.email);
      formData.set("password",   data.password);
      // Pass validated redirectTo so the action can redirect after login
      if (redirectTo) formData.set("redirectTo", redirectTo);
      const result = await loginAction(formData);
      if (result?.error) setServerError(result.error);
    });
  }

  return (
    <div className="w-full max-w-md">
      <div className="rounded-3xl border border-neutral-200 bg-white shadow-lg">
        {/* Top accent */}
        <div className="h-1 w-full rounded-t-3xl bg-gradient-to-r from-brand-900 via-brand-700 to-accent-500" />

        <div className="p-7 sm:p-8">
          <div className="mb-7 text-center">
            <div className="mx-auto mb-3 flex h-10 w-10 items-center justify-center rounded-xl bg-brand-900 text-white">
              <ShieldCheck className="h-5 w-5" />
            </div>
            <h1 className="text-xl font-bold text-navy-900" style={{ letterSpacing: "-0.02em" }}>
              Welcome back
            </h1>
            <p className="mt-1 text-sm text-neutral-500">
              Sign in to your {APP_NAME} account
            </p>
          </div>

          {serverError && (
            <Alert variant="error" message={serverError} className="mb-5" />
          )}

          <form onSubmit={handleSubmit(onSubmit)} noValidate className="space-y-5">
            <Input
              label="Email address"
              type="email"
              autoComplete="email"
              placeholder="you@example.com"
              required
              error={errors.email?.message}
              {...register("email")}
            />

            <div className="relative">
              <Input
                label="Password"
                type={showPassword ? "text" : "password"}
                autoComplete="current-password"
                placeholder="••••••••"
                required
                error={errors.password?.message}
                {...register("password")}
              />
              <button
                type="button"
                className="absolute right-3 top-9 rounded p-1 text-neutral-400 hover:text-neutral-600 transition-colors touch-target"
                onClick={() => setShowPassword(!showPassword)}
                aria-label={showPassword ? "Hide password" : "Show password"}
              >
                {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
              </button>
            </div>

            <Button type="submit" variant="primary" size="lg" fullWidth loading={isPending}>
              Sign in
            </Button>
          </form>

          <p className="mt-6 text-center text-sm text-neutral-500">
            Don&apos;t have an account?{" "}
            <Link href="/register" className="font-semibold text-brand-700 hover:text-brand-800 underline-offset-2 hover:underline">
              Create one
            </Link>
          </p>
        </div>
      </div>
    </div>
  );
}
