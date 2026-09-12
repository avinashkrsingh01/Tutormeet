/**
 * TutorMeet — Location data and supply-gate logic
 *
 * Design principles:
 * - Only generate location pages when there's meaningful tutor supply.
 * - Avoid thin pages: minimum MIN_TUTORS_FOR_PAGE verified tutors required.
 * - Cities are the primary unit. Localities are secondary (opt-in only).
 * - Slugs are lowercase, hyphen-separated (URL safe).
 *
 * Adding a new city:
 *   1. Add it to CITIES with display name, slug, state, and description.
 *   2. Optionally add localities in LOCALITIES keyed by city slug.
 *   3. The supply gate will prevent the page from being generated if there
 *      aren't enough verified tutors yet.
 */

// ─── Constants ─────────────────────────────────────────────────────────────────

/**
 * Minimum number of active verified tutors required before a location page
 * is generated. Below this, the page 404s to avoid thin content.
 */
export const MIN_TUTORS_FOR_PAGE = 3;

/**
 * Minimum tutors for a locality sub-page (higher bar than city).
 */
export const MIN_TUTORS_FOR_LOCALITY = 3;

// ─── Types ─────────────────────────────────────────────────────────────────────

export interface CityData {
  /** URL slug — used in /home-tutors/[city] */
  slug:        string;
  /** Human-readable display name */
  name:        string;
  /** Used in metadata + structured data */
  state:       string;
  /** Short descriptive phrase for H1 / meta */
  description: string;
  /** Nearby popular areas — used in body copy */
  popularAreas: string[];
  /** Popular subjects in this market (used in on-page copy) */
  popularSubjects?: string[];
}

export interface LocalityData {
  /** URL slug — used in /home-tutors/[city]/[locality] */
  slug:        string;
  /** Human-readable locality name */
  name:        string;
  /** Parent city slug */
  citySlug:    string;
}

// ─── City catalogue ────────────────────────────────────────────────────────────
// Only cities where TutorMeet is launching initially.
// Growth cities can be added here; supply gate prevents empty pages.

export const CITIES: CityData[] = [
  {
    slug:        "gurugram",
    name:        "Gurugram",
    state:       "Haryana",
    description: "Find verified home tutors in Gurugram for CBSE, ICSE and IB curriculum",
    popularAreas:    ["DLF Phase 1", "Sushant Lok", "Sector 56", "Sector 57", "Golf Course Road", "Palam Vihar"],
    popularSubjects: ["Mathematics", "Physics", "Chemistry", "English", "Science"],
  },
  {
    slug:        "delhi",
    name:        "Delhi",
    state:       "Delhi",
    description: "Find verified home tutors in Delhi for all classes and subjects",
    popularAreas:    ["Dwarka", "Rohini", "Pitampura", "Janakpuri", "Vasant Kunj", "Saket", "Lajpat Nagar"],
    popularSubjects: ["Mathematics", "English", "Science", "Hindi", "Social Studies"],
  },
  {
    slug:        "noida",
    name:        "Noida",
    state:       "Uttar Pradesh",
    description: "Find verified home tutors in Noida for CBSE and ICSE students",
    popularAreas:    ["Sector 50", "Sector 62", "Sector 76", "Sector 100", "Sector 137", "Greater Noida"],
    popularSubjects: ["Mathematics", "Physics", "Computer Science", "Chemistry", "English"],
  },
  {
    slug:        "bangalore",
    name:        "Bangalore",
    state:       "Karnataka",
    description: "Find verified home tutors in Bangalore for CBSE, ICSE and IGCSE students",
    popularAreas:    ["Koramangala", "Indiranagar", "Whitefield", "Marathahalli", "HSR Layout", "BTM Layout"],
    popularSubjects: ["Mathematics", "Science", "English", "Physics", "Computer Science"],
  },
  {
    slug:        "mumbai",
    name:        "Mumbai",
    state:       "Maharashtra",
    description: "Find verified home tutors in Mumbai for all boards and classes",
    popularAreas:    ["Andheri", "Bandra", "Powai", "Thane", "Navi Mumbai", "Borivali"],
    popularSubjects: ["Mathematics", "English", "Science", "Accountancy", "Economics"],
  },
  {
    slug:        "hyderabad",
    name:        "Hyderabad",
    state:       "Telangana",
    description: "Find verified home tutors in Hyderabad for CBSE and state board students",
    popularAreas:    ["Banjara Hills", "Jubilee Hills", "Hitech City", "Kondapur", "Gachibowli"],
    popularSubjects: ["Mathematics", "Physics", "Chemistry", "Biology", "English"],
  },
  {
    slug:        "pune",
    name:        "Pune",
    state:       "Maharashtra",
    description: "Find verified home tutors in Pune for CBSE, ICSE and SSC students",
    popularAreas:    ["Kothrud", "Baner", "Wakad", "Hinjewadi", "Aundh", "Viman Nagar"],
    popularSubjects: ["Mathematics", "Science", "English", "Physics", "Chemistry"],
  },
  {
    slug:        "faridabad",
    name:        "Faridabad",
    state:       "Haryana",
    description: "Find verified home tutors in Faridabad for CBSE and ICSE students",
    popularAreas:    ["NIT", "Sector 15", "Sector 28", "Old Faridabad", "Ballabhgarh"],
    popularSubjects: ["Mathematics", "Science", "English", "Hindi", "Social Studies"],
  },
];

