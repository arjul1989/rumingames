import { MedusaContainer } from "@medusajs/framework"
import { ContainerRegistrationKeys } from "@medusajs/framework/utils"
import { emitMonitorAlert } from "../monitoring"
import { sendDigitalCodesEmail } from "../send-digital-codes-email"
import { sendEmail } from "../email/send-email"
import { fulfillDigitalOrder, type FazerLike, isFazerOrderInProgress, resolveLineItemQuantity, persistDeliveredCodesForLineItem, countDeliveredUnits, sortDeliveriesById } from "../fulfill-digital-order"
import { SUPPLIER_MODULE } from "../../modules/supplier"
import { FAZER_MODULE } from "../../modules/fazer"
import { DIGITAL_DELIVERY_MODULE } from "../../modules/digital-delivery"
import { FUNDING_MODULE } from "../../modules/funding"
import type SupplierModuleService from "../../modules/supplier/service"
import type DigitalDeliveryModuleService from "../../modules/digital-delivery/service"
import type FundingModuleService from "../../modules/funding/service"
import type { FazerPayment } from "../../modules/fazer/lib/types"
import {
  BinanceFundingError,
  isFazerPaymentConfirmed,
  sendFazerFundingPayment,
} from "./binance-client"
import { getFundingConfig } from "./funding-config"

const MAX_ORDER_ATTEMPTS = 3
const POLL_ATTEMPTS = 5
const POLL_DELAY_MS = 1500

export interface FundAndFulfillOptions {
  orderId: string
  fazer?: FazerLike & {
    createPayment?(input: {
      method: string
      amount_usd: number
      idempotency_key: string
    }): Promise<FazerPayment>
    getPayment?(id: string): Promise<FazerPayment>
  }
  sleepImpl?: (ms: number) => Promise<void>
}

export interface FundAndFulfillResult {
  funded: number
  delivered: number
  failed: number
  skipped: number
}

const defaultSleep = (ms: number) => new Promise((r) => setTimeout(r, ms))

type FundingRunStatus =
  | "pending"
  | "fazer_payment_created"
  | "binance_sent"
  | "fazer_payment_confirmed"
  | "fazer_order_placed"
  | "completed"
  | "failed"

/**
 * Per-transaction funding pipeline (US-13.1): Fazer payment → Binance → Fazer order → delivery.
 */
