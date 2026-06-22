import { FazerClient } from "../lib/client"
import { FazerApiError, FazerTimeoutError } from "../lib/errors"

function jsonResponse(body: unknown, init: Partial<{ status: number; headers: Record<string, string> }> = {}) {
  const status = init.status ?? 200
  return new Response(JSON.stringify(body), {
    status,
    headers: { "content-type": "application/json", ...(init.headers ?? {}) },
  })
}

const noSleep = async () => {}

describe("FazerClient", () => {
  it("requires an api key", () => {
    expect(() => new FazerClient({ apiKey: "" })).toThrow()
  })

  it("sends X-Api-Key and parses a successful catalog response", async () => {
    const fetchImpl = jest.fn().mockResolvedValue(
      jsonResponse({ items: [{ id: "steam-10", name: "Steam $10", price_usd: 10 }] })
    )
    const client = new FazerClient({ apiKey: "key_123", fetchImpl, sleepImpl: noSleep })

    const page = await client.getCatalog({ category: "gift-cards", limit: 50 })

    expect(page.items).toHaveLength(1)
    const [url, opts] = fetchImpl.mock.calls[0]
    expect(url).toContain("/catalog?category=gift-cards&limit=50")
    expect((opts.headers as Record<string, string>)["X-Api-Key"]).toBe("key_123")
  })

  it("retries on 429 honoring Retry-After, then succeeds", async () => {
    const fetchImpl = jest
      .fn()
      .mockResolvedValueOnce(jsonResponse({ error: "rate limited" }, { status: 429, headers: { "retry-after": "1" } }))
      .mockResolvedValueOnce(jsonResponse({ balance_usd: 42, currency: "USD" }))
    const sleep = jest.fn().mockResolvedValue(undefined)
    const client = new FazerClient({ apiKey: "k", fetchImpl, sleepImpl: sleep, retries: 3 })

    const balance = await client.getBalance()

    expect(balance.balance_usd).toBe(42)
    expect(fetchImpl).toHaveBeenCalledTimes(2)
    expect(sleep).toHaveBeenCalledWith(1000) // Retry-After: 1s
  })

  it("retries on 5xx up to the limit then throws FazerApiError", async () => {
    const fetchImpl = jest.fn().mockResolvedValue(jsonResponse({ error: "boom" }, { status: 503 }))
    const client = new FazerClient({ apiKey: "k", fetchImpl, sleepImpl: noSleep, retries: 2 })

    await expect(client.getBalance()).rejects.toBeInstanceOf(FazerApiError)
    expect(fetchImpl).toHaveBeenCalledTimes(3) // initial + 2 retries
  })

  it("does not retry on non-429 4xx", async () => {
    const fetchImpl = jest.fn().mockResolvedValue(jsonResponse({ error: "bad request" }, { status: 400 }))
    const client = new FazerClient({ apiKey: "k", fetchImpl, sleepImpl: noSleep, retries: 3 })

    await expect(client.getBalance()).rejects.toBeInstanceOf(FazerApiError)
    expect(fetchImpl).toHaveBeenCalledTimes(1)
  })

  it("throws FazerTimeoutError when the request aborts", async () => {
    const abortError = Object.assign(new Error("aborted"), { name: "AbortError" })
    const fetchImpl = jest.fn().mockRejectedValue(abortError)
    const client = new FazerClient({ apiKey: "k", fetchImpl, sleepImpl: noSleep, retries: 1 })

    await expect(client.getBalance()).rejects.toBeInstanceOf(FazerTimeoutError)
    expect(fetchImpl).toHaveBeenCalledTimes(2) // initial + 1 retry
  })

  it("sends an Idempotency-Key when creating an order", async () => {
    const fetchImpl = jest.fn().mockResolvedValue(
      jsonResponse({ id: "ord_1", status: "completed", sku_id: "steam-10", quantity: 1, codes: ["ABC"] })
    )
    const client = new FazerClient({ apiKey: "k", fetchImpl, sleepImpl: noSleep })

    const order = await client.createOrder({ sku_id: "steam-10", quantity: 1, idempotency_key: "idem-1" })

    expect(order.codes).toEqual(["ABC"])
    const [, opts] = fetchImpl.mock.calls[0]
    expect((opts.headers as Record<string, string>)["Idempotency-Key"]).toBe("idem-1")
    expect(opts.method).toBe("POST")
  })
})
