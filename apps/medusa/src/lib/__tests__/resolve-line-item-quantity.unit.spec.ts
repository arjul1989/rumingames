import { resolveLineItemQuantity } from "../fulfill-digital-order"

describe("resolveLineItemQuantity", () => {
  it("uses detail.quantity when top-level quantity is missing", () => {
    expect(
      resolveLineItemQuantity({
        detail: { quantity: 2 },
      })
    ).toBe(2)
  })

  it("uses raw_quantity when quantity fields are missing", () => {
    expect(
      resolveLineItemQuantity({
        raw_quantity: { value: "3" },
      })
    ).toBe(3)
  })

  it("defaults to 1 when no quantity is present", () => {
    expect(resolveLineItemQuantity({})).toBe(1)
  })
})
