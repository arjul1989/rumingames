"use server"

import { sdk } from "@lib/config"

export type WompiSettings = {
  configured: boolean
  public_key: string | null
}

export async function getWompiSettings(): Promise<WompiSettings> {
  try {
    return await sdk.client.fetch<WompiSettings>("/store/wompi/settings", {
      method: "GET",
      cache: "no-store",
    })
  } catch {
    return { configured: false, public_key: null }
  }
}

export type WompiCheckoutParams = {
  public_key: string
  currency: string
  amount_in_cents: number
  reference: string
  signature_integrity: string
  redirect_url: string
  customer_email?: string
  customer_data?: Record<string, string>
}

export async function fetchWompiCheckoutParams(input: {
  reference: string
  amount: number
  customer_email?: string
  customer_data?: Record<string, string>
  redirect_url?: string
}): Promise<WompiCheckoutParams> {
  return sdk.client.fetch<WompiCheckoutParams>("/store/wompi/checkout-params", {
    method: "POST",
    body: input,
    cache: "no-store",
  })
}
