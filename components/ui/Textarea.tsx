"use client";

import { forwardRef } from "react";
import { cn } from "@/lib/utils";

export interface TextareaProps
  extends React.TextareaHTMLAttributes<HTMLTextAreaElement> {
  label?: string;
  error?: string;
  hint?: string;
  showCount?: boolean;
  maxLength?: number;
}

export const Textarea = forwardRef<HTMLTextAreaElement, TextareaProps>(
  (
    { label, error, hint, showCount, maxLength, className, id, value, ...props },
    ref
  ) => {
    const areaId = id ?? label?.toLowerCase().replace(/\s+/g, "-");
    const charCount =
      showCount && typeof value === "string" ? value.length : null;

    return (
      <div className="w-full">
        {label && (
          <label htmlFor={areaId} className="label-base">
            {label}
            {props.required && (
              <span className="ml-1 text-red-500" aria-hidden="true">*</span>
            )}
          </label>
        )}

        <textarea
          ref={ref}
          id={areaId}
          rows={4}
          maxLength={maxLength}
          value={value}
          className={cn(
            "input-base resize-y min-h-[96px]",
            error && "input-error",
            className
          )}
          aria-invalid={!!error}
          aria-describedby={
            error ? `${areaId}-error` :
            hint  ? `${areaId}-hint`  : undefined
          }
          {...props}
        />

        <div className="mt-1.5 flex items-start justify-between gap-2">
          <div>
            {hint && !error && (
              <p id={`${areaId}-hint`} className="field-hint">{hint}</p>
            )}
            {error && (
              <p id={`${areaId}-error`} className="field-error" role="alert">{error}</p>
            )}
          </div>
          {showCount && maxLength && charCount !== null && (
            <p
              className={cn(
                "ml-auto flex-shrink-0 text-xs tabular-nums",
                charCount >= maxLength
                  ? "text-red-500"
                  : charCount >= maxLength * 0.9
                  ? "text-amber-500"
                  : "text-neutral-400"
              )}
            >
              {charCount}/{maxLength}
            </p>
          )}
        </div>
      </div>
    );
  }
);

Textarea.displayName = "Textarea";
