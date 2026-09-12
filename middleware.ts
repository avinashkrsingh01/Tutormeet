import { type NextRequest, NextResponse } from "next/server";
import { updateSession } from "@/lib/supabase/middleware";
import { createServerClient, type CookieOptions } from "@supabase/ssr";

// ─────────────────────────────────────────────────────────────────────────────
// Route configuration
// ─────────────────────────────────────────────────────────────────────────────

/**
 * Protected routes and which roles can access them.
 * Checked in order — first prefix match wins.
 *
 * Parents   → can access /parent/** (including /parent/onboarding)
 * Tutors    → can access /tutor/**
 * Admins    → can access everything that requires auth
 */
const PROTECTED_ROUTES: Record<string, string[]> = {
  "/parent":  ["parent", "admin"],
  "/tutor":   ["tutor",  "admin"],
  "/admin":   ["admin"],
};

/** Routes that logged-in users should be bounced away from */
const AUTH_ROUTES = ["/login", "/register"];

// ─────────────────────────────────────────────────────────────────────────────
// Middleware
// ─────────────────────────────────────────────────────────────────────────────

export async function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;

  // 1 — Refresh Supabase session cookie on every request
  const { supabaseResponse, user } = await updateSession(request);

  // 2 — Redirect authenticated users away from auth pages
  if (user && AUTH_ROUTES.some((r) => pathname.startsWith(r))) {
    // Read role from JWT metadata FIRST (no network call needed).
    // Falls back to a DB lookup only if the metadata role is absent.
    const role = getRoleFromMetadata(user) ?? await getUserRoleFromDB(request, user.id);
    const destination = getDashboardUrl(role);
    return NextResponse.redirect(new URL(destination, request.url));
  }

  // 3 — Enforce role-based route protection
  for (const [prefix, allowedRoles] of Object.entries(PROTECTED_ROUTES)) {
    if (!pathname.startsWith(prefix)) continue;

    // Not logged in → send to /login with return-path
    if (!user) {
      const loginUrl = new URL("/login", request.url);
      loginUrl.searchParams.set("redirectTo", pathname);
      return NextResponse.redirect(loginUrl);
    }

    // Read role from JWT metadata first (fast, no network)
    const role = getRoleFromMetadata(user) ?? await getUserRoleFromDB(request, user.id);

    // If role lookup failed entirely (network error etc.) — deny access safely.
    // We cannot assume they are authorized. They must try again.
    if (role === null) {
      console.warn("[middleware] Could not determine role for user", user.id, "— denying access");
      return NextResponse.redirect(new URL("/unauthorized", request.url));
    }

    // Logged in with wrong role → unauthorized
    if (!allowedRoles.includes(role)) {
      return NextResponse.redirect(new URL("/unauthorized", request.url));
    }

    break; // only evaluate the first matching prefix
  }

  return supabaseResponse;
}

// ─────────────────────────────────────────────────────────────────────────────
// Helpers
// ─────────────────────────────────────────────────────────────────────────────

/**
 * Read the role from the Supabase JWT user_metadata.
 * This is set at signup time and stored inside the JWT cookie — no network
 * call needed, so it works even when the DB is unreachable.
 */
function getRoleFromMetadata(user: { user_metadata?: Record<string, unknown> }): string | null {
  const role = user.user_metadata?.role;
  if (typeof role === "string" && role.length > 0) return role;
  return null;
}

/**
 * Fallback: fetch role from the profiles table.
 * Only called when user_metadata.role is absent (e.g. legacy accounts).
 * Wrapped in try/catch so a network error does NOT cause /unauthorized.
 */
async function getUserRoleFromDB(
  request: NextRequest,
  userId: string
): Promise<string | null> {
  try {
    const response = NextResponse.next({ request });

    const supabase = createServerClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
      {
        cookies: {
          getAll() {
            return request.cookies.getAll();
          },
          setAll(
            cookiesToSet: { name: string; value: string; options?: CookieOptions }[]
          ) {
            cookiesToSet.forEach(({ name, value, options }) => {
              response.cookies.set(name, value, options);
            });
          },
        },
      }
    );

    const { data } = await supabase
      .from("profiles")
      .select("role")
      .eq("id", userId)
      .single();

    return data?.role ?? null;
  } catch (err) {
    // Network error — return null so we can handle gracefully
    console.warn("[middleware] DB role lookup failed:", err);
    return null;
  }
}

function getDashboardUrl(role: string | null): string {
  switch (role) {
    case "tutor": return "/tutor/dashboard";
    case "admin": return "/admin/dashboard";
    default:      return "/parent/dashboard";
  }
}

// ─────────────────────────────────────────────────────────────────────────────
// Matcher — run middleware on all routes except static assets
// ─────────────────────────────────────────────────────────────────────────────

export const config = {
  matcher: [
    "/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)",
  ],
};
