import { mapMpBrickError, mapCheckoutFailureReason } from "../mp-brick-errors"
import { buildMpBrickPaymentMethods } from "../mp-payment-settings.shared"

describe("mapMpBrickError", () => {
  it("maps payment_method_not_in_allowed_types", () => {
    expect(
      mapMpBrickError({
        type: "payment_method_not_in_allowed_types",
        message: "payment_method_not_in_allowed_types",
      })
    ).toMatch(/crédito|débito/i)
  })

  it("maps secure field failures to HTTPS guidance", () => {
    expect(
      mapMpBrickError("secure_fields_card_token_creation_failed")
    ).toMatch(/HTTPS/i)
  })
})

describe("buildMpBrickPaymentMethods", () => {
  it("enables credit, debit and prepaid when cards are on", () => {
    expect(
      buildMpBrickPaymentMethods({
        configured: true,
        enable_cards: true,
        enable_pse: false,
        enable_efecty: false,
        enable_manual_test: false,
      })
    ).toEqual({
      maxInstallments: 36,
      creditCard: "all",
      debitCard: "all",
      prepaidCard: "all",
    })
  })
})

describe("mapCheckoutFailureReason", () => {
  it("maps authorization failures to actionable copy", () => {
    expect(
      mapCheckoutFailureReason(
        "Session: payses_xxx was not authorized with the provider."
      )
    ).toMatch(/MOCK_MP|simulador/i)
  })
})
