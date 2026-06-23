import type { MedusaRequest, MedusaResponse } from "@medusajs/framework/http"
import { Modules, PaymentWebhookEvents } from "@medusajs/framework/utils"
import { verifyMpSignature } from "../../../modules/payment-mercadopago/lib/signature"
import { clientIp, rateLimit } from "../../../lib/rate-limit"

// Provider id segment expected by Medusa's payment webhook pipeline. The module
// resolves it as `pp_${provider}` -> pp_mercadopago_mercadopago.
const PROVIDER = "mercadopago_mercadopago"
const DEDUPE_TTL_SECONDS = 60 * 60 * 24

// Mercado Pago webhook endpoint (US-3.3 / RUM-25). Verifies the signature,
// filters payment events, dedupes notifications, then hands the event to
// Medusa's payment pipeline (which fires payment.captured -> Fazer fulfillment).
export async function POST(req: MedusaRequest, res: MedusaResponse) {
  const logger = req.scope.resolve("logger")

  // Rate limit abusive bursts (US-10.1 / RUM-65).
  if (!rateLimit(`mp-webhook:${clientIp(req)}`, 120, 60_000).ok) {
    return res.status(429).json({ message: "Too many requests" })
  }

  const body = (req.body ?? {}) as {
    id?: number | string
    type?: string
    action?: string
    data?: { id?: string | number }
  }

  // MP sends data.id in the body and/or as a `data.id` query param.
  const queryDataId = (req.query?.["data.id"] ?? req.query?.id) as string | undefined
  const dataId = String(body?.data?.id ?? queryDataId ?? "")

  // 1) Authenticity: verify x-signature when a secret is configured.
  const secret = process.env.MP_WEBHOOK_SECRET
  if (secret && secret !== "local-dev-mp-webhook-secret") {
    const valid = verifyMpSignature({
      xSignature: req.headers["x-signature"] as string | undefined,
      xRequestId: req.headers["x-request-id"] as string | undefined,
      dataId,
      secret,
    })
    if (!valid) {
      logger.warn("Mercado Pago webhook: invalid signature, rejecting.")
      return res.status(401).json({ message: "Invalid signature" })
    }
  } else {
    logger.warn("Mercado Pago webhook: MP_WEBHOOK_SECRET not set; skipping signature check (dev).")
  }

  // 2) Only payment notifications are relevant here.
  const type = body.type ?? (req.query?.type as string | undefined)
  if (type && type !== "payment") {
    return res.sendStatus(200)
  }

  // 3) Idempotency: skip notifications we've already accepted.
  const notificationId = String(body.id ?? req.headers["x-request-id"] ?? dataId)
  const cache = req.scope.resolve(Modules.CACHE)
  const dedupeKey = `mp:webhook:${notificationId}`
  if (await cache.get(dedupeKey)) {
    logger.info(`Mercado Pago webhook ${notificationId} already processed; skipping.`)
    return res.sendStatus(200)
  }
  await cache.set(dedupeKey, "1", DEDUPE_TTL_SECONDS)

  // 4) Hand off to Medusa's payment pipeline. The provider's
  // getWebhookActionAndData fetches the payment, maps the status and resolves
  // the payment session; processPaymentWorkflow then captures and emits events.
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
    logger.error(`Mercado Pago webhook processing failed: ${(e as Error).message}`)
    return res.status(400).json({ message: "Webhook processing error" })
  }

  return res.sendStatus(200)
}
