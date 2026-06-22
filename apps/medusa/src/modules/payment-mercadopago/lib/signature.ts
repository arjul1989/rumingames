import crypto from "crypto"

// Verifies a Mercado Pago webhook signature (US-3.3 / RUM-25).
// MP sends an `x-signature: ts=<ts>,v1=<hash>` header and an `x-request-id`.
// The signed manifest is: `id:<dataId>;request-id:<requestId>;ts:<ts>;`
// hashed with HMAC-SHA256 using the webhook secret.
// Docs: https://www.mercadopago.com.co/developers/en/docs/your-integrations/notifications/webhooks

export function parseXSignature(header: string | undefined): { ts?: string; v1?: string } {
  if (!header) return {}
  const parts = header.split(",")
  const out: { ts?: string; v1?: string } = {}
  for (const part of parts) {
    const [key, value] = part.split("=").map((s) => s.trim())
    if (key === "ts") out.ts = value
    if (key === "v1") out.v1 = value
  }
  return out
}

export interface VerifyMpSignatureParams {
  xSignature: string | undefined
  xRequestId: string | undefined
  dataId: string | undefined
  secret: string
}

export function verifyMpSignature({
  xSignature,
  xRequestId,
  dataId,
  secret,
}: VerifyMpSignatureParams): boolean {
  const { ts, v1 } = parseXSignature(xSignature)
  if (!ts || !v1 || !dataId || !xRequestId) {
    return false
  }

  // MP lowercases alphanumeric ids in the manifest.
  const manifest = `id:${dataId.toLowerCase()};request-id:${xRequestId};ts:${ts};`
  const expected = crypto.createHmac("sha256", secret).update(manifest).digest("hex")

  const a = Buffer.from(expected)
  const b = Buffer.from(v1)
  if (a.length !== b.length) {
    return false
  }
  return crypto.timingSafeEqual(a, b)
}
