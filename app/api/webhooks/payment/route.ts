/**
 * TutorMeet — Payment Webhook Handler
 *
 * SECURITY CRITICAL:
 * - This is the ONLY place where a payment can be marked as paid=TRUE.
 * - Frontend callbacks are NEVER trusted for payment confirmation.
 * - Every webhook is verified with HMAC signature before any DB update.
 * - Uses service-role client to bypass RLS for the payment update.
 * - verified_by_webhook is set to TRUE here and NOWHERE else.
 *
 * Rate-limiting and replay protection should be added at the
 * infrastructure layer (Vercel middleware / nginx) before production.
 */

import { NextResponse } from "next/server";
import { headers }      from "next/headers";
import { createAdminClient } from "@/lib/supabase/admin";
import { getGateway }        from "@/lib/payment";
import { rateLimit, getClientIp, rateLimitKey } from "@/lib/rate-limit";

// Maximum body size for webhooks (prevent DoS)
const MAX_BODY_BYTES = 1024 * 64; // 64KB

export async function POST(request: Request) {
  // ── Rate limit webhook: 100 per minute per IP ────────────────────────────
  const ip        = getClientIp(request);
  const rlResult  = rateLimit({ key: rateLimitKey("webhook_payment", ip), max: 100, windowSec: 60 });
  if (!rlResult.ok) {
    return NextResponse.json({ error: "Rate limit exceeded" }, { status: 429 });
  }

  // ── Read raw body (needed for HMAC verification) ──────────────────────────
  const contentLength = request.headers.get("content-length");
  if (contentLength && parseInt(contentLength) > MAX_BODY_BYTES) {
    return NextResponse.json({ error: "Payload too large" }, { status: 413 });
  }

  let rawBody: string;
  try {
    rawBody = await request.text();
  } catch {
    return NextResponse.json({ error: "Could not read body" }, { status: 400 });
  }

  // ── Get signature from headers ────────────────────────────────────────────
  const hdrs      = await headers();
  const signature = hdrs.get("x-razorpay-signature") ??
                    hdrs.get("stripe-signature")      ??
                    "";

  // ── Get webhook secret from env (NEVER from DB or request) ───────────────
  const webhookSecret = process.env.RAZORPAY_WEBHOOK_SECRET ??
                        process.env.PAYMENT_WEBHOOK_SECRET   ?? "";

  if (!webhookSecret) {
    console.error("[Webhook] PAYMENT_WEBHOOK_SECRET not configured");
    // Return 200 so gateway doesn't retry, but log the issue
    return NextResponse.json({ received: true, warning: "Webhook secret not configured" });
  }

  // ── Verify signature with gateway adapter ─────────────────────────────────
  const gateway = getGateway();
  const verified = gateway.verifyWebhook(rawBody, signature, webhookSecret);

  if (!verified.valid) {
    console.warn("[Webhook] Invalid signature:", verified.error);
    return NextResponse.json({ error: "Invalid signature" }, { status: 401 });
  }

  if (verified.status === "unknown") {
    // Acknowledge event types we don't handle yet
    return NextResponse.json({ received: true });
  }

  // ── Find the payment record by gateway_order_id ───────────────────────────
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const adminDb = createAdminClient() as any;

  const { data: payment } = await adminDb
    .from("payments")
    .select("id, status, amount_paise, verified_by_webhook, invoice_id, parent_id")
    .eq("gateway_order_id", verified.gateway_order_id ?? "")
    .single();

  if (!payment) {
    console.warn("[Webhook] Payment not found for order:", verified.gateway_order_id);
    // Return 200 — the event may be for a different environment
    return NextResponse.json({ received: true });
  }

  // ── Idempotency: skip if already processed ────────────────────────────────
  if (payment.verified_by_webhook && payment.status === "paid") {
    return NextResponse.json({ received: true, note: "Already processed" });
  }

  // ── Amount verification: must match what we expect ────────────────────────
  if (
    verified.amount_paise !== null &&
    Math.abs(verified.amount_paise - payment.amount_paise) > 1
  ) {
    console.error(
      `[Webhook] Amount mismatch for payment ${payment.id}:`,
      `expected ${payment.amount_paise}, got ${verified.amount_paise}`
    );
    // Update as disputed — do NOT mark as paid
    await adminDb
      .from("payments")
      .update({
        status:            "disputed",
        failure_reason:    `Amount mismatch: expected ${payment.amount_paise} paise, got ${verified.amount_paise}`,
        gateway_payment_id: verified.gateway_payment_id,
        gateway_signature:  signature,
      })
      .eq("id", payment.id);

    return NextResponse.json({ received: true, note: "Amount mismatch — marked disputed" });
  }

  // ── Update payment status ─────────────────────────────────────────────────
  const newStatus = verified.status === "captured" ? "paid"
                  : verified.status === "failed"   ? "failed"
                  : "processing";

  const updatePayload: Record<string, unknown> = {
    status:             newStatus,
    gateway_payment_id: verified.gateway_payment_id,
    gateway_signature:  signature,
  };

  // SECURITY: verified_by_webhook is only set TRUE here, in the webhook handler
  if (verified.status === "captured") {
    updatePayload.verified_by_webhook = true;
  }

  if (verified.status === "failed") {
    updatePayload.failure_reason = "Payment declined by gateway";
  }

  const { error: updateError } = await adminDb
    .from("payments")
    .update(updatePayload)
    .eq("id", payment.id);

  if (updateError) {
    console.error("[Webhook] Payment update error:", updateError);
    // Return 500 so gateway retries
    return NextResponse.json({ error: "Internal error" }, { status: 500 });
  }

  // ── If paid: mark invoice as paid ─────────────────────────────────────────
  if (newStatus === "paid") {
    if (payment.invoice_id) {
      await adminDb
        .from("invoices")
        .update({ status: "paid", paid_at: new Date().toISOString() })
        .eq("id", payment.invoice_id);
    }

    // Send notification to parent (non-critical — table may not exist yet)
    if (payment.parent_id) {
      await adminDb
        .from("notifications")
        .insert({
          user_id:     payment.parent_id,
          channel:     "in_app",
          title:       "Payment confirmed",
          body:        "Your payment has been confirmed and recorded.",
          action_url:  "/parent/payments",
          entity_type: "payment",
          entity_id:   payment.id,
        })
        .catch(() => {}); // notifications are non-critical
    }
  }

  console.info(`[Webhook] Payment ${payment.id} updated to ${newStatus}`);
  return NextResponse.json({ received: true });
}
