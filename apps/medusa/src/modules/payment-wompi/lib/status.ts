import { PaymentActions, PaymentSessionStatus } from "@medusajs/framework/utils"
import type { WompiTransactionStatus } from "./types"

const ASYNC_METHODS = new Set(["PSE", "NEQUI", "BANCOLOMBIA_TRANSFER"])

export function isAsyncWompiPaymentMethod(type?: string): boolean {
  return Boolean(type && ASYNC_METHODS.has(type.toUpperCase()))
}

export function wompiStatusToSessionStatus(
  status: WompiTransactionStatus
): PaymentSessionStatus {
  switch (status) {
    case "APPROVED":
      return PaymentSessionStatus.CAPTURED
    case "PENDING":
      return PaymentSessionStatus.PENDING
    case "DECLINED":
    case "ERROR":
      return PaymentSessionStatus.ERROR
    case "VOIDED":
      return PaymentSessionStatus.CANCELED
    default:
      return PaymentSessionStatus.PENDING
  }
}

export function wompiAuthorizeStatusFromTransaction(tx: {
  status: WompiTransactionStatus
  payment_method_type?: string
}): PaymentSessionStatus {
  const mapped = wompiStatusToSessionStatus(tx.status)
  if (
    mapped === PaymentSessionStatus.PENDING &&
    isAsyncWompiPaymentMethod(tx.payment_method_type)
  ) {
    return PaymentSessionStatus.AUTHORIZED
  }
  if (tx.status === "APPROVED") {
    return PaymentSessionStatus.CAPTURED
  }
  return mapped
}

export function wompiStatusToAction(status: WompiTransactionStatus): PaymentActions {
  switch (status) {
    case "APPROVED":
      return PaymentActions.SUCCESSFUL
    case "PENDING":
      return PaymentActions.PENDING
    case "DECLINED":
    case "ERROR":
      return PaymentActions.FAILED
    case "VOIDED":
      return PaymentActions.CANCELED
    default:
      return PaymentActions.NOT_SUPPORTED
  }
}
