import type { CartPricingBreakdown } from "@gorumin/types"
import { sdk } from "@lib/config"
import { getAuthHeaders, getCacheTag } from "./cookies"
import { revalidateTag } from "next/cache"

export async function applyCartPricing(
  cartId: string,
  countryCode: string
): Promise<CartPricingBreakdown | null> {
  try {
    const headers = {
      ...(await getAuthHeaders()),
    }
    const response = await sdk.client.fetch<{
      breakdown: CartPricingBreakdown
      applied: boolean
    }>(`/store/carts/${cartId}/apply-pricing`, {
      method: "POST",
      body: { country: countryCode },
      headers,
      cache: "no-store",
    })
    const cartCacheTag = await getCacheTag("carts")
    revalidateTag(cartCacheTag)
    return response.breakdown
  } catch {
    return null
  }
}

export async function retrieveCartPricingBreakdown(
  cartId: string,
  countryCode: string
): Promise<CartPricingBreakdown | null> {
  try {
    const response = await sdk.client.fetch<{ breakdown: CartPricingBreakdown }>(
      `/store/carts/${cartId}/pricing-breakdown?country=${countryCode}`,
      { method: "GET", cache: "no-store" }
    )
    return response.breakdown
  } catch {
    return null
  }
}
