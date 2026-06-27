/** Public storefront base URL for emails and redirects. */
function isLocalhostUrl(url: string): boolean {
  return /localhost|127\.0\.0\.1/i.test(url)
}

export function getStorefrontBaseUrl(): string {
  const raw = (
    process.env.STOREFRONT_URL ??
    process.env.STOREFRONT_BASE_URL ??
    ""
  )
    .trim()
    .replace(/\/$/, "")

  if (raw) {
    if (process.env.NODE_ENV === "production" && isLocalhostUrl(raw)) {
      const fallback = (process.env.STOREFRONT_BASE_URL ?? "https://gorumin.com").replace(
        /\/$/,
        ""
      )
      console.warn(
        `[storefront-url] STOREFRONT_URL is localhost in production; using ${fallback}`
      )
      return fallback
    }
    return raw
  }

  if (process.env.NODE_ENV === "production") {
    throw new Error(
      "STOREFRONT_URL is required in production (e.g. https://gorumin.com)."
    )
  }

  return "http://localhost:8000"
}

export function storefrontUrl(path: string, countryCode = "co"): string {
  const base = getStorefrontBaseUrl()
  const normalized = path.startsWith("/") ? path : `/${path}`
  if (normalized.startsWith(`/${countryCode}/`) || normalized === `/${countryCode}`) {
    return `${base}${normalized}`
  }
  return `${base}/${countryCode}${normalized}`
}
