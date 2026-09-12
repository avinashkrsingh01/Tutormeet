/**
 * TutorMeet — Server-side rate limiting
 *
 * Uses an in-memory sliding window per identifier (IP or user ID).
 * For production at scale, swap the store to Redis or Upstash.
 *
 * Usage:
 *   const limit = rateLimit({ key: ip, max: 10, windowSec: 60 });
 *   if (!limit.ok) return NextResponse.json({ error: "Too many requests" }, { status: 429 });
 */

type RateLimitEntry = { count: number; resetAt: number };

// In-memory store — replaced with Redis in production
const store = new Map<string, RateLimitEntry>();

// Cleanup old entries periodically (every 5 minutes)
if (typeof setInterval !== "undefined") {
  setInterval(() => {
    const now = Date.now();
    store.forEach((v, k) => {
      if (v.resetAt < now) store.delete(k);
    });
  }, 5 * 60 * 1000);
}

interface RateLimitOptions {
  key:       string;   // identifier — IP address or user ID
  max:       number;   // max requests in window
  windowSec: number;   // window length in seconds
}

interface RateLimitResult {
  ok:        boolean;
  remaining: number;
  resetAt:   number;   // epoch ms
}

export function rateLimit({ key, max, windowSec }: RateLimitOptions): RateLimitResult {
  const now      = Date.now();
  const windowMs = windowSec * 1000;

  const entry = store.get(key);

  if (!entry || entry.resetAt < now) {
    // New window
    const newEntry: RateLimitEntry = { count: 1, resetAt: now + windowMs };
    store.set(key, newEntry);
    return { ok: true, remaining: max - 1, resetAt: newEntry.resetAt };
  }

  entry.count++;
  store.set(key, entry);

  return {
    ok:        entry.count <= max,
    remaining: Math.max(0, max - entry.count),
    resetAt:   entry.resetAt,
  };
}

/**
 * Get client IP from Next.js request headers.
 * Falls back to a generic key when IP is unavailable (e.g. local dev).
 */
export function getClientIp(request: Request): string {
  // Vercel / Cloudflare forward the real IP in these headers
  const forwarded = request.headers.get("x-forwarded-for");
  if (forwarded) return forwarded.split(",")[0].trim();

  const realIp = request.headers.get("x-real-ip");
  if (realIp) return realIp.trim();

  return "unknown";
}

/**
 * Build a rate-limit key scoped to a specific action.
 * Combines the action name with the identifier so limits don't cross contaminate.
 */
export function rateLimitKey(action: string, identifier: string): string {
  return `rl:${action}:${identifier}`;
}
