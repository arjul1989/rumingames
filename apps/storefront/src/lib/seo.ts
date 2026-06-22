import type { Metadata } from "next"
import { getBaseURL } from "@lib/util/env"

// Centralised SEO helpers (Epic 8 / RUM-52). MVP serves a single locale
// (es-CO); the country list is kept here so hreflang and the sitemap can grow
// as new countries go live.
export const ACTIVE_COUNTRIES = ["co"] as const
export const DEFAULT_COUNTRY = "co"
export const SITE_NAME = "Gorumin"
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
