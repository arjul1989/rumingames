import type { MedusaRequest, MedusaResponse } from "@medusajs/framework/http"
import { Modules } from "@medusajs/framework/utils"
import { DIGITAL_DELIVERY_MODULE } from "../../../modules/digital-delivery"
import type DigitalDeliveryModuleService from "../../../modules/digital-delivery/service"
import { verifyFazerSignature } from "../../../modules/fazer/lib/webhook-signature"
import { clientIp, rateLimit } from "../../../lib/rate-limit"

const DEDUPE_TTL_SECONDS = 60 * 60 * 24
const RECONCILE_TTL_SECONDS = 60 * 30

// Maps Fazer order status to our digital_delivery status.
function mapStatus(s: string): "delivered" | "failed" | "refunded" | "processing" | null {
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

// Fazer Cards webhook (US-2.5 / RUM-20): updates digital_deliveries.status
// asynchronously. Verifies an HMAC signature, dedupes notifications and
// reconciles webhooks that arrive before the sync persisted the Fazer order id.
export async function POST(req: MedusaRequest, res: MedusaResponse) {
  const logger = req.scope.resolve("logger")

  if (!rateLimit(`fazer-webhook:${clientIp(req)}`, 120, 60_000).ok) {
    return res.status(429).json({ message: "Too many requests" })
  }

  // 1) Authenticity: verify HMAC signature when a secret is configured.
  const secret = process.env.FAZER_WEBHOOK_SECRET
  const headerName =
    (process.env.FAZER_WEBHOOK_SIGNATURE_HEADER || "x-fazer-signature").toLowerCase()
  if (secret) {
    const valid = verifyFazerSignature({
      rawBody: req.rawBody,
      signatureHeader: req.headers[headerName] as string | undefined,
      secret,
    })
    if (!valid) {
      logger.warn("Fazer webhook: invalid signature, rejecting.")
      return res.status(401).json({ message: "Invalid signature" })
    }
  } else {
    logger.warn("Fazer webhook: FAZER_WEBHOOK_SECRET not set; skipping signature check (dev).")
  }

  const body = (req.body ?? {}) as {
    id?: string | number
    order_id?: string
    fazer_order_id?: string
    status?: string
    codes?: string[]
    code?: string
    error?: string
  }

  const fazerOrderId = String(body.fazer_order_id ?? body.order_id ?? "")
  const status = mapStatus(body.status ?? "")
  if (!fazerOrderId || !status) {
    return res.status(400).json({ message: "Missing order id or unknown status" })
  }

  // 2) Idempotency.
  const cache = req.scope.resolve(Modules.CACHE)
  const notificationId = String(body.id ?? `${fazerOrderId}:${body.status}`)
  const dedupeKey = `fazer:webhook:${notificationId}`
  if (await cache.get(dedupeKey)) {
    return res.sendStatus(200)
  }
  await cache.set(dedupeKey, "1", DEDUPE_TTL_SECONDS)

  // 3) Apply to the matching delivery rows.
  const delivery = req.scope.resolve<DigitalDeliveryModuleService>(DIGITAL_DELIVERY_MODULE)
  const rows = await delivery.listDigitalDeliveries({ fazer_order_id: fazerOrderId })

  if (!rows.length) {
    // Reconciliation: webhook arrived before the sync persisted the Fazer order
    // id. Stash the outcome so a later fulfillment pass can pick it up.
    await cache.set(
      `fazer:reconcile:${fazerOrderId}`,
      JSON.stringify({ status: body.status, codes: body.codes ?? (body.code ? [body.code] : []), error: body.error ?? null }),
      RECONCILE_TTL_SECONDS
    )
    logger.info(`Fazer webhook for ${fazerOrderId} stashed for reconciliation (no delivery yet).`)
    return res.sendStatus(202)
  }

  const code = body.codes?.[0] ?? body.code
  for (const row of rows) {
    // Idempotent: never downgrade an already-delivered row.
    if (row.status === "delivered") continue
    try {
      if (status === "delivered" && code) {
        await delivery.storeCode(row.id, code, fazerOrderId)
      } else if (status === "delivered") {
        await delivery.updateDigitalDeliveries({
          id: row.id,
          status: "delivered",
          delivered_at: new Date(),
          error_message: null,
        })
      } else if (status === "failed") {
        await delivery.updateDigitalDeliveries({
          id: row.id,
          status: "failed",
          error_message: body.error ?? "Fazer reportó un fallo en el pedido.",
        })
      } else {
        await delivery.updateDigitalDeliveries({ id: row.id, status })
      }
    } catch (e) {
      logger.error(`Fazer webhook update failed for delivery ${row.id}: ${(e as Error).message}`)
    }
  }

  logger.info(`Fazer webhook applied: order ${fazerOrderId} -> ${status} (${rows.length} rows).`)
  return res.sendStatus(200)
}
