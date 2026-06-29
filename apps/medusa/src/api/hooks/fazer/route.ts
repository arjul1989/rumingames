import type { MedusaRequest, MedusaResponse } from "@medusajs/framework/http"
import { Modules } from "@medusajs/framework/utils"
import { DIGITAL_DELIVERY_MODULE } from "../../../modules/digital-delivery"
import type DigitalDeliveryModuleService from "../../../modules/digital-delivery/service"
import { parseFazerWebhookBody } from "../../../lib/fazer-webhook-payload"
import { webhookSecretRequired } from "../../../lib/webhook-auth"
import { verifyFazerSignature } from "../../../modules/fazer/lib/webhook-signature"
import { clientIp, rateLimit } from "../../../lib/rate-limit"

const DEDUPE_TTL_SECONDS = 60 * 60 * 24
const RECONCILE_TTL_SECONDS = 60 * 30

function fazerSignatureHeader(req: MedusaRequest): string | undefined {
  const configured = (
    process.env.FAZER_WEBHOOK_SIGNATURE_HEADER || "x-fazercards-signature"
  ).toLowerCase()
  const headers = req.headers
  return (
    (headers[configured] as string | undefined) ??
    (headers["x-fazercards-signature"] as string | undefined) ??
    (headers["x-fazer-signature"] as string | undefined)
  )
}

// Fazer Cards webhook (US-2.5 / RUM-20): updates digital_deliveries.status
// asynchronously. Verifies an HMAC signature, dedupes notifications and
// reconciles webhooks that arrive before the sync persisted the Fazer order id.
export async function POST(req: MedusaRequest, res: MedusaResponse) {
  const logger = req.scope.resolve("logger")

  if (!rateLimit(`fazer-webhook:${clientIp(req)}`, 120, 60_000).ok) {
    return res.status(429).json({ message: "Too many requests" })
  }

  const secret = process.env.FAZER_WEBHOOK_SECRET
  const secretCheck = webhookSecretRequired(secret, "Fazer")
  if (!secretCheck.ok) {
    logger.error("Fazer webhook: secret missing in production.")
    return res.status(secretCheck.status).json({ message: secretCheck.message })
  }

  const valid = verifyFazerSignature({
    rawBody: req.rawBody,
    signatureHeader: fazerSignatureHeader(req),
    secret: secret!,
  })
  if (!valid) {
    logger.warn("Fazer webhook: invalid signature, rejecting.")
    return res.status(401).json({ message: "Invalid signature" })
  }

  const body = (req.body ?? {}) as Record<string, unknown>
  const parsed = parseFazerWebhookBody(body)
  if (!parsed) {
    return res.status(400).json({ message: "Missing order id or unknown status" })
  }

  const { fazerOrderId, status, codes, error, notificationId } = parsed

  const cache = req.scope.resolve(Modules.CACHE)
  const dedupeKey = `fazer:webhook:${notificationId}`
  if (await cache.get(dedupeKey)) {
    return res.sendStatus(200)
  }
  await cache.set(dedupeKey, "1", DEDUPE_TTL_SECONDS)

  const delivery = req.scope.resolve<DigitalDeliveryModuleService>(DIGITAL_DELIVERY_MODULE)
  const rows = await delivery.listDigitalDeliveries({ fazer_order_id: fazerOrderId })

  if (!rows.length) {
    await cache.set(
      `fazer:reconcile:${fazerOrderId}`,
      JSON.stringify({
        status: body.type ?? body.status,
        codes,
        error,
      }),
      RECONCILE_TTL_SECONDS
    )
    logger.info(`Fazer webhook for ${fazerOrderId} stashed for reconciliation (no delivery yet).`)
    return res.sendStatus(202)
  }

  const code = codes[0]
  for (const row of rows) {
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
          error_message: error ?? "Fazer reportó un fallo en el pedido.",
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
