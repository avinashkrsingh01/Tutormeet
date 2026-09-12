"use client";

import Link from "next/link";
import Image from "next/image";
import { usePathname } from "next/navigation";
import { useState } from "react";
import { Menu, X, LogOut, ShieldCheck } from "lucide-react";
import { Avatar } from "@/components/ui/Avatar";
import { APP_NAME } from "@/lib/constants";
import { cn } from "@/lib/utils";
import { logoutAction } from "@/app/actions/auth";

export interface NavItem {
  label: string;
  href:  string;
  icon:  React.ReactNode;
  badge?: string | number;
}

interface DashboardNavProps {
  userName:    string;
  userEmail:   string;
  avatarUrl?:  string | null;
  navItems:    NavItem[];
  role?:       "parent" | "tutor" | "admin";
  roleLabel?:  string;
}

const roleConfig = {
  parent: { label: "Parent", color: "badge-navy"   },
  tutor:  { label: "Tutor",  color: "badge-teal"   },
  admin:  { label: "Admin",  color: "badge-orange" },
};

export function DashboardNav({
  userName,
  userEmail,
  avatarUrl,
  navItems,
  role,
  roleLabel,
}: DashboardNavProps) {
  const pathname = usePathname();
  const [open, setOpen] = useState(false);

  const roleInfo     = role ? roleConfig[role] : null;
  const displayLabel = roleLabel ?? roleInfo?.label;

  return (
    <>
      {/* ═══════════════════════════════════════════════════════
          TOP BAR — visible on all breakpoints
          ═══════════════════════════════════════════════════════ */}
      <header className="sticky top-0 z-40 border-b border-neutral-100 bg-white/95 backdrop-blur-sm shadow-xs">
        <div className="container-page flex h-14 items-center justify-between gap-2 sm:h-15 sm:gap-4">

          {/* Logo */}
          <Link
            href="/"
            className="group flex items-center gap-2 flex-shrink-0"
            aria-label="TutorMeet home"
          >
            <div className="flex h-8 w-8 items-center justify-center rounded-xl bg-brand-900 text-white transition-colors group-hover:bg-brand-800">
              <ShieldCheck className="h-4 w-4" />
            </div>
            <span
              className="hidden text-base font-bold text-navy-900 sm:block tracking-tight"
              style={{ letterSpacing: "-0.02em" }}
            >
              <span>Tutor<span className="text-blue-500">Meet</span></span>
            </span>
          </Link>

          {/* ── Desktop + tablet nav (md icon-only, lg full labels) ── */}
          {/* md (768–1023px): icon-only pills in a scrollable row        */}
          {/* lg (1024px+):    icons + labels in a scrollable row         */}
          <nav
            className="hidden md:flex flex-1 items-center justify-center overflow-x-auto scrollbar-hidden px-2"
            aria-label="Main navigation"
          >
            <div className="flex items-center gap-0.5">
              {navItems.map((item) => {
                const active =
                  pathname === item.href ||
                  (item.href !== "/" && pathname.startsWith(item.href));

                return (
                  <Link
                    key={item.href}
                    href={item.href}
                    title={item.label}
                    className={cn(
                      // Base: icon-only on md, labeled on lg
                      "relative flex items-center justify-center rounded-xl transition-all duration-150",
                      // md: square icon pill
                      "md:h-10 md:w-10",
                      // lg: switch to labeled nav item
                      "lg:h-auto lg:w-auto lg:gap-2 lg:px-3 lg:py-2",
                      "text-sm font-medium whitespace-nowrap",
                      active
                        ? "bg-brand-50 text-brand-700 font-semibold"
                        : "text-neutral-600 hover:bg-neutral-100 hover:text-navy-900"
                    )}
                    aria-current={active ? "page" : undefined}
                  >
                    <span className="flex-shrink-0">{item.icon}</span>
                    {/* Label hidden on md, visible on lg */}
                    <span className="hidden lg:inline">{item.label}</span>

                    {/* Badge */}
                    {item.badge !== undefined && (
                      <span
                        className={cn(
                          "flex items-center justify-center rounded-full text-2xs font-bold",
                          // md: absolute badge; lg: inline badge
                          "md:absolute md:-top-1 md:-right-1 md:h-4 md:min-w-4 md:px-0.5",
                          "lg:relative lg:top-auto lg:right-auto lg:ml-auto lg:h-4.5 lg:min-w-4.5 lg:px-1",
                          active
                            ? "bg-brand-600 text-white"
                            : "bg-neutral-200 text-neutral-600"
                        )}
                      >
                        {item.badge}
                      </span>
                    )}
                  </Link>
                );
              })}
            </div>
          </nav>

          {/* ── Right-side user area ── */}
          <div className="flex items-center gap-1.5 flex-shrink-0 sm:gap-2">
            {/* User name + role badge — lg only */}
            <div className="hidden lg:flex flex-col items-end">
              <span className="text-sm font-semibold text-navy-900 leading-tight">
                {userName}
              </span>
              {roleInfo && displayLabel && (
                <span className={cn("badge mt-0.5", roleInfo.color)}>
                  {displayLabel}
                </span>
              )}
            </div>

            <Avatar
              name={userName}
              src={avatarUrl}
              size="sm"
              className="ring-2 ring-white ring-offset-1"
            />

            {/* Sign out — lg only */}
            <form action={logoutAction} className="hidden lg:block">
              <button
                type="submit"
                className="rounded-xl p-2 text-neutral-400 transition-colors hover:bg-red-50 hover:text-red-500"
                title="Sign out"
                aria-label="Sign out"
              >
                <LogOut className="h-4 w-4" />
              </button>
            </form>

            {/* Hamburger — mobile only (< md) */}
            <button
              className="flex items-center justify-center rounded-xl p-2 text-neutral-600 hover:bg-neutral-100 transition-colors md:hidden touch-target"
              onClick={() => setOpen(!open)}
              aria-label={open ? "Close menu" : "Open menu"}
              aria-expanded={open}
              aria-controls="mobile-drawer"
            >
              {open ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
            </button>
          </div>
        </div>
      </header>

      {/* ═══════════════════════════════════════════════════════
          MOBILE DRAWER — slides in from left, only on < md
          ═══════════════════════════════════════════════════════ */}

      {/* Overlay */}
      <div
        className={cn(
          "fixed inset-0 z-30 bg-navy-950/30 backdrop-blur-sm transition-opacity duration-300 md:hidden",
          open ? "opacity-100 pointer-events-auto" : "opacity-0 pointer-events-none"
        )}
        onClick={() => setOpen(false)}
        aria-hidden="true"
      />

      {/* Drawer panel */}
      <aside
        id="mobile-drawer"
        className={cn(
          "fixed left-0 top-0 z-40 flex h-full w-72 flex-col bg-white shadow-xl",
          "transition-transform duration-300 ease-out md:hidden",
          open ? "translate-x-0" : "-translate-x-full"
        )}
        aria-label="Navigation drawer"
      >
        {/* Drawer header */}
        <div className="flex items-center justify-between border-b border-neutral-100 px-5 py-4">
          <Link
            href="/"
            className="flex items-center gap-2"
            onClick={() => setOpen(false)}
          >
            <div className="flex h-7 w-7 items-center justify-center rounded-lg bg-brand-900 text-white">
              <ShieldCheck className="h-3.5 w-3.5" />
            </div>
            <span className="text-sm font-bold text-navy-900"><span>Tutor<span className="text-blue-500">Meet</span></span></span>
          </Link>
          <button
            onClick={() => setOpen(false)}
            className="rounded-lg p-2 text-neutral-400 hover:bg-neutral-100 touch-target"
            aria-label="Close drawer"
          >
            <X className="h-4 w-4" />
          </button>
        </div>

        {/* User profile strip */}
        <div className="flex items-center gap-3 border-b border-neutral-100 px-5 py-4">
          <Avatar name={userName} src={avatarUrl} size="md" />
          <div className="min-w-0 flex-1">
            <p className="truncate text-sm font-semibold text-navy-900">{userName}</p>
            <p className="truncate text-xs text-neutral-500">{userEmail}</p>
          </div>
          {roleInfo && displayLabel && (
            <span className={cn("badge ml-auto flex-shrink-0", roleInfo.color)}>
              {displayLabel}
            </span>
          )}
        </div>

        {/* Nav list */}
        <nav className="flex-1 overflow-y-auto px-3 py-3" aria-label="Menu">
          {navItems.map((item) => {
            const active =
              pathname === item.href ||
              (item.href !== "/" && pathname.startsWith(item.href));

            return (
              <Link
                key={item.href}
                href={item.href}
                className={cn(
                  "nav-item mb-0.5",
                  active && "nav-item-active"
                )}
                onClick={() => setOpen(false)}
                aria-current={active ? "page" : undefined}
              >
                <span className="flex-shrink-0">{item.icon}</span>
                <span className="flex-1">{item.label}</span>
                {item.badge !== undefined && (
                  <span
                    className={cn(
                      "flex h-5 min-w-5 items-center justify-center rounded-full px-1.5 text-2xs font-bold",
                      active
                        ? "bg-brand-600 text-white"
                        : "bg-neutral-200 text-neutral-600"
                    )}
                  >
                    {item.badge}
                  </span>
                )}
              </Link>
            );
          })}
        </nav>

        {/* Drawer footer — sign out */}
        <div className="border-t border-neutral-100 p-3">
          <form action={logoutAction}>
            <button
              type="submit"
              className="nav-item w-full text-red-600 hover:bg-red-50 hover:text-red-700"
            >
              <LogOut className="h-4 w-4 flex-shrink-0" />
              Sign out
            </button>
          </form>
        </div>
      </aside>
    </>
  );
}
