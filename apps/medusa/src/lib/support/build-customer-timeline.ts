import type { MedusaContainer } from "@medusajs/framework"
import { ContainerRegistrationKeys } from "@medusajs/framework/utils"
import { SUPPLIER_MODULE } from "../../modules/supplier"
import { DIGITAL_DELIVERY_MODULE } from "../../modules/digital-delivery"
import { FUNDING_MODULE } from "../../modules/funding"
import type SupplierModuleService from "../../modules/supplier/service"
import type DigitalDeliveryModuleService from "../../modules/digital-delivery/service"
import type FundingModuleService from "../../modules/funding/service"

export type SupportTraceRow = {
  id: string
  stage: string
  label: string
  endpoint: string | null
  method: string | null
  request_json: unknown
  response_json: unknown
  status_code: number | null
  error_message: string | null
  created_at: string
}

export type SupportOrderTimeline = {
  id: string
  display_id: number | null
  created_at: string
  status: string
  email: string | null
  currency_code: string | null
  total: number | null
  customer_id: string | null
  storefront: {
    items: Array<{
      id: string
      title: string
      quantity: number
      unit_price: number | null
      variant_sku: string | null
    }>
    metadata: Record<string, unknown> | null
  }
  payment: {
    payments: Array<{
      id: string
      provider_id: string
      amount: number | null
      captured_at: string | null
      mp_payment_id: string | null
      mp_status: string | null
      mp_snapshot: Record<string, unknown> | null
      raw_data: Record<string, unknown> | null
    }>
  }
  emission: {
    deliveries: Array<{
      id: string
      line_item_id: string
      status: string
      fazer_order_id: string | null
      error_message: string | null
      delivered_at: string | null
      created_at: string
    }>
    funding_runs: Array<{
      id: string
      line_item_id: string
      status: string
      wholesale_usd: number
      fazer_payment_id: string | null
      fazer_order_id: string | null
      binance_transfer_id: string | null
      error_message: string | null
    }>
  }
  notifications: SupportTraceRow[]
  traces: SupportTraceRow[]
}

function toNumber(value: unknown): number | null {
  if (value == null) return null
  if (typeof value === "number" && Number.isFinite(value)) return value
  if (typeof value === "object" && value !== null && "value" in value) {
    const n = Number((value as { value: string }).value)
    return Number.isFinite(n) ? n : null
  }
  const n = Number(value)
  return Number.isFinite(n) ? n : null
}

function resolveOrderTotal(order: Record<string, unknown>): number | null {
  const summary = order.summary as Record<string, unknown> | undefined
  const totals = summary?.totals as Record<string, unknown> | undefined
  return (
    toNumber(totals?.current_order_total) ??
    toNumber(totals?.accounting_total) ??
    toNumber(order.total) ??
    null
  )
}

