import { buildCartPricingBreakdown } from "../country-pricing"

describe("gateway commission in cart total", () => {
  it("adds Wompi commission to single-item total", () => {
    const breakdown = buildCartPricingBreakdown({
      country_code: "co",
      gateway: "wompi",
      country: {
        fx_rate: 4000,
        local_currency_code: "cop",
        taxes: [{ name: "IVA", rate_pct: 10 }],
      },
      gatewayFee: {
        country_code: "co",
        gateway: "wompi",
        commission_pct: 3,
        commission_fixed_local: 800,
      },
      lines: [
        {
          wholesale_price_usd: 4,
          retail_price_usd: 5,
          quantity: 1,
        },
      ],
    })

    expect(breakdown.subtotal_local).toBe(20000)
    expect(breakdown.tax_total_local).toBe(2000)
    expect(breakdown.commission_local).toBe(1460)
    expect(breakdown.total_local).toBe(23460)
  })
})
