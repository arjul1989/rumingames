import type { HttpTypes } from "@medusajs/types"

function resolveMoneyAmount(value: unknown): number {
  if (value == null) return 0
  if (typeof value === "number" && Number.isFinite(value)) return value
  if (typeof value === "string") {
    const n = Number(value)
    return Number.isFinite(n) ? n : 0
  }
  if (typeof value === "object" && value !== null && "value" in value) {
    return resolveMoneyAmount((value as { value: unknown }).value)
  }
  return 0
}

type OrderTotalsLike = {
  current_order_total?: unknown
  accounting_total?: unknown
  original_order_total?: unknown
  raw_current_order_total?: unknown
  raw_accounting_total?: unknown
  raw_original_order_total?: unknown
}

/** Resolves order total from store/graph fields (handles BigNumber shapes). */
export function resolveOrderTotal(order: {
  total?: unknown
  summary?: { totals?: OrderTotalsLike | null } | null
  items?: HttpTypes.StoreOrderLineItem[] | null
}): number {
  const totals = order.summary?.totals
  const candidates = [
    order.total,
    totals?.current_order_total,
    totals?.accounting_total,
    totals?.original_order_total,
    totals?.raw_current_order_total,
    totals?.raw_accounting_total,
    totals?.raw_original_order_total,
  ]

  for (const value of candidates) {
    const n = resolveMoneyAmount(value)
    if (n > 0) return n
  }

  if (order.items?.length) {
    const sum = order.items.reduce(
      (acc, item) => acc + resolveOrderItemTotal(item),
      0
    )
    if (sum > 0) return sum
  }

  return 0
}

export function resolveOrderItemTotal(
  item: HttpTypes.StoreOrderLineItem
): number {
  const detail = item as HttpTypes.StoreOrderLineItem & {
    subtotal?: unknown
    raw_subtotal?: unknown
    raw_total?: unknown
    detail?: { subtotal?: unknown; raw_subtotal?: unknown }
  }

  const candidates = [
    item.total,
    detail.subtotal,
    detail.raw_subtotal,
    detail.raw_total,
    detail.detail?.subtotal,
    detail.detail?.raw_subtotal,
    item.unit_price != null && item.quantity != null
      ? Number(item.unit_price) * Number(item.quantity)
      : null,
  ]

  for (const value of candidates) {
    const n = resolveMoneyAmount(value)
    if (n > 0) return n
  }

  return 0
}

export function formatOrderDate(
  createdAt?: string | null,
  locale = "es-CO"
): string {
  if (!createdAt) return "—"
  const date = new Date(createdAt)
  if (Number.isNaN(date.getTime())) return "—"
  return date.toLocaleDateString(locale, {
    day: "2-digit",
    month: "short",
    year: "numeric",
  })
}
