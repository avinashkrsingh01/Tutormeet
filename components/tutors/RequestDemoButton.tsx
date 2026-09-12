"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { Video, ArrowRight, CheckCircle2 } from "lucide-react";
import { Button } from "@/components/ui/Button";
import { Alert } from "@/components/ui/Alert";
import { requestDemoAction } from "@/app/actions/demo";
import { cn } from "@/lib/utils";
import Link from "next/link";

interface RequestDemoButtonProps {
  tutorUserId: string;
  tutorName:   string;
  size?:       "sm" | "md" | "lg";
  fullWidth?:  boolean;
  className?:  string;
}

export function RequestDemoButton({
  tutorUserId,
  tutorName,
  size      = "lg",
  fullWidth = false,
  className,
}: RequestDemoButtonProps) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();
  const [state, setState] = useState<
    | { type: "idle" }
    | { type: "success" }
    | { type: "error";  message: string; requiresLogin?: boolean }
  >({ type: "idle" });

  function handleClick() {
    setState({ type: "idle" });
    startTransition(async () => {
      const result = await requestDemoAction(tutorUserId);
      if (result.success) {
        setState({ type: "success" });
        setTimeout(() => router.push(result.redirectTo), 1500);
      } else {
        setState({
          type:         "error",
          message:      result.error,
          requiresLogin: result.requiresLogin,
        });
      }
    });
  }

  if (state.type === "success") {
    return (
      <div className={cn(
        "flex items-center gap-2.5 rounded-2xl border border-accent-200 bg-accent-50 px-5 py-3.5 text-sm font-semibold text-accent-800",
        fullWidth && "w-full justify-center",
        className
      )}>
        <CheckCircle2 className="h-5 w-5 text-accent-600" />
        Request sent! Redirecting…
      </div>
    );
  }

  return (
    <div className={cn("space-y-3", fullWidth && "w-full")}>
      <Button
        variant="teal"
        size={size}
        fullWidth={fullWidth}
        loading={isPending}
        onClick={handleClick}
        className={className}
        iconLeft={<Video className="h-4.5 w-4.5" />}
      >
        Request Free Demo Class
      </Button>

      {state.type === "error" && (
        <div className="space-y-2">
          <Alert variant="error" message={state.message} />
          {state.requiresLogin && (
            <div className="flex gap-2">
              <Link href={`/register?role=parent&tutor=${tutorUserId}`} className="flex-1">
                <Button variant="primary" size="sm" fullWidth iconRight={<ArrowRight className="h-3.5 w-3.5" />}>
                  Create parent account
                </Button>
              </Link>
              <Link href={`/login?redirectTo=/tutors/${tutorUserId}`} className="flex-1">
                <Button variant="ghost" size="sm" fullWidth>
                  Sign in
                </Button>
              </Link>
            </div>
          )}
        </div>
      )}

      <p className="text-center text-xs text-neutral-400">
        Free · No commitment · Our team arranges the session
      </p>
    </div>
  );
}
