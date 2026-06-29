import { MedusaContainer } from "@medusajs/framework"
import { ContainerRegistrationKeys } from "@medusajs/framework/utils"
import { emitMonitorAlert } from "./monitoring"
import { sendDigitalCodesEmail } from "./send-digital-codes-email"
import { sendEmail } from "./email/send-email"
import { logSupportTrace } from "./support/log-support-trace"
import { SUPPLIER_MODULE } from "../modules/supplier"
import { FAZER_MODULE } from "../modules/fazer"
import { DIGITAL_DELIVERY_MODULE } from "../modules/digital-delivery"
import type SupplierModuleService from "../modules/supplier/service"
import type DigitalDeliveryModuleService from "../modules/digital-delivery/service"
import type { FazerCreateOrderInput, FazerOrder } from "../modules/fazer/lib/types"

const MAX_ATTEMPTS = 3
const POLL_ATTEMPTS = 15
const POLL_DELAY_MS = 2000

const FAZER_IN_PROGRESS_STATUSES = new Set([
  "created",
  "pending",
  "processing",
])

export function isFazerOrderInProgress(status: string): boolean {
  return FAZER_IN_PROGRESS_STATUSES.has(status)
}

type LineItemLike = {
  quantity?: unknown
  raw_quantity?: { value?: string } | null
  detail?: {
    quantity?: unknown
    raw_quantity?: { value?: string } | null
  } | null
}

/** Medusa graph `items.quantity` can be unset; REST/store still exposes quantity on detail. */
export function resolveLineItemQuantity(item: LineItemLike): number {
  const candidates = [
    item.quantity,
    item.detail?.quantity,
    item.raw_quantity?.value,
    item.detail?.raw_quantity?.value,
  ]
  for (const value of candidates) {
    if (value == null) continue
    const n =
      typeof value === "object" && value !== null && "value" in value
        ? Number((value as { value: string }).value)
        : Number(value)
    if (Number.isFinite(n) && n > 0) return Math.floor(n)
  }
  return 1
}

// Minimal Fazer surface needed for fulfillment; lets tests inject a fake.
export interface FazerLike {
  createOrder(input: FazerCreateOrderInput): Promise<FazerOrder>
  getOrder(id: string): Promise<FazerOrder>
}

export interface FulfillOptions {
  orderId: string
  /** Inject a Fazer client for testing without network/key. */
  fazer?: FazerLike
  /** Inject sleep to avoid real delays in tests. */
  sleepImpl?: (ms: number) => Promise<void>
}

export interface FulfillResult {
  delivered: number
  failed: number
  skipped: number
}

const defaultSleep = (ms: number) => new Promise((r) => setTimeout(r, ms))

export function sortDeliveriesById<T extends { id: string }>(rows: T[]): T[] {
  return [...rows].sort((a, b) => a.id.localeCompare(b.id))
}

/** Persists one digital_delivery row per unit; skips units already delivered. */
export async function persistDeliveredCodesForLineItem(
  delivery: DigitalDeliveryModuleService,
  options: {
    orderId: string
    lineItemId: string
    itemTitle: string
    fazerOrderId: string
    codes: string[]
    expectedQuantity: number
    existingDeliveries?: Array<{ id: string; status: string }>
  }
): Promise<{ newCodes: Array<{ product: string; code: string }>; unitsDelivered: number }> {
  const { orderId, lineItemId, itemTitle, fazerOrderId, codes, expectedQuantity } =
    options
  const rows = sortDeliveriesById(options.existingDeliveries ?? [])

  if (codes.length < expectedQuantity) {
    throw new Error(
      `Expected ${expectedQuantity} code(s), received ${codes.length} from Fazer order ${fazerOrderId}.`
    )
  }

  const newCodes: Array<{ product: string; code: string }> = []
  let unitsDelivered = 0

  for (let unitIndex = 0; unitIndex < expectedQuantity; unitIndex++) {
    const code = codes[unitIndex]
    if (!code) {
      throw new Error(
        `Missing code at index ${unitIndex} for Fazer order ${fazerOrderId}.`
      )
    }

    let row = rows[unitIndex]
    if (row?.status === "delivered") {
      continue
    }

    if (!row) {
      const created = await delivery.createDigitalDeliveries([
        { order_id: orderId, line_item_id: lineItemId, status: "processing" },
      ])
      row = created[0]
      rows[unitIndex] = row
    } else {
      await delivery.updateDigitalDeliveries({ id: row.id, status: "processing" })
    }

    await delivery.storeCode(row.id, code, fazerOrderId)
    newCodes.push({ product: itemTitle, code })
    unitsDelivered++
  }

  return { newCodes, unitsDelivered }
}

