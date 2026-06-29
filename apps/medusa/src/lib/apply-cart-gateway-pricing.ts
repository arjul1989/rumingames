import { MedusaContainer } from "@medusajs/framework"
import { ContainerRegistrationKeys } from "@medusajs/framework/utils"
import {
  refreshPaymentCollectionForCartWorkflow,
  updateCartWorkflow,
  updateLineItemInCartWorkflow,
} from "@medusajs/medusa/core-flows"
import { buildCartPricingBreakdownForCart } from "./build-cart-pricing-breakdown"
import type { CartPricingBreakdown } from "./country-pricing-types"

type CartItemRow = {
  id: string
  quantity?: number | null
  variant?: {
    id?: string | null
    metadata?: Record<string, unknown> | null
  } | null
}

function skuForItem(item: CartItemRow): string | null {
  const sku = item.variant?.metadata?.fazer_sku_id
  return typeof sku === "string" && sku ? sku : null
}

function lineTotalForItem(
  breakdown: CartPricingBreakdown,
  item: CartItemRow,
  index: number,
  items: CartItemRow[],
  allocated: { value: number }
): number {
  const sku = skuForItem(item)
  const line = breakdown.lines.find((row) =>
    sku ? row.fazer_sku_id === sku : false
  ) ?? breakdown.lines[index]

  if (!line) {
    return 0
  }

  const beforeCommission =
    breakdown.subtotal_local + breakdown.tax_total_local
  const lineBase = line.total_before_commission_local

  if (index === items.length - 1) {
    return breakdown.total_local - allocated.value
  }

  const share =
    beforeCommission > 0
      ? lineBase / beforeCommission
      : 1 / items.length
  const lineTotal = Math.round(breakdown.total_local * share)
  allocated.value += lineTotal
  return lineTotal
}

/** Applies gateway commission to cart line prices so payment matches pricing breakdown. */
export async function applyCartGatewayPricing(
  container: MedusaContainer,
  cartId: string,
  countryCode = "co"
): Promise<CartPricingBreakdown | null> {
  const query = container.resolve(ContainerRegistrationKeys.QUERY)
  const { data } = await query.graph({
    entity: "cart",
    fields: [
      "id",
      "metadata",
      "items.id",
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
        metadata?: Record<string, unknown> | null
        items?: CartItemRow[] | null
      }
    | undefined

  if (!cart?.id || !cart.items?.length) {
    return null
  }

  const breakdown = await buildCartPricingBreakdownForCart(
    container,
    cart,
    countryCode
  )
  if (!breakdown) {
    return null
  }

  const allocated = { value: 0 }
  const items = cart.items

  for (let index = 0; index < items.length; index++) {
    const item = items[index]
    if (!item.id) continue

    const qty = Math.max(1, item.quantity ?? 1)
    const lineTotal = lineTotalForItem(breakdown, item, index, items, allocated)
    const unitPrice = Math.max(0, Math.round(lineTotal / qty))

    await updateLineItemInCartWorkflow(container).run({
      input: {
        cart_id: cartId,
        item_id: item.id,
        update: {
          quantity: qty,
          unit_price: unitPrice,
        },
      },
    })
  }

  await refreshPaymentCollectionForCartWorkflow(container).run({
    input: { cart_id: cartId },
  })

  await updateCartWorkflow(container).run({
    input: {
      id: cartId,
      metadata: {
        ...(cart.metadata ?? {}),
        gorumin_pricing: {
          country_code: breakdown.country_code,
          gateway: breakdown.gateway,
          subtotal_local: breakdown.subtotal_local,
          tax_total_local: breakdown.tax_total_local,
          commission_local: breakdown.commission_local,
          commission_pct: breakdown.commission_pct,
          commission_fixed_local: breakdown.commission_fixed_local,
          total_local: breakdown.total_local,
          applied_at: new Date().toISOString(),
        },
      },
    },
  })

  return breakdown
}
