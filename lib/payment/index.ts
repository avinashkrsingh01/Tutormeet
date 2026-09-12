/**
 * TutorMeet Payment Gateway Factory
 *
 * Returns the active gateway adapter based on PAYMENT_GATEWAY env var.
 * To switch gateways:
 *   1. Set PAYMENT_GATEWAY=razorpay in your env file
 *   2. Ensure RAZORPAY_KEY_ID and RAZORPAY_KEY_SECRET are set
 *   3. The rest of the system adapts automatically
 *
 * Current default: "manual" (admin records payments manually)
 */
import { ManualPaymentAdapter } from "./adapters/manual";
import { RazorpayAdapter }      from "./adapters/razorpay";
import type { PaymentGatewayAdapter } from "./types";

export type { PaymentGatewayAdapter } from "./types";
export type {
  CreateOrderParams,
  GatewayOrder,
  WebhookEvent,
  VerifyWebhookResult,
  RefundParams,
  RefundResult,
} from "./types";

let _gateway: PaymentGatewayAdapter | null = null;

export function getGateway(): PaymentGatewayAdapter {
  if (_gateway) return _gateway;

  const provider = process.env.PAYMENT_GATEWAY ?? "manual";

  switch (provider) {
    case "razorpay":
      _gateway = new RazorpayAdapter();
      break;
    case "manual":
    default:
      _gateway = new ManualPaymentAdapter();
      break;
  }

  return _gateway;
}

// ─── Platform fee calculator ─────────────────────────────────────────────────

const PLATFORM_FEE_PERCENTAGE = parseFloat(
  process.env.PLATFORM_FEE_PERCENTAGE ?? "10"   // default 10%
);
const PLATFORM_FEE_MIN_PAISE = parseInt(
  process.env.PLATFORM_FEE_MIN_PAISE ?? "0"     // default no minimum
);

export function calculatePlatformFee(amountPaise: number): {
  platform_fee_paise: number;
  tutor_amount_paise: number;
} {
  const rawFee = Math.round(amountPaise * (PLATFORM_FEE_PERCENTAGE / 100));
  const platform_fee_paise = Math.max(rawFee, PLATFORM_FEE_MIN_PAISE);
  const tutor_amount_paise = amountPaise - platform_fee_paise;

  return { platform_fee_paise, tutor_amount_paise };
}

// ─── Transaction ID generator ─────────────────────────────────────────────────

export function generateTransactionId(): string {
  const now     = new Date();
  const yy      = String(now.getFullYear()).slice(-2);
  const mm      = String(now.getMonth() + 1).padStart(2, "0");
  const dd      = String(now.getDate()).padStart(2, "0");
  const random  = Math.random().toString(36).slice(2, 8).toUpperCase();
  return `TXN-${yy}${mm}${dd}-${random}`;
}

// ─── Invoice number generator ─────────────────────────────────────────────────

export function generateInvoiceNumber(sequenceNumber: number): string {
  const year    = new Date().getFullYear();
  const seq     = String(sequenceNumber).padStart(5, "0");
  return `TM-${year}-${seq}`;
}
