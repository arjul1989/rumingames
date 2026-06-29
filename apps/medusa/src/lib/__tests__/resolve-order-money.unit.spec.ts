import {
  resolveLineItemTotal,
  resolveOrderEmailItems,
  resolveOrderTotal,
} from "../resolve-order-money"

describe("resolveLineItemTotal", () => {
  it("uses subtotal when present", () => {
    expect(resolveLineItemTotal({ subtotal: 20000 })).toBe(20000)
  })

  it("falls back to unit_price × quantity when subtotal is zero", () => {
    expect(
      resolveLineItemTotal({
        subtotal: 0,
        unit_price: 36500,
        quantity: 1,
      })
    ).toBe(36500)
  })
})

describe("resolveOrderEmailItems", () => {
  it("allocates captured payment when line subtotals are zero", () => {
    const items = resolveOrderEmailItems({
      total: 0,
      payment_collections: [{ captured_amount: 56500 }],
      items: [
        { title: "A", subtotal: 0, unit_price: 20000, quantity: 1 },
        { title: "B", subtotal: 0, unit_price: 36500, quantity: 1 },
      ],
    })
    expect(items).toEqual([
      { title: "A", quantity: 1, total: 20000 },
      { title: "B", quantity: 1, total: 36500 },
    ])
  })
})

describe("resolveOrderTotal", () => {
  it("uses payment captured amount when order total is zero", () => {
    expect(
      resolveOrderTotal({
        total: 0,
        payment_collections: [{ captured_amount: 56500 }],
        items: [{ subtotal: 0, unit_price: 20000 }],
      })
    ).toBe(56500)
  })

  it("sums line items when no other total is available", () => {
    expect(
      resolveOrderTotal({
        total: 0,
        items: [
          { subtotal: 0, unit_price: 20000, quantity: 1 },
          { subtotal: 0, unit_price: 36500, quantity: 1 },
        ],
      })
    ).toBe(56500)
  })
})
