"use client";

import { useEffect, useCallback, useRef } from "react";
import { createPortal } from "react-dom";
import { X } from "lucide-react";
import { cn } from "@/lib/utils";

// ─── Types ────────────────────────────────────────────────────────────────────

type ModalSize = "sm" | "md" | "lg" | "xl" | "full";

interface ModalProps {
  open:         boolean;
  onClose:      () => void;
  title?:       string;
  description?: string;
  children:     React.ReactNode;
  size?:        ModalSize;
  hideClose?:   boolean;
  className?:   string;
}

// On sm+ these become max-width constraints on a centered card.
// On mobile (< sm) the modal is always full-screen regardless of size.
const sizeMap: Record<ModalSize, string> = {
  sm:   "sm:max-w-sm",
  md:   "sm:max-w-md",
  lg:   "sm:max-w-lg",
  xl:   "sm:max-w-2xl",
  full: "sm:max-w-5xl",
};

// Focusable element selector for focus-trap
const FOCUSABLE =
  'a[href], area[href], input:not([disabled]), select:not([disabled]), ' +
  'textarea:not([disabled]), button:not([disabled]), iframe, object, embed, ' +
  '[tabindex]:not([tabindex="-1"]), [contenteditable]';

// ─── Modal ────────────────────────────────────────────────────────────────────

export function Modal({
  open,
  onClose,
  title,
  description,
  children,
  size = "md",
  hideClose = false,
  className,
}: ModalProps) {
  const dialogRef = useRef<HTMLDivElement>(null);

  // ── Keyboard handling: Escape closes, Tab is trapped ────────────────────
  const handleKeyDown = useCallback(
    (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        e.preventDefault();
        onClose();
        return;
      }

      // Focus trap — keep Tab inside the modal
      if (e.key === "Tab" && dialogRef.current) {
        const focusable = Array.from(
          dialogRef.current.querySelectorAll<HTMLElement>(FOCUSABLE)
        ).filter((el) => !el.closest("[hidden]") && el.offsetParent !== null);

        if (focusable.length === 0) {
          e.preventDefault();
          return;
        }

        const first = focusable[0];
        const last  = focusable[focusable.length - 1];

        if (e.shiftKey) {
          if (document.activeElement === first) {
            e.preventDefault();
            last.focus();
          }
        } else {
          if (document.activeElement === last) {
            e.preventDefault();
            first.focus();
          }
        }
      }
    },
    [onClose]
  );

  useEffect(() => {
    if (!open) return;

    document.addEventListener("keydown", handleKeyDown);
    // Prevent body scroll while modal is open
    const scrollY = window.scrollY;
    document.body.style.overflow   = "hidden";
    document.body.style.position   = "fixed";
    document.body.style.top        = `-${scrollY}px`;
    document.body.style.width      = "100%";

    // Move focus into the modal
    const firstFocusable = dialogRef.current?.querySelector<HTMLElement>(FOCUSABLE);
    firstFocusable?.focus();

    return () => {
      document.removeEventListener("keydown", handleKeyDown);
      document.body.style.overflow = "";
      document.body.style.position = "";
      document.body.style.top      = "";
      document.body.style.width    = "";
      // Restore scroll position
      window.scrollTo(0, scrollY);
    };
  }, [open, handleKeyDown]);

  if (!open) return null;

  const content = (
    <div
      // Backdrop
      className={cn(
        "backdrop",
        // Mobile: align to bottom so sheet slides up; sm+: center
        "flex flex-col justify-end sm:items-center sm:justify-center",
        "p-0 sm:p-4",
      )}
      aria-modal="true"
      role="dialog"
      aria-labelledby={title ? "modal-title" : undefined}
      onClick={(e) => {
        if (e.target === e.currentTarget) onClose();
      }}
    >
      <div
        ref={dialogRef}
        className={cn(
          // Mobile: full-width bottom sheet, top corners rounded
          "relative w-full bg-white shadow-2xl animate-slide-up",
          "rounded-t-3xl sm:rounded-2xl",
          // sm+: constrain width, restore normal border-radius
          sizeMap[size],
          // Cap height and allow internal scroll
          "flex flex-col",
          "max-h-[92dvh] sm:max-h-[90vh]",
          className
        )}
        // Prevent backdrop click from propagating through the card
        onClick={(e) => e.stopPropagation()}
      >
        {/* ── Drag handle — mobile only ── */}
        <div
          className="mx-auto mt-3 h-1 w-10 flex-shrink-0 rounded-full bg-neutral-200 sm:hidden"
          aria-hidden="true"
        />

        {/* ── Header ── */}
        {(title || !hideClose) && (
          <div className="flex flex-shrink-0 items-start justify-between gap-4 border-b border-neutral-100 px-5 py-4 sm:px-6 sm:py-5">
            {title && (
              <div className="min-w-0">
                <h2
                  id="modal-title"
                  className="text-base font-semibold text-navy-900 tracking-tight"
                >
                  {title}
                </h2>
                {description && (
                  <p className="mt-0.5 text-sm text-neutral-500">{description}</p>
                )}
              </div>
            )}
            {!hideClose && (
              <button
                onClick={onClose}
                className="ml-auto flex-shrink-0 rounded-xl p-2 text-neutral-400 transition-colors hover:bg-neutral-100 hover:text-neutral-600 touch-target"
                aria-label="Close modal"
              >
                <X className="h-4 w-4" />
              </button>
            )}
          </div>
        )}

        {/* ── Scrollable body ── */}
        <div
          className="flex-1 overflow-y-auto overscroll-contain px-5 py-5 sm:px-6"
          // iOS momentum scrolling
          style={{ WebkitOverflowScrolling: "touch" }}
        >
          {children}
        </div>
      </div>
    </div>
  );

  if (typeof document !== "undefined") {
    return createPortal(content, document.body);
  }
  return null;
}

// ─── Modal Footer ──────────────────────────────────────────────────────────────
// Sticks to the bottom of the modal on mobile, inline on sm+.

export function ModalFooter({
  children,
  className,
}: {
  children:  React.ReactNode;
  className?: string;
}) {
  return (
    <div
      className={cn(
        // Always render at the bottom of the modal card
        "flex-shrink-0",
        "flex flex-col-reverse gap-2 border-t border-neutral-100",
        "px-5 py-4 pb-[calc(1rem+env(safe-area-inset-bottom))]",
        "sm:flex-row sm:justify-end sm:px-6 sm:py-4 sm:pb-4",
        className
      )}
    >
      {children}
    </div>
  );
}
