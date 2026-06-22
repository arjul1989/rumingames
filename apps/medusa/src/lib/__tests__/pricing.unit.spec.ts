import {
  computeCopPrice,
  getCategoryMargins,
  getMarginForCategory,
  rateChangedBeyondThreshold,
} from "../pricing"

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

describe("category margins", () => {
  const original = process.env.CATEGORY_MARGINS
  afterEach(() => {
    if (original === undefined) delete process.env.CATEGORY_MARGINS
    else process.env.CATEGORY_MARGINS = original
    delete process.env.DEFAULT_MARGIN_PCT
  })

  it("parses a valid CATEGORY_MARGINS json", () => {
    process.env.CATEGORY_MARGINS = '{"gift-cards":12,"top-ups":18}'
    expect(getCategoryMargins()).toEqual({ "gift-cards": 12, "top-ups": 18 })
  })

  it("returns {} for invalid json", () => {
    process.env.CATEGORY_MARGINS = "not-json"
    expect(getCategoryMargins()).toEqual({})
  })

  it("resolves per-category margin, falling back to global default", () => {
    process.env.CATEGORY_MARGINS = '{"gift-cards":12}'
    expect(getMarginForCategory("gift-cards")).toBe(12)
    // unknown category -> default (15)
    expect(getMarginForCategory("top-ups")).toBe(15)
    expect(getMarginForCategory(undefined)).toBe(15)
  })
})

describe("rateChangedBeyondThreshold", () => {
  it("triggers when there is no previous rate", () => {
    expect(rateChangedBeyondThreshold(0, 4000, 2)).toBe(true)
  })

  it("does not trigger for small moves under the threshold", () => {
    // +1% with a 2% threshold
    expect(rateChangedBeyondThreshold(4000, 4040, 2)).toBe(false)
  })

  it("triggers for moves above the threshold (up or down)", () => {
    expect(rateChangedBeyondThreshold(4000, 4120, 2)).toBe(true) // +3%
    expect(rateChangedBeyondThreshold(4000, 3880, 2)).toBe(true) // -3%
  })
})
