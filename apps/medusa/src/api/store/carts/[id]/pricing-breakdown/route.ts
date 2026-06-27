import type { MedusaRequest, MedusaResponse } from "@medusajs/framework/http"
import { ContainerRegistrationKeys } from "@medusajs/framework/utils"
import { buildCartPricingBreakdownForCart } from "../../../../../lib/build-cart-pricing-breakdown"

export async function GET(req: MedusaRequest, res: MedusaResponse) {
  const cartId = req.params.id
  const country = ((req.query?.country as string | undefined) ?? "co").toLowerCase()

  const query = req.scope.resolve(ContainerRegistrationKeys.QUERY)
  const { data } = await query.graph({
    entity: "cart",
    fields: [
      "id",
      "items.*",
      "items.quantity",
      "items.title",
      "items.variant.id",
      "items.variant.title",
      "items.variant.metadata",
    ],
    filters: { id: cartId },
  })

  const cart = data[0] as
    | {
        id?: string
        items?: Array<{
          quantity?: number | null
          title?: string | null
          variant?: {
            id?: string | null
            title?: string | null
            metadata?: Record<string, unknown> | null
          } | null
        }> | null
      }
    | undefined

  if (!cart) {
    return res.status(404).json({ message: "Cart not found" })
  }

  const breakdown = await buildCartPricingBreakdownForCart(req.scope, cart, country)
  if (!breakdown) {
    return res.status(404).json({ message: "Unable to build pricing breakdown" })
  }

  res.json({ breakdown })
}
