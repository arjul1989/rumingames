import crypto from "crypto"

/** Wompi widget/API integrity signature (reference + amount + currency + secret). */
export function buildWompiIntegritySignature(input: {
  reference: string
  amountInCents: number
  currency: string
  integritySecret: string
  expirationTime?: string
}): string {
  const base = `${input.reference}${input.amountInCents}${input.currency}`
  const payload = input.expirationTime
    ? `${base}${input.expirationTime}${input.integritySecret}`
    : `${base}${input.integritySecret}`
  return crypto.createHash("sha256").update(payload).digest("hex")
}

/** Verify Wompi event webhook checksum (docs/colombia/eventos). */
export function verifyWompiEventChecksum(input: {
  properties: string[]
  data: Record<string, unknown>
  timestamp: number
  checksum: string
  eventsSecret: string
}): boolean {
  const values = input.properties.map((path) => {
    const parts = path.split(".")
    let current: unknown = input.data
    for (const part of parts) {
      if (!current || typeof current !== "object") return ""
      current = (current as Record<string, unknown>)[part]
    }
    return String(current ?? "")
  })

  const payload = `${values.join("")}${input.timestamp}${input.eventsSecret}`
  const expected = crypto.createHash("sha256").update(payload).digest("hex")
  return expected.toLowerCase() === input.checksum.toLowerCase()
}

/** Convert Medusa/COP cart total (pesos) to Wompi amount_in_cents. */
export function toWompiAmountInCents(amountPesos: number): number {
  return Math.round(Number(amountPesos) * 100)
}
