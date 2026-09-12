"use client";

import { forwardRef } from "react";
import { cn } from "@/lib/utils";

// ─── Types ────────────────────────────────────────────────────────────────────

export type ButtonVariant =
  | "primary"
  | "secondary"   // alias for "outline" — backwards compatible
  | "blue"
  | "teal"
  | "outline"
  | "ghost"
  | "white"
  | "white-outline"
  | "danger"
  | "link";

export type ButtonSize = "xs" | "sm" | "md" | "lg" | "xl";

export interface ButtonProps
  extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: ButtonVariant;
  size?: ButtonSize;
  loading?: boolean;
  fullWidth?: boolean;
  iconLeft?: React.ReactNode;
  iconRight?: React.ReactNode;
}

// ─── Maps ─────────────────────────────────────────────────────────────────────

const variantMap: Record<ButtonVariant, string> = {
  primary:         "btn-primary",
  secondary:       "btn-outline",   // alias
  blue:            "btn-blue",
  teal:            "btn-teal",
  outline:         "btn-outline",
  ghost:           "btn-ghost",
  white:           "btn-white",
  "white-outline": "btn-white-outline",
  danger:          "btn-danger",
  link:            "btn-link",
};

const sizeMap: Record<ButtonSize, string> = {
  xs: "btn-xs",
  sm: "btn-sm",
  md: "btn-md",
  lg: "btn-lg",
  xl: "btn-xl",
};

// ─── Spinner ──────────────────────────────────────────────────────────────────

function Spinner() {
  return (
    <svg
      className="h-4 w-4 animate-spin"
      xmlns="http://www.w3.org/2000/svg"
      fill="none"
      viewBox="0 0 24 24"
      aria-hidden="true"
    >
      <circle
        className="opacity-25"
        cx="12" cy="12" r="10"
        stroke="currentColor" strokeWidth="4"
      />
      <path
        className="opacity-75"
        fill="currentColor"
        d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z"
      />
    </svg>
  );
}

// ─── Component ────────────────────────────────────────────────────────────────

export const Button = forwardRef<HTMLButtonElement, ButtonProps>(
  (
    {
      variant = "primary",
      size = "md",
      loading = false,
      fullWidth = false,
      iconLeft,
      iconRight,
      className,
      children,
      disabled,
      ...props
    },
    ref
  ) => {
    const isLink = variant === "link";

    return (
      <button
        ref={ref}
        disabled={disabled || loading}
        className={cn(
          "btn",
          !isLink && sizeMap[size],
          variantMap[variant],
          fullWidth && "w-full",
          className
        )}
        {...props}
      >
        {loading ? <Spinner /> : iconLeft}
        {children}
        {!loading && iconRight}
      </button>
    );
  }
);

Button.displayName = "Button";
