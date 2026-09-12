"use client";

import { useEffect } from "react";
import Link from "next/link";
import { AlertCircle, RefreshCw } from "lucide-react";
import { Button } from "@/components/ui/Button";

interface ErrorProps {
  error:  Error & { digest?: string };
  reset:  () => void;
}

export default function GlobalError({ error, reset }: ErrorProps) {
  useEffect(() => {
    // Log to monitoring — NEVER log error.message in production
    // as it may contain sensitive data.
    // Replace with your error monitoring service (e.g. Sentry) here.
    console.error("[App Error]", {
      digest: error.digest,
      // Intentionally not logging error.message — may expose internals
    });
  }, [error]);

  return (
    <div className="flex min-h-[60vh] flex-col items-center justify-center px-4 text-center">
      <div className="mb-5 flex h-16 w-16 items-center justify-center rounded-2xl bg-red-100 text-red-600">
        <AlertCircle className="h-8 w-8" />
      </div>
      <h1 className="mb-2 text-xl font-bold text-navy-900">Something went wrong</h1>
      <p className="mb-6 max-w-sm text-sm text-neutral-500">
        An unexpected error occurred. If this keeps happening, please contact support.
      </p>
      <div className="flex flex-col gap-3 sm:flex-row">
        <Button variant="primary" size="sm" onClick={reset}
          iconLeft={<RefreshCw className="h-4 w-4" />}>
          Try again
        </Button>
        <Link href="/">
          <Button variant="ghost" size="sm">Go to homepage</Button>
        </Link>
      </div>
      {/* Show digest for support reference — safe to display, reveals nothing internal */}
      {error.digest && (
        <p className="mt-6 text-xs text-neutral-400">
          Reference: <span className="font-mono">{error.digest}</span>
        </p>
      )}
    </div>
  );
}
