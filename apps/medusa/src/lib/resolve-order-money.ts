import { resolveLineItemQuantity } from "./fulfill-digital-order"
import { resolveMoneyAmount } from "./resolve-money-amount"

type LineItemLike = {
  title?: string
  unit_price?: unknown
  raw_unit_price?: unknown
  quantity?: unknown
  raw_quantity?: { value?: string } | null
  detail?: {
    quantity?: unknown
    subtotal?: unknown
    raw_subtotal?: unknown
  } | null
  subtotal?: unknown
  total?: unknown
  raw_total?: unknown
}

function resolveLineSubtotalFields(item: LineItemLike): number {
  return resolveMoneyAmount(
    item.detail?.subtotal ??
      item.detail?.raw_subtotal ??
      item.subtotal ??
      item.total ??
      item.raw_total
  )
}

type PaymentCollectionLike = {
  captured_amount?: unknown
  amount?: unknown
  payments?: Array<{
    captured_amount?: unknown
    amount?: unknown
  }>
}

type OrderLike = {
  total?: unknown
  subtotal?: unknown
  summary?: {
    totals?: {
      current_order_total?: unknown
      raw_current_order_total?: unknown
    }
  }
  payment_collections?: PaymentCollectionLike[]
  items?: LineItemLike[]
}

/** Line totals can be 0 on order.placed before Medusa finishes pricing; fall back to unit_price × qty. */
export function resolveLineItemTotal(item: LineItemLike): number {
  const fromFields = resolveLineSubtotalFields(item)
  if (fromFields > 0) return fromFields

  const qty = resolveLineItemQuantity(item)
  const unitPrice = resolveMoneyAmount(
    item.unit_price ?? item.raw_unit_price
  )
  return unitPrice * qty
}

export type OrderEmailLineItem = {
  title: string
  quantity: number
  total: number
}

/** Builds email line items; allocates captured payment when per-line totals are still zero. */
export function resolveOrderEmailItems(order: OrderLike): OrderEmailLineItem[] {
  const items = order.items ?? []
  if (!items.length) return []

  const resolved = items.map((item) => ({
    title: item.title ?? "Producto",
    quantity: resolveLineItemQuantity(item),
    total: resolveLineItemTotal(item),
    weight: 0,
  }))

  const lineSum = resolved.reduce((sum, item) => sum + item.total, 0)
  if (lineSum > 0) {
    return resolved.map(({ title, quantity, total }) => ({
      title,
      quantity,
      total,
    }))
  }

  const orderTotal = resolveOrderTotal(order)
  if (orderTotal <= 0) {
    return resolved.map(({ title, quantity, total }) => ({
      title,
      quantity,
      total,
    }))
  }

  for (let i = 0; i < items.length; i++) {
    const qty = resolved[i].quantity
    const unitPrice = resolveMoneyAmount(
      items[i].unit_price ?? items[i].raw_unit_price
    )
    resolved[i].weight = unitPrice > 0 ? unitPrice * qty : 1
  }

  const weightSum = resolved.reduce((sum, item) => sum + item.weight, 0)
  let allocated = 0
  return resolved.map((item, index) => {
    if (index === resolved.length - 1) {
      return {
        title: item.title,
        quantity: item.quantity,
        total: orderTotal - allocated,
      }
    }
    const share =
      weightSum > 0
        ? Math.round((orderTotal * item.weight) / weightSum)
        : Math.round(orderTotal / resolved.length)
    allocated += share
    return {
      title: item.title,
      quantity: item.quantity,
      total: share,
    }
  })
}

/** Order totals may be unset at placement; prefer captured payment amount, then line items. */
export function resolveOrderTotal(order: OrderLike): number {
  const fromSummary = resolveMoneyAmount(
    order.summary?.totals?.current_order_total ??
      order.summary?.totals?.raw_current_order_total
  )
  if (fromSummary > 0) return fromSummary

  const fromOrder = resolveMoneyAmount(order.total)
  if (fromOrder > 0) return fromOrder

  const fromSubtotal = resolveMoneyAmount(order.subtotal)
  if (fromSubtotal > 0) return fromSubtotal

  for (const pc of order.payment_collections ?? []) {
    const captured = resolveMoneyAmount(pc.captured_amount)
    if (captured > 0) return captured
    const amount = resolveMoneyAmount(pc.amount)
    if (amount > 0) return amount
    for (const payment of pc.payments ?? []) {
      const paymentCaptured = resolveMoneyAmount(payment.captured_amount)
      if (paymentCaptured > 0) return paymentCaptured
      const paymentAmount = resolveMoneyAmount(payment.amount)
      if (paymentAmount > 0) return paymentAmount
    }
  }

  return (order.items ?? []).reduce(
    (sum, item) => sum + resolveLineItemTotal(item),
    0
  )
}