export async function fundAndFulfillDigitalOrder(
  container: MedusaContainer,
  options: FundAndFulfillOptions
): Promise<FundAndFulfillResult> {
  const config = getFundingConfig()
  if (!config.enabled) {
    const legacy = await fulfillDigitalOrder(container, options)
    return {
      funded: 0,
      delivered: legacy.delivered,
      failed: legacy.failed,
      skipped: legacy.skipped,
    }
  }

  const { orderId } = options
  const logger = container.resolve("logger")
  const query = container.resolve(ContainerRegistrationKeys.QUERY)
  const supplier = container.resolve<SupplierModuleService>(SUPPLIER_MODULE)
  const delivery = container.resolve<DigitalDeliveryModuleService>(DIGITAL_DELIVERY_MODULE)
  const funding = container.resolve<FundingModuleService>(FUNDING_MODULE)
  const sleep = options.sleepImpl ?? defaultSleep

  const fazer =
    options.fazer ??
    (container.resolve(FAZER_MODULE) as FundAndFulfillOptions["fazer"])

  if (!fazer?.createPayment || !fazer?.getPayment) {
    logger.error("Fazer client missing payment methods; falling back to legacy fulfillment.")
    const legacy = await fulfillDigitalOrder(container, options)
    return {
      funded: 0,
      delivered: legacy.delivered,
      failed: legacy.failed,
      skipped: legacy.skipped,
    }
  }

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
    logger.warn(`fundAndFulfillDigitalOrder: order ${orderId} not found.`)
    return { funded: 0, delivered: 0, failed: 0, skipped: 0 }
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

  let funded = 0
  let delivered = 0
  let failed = 0
  let skipped = 0
  const codesToEmail: Array<{ product: string; code: string }> = []

  for (const item of items) {
    const mapping = item.variant_id ? mappingByVariant.get(item.variant_id) : undefined
    if (!mapping) continue

    const idempotencyKey = `fund:${orderId}:${item.id}`
    const existingRuns = await funding.listFundingRuns({ idempotency_key: idempotencyKey })
    let run = existingRuns[0]

    const wholesaleUsd = mapping.last_synced_price_usd
    if (wholesaleUsd == null || wholesaleUsd <= 0) {
      failed++
      await markFundingFailed(container, {
        orderId,
        item,
        mapping,
        idempotencyKey,
        run,
        error: "Precio mayorista Fazer no disponible para esta línea.",
        funding,
        delivery,
      })
      continue
    }

    const qty = resolveLineItemQuantity(item)
    const wholesaleTotalUsd = wholesaleUsd * qty

    if (wholesaleTotalUsd > config.maxUsdPerOrder) {
      failed++
      await markFundingFailed(container, {
        orderId,
        item,
        mapping,
        idempotencyKey,
        run,
        error: `Monto mayorista $${wholesaleTotalUsd} (${qty}×$${wholesaleUsd}) excede FUNDING_MAX_USD_PER_ORDER.`,
        funding,
        delivery,
      })
      continue
    }

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

    let deliveryRow = existingDeliveries[0]
    if (!deliveryRow) {
      const created = await delivery.createDigitalDeliveries([
        { order_id: orderId, line_item_id: item.id, status: "processing" },
      ])
      deliveryRow = created[0]
    } else if (deliveryRow.status !== "delivered") {
      await delivery.updateDigitalDeliveries({ id: deliveryRow.id, status: "processing" })
    }

    if (!run) {
      const created = await funding.createFundingRuns([
        {
          order_id: orderId,
          line_item_id: item.id,
          digital_delivery_id: deliveryRow.id,
          fazer_sku_id: mapping.fazer_sku_id,
          wholesale_usd: wholesaleTotalUsd,
          idempotency_key: idempotencyKey,
          fazer_payment_method: config.paymentMethod,
          status: "pending" as FundingRunStatus,
        },
      ])
      run = created[0]
    }

    try {
      if (run.status === "pending" || run.status === "failed") {
        const payment = await fazer.createPayment!({
          method: config.paymentMethod,
          amount_usd: wholesaleTotalUsd,
          idempotency_key: idempotencyKey,
        })

        await funding.updateFundingRuns({
          id: run.id,
          status: "fazer_payment_created",
          fazer_payment_id: payment.id,
          fazer_pay_to: payment.pay_to ?? null,
          fazer_pay_url: payment.pay_url ?? null,
          error_message: null,
        })
        run = { ...run, status: "fazer_payment_created", fazer_payment_id: payment.id }

        const binanceResult = await sendFazerFundingPayment({
          fazerPaymentId: payment.id,
          amountUsd: wholesaleTotalUsd,
          method: config.paymentMethod,
          payTo: payment.pay_to,
          payUrl: payment.pay_url,
          idempotencyKey,
        })

        await funding.updateFundingRuns({
          id: run.id,
          status: "binance_sent",
          binance_transfer_id: binanceResult.transferId,
        })
        run = { ...run, status: "binance_sent" }
        funded++

        let confirmed = isFazerPaymentConfirmed(payment.status)
        let polls = 0
        while (!confirmed && polls < config.paymentPollAttempts) {
          await sleep(config.paymentPollDelayMs)
          const latest = await fazer.getPayment!(payment.id)
          confirmed = isFazerPaymentConfirmed(latest.status)
          polls++
        }

        if (!confirmed) {
          throw new Error(
            `Fondeo Fazer ${payment.id} no confirmado tras ${polls} intentos.`
          )
        }

        await funding.updateFundingRuns({
          id: run.id,
          status: "fazer_payment_confirmed",
        })
        run = { ...run, status: "fazer_payment_confirmed" }
      }

      const externalId = (item.metadata?.player_id ?? item.metadata?.external_id) as
        | string
        | undefined
      const orderIdempotency = `${orderId}:${item.id}`
      let lastError = ""
      let success = false

      for (let attempt = 1; attempt <= MAX_ORDER_ATTEMPTS && !success; attempt++) {
        try {
          let fazerOrder = await fazer.createOrder({
            sku_id: mapping.fazer_sku_id,
            quantity: qty,
            idempotency_key: orderIdempotency,
            external_id: externalId,
          })

          await funding.updateFundingRuns({
            id: run.id,
            status: "fazer_order_placed",
            fazer_order_id: fazerOrder.id,
          })

          let orderPolls = 0
          while (isFazerOrderInProgress(fazerOrder.status) && orderPolls < POLL_ATTEMPTS) {
            await sleep(POLL_DELAY_MS)
            fazerOrder = await fazer.getOrder(fazerOrder.id)
            orderPolls++
          }

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

          await funding.updateFundingRuns({
            id: run.id,
            status: "completed",
            completed_at: new Date(),
            error_message: null,
          })

          delivered += unitsDelivered
          success = true
        } catch (e) {
          lastError = (e as Error).message
          logger.warn(
            `Fazer order attempt ${attempt}/${MAX_ORDER_ATTEMPTS} failed for ${orderIdempotency}: ${lastError}`
          )
        }
      }

      if (!success) {
        throw new Error(lastError || "No se pudo emitir el código en Fazer.")
      }
    } catch (e) {
      failed++
      const message =
        e instanceof BinanceFundingError || e instanceof Error
          ? e.message
          : "Error desconocido en fondeo."

      await funding.updateFundingRuns({
        id: run.id,
        status: "failed",
        error_message: message,
      })
      await delivery.updateDigitalDeliveries({
        id: deliveryRow.id,
        status: "failed",
        error_message: message,
      })
      await alertFundingFailed(
        container,
        order.display_id ?? undefined,
        item.title,
        message,
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
    `Fund+fulfill for order ${orderId}: ${funded} funded, ${delivered} delivered, ${failed} failed, ${skipped} skipped.`
  )

  return { funded, delivered, failed, skipped }
}

async function markFundingFailed(
  container: MedusaContainer,
  ctx: {
    orderId: string
    item: { id: string; title: string }
    mapping: { fazer_sku_id: string }
    idempotencyKey: string
    run?: { id: string }
    error: string
    funding: FundingModuleService
    delivery: DigitalDeliveryModuleService
  }
) {
  if (ctx.run) {
    await ctx.funding.updateFundingRuns({
      id: ctx.run.id,
      status: "failed",
      error_message: ctx.error,
    })
  } else {
    await ctx.funding.createFundingRuns([
      {
        order_id: ctx.orderId,
        line_item_id: ctx.item.id,
        fazer_sku_id: ctx.mapping.fazer_sku_id,
        wholesale_usd: 0,
        idempotency_key: ctx.idempotencyKey,
        status: "failed",
        error_message: ctx.error,
      },
    ])
  }

  const deliveries = await ctx.delivery.listDigitalDeliveries({
    order_id: ctx.orderId,
    line_item_id: ctx.item.id,
  })
  if (deliveries[0]) {
    await ctx.delivery.updateDigitalDeliveries({
      id: deliveries[0].id,
      status: "failed",
      error_message: ctx.error,
    })
  }

  await alertFundingFailed(container, undefined, ctx.item.title, ctx.error, ctx.orderId)
}

async function alertFundingFailed(
  container: MedusaContainer,
  displayId: number | string | undefined,
  productTitle: string,
  error: string,
  orderId: string
) {
  await emitMonitorAlert(container, {
    event_type: "funding.failed",
    severity: "ERROR",
    message: `Fondeo falló para orden #${displayId ?? orderId}: ${productTitle}`,
    context: { order_id: orderId, display_id: displayId, product: productTitle, error },
  })

  const to = process.env.ADMIN_ALERT_EMAIL || "admin@gorumin.com"
  await sendEmail(container, {
    to,
    template: "fulfillment-failed",
    data: {
      subject: `[rumin] Fallo de fondeo en orden #${displayId ?? ""}`,
      message: `No se pudo fondear/entregar "${productTitle}".`,
      details: `Orden: ${orderId}\nError: ${error}`,
    },
  })
}
