import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";

/**
 * Supabase Auth callback — exchanges the code from the email confirmation
 * link for a session cookie, then redirects to the appropriate dashboard.
 *
 * SECURITY: redirectTo is validated to be a relative path only.
 * An external URL (e.g. https://evil.com) is silently discarded to prevent
 * open-redirect attacks — a common vector after OAuth / email flows.
 */

/** Returns true only for safe relative paths like /parent/dashboard */
function isSafeRedirect(value: string | null): value is string {
  if (!value) return false;
  // Must start with / but not // (protocol-relative = external)
  // Must not contain protocol-looking strings
  return (
    value.startsWith("/") &&
    !value.startsWith("//") &&
    !value.includes("://") &&
    !value.includes("\\")
  );
}

export async function GET(request: Request) {
  const { searchParams, origin } = new URL(request.url);
  const code       = searchParams.get("code");
  const rawRedirect = searchParams.get("redirectTo");

  // Validate redirectTo before any use — reject external URLs
  const safeRedirect = isSafeRedirect(rawRedirect) ? rawRedirect : null;

  if (code) {
    const supabase = await createClient();
    const { error } = await supabase.auth.exchangeCodeForSession(code);

    if (!error) {
      const { data: { user } } = await supabase.auth.getUser();

      if (user) {
        const { data: profile } = await supabase
          .from("profiles")
          .select("role")
          .eq("id", user.id)
          .single();

        const role = profile?.role ?? "parent";

        const dashboardMap: Record<string, string> = {
          parent: "/parent/dashboard",
          tutor:  "/tutor/dashboard",
          admin:  "/admin/dashboard",
        };

        const destination = safeRedirect ?? dashboardMap[role] ?? "/parent/dashboard";

        return NextResponse.redirect(`${origin}${destination}`);
      }
    }
  }

  // Auth failed — redirect to login with a safe, non-descriptive error code
  return NextResponse.redirect(`${origin}/login?error=auth_callback_failed`);
}
