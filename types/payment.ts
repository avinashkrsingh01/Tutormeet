// ============================================================
// TutorMeet — Payment System Types
// Designed for gateway-agnostic operation.
// The gateway can be swapped by changing the provider field
// and the corresponding gateway adapter in lib/payment/.
// ============================================================

// ─── Payment status pipeline ──────────────────────────────────────────────────

export type PaymentStatus =
  | "pending"            // Created, awaiting parent action
  | "awaiting_capture"   // Authorised by gateway, not yet captured
  | "processing"         // Capture in progress
  | "paid"               // Successfully captured — confirmed by server-side webhook
  | "failed"             // Gateway declined or error
  | "refunded"           // Full refund issued
  | "partially_refunded" // Partial refund issued
  | "disputed"           // Parent raised a chargeback / dispute
  | "cancelled";         // Cancelled before payment

// ─── Payment method types ─────────────────────────────────────────────────────

export type PaymentMethod =
  | "upi"           // India-first: Google Pay, PhonePe, BHIM
  | "card"          // Debit / credit card (gateway-tokenised — no raw numbers stored)
  | "net_banking"   // Internet banking
  | "wallet"        // Paytm, Amazon Pay, etc.
  | "cash"          // Offline — recorded by admin only
  | "bank_transfer" // NEFT / RTGS — recorded by admin only
  | "other";

// ─── Payment gateway providers ───────────────────────────────────────────────
// Credentials NEVER hardcoded — loaded from environment variables at runtime.

export type PaymentGateway =
  | "razorpay"   // Primary for India
  | "stripe"     // International fallback
  | "manual"     // Admin-recorded offline payment
  | "none";      // Gateway not yet integrated (current phase)

// ─── Invoice entity ───────────────────────────────────────────────────────────

export type InvoiceStatus = "draft" | "issued" | "paid" | "overdue" | "cancelled";

export type Invoice = {
  id:              string;
  invoice_number:  string;        // Human-readable: TM-2024-0001
  enrollment_id:   string;
  parent_id:       string;
  tutor_id:        string;
  student_name:    string | null;

  // Period
  period_start:    string;        // ISO date
  period_end:      string;
  sessions_billed: number;

  // Amounts (all in paise for INR to avoid float errors)
  amount_paise:         number;   // gross amount parent pays
  platform_fee_paise:   number;   // TutorMeet share
  tutor_amount_paise:   number;   // amount tutor receives
  currency:             string;   // "INR"

  status:          InvoiceStatus;
  due_date:        string | null;
  issued_at:       string | null;
  paid_at:         string | null;

  notes:           string | null;
  created_at:      string;
  updated_at:      string;
};

// ─── Payment transaction ──────────────────────────────────────────────────────
// One payment = one financial event.
// SECURITY: raw card data is NEVER stored. The gateway stores card details
// and returns a token/order_id. Only the token is recorded here.

export type Payment = {
  id:                string;   // internal UUID
  transaction_id:    string;   // UNIQUE — human-readable: TXN-2024-001234

  // What this payment is for
  invoice_id:        string | null;
  enrollment_id:     string;
  parent_id:         string;
  tutor_id:          string;

  // Amounts — stored as integer paise to avoid float issues
  amount_paise:         number;   // what parent paid
  platform_fee_paise:   number;   // TutorMeet keeps this
  tutor_amount_paise:   number;   // tutor earns this (amount - fee)
  currency:             string;   // "INR"

  // Gateway info — populated once gateway is integrated
  gateway:              PaymentGateway;
  gateway_order_id:     string | null;   // from gateway (e.g. Razorpay order_id)
  gateway_payment_id:   string | null;   // from gateway webhook ONLY — never frontend
  gateway_signature:    string | null;   // webhook signature (stored for audit)
  payment_method:       PaymentMethod | null;

  status:               PaymentStatus;

  // SECURITY: verified_by_webhook = TRUE only when set by server-side webhook
  // handler. Frontend cannot set this field.
  verified_by_webhook:  boolean;

  // Refund tracking
  refunded_amount_paise: number;
  refund_reason:         string | null;
  refunded_at:           string | null;

  // Metadata
  description:           string | null;
  failure_reason:        string | null;
  notes:                 string | null;   // admin notes — PRIVATE

  created_at:  string;
  updated_at:  string;
};

// ─── Ledger entry ─────────────────────────────────────────────────────────────
// Double-entry internal ledger.
// Every financial event creates two entries (debit + credit).

export type LedgerEntryType =
  | "payment_received"     // Parent pays
  | "platform_fee"         // TutorMeet earns
  | "tutor_earning"        // Tutor earns
  | "refund_issued"        // Full refund
  | "partial_refund"       // Partial refund
  | "payout_initiated"     // Tutor payout started
  | "payout_completed"     // Tutor payout done
  | "adjustment";          // Admin manual adjustment

export type LedgerEntry = {
  id:              string;
  payment_id:      string;
  entry_type:      LedgerEntryType;
  amount_paise:    number;        // always positive
  direction:       "credit" | "debit";
  account:         "platform" | "tutor" | "parent";  // whose account this affects
  currency:        string;
  balance_after:   number | null;  // running balance for this account
  description:     string;
  created_at:      string;
};

// ─── Tutor payout ────────────────────────────────────────────────────────────

export type PayoutStatus = "pending" | "processing" | "completed" | "failed";

export type TutorPayout = {
  id:              string;
  tutor_id:        string;
  amount_paise:    number;
  currency:        string;
  status:          PayoutStatus;
  payment_ids:     string[];    // which payments this payout covers
  utr_number:      string | null;  // bank transfer reference
  bank_account:    string | null;  // last 4 digits only — NEVER full account
  initiated_by:    string;      // admin_id
  initiated_at:    string;
  completed_at:    string | null;
  failure_reason:  string | null;
  notes:           string | null;
  created_at:      string;
};

// ─── Platform fee config ──────────────────────────────────────────────────────

export type PlatformFeeConfig = {
  percentage:     number;   // e.g. 10.00 = 10%
  minimum_paise:  number;   // minimum fee in paise
  maximum_paise:  number | null;   // cap (null = no cap)
  effective_from: string;
};

// ─── Payment summary (for dashboards) ────────────────────────────────────────

export type PaymentSummary = {
  total_paid_paise:        number;
  total_pending_paise:     number;
  total_refunded_paise:    number;
  last_payment_at:         string | null;
  payment_count:           number;
};

// ─── Helper: paise ↔ rupees ───────────────────────────────────────────────────

export function paiseToRupees(paise: number): number {
  return paise / 100;
}

export function rupeesToPaise(rupees: number): number {
  return Math.round(rupees * 100);
}

export function formatPaise(paise: number, currency = "INR"): string {
  return new Intl.NumberFormat("en-IN", {
    style:    "currency",
    currency,
    maximumFractionDigits: 0,
  }).format(paise / 100);
}
