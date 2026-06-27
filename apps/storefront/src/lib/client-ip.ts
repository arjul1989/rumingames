import { headers } from "next/headers"

/** Client IP for payment providers (Mercado Pago PSE requires additional_info.ip_address). */
export async function getClientIpAddress(): Promise<string> {
  const h = await headers()
  const forwarded = h.get("x-forwarded-for")
  if (forwarded) {
    const ip = forwarded.split(",")[0]?.trim()
    if (ip) return ip
  }

  const realIp = h.get("x-real-ip")?.trim()
  if (realIp) return realIp

  const cfConnecting = h.get("cf-connecting-ip")?.trim()
  if (cfConnecting) return cfConnecting

  return "127.0.0.1"
}
