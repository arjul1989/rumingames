/** In production, unsigned webhooks must be rejected (no secret configured). */
export function webhookSecretRequired(
  secret: string | undefined,
  provider: string
): { ok: true } | { ok: false; status: number; message: string } {
  if (process.env.NODE_ENV === "production" && !secret?.trim()) {
    return {
      ok: false,
      status: 503,
      message: `${provider} webhook secret is not configured`,
    }
  }
  return { ok: true }
}
