import type { NextRequest } from "next/server"
import { getBaseURL } from "@lib/util/env"

function isUsableOrigin(origin: string): boolean {
  try {
    const { hostname } = new URL(origin)
    return hostname !== "0.0.0.0" && hostname !== "127.0.0.1"
  } catch {
    return false
  }
}

/** Public storefront origin — avoids Cloud Run's internal 0.0.0.0:8000 host. */
export function getRequestOrigin(req: NextRequest): string {
  const configured =
    process.env.NEXT_PUBLIC_BASE_URL || process.env.STOREFRONT_URL || ""
  if (configured && isUsableOrigin(configured)) {
    return configured.replace(/\/$/, "")
  }

  const forwardedHost = req.headers.get("x-forwarded-host")
  const forwardedProto = req.headers.get("x-forwarded-proto") || "https"
  if (forwardedHost) {
    const host = forwardedHost.split(",")[0]?.trim()
    if (host && !host.startsWith("0.0.0.0")) {
      return `${forwardedProto}://${host}`
    }
  }

  const host = req.headers.get("host")
  if (host && !host.startsWith("0.0.0.0")) {
    const proto =
      req.headers.get("x-forwarded-proto") ||
      (host.includes("localhost") ? "http" : "https")
    return `${proto}://${host}`
  }

  return getBaseURL().replace(/\/$/, "")
}

export function absoluteStorefrontUrl(
  req: NextRequest,
  pathname: string
): URL {
  const base = getRequestOrigin(req)
  const path = pathname.startsWith("/") ? pathname : `/${pathname}`
  return new URL(path, `${base}/`)
}
