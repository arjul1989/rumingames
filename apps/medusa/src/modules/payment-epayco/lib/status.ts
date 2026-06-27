import { PaymentSessionStatus } from "@medusajs/framework/utils"
import type { EpaycoTransaction, EpaycoTransactionStatus } from "./types"

export function normalizeEpaycoStatus(
  status: string | undefined
): EpaycoTransactionStatus | "UNKNOWN" {
  const normalized = (status ?? "").trim()
  if (
    normalized === "Aceptada" ||
    normalized === "Rechazada" ||
    normalized === "Pendiente" ||
    normalized === "Fallida"
  ) {
    return normalized
  }
  return "UNKNOWN"
}

export function epaycoStatusToSessionStatus(
  status: string | undefined
): PaymentSessionStatus {
  switch (normalizeEpaycoStatus(status)) {
    case "Aceptada":
      return PaymentSessionStatus.CAPTURED
    case "Pendiente":
      return PaymentSessionStatus.AUTHORIZED
    case "Rechazada":
    case "Fallida":
      return PaymentSessionStatus.ERROR
    default:
      return PaymentSessionStatus.PENDING
  }
}

export function epaycoStatusToAction(
  status: string | undefined
): "authorized" | "captured" | "failed" | "not_supported" {
  switch (normalizeEpaycoStatus(status)) {
    case "Aceptada":
      return "captured"
    case "Pendiente":
      return "authorized"
    case "Rechazada":
    case "Fallida":
      return "failed"
    default:
      return "not_supported"
  }
}

export function epaycoAuthorizeStatusFromTransaction(
  tx: Pick<EpaycoTransaction, "estado">
) {
  return epaycoStatusToSessionStatus(tx.estado)
}
