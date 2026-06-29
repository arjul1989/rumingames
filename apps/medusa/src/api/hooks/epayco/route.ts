import type { MedusaRequest, MedusaResponse } from "@medusajs/framework/http"
import { Modules, PaymentWebhookEvents } from "@medusajs/framework/utils"
import { clientIp, rateLimit } from "../../../lib/rate-limit"
import { webhookSecretRequired } from "../../../lib/webhook-auth"
import { emitMonitorAlert } from "../../../lib/monitoring"
import { logSupportTrace } from "../../../lib/support/log-support-trace"

const PROVIDER = "epayco_epayco"
const DEDUPE_TTL_SECONDS = 60 * 60 * 24

export async function POST(req: MedusaRequest, res: MedusaResponse) {
  const logger = req.scope.resolve("logger")

  if (!rateLimit(`epayco-webhook:${clientIp(req)}`, 120, 60_000).ok) {
    return res.status(429).json({ message: "Too many requests" })
  }

  const body = (req.body ?? {}) as Record<string, unknown>
  const refPayco = String(body.ref_payco ?? body.x_ref_payco ?? body.x_id_invoice ?? "")
  const signature = String(body.x_signature ?? body.signature ?? "")

  const secret = process.env.EPAYCO_CONFIRMATION_SECRET
  const secretCheck = webhookSecretRequired(secret, "ePayco")
  if (!secretCheck.ok) {
    logger.error("ePayco webhook: secret missing in production.")
    return res.status(secretCheck.status).json({ message: secretCheck.message })
  }

  if (secret && signature) {
    const expected = [
      process.env.EPAYCO_PUBLIC_KEY,
      body.x_cust_id_cliente,
      body.x_ref_payco,
      body.x_transaction_id,
      body.x_amount,
      body.x_currency_code,
    ]
      .map((v) => String(v ?? ""))
      .join("^")
      .concat(`^${secret}`)

    const crypto = await import("crypto")
    const hash = crypto.createHash("md5").update(expected).digest("hex")
    if (hash.toLowerCase() !== signature.toLowerCase()) {
      logger.warn("ePayco webhook: invalid signature, rejecting.")
      return res.status(401).json({ message: "Invalid signature" })
    }
  } else if (secret) {
    logger.warn("ePayco webhook: missing signature; rejecting.")
    return res.status(401).json({ message: "Invalid signature" })
  } else if (process.env.NODE_ENV !== "production") {
    logger.warn("ePayco webhook: EPAYCO_CONFIRMATION_SECRET not set; skipping verification (dev).")
  }

  if (!refPayco) {
    return res.sendStatus(200)
  }

  const cache = req.scope.resolve(Modules.CACHE)
  const dedupeKey = `epayco:webhook:${refPayco}:${body.x_transaction_id ?? ""}`
  if (await cache.get(dedupeKey)) {
    logger.info(`ePayco webhook ${refPayco} already processed; skipping.`)
    return res.sendStatus(200)
  }
  await cache.set(dedupeKey, "1", DEDUPE_TTL_SECONDS)

  await logSupportTrace(req.scope, {
    stage: "webhook_mp",
    label: "Webhook ePayco confirmación",
    endpoint: "/hooks/epayco",
    method: "POST",
    request: {
      ref_payco: refPayco,
      estado: body.x_response ?? body.x_cod_response,
      factura: body.x_id_invoice ?? body.x_invoice_id,
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
    logger.error(`ePayco webhook processing failed: ${(e as Error).message}`)
    await emitMonitorAlert(req.scope, {
      event_type: "payment.webhook.error",
      severity: "ERROR",
      message: `Error procesando webhook ePayco: ${(e as Error).message}`,
      context: { ref_payco: refPayco },
    })
    return res.status(400).json({ message: "Webhook processing error" })
  }

  return res.sendStatus(200)
}
