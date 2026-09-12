// ============================================================
// TutorMeet — Payment Gateway Abstraction Layer
//
// This interface must be implemented by every gateway adapter.
// To swap gateways, change the adapter returned by getGateway().
// Credentials are NEVER hardcoded — always read from env vars.
// ============================================================

export interface CreateOrderParams {
  amount_paise:   number;    // amount in paise (INR)
  currency:       string;    // "INR"
  receipt:        string;    // internal transaction_id for cross-reference
  description?:   string;
  notes?:         Record<string, string>;
}

export interface GatewayOrder {
  gateway_order_id: string;   // returned by gateway, stored in payments table
  amount_paise:     number;
  currency:         string;
  status:           string;
  created_at:       string;
}

export interface WebhookEvent {
  event_type:         string;   // e.g. "payment.captured", "refund.processed"
  gateway_payment_id: string;   // gateway's payment ID
  gateway_order_id:   string;   // gateway's order ID
  amount_paise:       number;
  currency:           string;
  status:             string;
  signature:          string;   // HMAC signature for verification
  raw_payload:        string;   // original webhook body (for audit)
}

export interface VerifyWebhookResult {
  valid:              boolean;
  gateway_payment_id: string | null;
  gateway_order_id:   string | null;
  amount_paise:       number | null;
  status:             "captured" | "failed" | "refunded" | "unknown";
  error?:             string;
}

export interface RefundParams {
  gateway_payment_id: string;
  amount_paise:       number;
  reason?:            string;
  notes?:             Record<string, string>;
}

export interface RefundResult {
  success:          boolean;
  gateway_refund_id?: string;
  error?:           string;
}

// ─── The gateway interface every adapter must implement ───────────────────────

export interface PaymentGatewayAdapter {
  /**
   * Name of this gateway (matches PaymentGateway type).
   */
  readonly name: string;

  /**
   * Create a payment order on the gateway.
   * Returns a gateway_order_id that the frontend uses to open the checkout.
   * NEVER returns card details or credentials.
   */
  createOrder(params: CreateOrderParams): Promise<GatewayOrder>;

  /**
   * Verify a webhook signature and extract payment details.
   * MUST be called server-side only. This is the ONLY trusted way
   * to confirm a payment — frontend confirmation is rejected.
   */
  verifyWebhook(
    payload:   string,   // raw request body
    signature: string,   // from webhook headers
    secret:    string    // from environment variable
  ): VerifyWebhookResult;

  /**
   * Issue a full or partial refund.
   */
  refund(params: RefundParams): Promise<RefundResult>;

  /**
   * Verify the gateway's credentials are configured correctly.
   * Used on startup to fail fast if env vars are missing.
   */
  isConfigured(): boolean;
}