export async function buildCustomerTimeline(
  container: MedusaContainer,
  email: string
): Promise<{ email: string; orders: SupportOrderTimeline[] }> {
  const normalized = email.trim().toLowerCase()
  if (!normalized) {
    return { email: normalized, orders: [] }
  }

  const query = container.resolve(ContainerRegistrationKeys.QUERY)
  const supplier = container.resolve<SupplierModuleService>(SUPPLIER_MODULE)
  const dd = container.resolve<DigitalDeliveryModuleService>(DIGITAL_DELIVERY_MODULE)
  const funding = container.resolve<FundingModuleService>(FUNDING_MODULE)

  const { data: ordersRaw } = await query.graph({
    entity: "order",
    fields: [
      "id",
      "display_id",
      "created_at",
      "status",
      "email",
      "currency_code",
      "customer_id",
      "metadata",
      "summary.totals.*",
      "items.id",
      "items.title",
      "items.quantity",
      "items.unit_price",
      "items.variant.sku",
      "payment_collections.payments.id",
      "payment_collections.payments.provider_id",
      "payment_collections.payments.amount",
      "payment_collections.payments.captured_at",
      "payment_collections.payments.data",
    ],
    filters: { email: normalized },
    pagination: { take: 50, order: { created_at: "DESC" } },
  })

  const orders = (ordersRaw ?? []) as Record<string, unknown>[]
  const orderIds = orders.map((o) => String(o.id))

  const [tracesByEmail] = await supplier.listAndCountSupportTraces(
    { email: normalized },
    { take: 500, order: { created_at: "ASC" } }
  )

  const tracesByOrder: typeof tracesByEmail = []
  for (const oid of orderIds) {
    const [rows] = await supplier.listAndCountSupportTraces(
      { order_id: oid },
      { take: 200, order: { created_at: "ASC" } }
    )
    tracesByOrder.push(...rows)
  }

  const traceMap = new Map<string, SupportTraceRow[]>()
  const allTraces = [...tracesByEmail, ...tracesByOrder]
  const seenTrace = new Set<string>()
  for (const t of allTraces) {
    if (seenTrace.has(t.id)) continue
    seenTrace.add(t.id)
    const oid = t.order_id
    if (!oid) continue
    const row: SupportTraceRow = {
      id: t.id,
      stage: t.stage,
      label: t.label,
      endpoint: t.endpoint ?? null,
      method: t.method ?? null,
      request_json: t.request_json ?? null,
      response_json: t.response_json ?? null,
      status_code: t.status_code ?? null,
      error_message: t.error_message ?? null,
      created_at: String(t.created_at),
    }
    const list = traceMap.get(oid) ?? []
    list.push(row)
    traceMap.set(oid, list)
  }

  const timelines: SupportOrderTimeline[] = []

  for (const order of orders) {
    const orderId = String(order.id)
    const [deliveries] = await dd.listAndCountDigitalDeliveries(
      { order_id: orderId },
      { take: 20, order: { created_at: "ASC" } }
    )
    const [runs] = await funding.listAndCountFundingRuns(
      { order_id: orderId },
      { take: 20, order: { created_at: "ASC" } }
    )

    const items = ((order.items as Record<string, unknown>[]) ?? []).map((item) => ({
      id: String(item.id ?? ""),
      title: String(item.title ?? "—"),
      quantity: toNumber(item.quantity) ?? 1,
      unit_price: toNumber(item.unit_price),
      variant_sku:
        (item.variant as { sku?: string } | undefined)?.sku ?? null,
    }))

    const payments: SupportOrderTimeline["payment"]["payments"] = []
    const collections = (order.payment_collections as Record<string, unknown>[]) ?? []
    for (const col of collections) {
      for (const p of (col.payments as Record<string, unknown>[]) ?? []) {
        const data = (p.data as Record<string, unknown>) ?? {}
        payments.push({
          id: String(p.id ?? ""),
          provider_id: String(p.provider_id ?? ""),
          amount: toNumber(p.amount),
          captured_at: p.captured_at ? String(p.captured_at) : null,
          mp_payment_id: data.id != null ? String(data.id) : null,
          mp_status: data.mp_status ? String(data.mp_status) : data.status ? String(data.status) : null,
          mp_snapshot: data.mp_status ? (data as Record<string, unknown>) : null,
          raw_data: data,
        })
      }
    }

    const orderTraces = traceMap.get(orderId) ?? []
    const notifications = orderTraces.filter((t) => t.stage === "email")

    timelines.push({
      id: orderId,
      display_id: order.display_id != null ? Number(order.display_id) : null,
      created_at: String(order.created_at ?? ""),
      status: String(order.status ?? ""),
      email: order.email ? String(order.email) : null,
      currency_code: order.currency_code ? String(order.currency_code) : null,
      total: resolveOrderTotal(order),
      customer_id: order.customer_id ? String(order.customer_id) : null,
      storefront: {
        items,
        metadata: (order.metadata as Record<string, unknown>) ?? null,
      },
      payment: { payments },
      emission: {
        deliveries: deliveries.map((d) => ({
          id: d.id,
          line_item_id: d.line_item_id ?? "",
          status: d.status,
          fazer_order_id: d.fazer_order_id ?? null,
          error_message: d.error_message ?? null,
          delivered_at: d.delivered_at ? String(d.delivered_at) : null,
          created_at: String(d.created_at),
        })),
        funding_runs: runs.map((r) => ({
          id: r.id,
          line_item_id: r.line_item_id,
          status: r.status,
          wholesale_usd: r.wholesale_usd,
          fazer_payment_id: r.fazer_payment_id ?? null,
          fazer_order_id: r.fazer_order_id ?? null,
          binance_transfer_id: r.binance_transfer_id ?? null,
          error_message: r.error_message ?? null,
        })),
      },
      notifications,
      traces: orderTraces,
    })
  }

  return { email: normalized, orders: timelines }
}