export function countDeliveredUnits(
  deliveries: Array<{ status: string }>,
  expectedQuantity: number
): boolean {
  return deliveries.filter((d) => d.status === "delivered").length >= expectedQuantity
}

// Fulfills the digital line items of a paid order against Fazer Cards
// (US-2.4 / RUM-19): one Fazer order per line item with a stable idempotency
// key, encrypted code storage, customer email, and admin alert on failure.
export async function fulfillDigitalOrder(
  container: MedusaContainer,
  options: FulfillOptions
): Promise<FulfillResult> {
  const { orderId } = options
  const logger = container.resolve("logger")
  const query = container.resolve(ContainerRegistrationKeys.QUERY)
  const supplier = container.resolve<SupplierModuleService>(SUPPLIER_MODULE)
  const delivery = container.resolve<DigitalDeliveryModuleService>(DIGITAL_DELIVERY_MODULE)
  const sleep = options.sleepImpl ?? defaultSleep

  const fazer: FazerLike =
    options.fazer ?? (container.resolve(FAZER_MODULE) as unknown as FazerLike)

  const { data: orders } = await query.graph({
    entity: "order",
    fields: [
      "id",
      "email",
      "display_id",
      "items.id",
      "items.quantity",
      "items.raw_quantity",
      "items.detail.quantity",
      "items.detail.raw_quantity",
      "items.variant_id",
      "items.title",
      "items.metadata",
    ],
    filters: { id: orderId },
  })
  const order = orders[0]
  if (!order) {
    logger.warn(`fulfillDigitalOrder: order ${orderId} not found.`)
    return { delivered: 0, failed: 0, skipped: 0 }
  }

  const items = (order.items ?? []) as Array<{
    id: string
    quantity?: unknown
    raw_quantity?: { value?: string } | null
    detail?: {
      quantity?: unknown
      raw_quantity?: { value?: string } | null
    } | null
    variant_id: string | null
    title: string
    metadata?: Record<string, unknown> | null
  }>

  const variantIds = items.map((i) => i.variant_id).filter(Boolean) as string[]
  const mappings = variantIds.length
    ? await supplier.listSupplierProductMappings({ medusa_variant_id: variantIds })
    : []
  const mappingByVariant = new Map(mappings.map((m) => [m.medusa_variant_id, m]))

  let delivered = 0
  let failed = 0
  let skipped = 0
  const codesToEmail: Array<{ product: string; code: string }> = []

  for (const item of items) {
    const mapping = item.variant_id ? mappingByVariant.get(item.variant_id) : undefined
    if (!mapping) {
      // Non-digital / unmapped line item; nothing to fulfill.
      continue
    }

    const qty = resolveLineItemQuantity(item)
    const existingDeliveries = sortDeliveriesById(
      await delivery.listDigitalDeliveries({
        order_id: orderId,
        line_item_id: item.id,
      })
    )

    if (countDeliveredUnits(existingDeliveries, qty)) {
      skipped++
      continue
    }

    const idempotencyKey = `${orderId}:${item.id}`
    const externalId = (item.metadata?.player_id ?? item.metadata?.external_id) as
      | string
      | undefined

    let lastError = ""
    let success = false

    for (let attempt = 1; attempt <= MAX_ATTEMPTS && !success; attempt++) {
      try {
        let fazerOrder = await fazer.createOrder({
          sku_id: mapping.fazer_sku_id,
          quantity: qty,
          idempotency_key: idempotencyKey,
          external_id: externalId,
        })
        await logSupportTrace(container, {
          email: order.email ?? null,
          order_id: orderId,
          stage: "fazer_order",
          label: "Crear orden Fazer",
          endpoint: "POST /giftcards/order | /topups/order",
          method: "POST",
          request: {
            sku_id: mapping.fazer_sku_id,
            quantity: qty,
            idempotency_key: idempotencyKey,
          },
          response: fazerOrder,
        })

        // Poll until the supplier finishes provisioning the code.
        let polls = 0
        while (isFazerOrderInProgress(fazerOrder.status) && polls < POLL_ATTEMPTS) {
          await sleep(POLL_DELAY_MS)
          fazerOrder = await fazer.getOrder(fazerOrder.id)
          polls++
        }
        await logSupportTrace(container, {
          email: order.email ?? null,
          order_id: orderId,
          stage: "fazer_order",
          label: `Poll orden Fazer (${polls} intentos)`,
          endpoint: `GET /orders/${fazerOrder.id}`,
          method: "GET",
          response: fazerOrder,
        })

        if (fazerOrder.status !== "completed") {
          throw new Error(
            `Fazer order ${fazerOrder.id} ended in status ${fazerOrder.status}` +
              (fazerOrder.error ? `: ${fazerOrder.error}` : "")
          )
        }

        const codes = fazerOrder.codes ?? []
        if (!codes.length) {
          throw new Error(`Fazer order ${fazerOrder.id} completed without codes.`)
        }

        const { newCodes, unitsDelivered } = await persistDeliveredCodesForLineItem(
          delivery,
          {
            orderId,
            lineItemId: item.id,
            itemTitle: item.title,
            fazerOrderId: fazerOrder.id,
            codes,
            expectedQuantity: qty,
            existingDeliveries,
          }
        )

        codesToEmail.push(...newCodes)
        delivered += unitsDelivered
        success = true
      } catch (e) {
        lastError = (e as Error).message
        logger.warn(
          `Fulfillment attempt ${attempt}/${MAX_ATTEMPTS} failed for ${idempotencyKey}: ${lastError}`
        )
      }
    }

    if (!success) {
      failed++
      const failedRow = existingDeliveries.find((row) => row.status !== "delivered")
      if (failedRow) {
        await delivery.updateDigitalDeliveries({
          id: failedRow.id,
          status: "failed",
          error_message: lastError,
        })
      }
      await alertAdmin(
        container,
        order.display_id ?? undefined,
        item.title,
        lastError,
        orderId
      )
    }
  }

  if (codesToEmail.length > 0 && order.email) {
    await sendDigitalCodesEmail(container, {
      to: order.email,
      display_id: order.display_id ?? orderId,
      order_id: orderId,
      codes: codesToEmail,
    })
  }

  logger.info(
    `Fulfillment for order ${orderId}: ${delivered} delivered, ${failed} failed, ${skipped} skipped.`
  )
  return { delivered, failed, skipped }
}

async function alertAdmin(
  container: MedusaContainer,
  displayId: number | string | undefined,
  productTitle: string,
  error: string,
  orderId: string
) {
  await emitMonitorAlert(container, {
    event_type: "fulfillment.failed",
    severity: "ERROR",
    message: `Fulfillment falló para orden #${displayId ?? orderId}: ${productTitle}`,
    context: { order_id: orderId, display_id: displayId, product: productTitle, error },
  })

  const to = process.env.ADMIN_ALERT_EMAIL || "admin@gorumin.com"
  await sendEmail(container, {
    to,
    template: "fulfillment-failed",
    data: {
      subject: `[rumin] Fallo de fulfillment en orden #${displayId ?? ""}`,
      message: `No se pudo entregar "${productTitle}" tras ${MAX_ATTEMPTS} intentos.`,
      details: `Orden: ${orderId}\nError: ${error}`,
    },
  })
}
