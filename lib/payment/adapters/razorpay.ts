/**
 * Razorpay payment adapter (stub — ready for integration).
 *
 * TO ACTIVATE:
 * 1. npm install razorpay
 * 2. Set env vars:
 *      RAZORPAY_KEY_ID=rzp_live_...
 *      RAZORPAY_KEY_SECRET=...
 *      RAZORPAY_WEBHOOK_SECRET=...
 * 3. Change getGateway() in lib/payment/index.ts to return new RazorpayAdapter()
 *
 * SECURITY REQUIREMENTS:
 * - RAZORPAY_KEY_SECRET and RAZORPAY_WEBHOOK_SECRET MUST stay server-side only.
 * - NEVER expose them to the browser (no NEXT_PUBLIC_ prefix).
 * - Webhook verification MUST use the secret from env — never from the payload.
 * - Payment success MUST be confirmed only via webhook — never via frontend callback.
 */
import type {
  PaymentGatewayAdapter,
  CreateOrderParams,
  GatewayOrder,
  VerifyWebhookResult,
  RefundParams,
  RefundResult,
} from "../types";
import crypto from "crypto";

export class RazorpayAdapter implements PaymentGatewayAdapter {
  readonly name = "razorpay";

  private get keyId(): string {
    const key = process.env.RAZORPAY_KEY_ID;
    if (!key) throw new Error("RAZORPAY_KEY_ID env var not set");
    return key;
  }

  private get keySecret(): string {
    const secret = process.env.RAZORPAY_KEY_SECRET;
    if (!secret) throw new Error("RAZORPAY_KEY_SECRET env var not set");
    return secret;
  }

  isConfigured(): boolean {
    return !!(process.env.RAZORPAY_KEY_ID && process.env.RAZORPAY_KEY_SECRET);
  }

  async createOrder(params: CreateOrderParams): Promise<GatewayOrder> {
    /**
     * TODO: Replace stub with actual Razorpay SDK call:
     *
     * import Razorpay from "razorpay";
     * const razorpay = new Razorpay({ key_id: this.keyId, key_secret: this.keySecret });
     * const order = await razorpay.orders.create({
     *   amount:   params.amount_paise,
     *   currency: params.currency,
     *   receipt:  params.receipt,
     *   notes:    params.notes,
     * });
     * return { gateway_order_id: order.id, ... };
     */
    throw new Error(
      "Razorpay integration not yet active. Install razorpay package and uncomment the implementation."
    );
  }

  /**
   * Verify Razorpay webhook signature.
   *
   * Razorpay signs every webhook with HMAC-SHA256 using the webhook secret.
   * We verify by computing the expected signature and comparing with the
   * signature from the X-Razorpay-Signature header.
   *
   * SECURITY: This verification happens entirely server-side.
   * The webhook secret is read from env — never from the payload.
   */
  verifyWebhook(
    payload:   string,
    signature: string,
    secret:    string
  ): VerifyWebhookResult {
    try {
      const expectedSignature = crypto
        .createHmac("sha256", secret)
        .update(payload)
        .digest("hex");

      const isValid = crypto.timingSafeEqual(
        Buffer.from(expectedSignature, "hex"),
        Buffer.from(signature,         "hex")
      );

      if (!isValid) {
        return { valid: false, gateway_payment_id: null, gateway_order_id: null,
                 amount_paise: null, status: "unknown", error: "Invalid signature" };
      }

      const event = JSON.parse(payload);
      const entity = event?.payload?.payment?.entity;

      if (!entity) {
        return { valid: true, gateway_payment_id: null, gateway_order_id: null,
                 amount_paise: null, status: "unknown" };
      }

      return {
        valid:              true,
        gateway_payment_id: entity.id,
        gateway_order_id:   entity.order_id,
        amount_paise:       entity.amount,
        status:             entity.status === "captured" ? "captured"
                          : entity.status === "failed"   ? "failed"
                          : "unknown",
      };
    } catch (e) {
      return {
        valid:              false,
        gateway_payment_id: null,
        gateway_order_id:   null,
        amount_paise:       null,
        status:             "unknown",
        error:              e instanceof Error ? e.message : "Verification error",
      };
    }
  }

  async refund(params: RefundParams): Promise<RefundResult> {
    /**
     * TODO: Replace stub with actual Razorpay refund:
     *
     * const razorpay = new Razorpay({ key_id: this.keyId, key_secret: this.keySecret });
     * const refund = await razorpay.payments.refund(params.gateway_payment_id, {
     *   amount: params.amount_paise,
     *   notes:  params.notes,
     * });
     * return { success: true, gateway_refund_id: refund.id };
     */
    throw new Error("Razorpay refund not yet implemented.");
  }
}
