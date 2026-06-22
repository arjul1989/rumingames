import type { MetadataRoute } from "next"
import { getBaseURL } from "@lib/util/env"
import { absoluteUrl } from "@lib/seo"

// robots.txt (Epic 8 / US-8.4 / RUM-56). Public content is indexable; private
// flows (checkout, account, orders) are kept out of the index.
export default function robots(): MetadataRoute.Robots {
  let host: string | undefined
  try {
    host = new URL(getBaseURL()).host
  } catch {
    host = undefined
  }

  return {
    rules: [
      {
        userAgent: "*",
        allow: "/",
        disallow: [
          "/api/",
          "/*/checkout",
          "/*/account",
          "/*/cuenta",
          "/*/order/",
        ],
      },
    ],
    sitemap: absoluteUrl("sitemap.xml"),
    host,
  }
}
