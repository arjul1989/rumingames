import { computeCopPrice } from "../pricing"

describe("computeCopPrice", () => {
  it("applies rate and margin, rounding to nearest 100", () => {
    // 10 USD * 4000 * 1.15 = 46000
    expect(computeCopPrice(10, 4000, 15)).toBe(46000)
  })

  it("rounds to the nearest 100 COP", () => {
    // 3.33 * 4000 * 1.15 = 15318 -> 15300
    expect(computeCopPrice(3.33, 4000, 15)).toBe(15300)
  })

  it("supports a zero margin", () => {
    expect(computeCopPrice(5, 4000, 0)).toBe(20000)
  })

  it("rejects invalid prices", () => {
    expect(() => computeCopPrice(-1, 4000, 15)).toThrow()
    expect(() => computeCopPrice(NaN, 4000, 15)).toThrow()
  })
})
