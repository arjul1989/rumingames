import { PaymentSessionStatus } from "@medusajs/framework/utils"
import {
  medusaAuthorizeStatusFromMpPayment,
  mpStatusToSessionStatus,
  mpStatusToAction,
} from "../lib/status"

describe("mercadopago status mapping", () => {
  it("maps approved to captured / successful", () => {
    expect(mpStatusToSessionStatus("approved")).toBe(PaymentSessionStatus.CAPTURED)
    expect(mpStatusToAction("approved")).toBe("captured")
  })

  it("maps authorized", () => {
    expect(mpStatusToSessionStatus("authorized")).toBe(PaymentSessionStatus.AUTHORIZED)
    expect(mpStatusToAction("authorized")).toBe("authorized")
  })

  it("maps in-flight statuses to pending", () => {
    for (const s of ["pending", "in_process", "in_mediation"] as const) {
      expect(mpStatusToSessionStatus(s)).toBe(PaymentSessionStatus.PENDING)
      expect(mpStatusToAction(s)).toBe("pending")
    }
  })

  it("treats pending PSE/Efecty as authorized for Medusa cart completion", () => {
    expect(
      medusaAuthorizeStatusFromMpPayment({
        status: "pending",
        payment_method_id: "pse",
      })
    ).toBe(PaymentSessionStatus.AUTHORIZED)
    expect(
      medusaAuthorizeStatusFromMpPayment({
        status: "pending",
        payment_method_id: "efecty",
      })
    ).toBe(PaymentSessionStatus.AUTHORIZED)
  })

  it("keeps pending card payments unauthorized without MOCK_MP", () => {
    const prev = process.env.MOCK_MP
    delete process.env.MOCK_MP
    try {
      expect(
        medusaAuthorizeStatusFromMpPayment({
          status: "pending",
          payment_method_id: "visa",
        })
      ).toBe(PaymentSessionStatus.PENDING)
    } finally {
      if (prev === undefined) delete process.env.MOCK_MP
      else process.env.MOCK_MP = prev
    }
  })

  it("treats pending mock card payments as authorized when MOCK_MP is enabled", () => {
    const prev = process.env.MOCK_MP
    process.env.MOCK_MP = "true"
    try {
      expect(
        medusaAuthorizeStatusFromMpPayment({
          status: "pending",
          payment_method_id: "visa",
        })
      ).toBe(PaymentSessionStatus.AUTHORIZED)
    } finally {
      if (prev === undefined) delete process.env.MOCK_MP
      else process.env.MOCK_MP = prev
    }
  })

  it("maps rejected to error / failed", () => {
    expect(mpStatusToSessionStatus("rejected")).toBe(PaymentSessionStatus.ERROR)
    expect(mpStatusToAction("rejected")).toBe("failed")
  })

  it("maps cancelled/refunded/charged_back to canceled", () => {
    for (const s of ["cancelled", "refunded", "charged_back"] as const) {
      expect(mpStatusToSessionStatus(s)).toBe(PaymentSessionStatus.CANCELED)
      expect(mpStatusToAction(s)).toBe("canceled")
    }
  })
})
