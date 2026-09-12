/**
 * TutorMeet — Dynamic sitemap
 *
 * Next.js reads this file and serves /sitemap.xml automatically.
 * Static routes always appear. Location pages are included only if
 * their supply gate passes at build time — preventing thin pages
 * from entering the sitemap.
 *
 * Docs: https://nextjs.org/docs/app/api-reference/file-conventions/metadata/sitemap
 */

import type { MetadataRoute } from "next";
import { SITE_URL } from "@/lib/seo";
import {
  CITIES,
  LOCALITIES,
  cityHasSupply,
  localityHasSupply,
} from "@/lib/locations";

// ─── Static public routes ──────────────────────────────────────────────────────

const STATIC_ROUTES: {
  url:          string;
  priority:     number;
  changeFreq:   MetadataRoute.Sitemap[number]["changeFrequency"];
}[] = [
  { url: "/",              priority: 1.0,  changeFreq: "weekly"  },
  { url: "/tutors",        priority: 0.95, changeFreq: "daily"   },
  { url: "/for-parents",   priority: 0.85, changeFreq: "monthly" },
  { url: "/for-tutors",    priority: 0.85, changeFreq: "monthly" },
  { url: "/about",         priority: 0.7,  changeFreq: "monthly" },
  { url: "/register",      priority: 0.8,  changeFreq: "monthly" },
  { url: "/login",         priority: 0.5,  changeFreq: "yearly"  },
  { url: "/privacy",       priority: 0.3,  changeFreq: "yearly"  },
  { url: "/terms",         priority: 0.3,  changeFreq: "yearly"  },
  { url: "/safety",        priority: 0.4,  changeFreq: "yearly"  },
  { url: "/refund",        priority: 0.3,  changeFreq: "yearly"  },
  { url: "/tutor-agreement",  priority: 0.3, changeFreq: "yearly" },
  { url: "/parent-agreement", priority: 0.3, changeFreq: "yearly" },
];

// ─── Sitemap generator ─────────────────────────────────────────────────────────

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const now = new Date();

  // 1. Static routes
  const staticEntries: MetadataRoute.Sitemap = STATIC_ROUTES.map(({ url, priority, changeFreq }) => ({
    url:              `${SITE_URL}${url}`,
    lastModified:     now,
    changeFrequency:  changeFreq,
    priority,
  }));

  // 2. City location pages — only include when supply gate passes
  const cityEntries: MetadataRoute.Sitemap = [];
  for (const city of CITIES) {
    const hasEnough = await cityHasSupply(city.name);
    if (hasEnough) {
      cityEntries.push({
        url:             `${SITE_URL}/home-tutors/${city.slug}`,
        lastModified:    now,
        changeFrequency: "weekly",
        priority:        0.9,
      });
    }
  }

  // 3. Locality pages — only include when supply gate passes
  const localityEntries: MetadataRoute.Sitemap = [];
  for (const [citySlug, localities] of Object.entries(LOCALITIES)) {
    const city = CITIES.find((c) => c.slug === citySlug);
    if (!city) continue;

    for (const loc of localities) {
      const hasEnough = await localityHasSupply(city.name, loc.name);
      if (hasEnough) {
        localityEntries.push({
          url:             `${SITE_URL}/home-tutors/${citySlug}/${loc.slug}`,
          lastModified:    now,
          changeFrequency: "weekly",
          priority:        0.8,
        });
      }
    }
  }

  return [...staticEntries, ...cityEntries, ...localityEntries];
}
