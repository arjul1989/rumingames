import type { CartPricingBreakdown } from "@gorumin/types"
import { sdk } from "@lib/config"

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
