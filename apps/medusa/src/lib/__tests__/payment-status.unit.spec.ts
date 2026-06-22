import { normalizePaymentStatus } from "../payment-status"

describe("normalizePaymentStatus", () => {
  it("prefers Mercado Pago status when present", () => {
    expect(normalizePaymentStatus("not_paid", "approved")).toBe("approved")
    expect(normalizePaymentStatus("captured", "refunded")).toBe("refunded")
    expect(normalizePaymentStatus("awaiting", "rejected")).toBe("rejected")
  })

  it("falls back to Medusa payment status", () => {
    expect(normalizePaymentStatus("captured")).toBe("approved")
    expect(normalizePaymentStatus("refunded")).toBe("refunded")
    expect(normalizePaymentStatus("canceled")).toBe("rejected")
    expect(normalizePaymentStatus("awaiting")).toBe("pending")
    expect(normalizePaymentStatus(undefined)).toBe("pending")
  })

  it("treats authorized as approved and in_process as pending", () => {
    expect(normalizePaymentStatus(undefined, "authorized")).toBe("approved")
    expect(normalizePaymentStatus(undefined, "in_process")).toBe("pending")
  })
})
