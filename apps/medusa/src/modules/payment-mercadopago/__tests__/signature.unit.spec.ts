import crypto from "crypto"
import { parseXSignature, verifyMpSignature } from "../lib/signature"

const SECRET = "test-webhook-secret"

function sign(dataId: string, requestId: string, ts: string): string {
  const manifest = `id:${dataId.toLowerCase()};request-id:${requestId};ts:${ts};`
  const v1 = crypto.createHmac("sha256", SECRET).update(manifest).digest("hex")
  return `ts=${ts},v1=${v1}`
}

describe("mercadopago signature", () => {
  it("parses the x-signature header", () => {
    expect(parseXSignature("ts=123,v1=abc")).toEqual({ ts: "123", v1: "abc" })
    expect(parseXSignature(undefined)).toEqual({})
  })

  it("accepts a valid signature", () => {
    const xSignature = sign("123456", "req-1", "1700000000")
    expect(
      verifyMpSignature({ xSignature, xRequestId: "req-1", dataId: "123456", secret: SECRET })
    ).toBe(true)
  })

  it("rejects a tampered payment id", () => {
    const xSignature = sign("123456", "req-1", "1700000000")
    expect(
      verifyMpSignature({ xSignature, xRequestId: "req-1", dataId: "999999", secret: SECRET })
    ).toBe(false)
  })

  it("rejects a wrong secret", () => {
    const xSignature = sign("123456", "req-1", "1700000000")
    expect(
      verifyMpSignature({ xSignature, xRequestId: "req-1", dataId: "123456", secret: "nope" })
    ).toBe(false)
  })

  it("rejects missing parts", () => {
    expect(
      verifyMpSignature({ xSignature: undefined, xRequestId: "r", dataId: "1", secret: SECRET })
    ).toBe(false)
  })
})
