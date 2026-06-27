import type {
  WompiThreeDsAuth,
  WompiTransaction,
  WompiTransactionStatus,
} from "./types"

const FINAL_STATUSES = new Set<WompiTransactionStatus>([
  "APPROVED",
  "DECLINED",
  "VOIDED",
  "ERROR",
])

export function isWompiFinalStatus(status: WompiTransactionStatus): boolean {
  return FINAL_STATUSES.has(status)
}

export function getWompiThreeDsAuth(tx: WompiTransaction): WompiThreeDsAuth | null {
  return tx.payment_method?.extra?.three_ds_auth ?? null
}

export function isWompiThreeDsChallenge(auth: WompiThreeDsAuth | null): boolean {
  return (
    auth?.current_step === "CHALLENGE" &&
    auth?.current_step_status === "PENDING" &&
    Boolean(auth.three_ds_method_data)
  )
}

export function isWompiThreeDsAuthenticating(auth: WompiThreeDsAuth | null): boolean {
  return auth?.current_step === "AUTHENTICATION"
}

/** Decode HTML-escaped iframe content from Wompi 3DS challenge. */
export function decodeWompiChallengeHtml(escapedHtml: string): string {
  return escapedHtml
    .replace(/&lt;/g, "<")
    .replace(/&gt;/g, ">")
    .replace(/&quot;/g, '"')
    .replace(/&#39;/g, "'")
    .replace(/&amp;/g, "&")
}

export function extractWompiChallengeIframeSrcDoc(
  escapedHtml: string
): string | null {
  const decoded = decodeWompiChallengeHtml(escapedHtml)
  const match = decoded.match(/<iframe[\s\S]*?<\/iframe>/i)
  return match?.[0] ?? decoded
}
