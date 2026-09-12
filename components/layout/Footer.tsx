import Link from "next/link";
import Image from "next/image";
import { ShieldCheck, MapPin } from "lucide-react";
import { APP_NAME, APP_TAGLINE } from "@/lib/constants";

const footerLinks = {
  product: [
    { label: "Find a Tutor",   href: "/register?role=parent" },
    { label: "Become a Tutor", href: "/register?role=tutor" },
    { label: "How It Works",   href: "/for-parents" },
    { label: "Verification",   href: "/for-tutors#verification" },
  ],
  company: [
    { label: "About Us",       href: "/about" },
    { label: "Contact",        href: "/about#contact" },
    { label: "Safety",         href: "/safety" },
    { label: "Careers",        href: "/about#careers" },
  ],
  legal: [
    { label: "Privacy Policy",   href: "/privacy" },
    { label: "Terms of Service", href: "/terms" },
    { label: "Refund Policy",    href: "/refund" },
    { label: "Safety Policy",    href: "/safety" },
    { label: "Tutor Agreement",  href: "/tutor-agreement" },
    { label: "Parent Agreement", href: "/parent-agreement" },
  ],
};

export function Footer() {
  const year = new Date().getFullYear();

  return (
    <footer className="bg-brand-950 text-neutral-400">

      {/* ── Main grid ───────────────────────────────────────────── */}
      <div className="container-page py-14 lg:py-16">
        <div className="grid grid-cols-1 gap-10 md:grid-cols-12">

          {/* Brand */}
          <div className="md:col-span-4 lg:col-span-5">
            <Link
              href="/"
              className="group mb-5 flex items-center gap-2.5"
              aria-label="TutorMeet home"
            >
              <div className="flex h-8 w-8 items-center justify-center rounded-xl bg-accent-500 text-white transition-colors group-hover:bg-accent-400">
                <ShieldCheck className="h-4 w-4" />
              </div>
              <div>
                <span
                  className="block text-lg font-bold text-white tracking-tight"
                  style={{ letterSpacing: "-0.02em" }}
                >
                  <span>Tutor<span className="text-blue-500">Meet</span></span>
                </span>
              </div>
            </Link>

            <p className="mb-1.5 text-sm font-semibold text-neutral-300">
              {APP_TAGLINE}
            </p>
            <p className="mb-6 max-w-xs text-sm leading-relaxed text-neutral-500">
              India&apos;s trusted home-tutor marketplace. Connecting parents
              with verified, background-checked tutors in their locality.
            </p>

            <div className="inline-flex items-center gap-2 rounded-full border border-neutral-700 bg-neutral-800/50 px-3.5 py-1.5 text-xs font-medium text-neutral-400">
              <MapPin className="h-3.5 w-3.5 text-accent-500" />
              Currently serving Bengaluru
            </div>
          </div>

          {/* Links */}
          <div className="md:col-span-8 lg:col-span-7 grid grid-cols-1 gap-8 sm:grid-cols-3">

            {/* Product */}
            <div>
              <h4
                className="mb-4 text-xs font-semibold uppercase text-neutral-300"
                style={{ letterSpacing: "0.12em" }}
              >
                TutorMeet
              </h4>
              <ul className="space-y-3">
                {footerLinks.product.map((link) => (
                  <li key={link.href}>
                    <Link
                      href={link.href}
                      className="text-sm text-neutral-500 transition-colors hover:text-neutral-200"
                    >
                      {link.label}
                    </Link>
                  </li>
                ))}
              </ul>
            </div>

            {/* Company */}
            <div>
              <h4
                className="mb-4 text-xs font-semibold uppercase text-neutral-300"
                style={{ letterSpacing: "0.12em" }}
              >
                Company
              </h4>
              <ul className="space-y-3">
                {footerLinks.company.map((link) => (
                  <li key={link.href}>
                    <Link
                      href={link.href}
                      className="text-sm text-neutral-500 transition-colors hover:text-neutral-200"
                    >
                      {link.label}
                    </Link>
                  </li>
                ))}
              </ul>
            </div>

            {/* Legal */}
            <div>
              <h4
                className="mb-4 text-xs font-semibold uppercase text-neutral-300"
                style={{ letterSpacing: "0.12em" }}
              >
                Legal
              </h4>
              <ul className="space-y-3">
                {footerLinks.legal.map((link) => (
                  <li key={link.href}>
                    <Link
                      href={link.href}
                      className="text-sm text-neutral-500 transition-colors hover:text-neutral-200"
                    >
                      {link.label}
                    </Link>
                  </li>
                ))}
              </ul>
            </div>
          </div>
        </div>
      </div>

      {/* ── Bottom bar ───────────────────────────────────────────── */}
      <div className="border-t border-neutral-800">
        <div className="container-page flex flex-col items-center justify-between gap-3 py-5 sm:flex-row">
          <p className="text-xs text-neutral-600">
            &copy; {year} {APP_NAME}. All rights reserved.
          </p>
          <div className="flex items-center gap-4">
            <span className="flex items-center gap-1.5 text-xs text-neutral-600">
              <ShieldCheck className="h-3.5 w-3.5 text-accent-600" />
              All tutors verified
            </span>
            <span className="text-neutral-700" aria-hidden="true">·</span>
            <span className="text-xs text-neutral-600">Made in India 🇮🇳</span>
          </div>
        </div>
      </div>
    </footer>
  );
}
