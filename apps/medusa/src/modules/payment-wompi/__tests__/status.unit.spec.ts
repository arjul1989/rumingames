import { PaymentSessionStatus } from "@medusajs/framework/utils"
import {
  wompiAuthorizeStatusFromTransaction,
  wompiStatusToAction,
  wompiStatusToSessionStatus,
} from "../lib/status"

describe("Wompi status mapping", () => {
  it("maps APPROVED to captured", () => {
    expect(wompiStatusToSessionStatus("APPROVED")).toBe(
      PaymentSessionStatus.CAPTURED
    )
    expect(wompiStatusToAction("APPROVED")).toBe("captured")
  })

  it("treats async PSE as authorized for order placement", () => {
    expect(
      wompiAuthorizeStatusFromTransaction({
        status: "PENDING",
        payment_method_type: "PSE",
      })
    ).toBe(PaymentSessionStatus.AUTHORIZED)
  })

  it("maps DECLINED to error", () => {
    expect(wompiStatusToSessionStatus("DECLINED")).toBe(
      PaymentSessionStatus.ERROR
    )
    expect(wompiStatusToAction("DECLINED")).toBe("failed")
  })
})
