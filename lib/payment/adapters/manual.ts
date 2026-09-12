/**
 * Manual payment adapter — no gateway integration.
 * Used during Phase 1 while Razorpay is not yet connected.
 * All payment recording is done by admin staff manually.
 *
 * When Razorpay is integrated, replace this with adapters/razorpay.ts
 * and change getGateway() in lib/payment/index.ts.
 */
import type {
  PaymentGatewayAdapter,
  CreateOrderParams,
  GatewayOrder,
  VerifyWebhookResult,
  RefundParams,
  RefundResult,
} from "../types";

export class ManualPaymentAdapter implements PaymentGatewayAdapter {
  readonly name = "manual";

  createOrder(params: CreateOrderParams): Promise<GatewayOrder> {
    // In manual mode, we just return a placeholder order.
    // Actual payment is tracked by admin staff.
    return Promise.resolve({
      gateway_order_id: `MANUAL-${params.receipt}-${Date.now()}`,
      amount_paise:     params.amount_paise,
      currency:         params.currency,
      status:           "created",
      created_at:       new Date().toISOString(),
    });
  }

  verifyWebhook(
    _payload:   string,
    _signature: string,
    _secret:    string
  ): VerifyWebhookResult {
    // Manual mode has no webhook — admin records payments directly.
    return {
      valid:              false,
      gateway_payment_id: null,
      gateway_order_id:   null,
      amount_paise:       null,
      status:             "unknown",
      error:              "Manual mode does not support webhooks.",
    };
  }

  async refund(_params: RefundParams): Promise<RefundResult> {
    return {
      success: false,
      error:   "Manual refunds must be processed by admin staff.",
    };
  }

  isConfigured(): boolean {
    return true; // Manual mode is always "configured"
  }
}
