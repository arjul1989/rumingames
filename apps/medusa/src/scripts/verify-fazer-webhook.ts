import type { ExecArgs } from "@medusajs/framework/types"
import { ContainerRegistrationKeys } from "@medusajs/framework/utils"
import { resolveFazerWebhookSecret } from "../lib/fazer-webhook-secret"
import {
  signFazerWebhookBody,
  verifyFazerSignature,
} from "../modules/fazer/lib/webhook-signature"

type CliArgs = {
  url?: string
  orderId?: string
  type?: string
  code?: string
}

function parseArgs(): CliArgs {
  const args: CliArgs = {}
  for (const raw of process.argv.slice(2)) {
    const [key, value] = raw.split("=")
    if (!value) continue
    switch (key) {
      case "--url":
        args.url = value
        break
      case "--order-id":
        args.orderId = value
        break
      case "--type":
        args.type = value
        break
      case "--code":
        args.code = value
        break
    }
  }
  return args
}

/**
 * Signs a sample Fazer webhook and POSTs it to Medusa.
 *
 * Local:
 *   set -a && source ../../infra/gcp/.env.sandbox && set +a
 *   npx medusa exec ./src/scripts/verify-fazer-webhook.ts
 *
 * Sandbox (default URL):
 *   npx medusa exec ./src/scripts/verify-fazer-webhook.ts -- --url=https://api.sbx.gorumin.com/hooks/fazer
 */
export default async function verifyFazerWebhook({ container }: ExecArgs) {
  const logger = container.resolve(ContainerRegistrationKeys.LOGGER)
  const secret = resolveFazerWebhookSecret()

  if (!secret) {
    throw new Error(
      "Set FAZER_WEBHOOK_SIGNATURE_SECRET (or FAZER_WEBHOOK_SECRET) in the environment."
    )
  }

  const cli = parseArgs()
  const target =
    cli.url ??
    `${(process.env.MEDUSA_BACKEND_URL ?? "http://localhost:9000").replace(/\/$/, "")}/hooks/fazer`

  const headerName =
    process.env.FAZER_WEBHOOK_SIGNATURE_HEADER || "x-webhook-signature"

  const orderId = cli.orderId ?? `verify_${Date.now()}`
  const eventType = cli.type ?? "order.completed"
  const code = cli.code ?? "TEST-CODE-1234"

  const payload = {
    id: `evt_${Date.now()}`,
    type: eventType,
    order: {
      id: orderId,
      code,
    },
  }

  const rawBody = JSON.stringify(payload)
  const signature = signFazerWebhookBody(rawBody, secret)

  const localOk = verifyFazerSignature({
    rawBody,
    signatureHeader: signature,
    secret,
  })
  if (!localOk) {
    throw new Error("Local signature self-check failed.")
  }
  logger.info(`[verify-fazer-webhook] local HMAC OK, posting to ${target}`)

  const res = await fetch(target, {
    method: "POST",
    headers: {
      "content-type": "application/json",
      [headerName]: signature,
    },
    body: rawBody,
  })

  const text = await res.text()
  logger.info(`[verify-fazer-webhook] HTTP ${res.status} ${text || "(empty)"}`)

  if (res.status === 401) {
    throw new Error(
      "Webhook rejected (401). Check FAZER_WEBHOOK_SIGNATURE_SECRET and FAZER_WEBHOOK_SIGNATURE_HEADER=x-webhook-signature on the server."
    )
  }
  if (res.status === 503) {
    throw new Error(
      "Webhook secret not configured on server (503). Redeploy Medusa with FAZER_WEBHOOK_SIGNATURE_SECRET."
    )
  }
  if (!res.ok && res.status !== 202) {
    throw new Error(`Unexpected response ${res.status}`)
  }

  logger.info(
    res.status === 202
      ? "verify-fazer-webhook OK (202 — stashed for reconciliation, no delivery row yet)"
      : "verify-fazer-webhook OK"
  )
}
