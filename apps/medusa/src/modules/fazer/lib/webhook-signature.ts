import crypto from "crypto"
import { resolveFazerWebhookSecret } from "../../../lib/fazer-webhook-secret"

// HMAC-SHA256 verification for Fazer webhooks (US-2.5 / RUM-20). The provider
// signs the raw request body with a shared secret; we recompute and compare in
// constant time. Header: X-Webhook-Signature: sha256=<hex> (configurable via
// FAZER_WEBHOOK_SIGNATURE_HEADER). Also accepts legacy header names.
export function signFazerWebhookBody(
  rawBody: string | Buffer,
  secret: string
): string {
  const body = typeof rawBody === "string" ? rawBody : rawBody.toString("utf8")
  const hex = crypto.createHmac("sha256", secret).update(body).digest("hex")
  return `sha256=${hex}`
}

export function verifyFazerSignature(params: {
  rawBody: string | Buffer | undefined
  signatureHeader: string | undefined
  secret?: string
}): boolean {
  const secret = params.secret ?? resolveFazerWebhookSecret()
  const { rawBody, signatureHeader } = params
  if (!rawBody || !signatureHeader || !secret) return false

  const provided = signatureHeader.replace(/^sha256=/i, "").trim().toLowerCase()
  const body = typeof rawBody === "string" ? rawBody : rawBody.toString("utf8")
  const expected = crypto.createHmac("sha256", secret).update(body).digest("hex")

  if (provided.length !== expected.length) return false
  try {
    return crypto.timingSafeEqual(Buffer.from(provided), Buffer.from(expected))
  } catch {
    return false
  }
}
