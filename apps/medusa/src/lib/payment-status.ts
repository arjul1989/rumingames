// Normalizes payment state into the four customer-facing statuses required by
// the post-checkout page (US-3.4 / RUM-26): pending | approved | rejected | refunded.

export type PublicPaymentStatus = "pending" | "approved" | "rejected" | "refunded"

function fromMpStatus(mpStatus?: string): PublicPaymentStatus | null {
  switch (mpStatus) {
    case "approved":
    case "authorized":
      return "approved"
    case "rejected":
    case "cancelled":
      return "rejected"
    case "refunded":
    case "charged_back":
      return "refunded"
    case "pending":
    case "in_process":
    case "in_mediation":
      return "pending"
    default:
      return null
  }
}

function fromMedusaStatus(status?: string): PublicPaymentStatus {
  switch (status) {
    case "captured":
    case "partially_captured":
    case "authorized":
    case "partially_authorized":
      return "approved"
    case "refunded":
    case "partially_refunded":
      return "refunded"
    case "canceled":
      return "rejected"
    default:
      // not_paid, awaiting, requires_action, unknown
      return "pending"
  }
}

// The Mercado Pago status (when present) is more specific, so it takes
// precedence over Medusa's aggregate payment status.
export function normalizePaymentStatus(
  medusaPaymentStatus?: string,
  mpStatus?: string
): PublicPaymentStatus {
  return fromMpStatus(mpStatus) ?? fromMedusaStatus(medusaPaymentStatus)
}