// ─── Locality catalogue ────────────────────────────────────────────────────────
// Keyed by city slug. Only high-density localities with enough tutor supply
// should be added here. Start lean and expand.

export const LOCALITIES: Record<string, LocalityData[]> = {
  gurugram: [
    { slug: "sector-56", name: "Sector 56",   citySlug: "gurugram" },
    { slug: "sector-57", name: "Sector 57",   citySlug: "gurugram" },
    { slug: "dlf-phase-1", name: "DLF Phase 1", citySlug: "gurugram" },
    { slug: "sushant-lok", name: "Sushant Lok", citySlug: "gurugram" },
    { slug: "golf-course-road", name: "Golf Course Road", citySlug: "gurugram" },
    { slug: "palam-vihar", name: "Palam Vihar",  citySlug: "gurugram" },
  ],
  delhi: [
    { slug: "dwarka",         name: "Dwarka",         citySlug: "delhi" },
    { slug: "rohini",         name: "Rohini",         citySlug: "delhi" },
    { slug: "vasant-kunj",    name: "Vasant Kunj",    citySlug: "delhi" },
    { slug: "saket",          name: "Saket",          citySlug: "delhi" },
    { slug: "lajpat-nagar",   name: "Lajpat Nagar",   citySlug: "delhi" },
    { slug: "janakpuri",      name: "Janakpuri",      citySlug: "delhi" },
  ],
  noida: [
    { slug: "sector-62",  name: "Sector 62",  citySlug: "noida" },
    { slug: "sector-50",  name: "Sector 50",  citySlug: "noida" },
    { slug: "sector-76",  name: "Sector 76",  citySlug: "noida" },
    { slug: "sector-137", name: "Sector 137", citySlug: "noida" },
  ],
  bangalore: [
    { slug: "koramangala",  name: "Koramangala",  citySlug: "bangalore" },
    { slug: "indiranagar",  name: "Indiranagar",  citySlug: "bangalore" },
    { slug: "whitefield",   name: "Whitefield",   citySlug: "bangalore" },
    { slug: "hsr-layout",   name: "HSR Layout",   citySlug: "bangalore" },
    { slug: "marathahalli", name: "Marathahalli", citySlug: "bangalore" },
  ],
};

// ─── Lookup helpers ────────────────────────────────────────────────────────────

/** Get city data by slug. Returns null if city doesn't exist in catalogue. */
export function getCityBySlug(slug: string): CityData | null {
  return CITIES.find((c) => c.slug === slug) ?? null;
}

/** Get locality data by city + locality slug. */
export function getLocalityBySlug(
  citySlug: string,
  localitySlug: string
): LocalityData | null {
  return (
    LOCALITIES[citySlug]?.find((l) => l.slug === localitySlug) ?? null
  );
}

/** All localities for a given city slug. */
export function getLocalitiesForCity(citySlug: string): LocalityData[] {
  return LOCALITIES[citySlug] ?? [];
}

// ─── Slug ↔ display name ───────────────────────────────────────────────────────

/** Convert a city/locality name to a URL-safe slug. */
export function nameToSlug(name: string): string {
  return name
    .toLowerCase()
    .replace(/\s+/g, "-")
    .replace(/[^a-z0-9-]/g, "");
}

/** Convert a slug back to a display name. Uses catalogue first, then capitalises. */
export function slugToDisplayName(slug: string): string {
  // Check cities
  const city = CITIES.find((c) => c.slug === slug);
  if (city) return city.name;

  // Check localities across all cities
  for (const localities of Object.values(LOCALITIES)) {
    const loc = localities.find((l) => l.slug === slug);
    if (loc) return loc.name;
  }

  // Fallback: capitalise each word
  return slug
    .split("-")
    .map((w) => w.charAt(0).toUpperCase() + w.slice(1))
    .join(" ");
}

// ─── Supply gate ───────────────────────────────────────────────────────────────

/**
 * Returns true if there are enough verified tutors to warrant showing
 * this location page. Used in generateStaticParams and page guards.
 *
 * At build time this hits the DB. At request time the page itself
 * re-validates; this is just used to decide whether to include a route.
 */
export async function cityHasSupply(
  cityName: string,
  min = MIN_TUTORS_FOR_PAGE
): Promise<boolean> {
  try {
    // Dynamic import avoids pulling Supabase into client bundles
    const { createClient } = await import("@/lib/supabase/server");
    const supabase = await createClient();
    const { count } = await supabase
      .from("tutor_profiles")
      .select("*", { count: "exact", head: true })
      .eq("verification_status", "verified")
      .ilike("city", cityName);
    return (count ?? 0) >= min;
  } catch {
    // If DB is unavailable at build time, include the page anyway —
    // the page itself will show a graceful empty state.
    return true;
  }
}

export async function localityHasSupply(
  cityName: string,
  localityName: string,
  min = MIN_TUTORS_FOR_LOCALITY
): Promise<boolean> {
  try {
    const { createClient } = await import("@/lib/supabase/server");
    const supabase = await createClient();
    const { count } = await supabase
      .from("tutor_profiles")
      .select("*", { count: "exact", head: true })
      .eq("verification_status", "verified")
      .ilike("city", cityName)
      .ilike("locality", localityName);
    return (count ?? 0) >= min;
  } catch {
    return true;
  }
}
