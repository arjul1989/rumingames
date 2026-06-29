export type ParsedFazerWebhook = {
  fazerOrderId: string
  status: "delivered" | "failed" | "refunded" | "processing"
  codes: string[]
  error: string | null
  notificationId: string
}

function mapEventType(type: string): ParsedFazerWebhook["status"] | null {
  switch (type) {
    case "order.completed":
      return "delivered"
    case "order.failed":
      return "failed"
    case "order.refunded":
      return "refunded"
    default:
      return null
  }
}

function mapLegacyStatus(s: string): ParsedFazerWebhook["status"] | null {
  switch ((s || "").toLowerCase()) {
    case "completed":
    case "delivered":
    case "success":
      return "delivered"
    case "failed":
    case "error":
      return "failed"
    case "refunded":
      return "refunded"
    case "processing":
    case "pending":
      return "processing"
    default:
      return null
  }
}

/** Normalizes official FazerCards events and legacy flat webhook bodies. */
export function parseFazerWebhookBody(
  body: Record<string, unknown>
): ParsedFazerWebhook | null {
  const type = typeof body.type === "string" ? body.type : ""
  if (type.startsWith("order.")) {
    const order = (body.order ?? {}) as Record<string, unknown>
    const status = mapEventType(type)
    const fazerOrderId = String(order.id ?? "")
    if (!fazerOrderId || !status) return null

    const codes = Array.isArray(order.codes)
      ? order.codes.map((c) => String(c))
      : order.code
        ? [String(order.code)]
        : []

    return {
      fazerOrderId,
      status,
      codes,
      error:
        (typeof body.reason === "string" && body.reason) ||
        (typeof order.error === "string" && order.error) ||
        null,
      notificationId: String(body.id ?? `${fazerOrderId}:${type}`),
    }
  }

  const fazerOrderId = String(body.fazer_order_id ?? body.order_id ?? "")
  const status = mapLegacyStatus(String(body.status ?? ""))
  if (!fazerOrderId || !status) return null

  const codes = Array.isArray(body.codes)
    ? body.codes.map((c) => String(c))
    : body.code
      ? [String(body.code)]
      : []

  return {
    fazerOrderId,
    status,
    codes,
    error: typeof body.error === "string" ? body.error : null,
    notificationId: String(body.id ?? `${fazerOrderId}:${body.status}`),
  }
}
