"use client";

import Link from "next/link";
import Image from "next/image";
import { useState, useEffect } from "react";
import { Menu, X, ShieldCheck } from "lucide-react";
import { Button } from "@/components/ui/Button";
import { APP_NAME } from "@/lib/constants";
import { cn } from "@/lib/utils";

interface NavbarProps {
  transparent?: boolean;
}

const navLinks = [
  { label: "Find a Tutor", href: "/tutors"      },
  { label: "For Parents",  href: "/for-parents" },
  { label: "For Tutors",   href: "/for-tutors"  },
  { label: "About",        href: "/about"       },
];

export function Navbar({ transparent = false }: NavbarProps) {
  const [mobileOpen, setMobileOpen]   = useState(false);
  const [scrolled,   setScrolled]     = useState(false);

  useEffect(() => {
    if (!transparent) return;
    const onScroll = () => setScrolled(window.scrollY > 16);
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, [transparent]);

  const isOpaque = !transparent || scrolled || mobileOpen;

  return (
    <header
      className={cn(
        "top-0 z-50 w-full transition-all duration-300",
        transparent ? "fixed" : "sticky",
        isOpaque
          ? "border-b border-neutral-100 bg-white/95 shadow-xs backdrop-blur-sm"
          : "bg-transparent"
      )}
    >
      <nav className="container-page flex h-16 items-center justify-between">

        {/* ── Logo ──────────────────────────────────────────────── */}
        <Link
          href="/"
          className="flex items-center gap-2.5 group"
          aria-label="TutorMeet home"
        >
          {/* Logo mark */}
          <Image 
            src="/icons/icon-192x192.png" 
            alt="TutorMeet Logo" 
            width={32} 
            height={32} 
            className="h-8 w-8"
          />

          {/* Wordmark */}
          <span className={cn(
            "text-2xl font-bold tracking-tight transition-colors",
            isOpaque ? "text-navy-900" : "text-white"
          )}
            style={{ letterSpacing: "-0.02em" }}
          >
            <span>Tutor<span className="text-blue-600">Meet</span></span>
          </span>
        </Link>

        {/* ── Desktop nav links ──────────────────────────────────── */}
        <div className="hidden items-center gap-1 md:flex">
          {navLinks.map((link) => (
            <Link
              key={link.href}
              href={link.href}
              className={cn(
                "rounded-lg px-3.5 py-2 text-sm font-medium transition-colors duration-150",
                isOpaque
                  ? "text-neutral-600 hover:bg-neutral-100 hover:text-navy-900"
                  : "text-white/80 hover:bg-white/10 hover:text-white"
              )}
            >
              {link.label}
            </Link>
          ))}
        </div>

        {/* ── Desktop CTAs ───────────────────────────────────────── */}
        <div className="hidden items-center gap-2 md:flex">
          <Link href="/login">
            <Button
              variant={isOpaque ? "ghost" : "white-outline"}
              size="sm"
            >
              Sign in
            </Button>
          </Link>
          <Link href="/register">
            <Button
              variant={isOpaque ? "primary" : "white"}
              size="sm"
            >
              Get Started
            </Button>
          </Link>
        </div>

        {/* ── Mobile menu toggle ─────────────────────────────────── */}
        <button
          className={cn(
            "rounded-xl p-2 transition-colors md:hidden",
            isOpaque
              ? "text-neutral-700 hover:bg-neutral-100"
              : "text-white hover:bg-white/10"
          )}
          onClick={() => setMobileOpen(!mobileOpen)}
          aria-label="Toggle navigation menu"
          aria-expanded={mobileOpen}
        >
          {mobileOpen
            ? <X className="h-5 w-5" />
            : <Menu className="h-5 w-5" />}
        </button>
      </nav>

      {/* ── Mobile menu panel ──────────────────────────────────────── */}
      {mobileOpen && (
        <div className="border-t border-neutral-100 bg-white px-4 pb-5 md:hidden animate-slide-up">
          {/* Nav links */}
          <nav className="flex flex-col gap-0.5 pt-3">
            {navLinks.map((link) => (
              <Link
                key={link.href}
                href={link.href}
                className="rounded-xl px-4 py-3 text-sm font-medium text-neutral-700 hover:bg-neutral-50 hover:text-navy-900 transition-colors"
                onClick={() => setMobileOpen(false)}
              >
                {link.label}
              </Link>
            ))}
          </nav>

          {/* CTAs */}
          <div className="mt-4 flex flex-col gap-2.5 border-t border-neutral-100 pt-4">
            <Link href="/register" onClick={() => setMobileOpen(false)}>
              <Button variant="primary" fullWidth size="md">
                Get Started — It&apos;s Free
              </Button>
            </Link>
            <Link href="/login" onClick={() => setMobileOpen(false)}>
              <Button variant="ghost" fullWidth size="md">
                Sign in
              </Button>
            </Link>
          </div>

          {/* Trust note */}
          <p className="mt-4 flex items-center justify-center gap-1.5 text-xs text-neutral-400">
            <ShieldCheck className="h-3.5 w-3.5 text-accent-500" />
            Every tutor is verified &amp; background-checked
          </p>
        </div>
      )}
    </header>
  );
}
