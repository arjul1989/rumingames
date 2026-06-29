import { resolveFazerWebhookSecret } from "../fazer-webhook-secret"
import {
  signFazerWebhookBody,
  verifyFazerSignature,
} from "../../modules/fazer/lib/webhook-signature"

describe("Fazer webhook secret + signature", () => {
  const original = process.env

  beforeEach(() => {
    process.env = { ...original }
  })

  afterAll(() => {
    process.env = original
  })

  it("strips whsec_ prefix from FAZER_WEBHOOK_SIGNATURE_SECRET", () => {
    process.env.FAZER_WEBHOOK_SIGNATURE_SECRET =
      "whsec_abcdef0123456789abcdef0123456789abcdef0123456789abcdef0123456789"
    expect(resolveFazerWebhookSecret()).toBe(
      "abcdef0123456789abcdef0123456789abcdef0123456789abcdef0123456789"
    )
  })

  it("signs and verifies with sha256= prefix", () => {
    const secret = "test-signing-secret"
    const body = JSON.stringify({ type: "order.completed", order: { id: "o1" } })
    const header = signFazerWebhookBody(body, secret)
    expect(header).toMatch(/^sha256=[a-f0-9]{64}$/)
    expect(
      verifyFazerSignature({
        rawBody: body,
        signatureHeader: header,
        secret,
      })
    ).toBe(true)
  })
})
