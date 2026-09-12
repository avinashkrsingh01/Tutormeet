/**
 * TutorMeet — Centralised SEO utilities
 *
 * All metadata, canonical URLs, and structured-data (JSON-LD) generators
 * live here so they stay consistent as the site grows.
 *
 * Usage:
 *   import { buildMetadata, jsonLd } from "@/lib/seo";
 *   export const metadata = buildMetadata({ title: "...", description: "..." });
 */

import type { Metadata } from "next";
import { APP_NAME, APP_DESCRIPTION, APP_TAGLINE } from "@/lib/constants";

// ─── Runtime constants ─────────────────────────────────────────────────────────

/** Canonical origin — must be set in env for production. */
export const SITE_URL =
  (process.env.NEXT_PUBLIC_APP_URL ?? "https://tutormeet.in").replace(/\/$/, "");

export const SITE_NAME    = APP_NAME;
export const SITE_TAGLINE = APP_TAGLINE;

// ─── OG image defaults ─────────────────────────────────────────────────────────
// Using a path under /public so Next.js can serve it statically.
// Replace with actual image once brand assets are available.

export const OG_IMAGE_DEFAULT = {
  url:    `${SITE_URL}/og-default.png`,
  width:  1200,
  height: 630,
  alt:    `${APP_NAME} — ${APP_TAGLINE}`,
  type:   "image/png" as const,
};

// ─── Canonical URL builder ─────────────────────────────────────────────────────

/** Returns an absolute canonical URL for the given pathname. */
export function canonicalUrl(pathname: string): string {
  return `${SITE_URL}${pathname.startsWith("/") ? pathname : `/${pathname}`}`;
}

// ─── Core metadata factory ─────────────────────────────────────────────────────

interface BuildMetadataOptions {
  /** Page title — template " | TutorMeet" is applied by root layout. */
  title:        string;
  description:  string;
  /** Absolute or root-relative path for canonical link. */
  canonical?:   string;
  /** Additional keywords merged on top of the base set. */
  keywords?:    string[];
  /** OG image override — falls back to OG_IMAGE_DEFAULT. */
  ogImage?:     { url: string; width?: number; height?: number; alt?: string };
  /** Set to false for pages you don't want indexed (e.g. /login). */
  noIndex?:     boolean;
  /** Article/product publish date for OG type "article". */
  publishedTime?: string;
}

const BASE_KEYWORDS = [
  "home tutor",
  "home tuition",
  "private tutor India",
  "verified tutor",
  "CBSE tutor",
  "ICSE tutor",
  "find tutor near me",
  "tutor marketplace India",
];

export function buildMetadata({
  title,
  description,
  canonical,
  keywords = [],
  ogImage,
  noIndex = false,
  publishedTime,
}: BuildMetadataOptions): Metadata {
  const image = ogImage
    ? { url: ogImage.url, width: ogImage.width ?? 1200, height: ogImage.height ?? 630, alt: ogImage.alt ?? title }
    : OG_IMAGE_DEFAULT;

  return {
    title,
    description,
    keywords:  [...BASE_KEYWORDS, ...keywords],
    authors:   [{ name: APP_NAME, url: SITE_URL }],
    creator:   APP_NAME,
    publisher: APP_NAME,

    ...(canonical && {
      alternates: { canonical: canonicalUrl(canonical) },
    }),

    robots: noIndex
      ? { index: false, follow: false }
      : { index: true,  follow: true,  googleBot: { index: true, follow: true } },

    openGraph: {
      type:        publishedTime ? "article" : "website",
      locale:      "en_IN",
      siteName:    SITE_NAME,
      title,
      description,
      url:         canonical ? canonicalUrl(canonical) : undefined,
      images:      [image],
      ...(publishedTime && { publishedTime }),
    },

    twitter: {
      card:        "summary_large_image",
      site:        "@tutormeetin",
      creator:     "@tutormeetin",
      title,
      description,
      images:      [image.url],
    },
  };
}

// ─── JSON-LD generators ────────────────────────────────────────────────────────

