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

  it("parses balance from the live API shape", async () => {
    const fetchImpl = jest.fn().mockResolvedValue(
      jsonResponse({ ok: true, balance: "42.5000", currency: "USD" })
    )
    const client = new FazerClient({ apiKey: "key_123", fetchImpl, sleepImpl: noSleep })

    const balance = await client.getBalance()

    expect(balance.balance_usd).toBe(42.5)
    expect(balance.currency).toBe("USD")
    const [url, opts] = fetchImpl.mock.calls[0]
    expect(url).toContain("/balance")
    expect((opts.headers as Record<string, string>)["X-Api-Key"]).toBe("key_123")
  })

  it("fetches gift card offers for mapped sku ids", async () => {
    const fetchImpl = jest.fn().mockResolvedValue(
      jsonResponse({
        ok: true,
        category_id: "steam_wallet_global",
        offers: [
          {
            card_id: "5_usd",
            name: "5 USD",
            price_usd: "5.2000",
            stock: 10,
          },
        ],
      })
    )
    const client = new FazerClient({ apiKey: "k", fetchImpl, sleepImpl: noSleep })

    const items = await client.listCatalogItemsForSkus([
      "giftcard:steam_wallet_global:5_usd",
    ])

    expect(items).toHaveLength(1)
    expect(items[0]).toMatchObject({
      id: "giftcard:steam_wallet_global:5_usd",
      price_usd: 5.2,
      in_stock: true,
      category: "gift-cards",
    })
    expect(fetchImpl.mock.calls[0][0]).toContain("/giftcards/cards?category_id=steam_wallet_global")
  })

  it("retries on 429 honoring Retry-After, then succeeds", async () => {
    const fetchImpl = jest
      .fn()
      .mockResolvedValueOnce(jsonResponse({ error: "rate limited" }, { status: 429, headers: { "retry-after": "1" } }))
      .mockResolvedValueOnce(jsonResponse({ ok: true, balance: "42.0000", currency: "USD" }))
    const sleep = jest.fn().mockResolvedValue(undefined)
    const client = new FazerClient({ apiKey: "k", fetchImpl, sleepImpl: sleep, retries: 3 })

    const balance = await client.getBalance()

    expect(balance.balance_usd).toBe(42)
    expect(fetchImpl).toHaveBeenCalledTimes(2)
    expect(sleep).toHaveBeenCalledWith(1000)
  })

  it("retries on 5xx up to the limit then throws FazerApiError", async () => {
    const fetchImpl = jest
      .fn()
      .mockImplementation(() => jsonResponse({ error: "boom" }, { status: 503 }))
    const client = new FazerClient({ apiKey: "k", fetchImpl, sleepImpl: noSleep, retries: 2 })

    await expect(client.getBalance()).rejects.toBeInstanceOf(FazerApiError)
    expect(fetchImpl).toHaveBeenCalledTimes(3)
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
    expect(fetchImpl).toHaveBeenCalledTimes(2)
  })

  it("creates a gift card order with Idempotency-Key", async () => {
    const fetchImpl = jest.fn().mockResolvedValue(
      jsonResponse({
        ok: true,
        order: {
          id: "ord-1",
          status: "completed",
          cards: ["ABC-123"],
        },
      })
    )
    const client = new FazerClient({ apiKey: "k", fetchImpl, sleepImpl: noSleep })

    const order = await client.createOrder({
      sku_id: "giftcard:steam_wallet_global:5_usd",
      quantity: 1,
      idempotency_key: "idem-1",
    })

    expect(order.codes).toEqual(["ABC-123"])
    const [url, opts] = fetchImpl.mock.calls[0]
    expect(url).toContain("/giftcards/order")
    expect((opts.headers as Record<string, string>)["Idempotency-Key"]).toBe("idem-1")
    expect(opts.method).toBe("POST")
  })
})
