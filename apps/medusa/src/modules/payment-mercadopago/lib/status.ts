import { PaymentSessionStatus, PaymentActions } from "@medusajs/framework/utils"
import type { MpPaymentStatus } from "./types"
import { isAsyncMpPaymentMethod } from "./build-payment-payload"

// Maps a Mercado Pago payment status to a Medusa payment-session status.
// Used by getPaymentStatus/authorizePayment to keep state in sync.
export function mpStatusToSessionStatus(
  status: MpPaymentStatus
): PaymentSessionStatus {
  switch (status) {
    case "approved":
      return PaymentSessionStatus.CAPTURED
    case "authorized":
      return PaymentSessionStatus.AUTHORIZED
    case "pending":
    case "in_process":
    case "in_mediation":
      return PaymentSessionStatus.PENDING
    case "rejected":
      return PaymentSessionStatus.ERROR
    case "cancelled":
    case "refunded":
    case "charged_back":
      return PaymentSessionStatus.CANCELED
    default:
      return PaymentSessionStatus.PENDING
  }
}

/**
 * Medusa cart completion only accepts AUTHORIZED/CAPTURED sessions.
 * PSE/Efecty create MP payments in `pending` until the buyer finishes at the bank;
 * treat a successful create as authorized so we can place the order and redirect.
 */
export function medusaAuthorizeStatusFromMpPayment(payment: {
  status: MpPaymentStatus
  payment_method_id?: string
}): PaymentSessionStatus {
  const mapped = mpStatusToSessionStatus(payment.status)
  if (
    mapped === PaymentSessionStatus.PENDING &&
    isAsyncMpPaymentMethod(payment.payment_method_id)
  ) {
    return PaymentSessionStatus.AUTHORIZED
  }
  return mapped
}

// Maps a Mercado Pago payment status to the webhook action Medusa should take
// (US-3.3 / RUM-25). "captured" lets Medusa fire payment.captured -> fulfillment.
export function mpStatusToAction(status: MpPaymentStatus): PaymentActions {
  switch (status) {
    case "approved":
      return PaymentActions.SUCCESSFUL
    case "authorized":
      return PaymentActions.AUTHORIZED
    case "pending":
    case "in_process":
    case "in_mediation":
      return PaymentActions.PENDING
    case "rejected":
      return PaymentActions.FAILED
    case "cancelled":
    case "refunded":
    case "charged_back":
      return PaymentActions.CANCELED
    default:
      return PaymentActions.NOT_SUPPORTED
  }
}
