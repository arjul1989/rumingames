import { buildMpCreatePaymentPayload } from "../lib/build-payment-payload"

describe("buildMpCreatePaymentPayload", () => {
  it("builds PSE payload with callback_url and enriched payer", () => {
    const payload = buildMpCreatePaymentPayload(
      {
        session_id: "payses_test",
        amount: 50000,
        payment_method_id: "pse",
        ip_address: "190.85.120.10",
        payer: {
          email: "buyer@test.com",
          entityType: "individual",
          identification: { type: "CC", number: "1234567890" },
        },
        transaction_details: { financial_institution: "1009" },
        shipping_address: {
          first_name: "Juan",
          last_name: "Pérez",
          address_1: "Calle 123",
          city: "Bogotá",
          province: "Cundinamarca",
          postal_code: "00000",
          phone: "3001234567",
        },
      },
      {
        notificationUrl: "https://api.example.com/hooks/mp",
        callbackUrl: "https://gorumin.com/co/checkout/pending",
        statementDescriptor: "GORUMIN",
      }
    )

    expect(payload.payment_method_id).toBe("pse")
    expect(payload.callback_url).toBe("https://gorumin.com/co/checkout/pending")
    expect(payload.payer?.entity_type).toBe("individual")
    expect(payload.payer?.identification).toEqual({
      type: "CC",
      number: "1234567890",
    })
    expect(payload.payer?.address?.zip_code).toBe("00000")
    expect(payload.payer?.phone).toEqual({
      area_code: "300",
      number: "12345",
    })
    expect(payload.transaction_details?.financial_institution).toBe("1009")
    expect(payload.additional_info?.ip_address).toBe("190.85.120.10")
  })

  it("prefers server amount over brick transaction_amount", () => {
    const payload = buildMpCreatePaymentPayload(
      {
        session_id: "payses_test",
        amount: 19660,
        transaction_amount: 18250,
        payment_method_id: "visa",
        token: "tok_test",
      },
      {}
    )

    expect(payload.transaction_amount).toBe(19660)
  })
})
