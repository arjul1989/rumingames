/** Public HTTPS URL for the Gorumin logo in transactional emails. */

const DEFAULT_GCS_LOGO =
  "https://storage.googleapis.com/gorumin-public-assets/email/gorumin-logo-256.png"

export function getEmailLogoUrl(): string {
  if (process.env.EMAIL_LOGO_URL) {
    return process.env.EMAIL_LOGO_URL.replace(/\/$/, "")
  }

  const storefront = (process.env.STOREFRONT_URL || "").replace(/\/$/, "")
  if (storefront && !storefront.includes("localhost")) {
    return `${storefront}/brand/gorumin-logo-256.png`
  }

  return DEFAULT_GCS_LOGO
}

/** Brevo/Gmail block data: URIs — always use a hosted HTTPS URL. */
export function emailLogoSrc(): string {
  return getEmailLogoUrl()
}

export function emailLogoHtml(width = 168, align: "center" | "left" = "center"): string {
  const src = emailLogoSrc()
  const margin = align === "left" ? "0" : "0 auto"
  return `<img src="${src}" alt="rumin" width="${width}" height="auto" style="display:block;margin:${margin};max-width:100%;height:auto;border:0;" />`
}
