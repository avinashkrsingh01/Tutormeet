"use server";

import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";
import {
  getGateway,
  calculatePlatformFee,
  generateTransactionId,
  generateInvoiceNumber,
} from "@/lib/payment";
import { rupeesToPaise } from "@/types/payment";
import { z } from "zod";

// ─────────────────────────────────────────────────────────────────────────────
// CREATE INVOICE
// Admin creates an invoice for a billing period.
// ─────────────────────────────────────────────────────────────────────────────

const createInvoiceSchema = z.object({
  enrollment_id:  z.string().uuid(),
  period_start:   z.string().min(1),
  period_end:     z.string().min(1),
  sessions_billed: z.number().int().min(1),
  amount_rupees:  z.number().min(1),
  notes:          z.string().optional(),
});

export type CreateInvoiceResult =
  | { success: true;  invoice_id: string; invoice_number: string }
  | { success: false; error: string };

export async function createInvoiceAction(
  data: z.infer<typeof createInvoiceSchema>
): Promise<CreateInvoiceResult> {
  const parsed = createInvoiceSchema.safeParse(data);
  if (!parsed.success) {
    return { success: false, error: parsed.error.errors[0].message };
  }

  // Must be admin
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return { success: false, error: "Unauthorized." };

  const { data: profile } = await supabase
    .from("profiles").select("role").eq("id", user.id).single();
  if (!profile || profile.role !== "admin") {
    return { success: false, error: "Only admins can create invoices." };
  }

  // Fetch enrollment details
  const { data: enrollment } = await supabase
    .from("enrollments")
    .select("parent_id, tutor_id, student_id")
    .eq("id", parsed.data.enrollment_id)
    .single();

  if (!enrollment) return { success: false, error: "Enrollment not found." };

  const amount_paise = rupeesToPaise(parsed.data.amount_rupees);
  const { platform_fee_paise, tutor_amount_paise } = calculatePlatformFee(amount_paise);

  // Get next invoice sequence number
  const adminDb = createAdminClient() as any; // eslint-disable-line
  const { data: seqRow } = await adminDb.rpc("nextval", { seq: "invoice_number_seq" });
  const seq = seqRow ?? Date.now();
  const invoice_number = generateInvoiceNumber(Number(seq));

  const { data: invoice, error } = await supabase
    .from("invoices")
    .insert({
      invoice_number,
      enrollment_id:      parsed.data.enrollment_id,
      parent_id:          enrollment.parent_id,
      tutor_id:           enrollment.tutor_id,
      period_start:       parsed.data.period_start,
      period_end:         parsed.data.period_end,
      sessions_billed:    parsed.data.sessions_billed,
      amount_paise,
      platform_fee_paise,
      tutor_amount_paise,
      currency:           "INR",
      status:             "issued",
      issued_at:          new Date().toISOString(),
      notes:              parsed.data.notes ?? null,
    })
    .select("id, invoice_number")
    .single();

  if (error || !invoice) {
    console.error("Invoice create error:", error);
    return { success: false, error: "Could not create invoice." };
  }

  return { success: true, invoice_id: invoice.id, invoice_number: invoice.invoice_number };
}

// ─────────────────────────────────────────────────────────────────────────────
// RECORD MANUAL PAYMENT (Phase 1 — no gateway)
// Admin records a payment made directly by parent to tutor.
// ─────────────────────────────────────────────────────────────────────────────

const recordManualPaymentSchema = z.object({
  invoice_id:     z.string().uuid().optional(),
  enrollment_id:  z.string().uuid(),
  amount_rupees:  z.number().min(1),
  payment_method: z.enum(["cash","bank_transfer","upi","other"]),
  description:    z.string().optional(),
  notes:          z.string().optional(),
});

export type RecordPaymentResult =
  | { success: true;  payment_id: string; transaction_id: string }
  | { success: false; error: string };

