import type { Metadata } from "next"
import { getBaseURL } from "@lib/util/env"
import { ACTIVE_COUNTRY_CODES, DEFAULT_COUNTRY as DEFAULT_CC } from "@lib/countries"

// Centralised SEO helpers (Epic 8 / RUM-52). MVP serves a single locale
// (es-CO); the active country list comes from the per-country config
// (US-6.3 / RUM-43) so hreflang and the sitemap grow as new markets go live.
export const ACTIVE_COUNTRIES = ACTIVE_COUNTRY_CODES
export const DEFAULT_COUNTRY = DEFAULT_CC
export const SITE_NAME = "rumin"
export const SITE_DOMAIN = "gorumin.com"
export const OG_LOCALE = "es_CO"

export function absoluteUrl(path = ""): string {
  const base = getBaseURL().replace(/\/$/, "")
  const clean = path ? `/${path.replace(/^\//, "")}` : ""
  return `${base}${clean}`
}

/**
 * Canonical + hreflang alternates for a localized path. `path` is the part
 * after the country segment, e.g. "noticias/mi-slug" (no leading country).
 */
export function localizedAlternates(path = ""): Metadata["alternates"] {
  const suffix = path ? `/${path.replace(/^\//, "")}` : ""
  const languages: Record<string, string> = {}
  for (const cc of ACTIVE_COUNTRIES) {
    languages[`es-${cc.toUpperCase()}`] = absoluteUrl(`${cc}${suffix}`)
  }
  languages["x-default"] = absoluteUrl(`${DEFAULT_COUNTRY}${suffix}`)

  return {
    canonical: absoluteUrl(`${DEFAULT_COUNTRY}${suffix}`),
    languages,
  }
}

// Shared OpenGraph defaults so every page inherits siteName + locale.
export function openGraphBase(): NonNullable<Metadata["openGraph"]> {
  return {
    siteName: SITE_NAME,
    locale: OG_LOCALE,
    type: "website",
  }
}
