import { describe, expect, it } from "@jest/globals"
import {
  buildCartPricingBreakdown,
  computeLinePricing,
  resolveRetailPriceUsd,
} from "../country-pricing"

describe("country-pricing", () => {
  const country = {
    fx_rate: 4000,
    local_currency_code: "cop",
    taxes: [{ name: "IVA", rate_pct: 10 }],
  }

  it("computes Colombia example: $5 USD retail, 10% IVA, $0 commission", () => {
    const line = computeLinePricing(
      {
        wholesale_price_usd: 4.3,
        retail_price_usd: 5,
        quantity: 1,
      },
      country
    )

    expect(line.subtotal_local).toBe(20000)
    expect(line.face_value_usd).toBe(5)
    expect(line.face_value_local).toBe(20000)
    expect(line.margin_usd).toBe(0)
    expect(line.margin_local).toBe(0)
    expect(line.tax_total_local).toBe(2000)
    expect(line.total_before_commission_local).toBe(22000)

    const cart = buildCartPricingBreakdown({
      country_code: "co",
      gateway: "wompi",
      country,
      gatewayFee: {
        country_code: "co",
        gateway: "wompi",
        commission_pct: 3,
        commission_fixed_local: 800,
      },
      lines: [{ wholesale_price_usd: 4.3, retail_price_usd: 5 }],
      commission_fixed_local_override: 0,
    })

    expect(cart.subtotal_local).toBe(20000)
    expect(cart.face_value_usd).toBe(5)
    expect(cart.face_value_local).toBe(20000)
    expect(cart.margin_local).toBe(0)
    expect(cart.tax_total_local).toBe(2000)
    expect(cart.commission_local).toBe(0)
    expect(cart.commission_is_zero).toBe(true)
    expect(cart.total_local).toBe(22000)
    expect(cart.subtotal_usd).toBe(5)
    expect(cart.total_usd).toBe(5.5)
  })

  it("hides taxes when none configured", () => {
    const line = computeLinePricing(
      { wholesale_price_usd: 4.3, retail_price_usd: 5 },
      { ...country, taxes: [] }
    )
    expect(line.taxes).toHaveLength(0)
    expect(line.tax_total_local).toBe(0)
  })

  it("falls back to margin when retail USD is not set", () => {
    expect(resolveRetailPriceUsd({ wholesale_price_usd: 10, margin_pct: 15 })).toBe(11.5)
  })

  it("uses computeCopPrice for COP subtotal (matches catalog / cart charge)", () => {
    const line = computeLinePricing(
      {
        wholesale_price_usd: 4.6478,
        margin_pct: 15,
        face_value_amount: 5,
        face_value_currency: "USD",
        quantity: 1,
      },
      { fx_rate: 4000, local_currency_code: "cop", taxes: [] }
    )

    expect(line.face_value_usd).toBe(5)
    expect(line.subtotal_local).toBe(21400)
    expect(line.fx_rate).toBe(4280)
    expect(line.margin_local).toBe(0)
    expect(line.face_value_local).toBe(21400)
  })

  it("shows effective FX with margin baked in when face equals wholesale", () => {
    const line = computeLinePricing(
      {
        wholesale_price_usd: 10,
        margin_pct: 15,
        face_value_amount: 10,
        face_value_currency: "USD",
        quantity: 1,
      },
      { fx_rate: 4000, local_currency_code: "cop", taxes: [] }
    )

    expect(line.subtotal_local).toBe(46000)
    expect(line.fx_rate).toBe(4600)
  })

  it("applies default Wompi commission on cart total base", () => {
    const cart = buildCartPricingBreakdown({
      country_code: "co",
      gateway: "wompi",
      country,
      gatewayFee: {
        country_code: "co",
        gateway: "wompi",
        commission_pct: 3,
        commission_fixed_local: 800,
      },
      lines: [{ wholesale_price_usd: 4.3, retail_price_usd: 5 }],
    })

    expect(cart.commission_local).toBe(1460)
    expect(cart.commission_is_zero).toBe(false)
    expect(cart.total_local).toBe(23460)
  })
})
