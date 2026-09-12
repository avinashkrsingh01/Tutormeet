"use client";

import { forwardRef } from "react";
import { cn } from "@/lib/utils";

export interface InputProps
  extends React.InputHTMLAttributes<HTMLInputElement> {
  label?: string;
  error?: string;
  hint?: string;
  success?: boolean;
  iconLeft?: React.ReactNode;
  iconRight?: React.ReactNode;
}

export const Input = forwardRef<HTMLInputElement, InputProps>(
  (
    { label, error, hint, success, iconLeft, iconRight, className, id, ...props },
    ref
  ) => {
    const inputId = id ?? label?.toLowerCase().replace(/\s+/g, "-");

    return (
      <div className="w-full">
        {label && (
          <label htmlFor={inputId} className="label-base">
            {label}
            {props.required && (
              <span className="ml-1 text-red-500" aria-hidden="true">*</span>
            )}
          </label>
        )}

        <div className="relative">
          {iconLeft && (
            <span className="pointer-events-none absolute left-3.5 top-1/2 -translate-y-1/2 text-neutral-400">
              {iconLeft}
            </span>
          )}
          <input
            ref={ref}
            id={inputId}
            className={cn(
              "input-base",
              error   && "input-error",
              success && "input-success",
              iconLeft  && "pl-10",
              iconRight && "pr-10",
              className
            )}
            aria-invalid={!!error}
            aria-describedby={
              error ? `${inputId}-error` :
              hint  ? `${inputId}-hint`  : undefined
            }
            {...props}
          />
          {iconRight && (
            <span className="pointer-events-none absolute right-3.5 top-1/2 -translate-y-1/2 text-neutral-400">
              {iconRight}
            </span>
          )}
        </div>

        {hint && !error && (
          <p id={`${inputId}-hint`} className="field-hint">{hint}</p>
        )}
        {error && (
          <p id={`${inputId}-error`} className="field-error" role="alert">
            {error}
          </p>
        )}
      </div>
    );
  }
);

Input.displayName = "Input";