export async function recordManualPaymentAction(
  data: z.infer<typeof recordManualPaymentSchema>
): Promise<RecordPaymentResult> {
  const parsed = recordManualPaymentSchema.safeParse(data);
  if (!parsed.success) {
    return { success: false, error: parsed.error.errors[0].message };
  }

  // Must be admin
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return { success: false, error: "Unauthorized." };
  const { data: profile } = await supabase
    .from("profiles").select("role").eq("id", user.id).single();
  if (!profile || profile.role !== "admin") {
    return { success: false, error: "Only admins can record manual payments." };
  }

  const { data: enrollment } = await supabase
    .from("enrollments")
    .select("parent_id, tutor_id")
    .eq("id", parsed.data.enrollment_id)
    .single();

  if (!enrollment) return { success: false, error: "Enrollment not found." };

  const amount_paise = rupeesToPaise(parsed.data.amount_rupees);
  const { platform_fee_paise, tutor_amount_paise } = calculatePlatformFee(amount_paise);
  const transaction_id = generateTransactionId();

  // Manual payments are pre-verified (admin recorded them)
  const { data: payment, error } = await supabase
    .from("payments")
    .insert({
      transaction_id,
      invoice_id:           parsed.data.invoice_id ?? null,
      enrollment_id:        parsed.data.enrollment_id,
      parent_id:            enrollment.parent_id,
      tutor_id:             enrollment.tutor_id,
      amount_paise,
      platform_fee_paise,
      tutor_amount_paise,
      currency:             "INR",
      gateway:              "manual",
      payment_method:       parsed.data.payment_method,
      status:               "paid",
      verified_by_webhook:  false,  // manual: no webhook — verified by admin
      description:          parsed.data.description ?? null,
      notes:                parsed.data.notes ?? null,
    })
    .select("id, transaction_id")
    .single();

  if (error || !payment) {
    console.error("Manual payment error:", error);
    return { success: false, error: "Could not record payment." };
  }

  // Mark invoice as paid
  if (parsed.data.invoice_id) {
    await supabase
      .from("invoices")
      .update({ status: "paid", paid_at: new Date().toISOString() })
      .eq("id", parsed.data.invoice_id);
  }

  return {
    success:        true,
    payment_id:     payment.id,
    transaction_id: payment.transaction_id,
  };
}

// ─────────────────────────────────────────────────────────────────────────────
// CREATE GATEWAY ORDER (Phase 2 — when gateway is active)
// Returns gateway_order_id for frontend checkout.
// NEVER returns secrets or confirms payment here.
// ─────────────────────────────────────────────────────────────────────────────

const createGatewayOrderSchema = z.object({
  invoice_id: z.string().uuid(),
});

export async function createGatewayOrderAction(
  data: z.infer<typeof createGatewayOrderSchema>
): Promise<{ success: true; gateway_order_id: string; transaction_id: string; amount_paise: number } | { success: false; error: string }> {
  const parsed = createGatewayOrderSchema.safeParse(data);
  if (!parsed.success) return { success: false, error: parsed.error.errors[0].message };

  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return { success: false, error: "Session expired." };

  const { data: invoice } = await supabase
    .from("invoices")
    .select("id, enrollment_id, parent_id, tutor_id, amount_paise, platform_fee_paise, tutor_amount_paise")
    .eq("id", parsed.data.invoice_id)
    .eq("parent_id", user.id)
    .single();

  if (!invoice) return { success: false, error: "Invoice not found." };
  if (invoice.amount_paise <= 0) return { success: false, error: "Invalid invoice amount." };

  const gateway      = getGateway();
  const transaction_id = generateTransactionId();

  try {
    const order = await gateway.createOrder({
      amount_paise:  invoice.amount_paise,
      currency:      "INR",
      receipt:       transaction_id,
      description:   `TutorMeet invoice ${parsed.data.invoice_id}`,
    });

    // Create pending payment record
    const { data: payment, error } = await supabase
      .from("payments")
      .insert({
        transaction_id,
        invoice_id:          invoice.id,
        enrollment_id:       invoice.enrollment_id,
        parent_id:           invoice.parent_id,
        tutor_id:            invoice.tutor_id,
        amount_paise:        invoice.amount_paise,
        platform_fee_paise:  invoice.platform_fee_paise,
        tutor_amount_paise:  invoice.tutor_amount_paise,
        currency:            "INR",
        gateway:             gateway.name as any, // eslint-disable-line
        gateway_order_id:    order.gateway_order_id,
        status:              "pending",
        verified_by_webhook: false,
      })
      .select("id")
      .single();

    if (error || !payment) return { success: false, error: "Could not create payment record." };

    return {
      success:          true,
      gateway_order_id: order.gateway_order_id,
      transaction_id,
      amount_paise:     invoice.amount_paise,
    };
  } catch (e) {
    return {
      success: false,
      error:   e instanceof Error ? e.message : "Gateway error.",
    };
  }
}
