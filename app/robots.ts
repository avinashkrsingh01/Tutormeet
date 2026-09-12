/**
 * TutorMeet — robots.txt
 *
 * Next.js serves this as /robots.txt automatically.
 * Rules:
 *  - Allow all crawlers on public marketing and location pages.
 *  - Block crawlers from all auth, dashboard, API, and admin routes
 *    to avoid leaking private data and wasting crawl budget.
 *
 * Docs: https://nextjs.org/docs/app/api-reference/file-conventions/metadata/robots
 */

import type { MetadataRoute } from "next";
import { SITE_URL } from "@/lib/seo";

export default function robots(): MetadataRoute.Robots {
  return {
    rules: [
      {
        // Default rule for all crawlers
        userAgent: "*",
        allow: [
          "/",
          "/tutors",
          "/tutors/*",
          "/home-tutors/*",
          "/for-parents",
          "/for-tutors",
          "/about",
          "/register",
          "/login",
          "/privacy",
          "/terms",
          "/safety",
          "/refund",
          "/tutor-agreement",
          "/parent-agreement",
        ],
        disallow: [
          // Auth flows — no crawl needed
          "/auth/",
          "/unauthorized",
          // Dashboard portals — private, behind auth
          "/parent/",
          "/tutor/",
          "/admin/",
          // API routes — never index
          "/api/",
          // Internal Next.js
          "/_next/",
          // Onboarding sub-paths
          "/parent/onboarding",
          "/tutor/onboarding",
          "/tutor/onboarding/*",
        ],
      },
      {
        // Explicitly block common AI/scraper crawlers from private paths
        userAgent: [
          "GPTBot",
          "ChatGPT-User",
          "CCBot",
          "anthropic-ai",
          "Claude-Web",
          "Omgilibot",
        ],
        disallow: [
          "/parent/",
          "/tutor/",
          "/admin/",
          "/api/",
        ],
      },
    ],
    sitemap: `${SITE_URL}/sitemap.xml`,
    host:    SITE_URL,
  };
}
