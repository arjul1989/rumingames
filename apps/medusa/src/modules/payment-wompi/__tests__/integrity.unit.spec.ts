import {
  buildWompiIntegritySignature,
  verifyWompiEventChecksum,
  toWompiAmountInCents,
} from "../lib/integrity"

describe("Wompi integrity", () => {
  it("builds widget signature from reference, amount, currency and secret", () => {
    const signature = buildWompiIntegritySignature({
      reference: "sk8-438k4-xmxm392-sn2m",
      amountInCents: 2490000,
      currency: "COP",
      integritySecret: "prod_integrity_Z5mMke9x0k8gpErbDqwrJXMqsI6SFli6",
    })
    expect(signature).toBe(
      "37c8407747e595535433ef8f6a811d853cd943046624a0ec04662b17bbf33bf5"
    )
  })

  it("converts COP pesos to Wompi cents", () => {
    expect(toWompiAmountInCents(95000)).toBe(9500000)
  })

  it("verifies event checksum round-trip", () => {
    const data = {
      transaction: {
        id: "tx-123",
        status: "APPROVED",
        amount_in_cents: 10000,
      },
    }
    const properties = [
      "transaction.id",
      "transaction.status",
      "transaction.amount_in_cents",
    ]
    const timestamp = 1700000000
    const eventsSecret = "test_events_secret"
    const payload = `${data.transaction.id}${data.transaction.status}${data.transaction.amount_in_cents}${timestamp}${eventsSecret}`
    const checksum = require("crypto")
      .createHash("sha256")
      .update(payload)
      .digest("hex")

    expect(
      verifyWompiEventChecksum({
        properties,
        data,
        timestamp,
        checksum,
        eventsSecret,
      })
    ).toBe(true)
  })
})