/**
 * Renders a <script type="application/ld+json"> tag.
 * Use inside a Server Component's JSX.
 *
 * @example
 *   <script {...jsonLd(websiteSchema())} />
 *
 * Note: Set a `key` prop directly on the <script> element at the call site
 * to avoid React duplicate-key warnings when multiple schemas are on one page.
 */
export function jsonLd(schema: Record<string, unknown>): React.ScriptHTMLAttributes<HTMLScriptElement> {
  return {
    type:                     "application/ld+json",
    dangerouslySetInnerHTML: { __html: JSON.stringify(schema) },
  };
}

// ── Website schema ─────────────────────────────────────────────────────────────

export function websiteSchema() {
  return {
    "@context":       "https://schema.org",
    "@type":          "WebSite",
    "@id":            `${SITE_URL}/#website`,
    name:             SITE_NAME,
    url:              SITE_URL,
    description:      APP_DESCRIPTION,
    inLanguage:       "en-IN",
    potentialAction: {
      "@type":       "SearchAction",
      target:        {
        "@type":    "EntryPoint",
        urlTemplate: `${SITE_URL}/tutors?q={search_term_string}`,
      },
      "query-input": "required name=search_term_string",
    },
  };
}

// ── Organization schema ────────────────────────────────────────────────────────

export function organizationSchema() {
  return {
    "@context":  "https://schema.org",
    "@type":     "Organization",
    "@id":       `${SITE_URL}/#organization`,
    name:        SITE_NAME,
    url:         SITE_URL,
    logo: {
      "@type":       "ImageObject",
      url:           `${SITE_URL}/logo.png`,
      width:         512,
      height:        512,
    },
    sameAs: [
      // Add social profile URLs here once created
    ],
    contactPoint: {
      "@type":       "ContactPoint",
      contactType:   "customer support",
      email:         "support@tutormeet.in",
      availableLanguage: ["English", "Hindi"],
    },
  };
}

// ── BreadcrumbList schema ──────────────────────────────────────────────────────

export function breadcrumbSchema(
  items: { name: string; href: string }[]
) {
  return {
    "@context":        "https://schema.org",
    "@type":           "BreadcrumbList",
    itemListElement:   items.map((item, i) => ({
      "@type":    "ListItem",
      position:   i + 1,
      name:       item.name,
      item:       canonicalUrl(item.href),
    })),
  };
}

// ── LocalBusiness / Service schema for location pages ──────────────────────────

export function localBusinessSchema(options: {
  name:         string;
  description:  string;
  url:          string;
  city:         string;
  state?:       string;
  country?:     string;
  priceRange?:  string;
}) {
  return {
    "@context":    "https://schema.org",
    "@type":       ["Service", "LocalBusiness"],
    "@id":         canonicalUrl(options.url),
    name:          options.name,
    description:   options.description,
    url:           canonicalUrl(options.url),
    provider: {
      "@id":       `${SITE_URL}/#organization`,
    },
    areaServed: {
      "@type":     "City",
      name:        options.city,
      ...(options.state   && { containedIn: { "@type": "State",   name: options.state   } }),
      ...(options.country && { containedIn: { "@type": "Country", name: options.country } }),
    },
    serviceType:   "Home Tuition",
    ...(options.priceRange && { priceRange: options.priceRange }),
  };
}

// ── FAQPage schema ─────────────────────────────────────────────────────────────

export function faqSchema(items: { question: string; answer: string }[]) {
  return {
    "@context":  "https://schema.org",
    "@type":     "FAQPage",
    mainEntity:  items.map((item) => ({
      "@type":        "Question",
      name:           item.question,
      acceptedAnswer: {
        "@type": "Answer",
        text:    item.answer,
      },
    })),
  };
}

// ── SiteLinksSearchBox ─────────────────────────────────────────────────────────

export function siteLinksSearchBoxSchema() {
  return {
    "@context":      "https://schema.org",
    "@type":         "WebSite",
    url:             SITE_URL,
    potentialAction: {
      "@type":       "SearchAction",
      target:        `${SITE_URL}/tutors?q={search_term_string}`,
      "query-input": "required name=search_term_string",
    },
  };
}
