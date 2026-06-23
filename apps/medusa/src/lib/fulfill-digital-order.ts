import { MedusaContainer } from "@medusajs/framework"
import { ContainerRegistrationKeys, Modules } from "@medusajs/framework/utils"
import { emitMonitorAlert } from "./monitoring"
import { SUPPLIER_MODULE } from "../modules/supplier"
import { FAZER_MODULE } from "../modules/fazer"
import { DIGITAL_DELIVERY_MODULE } from "../modules/digital-delivery"
import type SupplierModuleService from "../modules/supplier/service"
import type DigitalDeliveryModuleService from "../modules/digital-delivery/service"
import type { FazerCreateOrderInput, FazerOrder } from "../modules/fazer/lib/types"

const MAX_ATTEMPTS = 3
const POLL_ATTEMPTS = 5
const POLL_DELAY_MS = 1500

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
  const notification = container.resolve(Modules.NOTIFICATION)
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
    quantity: number
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

  for (const item of items) {
    const mapping = item.variant_id ? mappingByVariant.get(item.variant_id) : undefined
    if (!mapping) {
      // Non-digital / unmapped line item; nothing to fulfill.
      continue
    }

    // Idempotency: reuse the existing delivery row for this line item.
    const existing = await delivery.listDigitalDeliveries({
      order_id: orderId,
      line_item_id: item.id,
    })
    let row = existing[0]
    if (row?.status === "delivered") {
      skipped++
      continue
    }
    if (!row) {
      const created = await delivery.createDigitalDeliveries([
        { order_id: orderId, line_item_id: item.id, status: "processing" },
      ])
      row = created[0]
    } else {
      await delivery.updateDigitalDeliveries({ id: row.id, status: "processing" })
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
          quantity: item.quantity,
          idempotency_key: idempotencyKey,
          external_id: externalId,
        })

        // Poll until the supplier finishes provisioning the code.
        let polls = 0
        while (
          (fazerOrder.status === "pending" || fazerOrder.status === "processing") &&
          polls < POLL_ATTEMPTS
        ) {
          await sleep(POLL_DELAY_MS)
          fazerOrder = await fazer.getOrder(fazerOrder.id)
          polls++
        }

        if (fazerOrder.status !== "completed") {
          throw new Error(
            `Fazer order ${fazerOrder.id} ended in status ${fazerOrder.status}` +
              (fazerOrder.error ? `: ${fazerOrder.error}` : "")
          )
        }

        const code = fazerOrder.codes?.[0]
        if (!code) {
          throw new Error(`Fazer order ${fazerOrder.id} completed without a code.`)
        }

        await delivery.storeCode(row.id, code, fazerOrder.id)
        await sendCustomerCode(
          notification,
          order.email ?? "",
          item.title,
          order.display_id ?? undefined
        )
        delivered++
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
      await delivery.updateDigitalDeliveries({
        id: row.id,
        status: "failed",
        error_message: lastError,
      })
      await alertAdmin(
        container,
        notification,
        order.display_id ?? undefined,
        item.title,
        lastError,
        orderId
      )
    }
  }

  logger.info(
    `Fulfillment for order ${orderId}: ${delivered} delivered, ${failed} failed, ${skipped} skipped.`
  )
  return { delivered, failed, skipped }
}

async function sendCustomerCode(
  notification: { createNotifications: (n: unknown) => Promise<unknown> },
  to: string,
  productTitle: string,
  displayId?: number | string
) {
  if (!to) return
  await notification.createNotifications({
    to,
    channel: "email",
    template: "digital-code-delivered",
    content: {
      subject: `Tu código de ${productTitle} está listo`,
      text:
        `¡Gracias por tu compra! Tu código de "${productTitle}" ` +
        `(orden #${displayId ?? ""}) ya está disponible en "Mis órdenes".`,
    } as unknown as Record<string, unknown>,
    data: { product: productTitle, display_id: displayId ?? "" },
  })
}

async function alertAdmin(
  container: MedusaContainer,
  notification: { createNotifications: (n: unknown) => Promise<unknown> },
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
  await notification.createNotifications({
    to,
    channel: "email",
    template: "fulfillment-failed",
    content: {
      subject: `[Gorumin] Fallo de fulfillment en orden #${displayId ?? ""}`,
      text: `No se pudo entregar "${productTitle}" tras ${MAX_ATTEMPTS} intentos. Error: ${error}`,
    } as unknown as Record<string, unknown>,
    data: { display_id: displayId ?? "", product: productTitle, error },
  })
}
