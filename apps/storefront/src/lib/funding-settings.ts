/** Matches Medusa FUNDING_ENABLED — baked at build time for storefront UX (Épica 13). */
export function isFundingUxEnabled(): boolean {
  return process.env.NEXT_PUBLIC_FUNDING_ENABLED === "true"
}
