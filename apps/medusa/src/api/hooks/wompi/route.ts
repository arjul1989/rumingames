import type { MedusaRequest, MedusaResponse } from "@medusajs/framework/http"
import { Modules, PaymentWebhookEvents } from "@medusajs/framework/utils"
import { verifyWompiEventChecksum } from "../../../modules/payment-wompi/lib/integrity"
import { clientIp, rateLimit } from "../../../lib/rate-limit"
import { webhookSecretRequired } from "../../../lib/webhook-auth"
import { emitMonitorAlert } from "../../../lib/monitoring"
import { logSupportTrace } from "../../../lib/support/log-support-trace"

const PROVIDER = "wompi_wompi"
const DEDUPE_TTL_SECONDS = 60 * 60 * 24

export async function POST(req: MedusaRequest, res: MedusaResponse) {
  const logger = req.scope.resolve("logger")

  if (!rateLimit(`wompi-webhook:${clientIp(req)}`, 120, 60_000).ok) {
    return res.status(429).json({ message: "Too many requests" })
  }

  const body = (req.body ?? {}) as {
    event?: string
    data?: Record<string, unknown>
    environment?: string
    signature?: { properties?: string[]; checksum?: string }
    timestamp?: number
    sent_at?: string
  }

  const secret = process.env.WOMPI_EVENTS_SECRET
  const secretCheck = webhookSecretRequired(secret, "Wompi")
  if (!secretCheck.ok) {
    logger.error("Wompi webhook: secret missing in production.")
    return res.status(secretCheck.status).json({ message: secretCheck.message })
  }

  const checksum =
    (req.headers["x-event-checksum"] as string | undefined) ??
    body.signature?.checksum

  if (secret && checksum && body.signature?.properties && body.timestamp != null) {
    const valid = verifyWompiEventChecksum({
      properties: body.signature.properties,
      data: body.data ?? {},
      timestamp: body.timestamp,
      checksum,
      eventsSecret: secret,
    })
    if (!valid) {
      logger.warn("Wompi webhook: invalid checksum, rejecting.")
      await emitMonitorAlert(req.scope, {
        event_type: "payment.webhook.error",
        severity: "WARNING",
        message: "Webhook Wompi rechazado: checksum inválido",
        context: { event: body.event },
      })
      return res.status(401).json({ message: "Invalid signature" })
    }
  } else if (secret) {
    logger.warn("Wompi webhook: missing checksum fields; rejecting.")
    return res.status(401).json({ message: "Invalid signature" })
  } else if (process.env.NODE_ENV !== "production") {
    logger.warn("Wompi webhook: WOMPI_EVENTS_SECRET not set; skipping verification (dev).")
  }

  if (body.event !== "transaction.updated") {
    return res.sendStatus(200)
  }

  const tx = (body.data?.transaction ?? {}) as { id?: string; reference?: string }
  const notificationId = String(tx.id ?? body.sent_at ?? Date.now())
  const cache = req.scope.resolve(Modules.CACHE)
  const dedupeKey = `wompi:webhook:${notificationId}`
  if (await cache.get(dedupeKey)) {
    logger.info(`Wompi webhook ${notificationId} already processed; skipping.`)
    return res.sendStatus(200)
  }
  await cache.set(dedupeKey, "1", DEDUPE_TTL_SECONDS)

  await logSupportTrace(req.scope, {
    stage: "webhook_mp",
    label: `Webhook Wompi ${body.event}`,
    endpoint: "/hooks/wompi",
    method: "POST",
    request: {
      event: body.event,
      transaction_id: tx.id,
      reference: tx.reference,
    },
    response: { accepted: true },
  })

  try {
    const eventBus = req.scope.resolve(Modules.EVENT_BUS)
    await eventBus.emit({
      name: PaymentWebhookEvents.WebhookReceived,
      data: {
        provider: PROVIDER,
        payload: { data: req.body, rawData: req.rawBody, headers: req.headers },
      },
    })
  } catch (e) {
    logger.error(`Wompi webhook processing failed: ${(e as Error).message}`)
    await emitMonitorAlert(req.scope, {
      event_type: "payment.webhook.error",
      severity: "ERROR",
      message: `Error procesando webhook Wompi: ${(e as Error).message}`,
      context: { transaction_id: tx.id },
    })
    return res.status(400).json({ message: "Webhook processing error" })
  }

  return res.sendStatus(200)
}
