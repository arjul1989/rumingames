import { PaymentSessionStatus } from "@medusajs/framework/utils"
import {
  epaycoStatusToAction,
  epaycoStatusToSessionStatus,
} from "../lib/status"

describe("ePayco status mapping", () => {
  it("maps Aceptada to captured", () => {
    expect(epaycoStatusToSessionStatus("Aceptada")).toBe(
      PaymentSessionStatus.CAPTURED
    )
    expect(epaycoStatusToAction("Aceptada")).toBe("captured")
  })

  it("maps Pendiente to authorized", () => {
    expect(epaycoStatusToSessionStatus("Pendiente")).toBe(
      PaymentSessionStatus.AUTHORIZED
    )
    expect(epaycoStatusToAction("Pendiente")).toBe("authorized")
  })

  it("maps Rechazada to error", () => {
    expect(epaycoStatusToSessionStatus("Rechazada")).toBe(
      PaymentSessionStatus.ERROR
    )
    expect(epaycoStatusToAction("Rechazada")).toBe("failed")
  })
})
