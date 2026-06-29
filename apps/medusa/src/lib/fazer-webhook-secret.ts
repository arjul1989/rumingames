/** Signing secret from Fazer panel (whsec_…) or legacy FAZER_WEBHOOK_SECRET. */
export function resolveFazerWebhookSecret(): string | undefined {
  const raw =
    process.env.FAZER_WEBHOOK_SIGNATURE_SECRET?.trim() ||
    process.env.FAZER_WEBHOOK_SECRET?.trim()
  if (!raw) return undefined
  if (raw.startsWith("whsec_")) {
    return raw.slice("whsec_".length)
  }
  return raw
}
