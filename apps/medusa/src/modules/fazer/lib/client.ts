import { FazerApiError, FazerNetworkError, FazerTimeoutError } from "./errors"
import { formatFazerSku, parseFazerSku } from "./sku"
import type {
  FazerBalance,
  FazerCatalogItem,
  FazerCatalogPage,
  FazerCatalogParams,
  FazerCategoryListPage,
  FazerCreateOrderInput,
  FazerGiftCardCategoryDetail,
  FazerGiftCardOffer,
  FazerOrder,
  FazerOrderStatus,
  FazerPayment,
  FazerPaymentMethod,
  FazerCreatePaymentInput,
  FazerTopupCategoryDetail,
  FazerTopupOffer,
} from "./types"

export interface FazerClientOptions {
  apiKey: string
  baseUrl?: string
  timeoutMs?: number
  /** Max retry attempts on 429 / 5xx / network errors (0 disables). */
  retries?: number
  /** Injectable fetch for testing. */
  fetchImpl?: typeof fetch
  /** Injectable sleep for testing backoff without real delays. */
  sleepImpl?: (ms: number) => Promise<void>
}

const DEFAULT_BASE_URL = "https://api.fzr.cards/api/v2"
const DEFAULT_TIMEOUT_MS = 30_000
const DEFAULT_RETRIES = 3

const defaultSleep = (ms: number): Promise<void> =>
  new Promise((r) => setTimeout(r, ms))

type ApiEnvelope<T> = { ok: true } & T
type ApiErrorEnvelope = { ok: false; error: string; code?: string }

/**
 * Typed client for the Fazer Cards reseller API v2.
 * Catalog is split across giftcards/cards and topups/offers (no /catalog route).
 */
export class FazerClient {
  private readonly apiKey: string
  private readonly baseUrl: string
  private readonly timeoutMs: number
  private readonly retries: number
  private readonly fetchImpl: typeof fetch
  private readonly sleep: (ms: number) => Promise<void>

  constructor(options: FazerClientOptions) {
    if (!options.apiKey) {
      throw new Error("FazerClient requires an apiKey.")
    }
    this.apiKey = options.apiKey
    this.baseUrl = (options.baseUrl ?? DEFAULT_BASE_URL).replace(/\/$/, "")
    this.timeoutMs = options.timeoutMs ?? DEFAULT_TIMEOUT_MS
    this.retries = options.retries ?? DEFAULT_RETRIES
    this.fetchImpl = options.fetchImpl ?? globalThis.fetch
    this.sleep = options.sleepImpl ?? defaultSleep
  }

  /** @deprecated Use listCatalogItemsForSkus. Kept for callers that paginate categories. */
  async getCatalog(params: FazerCatalogParams = {}): Promise<FazerCatalogPage> {
    const items = await this.listCatalogItemsForSkus([])
    const offset = params.offset ?? 0
    const limit = params.limit ?? items.length
    const slice = items.slice(offset, offset + limit)
    return { items: slice, total: items.length, limit, offset }
  }

  /** Fetches live wholesale prices for the given encoded sku ids. */
  async listCatalogItemsForSkus(skuIds: string[]): Promise<FazerCatalogItem[]> {
    const byCategory = new Map<string, { kind: "giftcard" | "topup"; offers: Set<string> }>()

    for (const skuId of skuIds) {
      const parsed = parseFazerSku(skuId)
      if (!parsed) continue
      const entry = byCategory.get(parsed.category_id) ?? {
        kind: parsed.kind,
        offers: new Set<string>(),
      }
      entry.offers.add(parsed.offer_id)
      byCategory.set(parsed.category_id, entry)
    }

    const items: FazerCatalogItem[] = []
    for (const [categoryId, { kind, offers }] of byCategory) {
      if (kind === "giftcard") {
        const page = await this.getGiftCardOffers(categoryId)
        for (const offer of page.offers) {
          if (!offers.has(offer.card_id)) continue
          items.push(this.giftCardToCatalogItem(categoryId, offer))
        }
      } else {
        const page = await this.getTopupOffers(categoryId)
        for (const offer of page.offers) {
          if (!offers.has(offer.offer_id)) continue
          items.push(this.topupToCatalogItem(categoryId, offer))
        }
      }
    }
    return items
  }

  async listGiftCardCategories(cursor?: string, limit = 200): Promise<FazerCategoryListPage> {
    const qs = new URLSearchParams({ limit: String(limit), include_ui: "1" })
    if (cursor) qs.set("cursor", cursor)
    const body = await this.request<
      ApiEnvelope<{
        items: FazerCategoryListPage["items"]
        meta: FazerCategoryListPage["meta"]
      }>
    >("GET", `/giftcards?${qs}`)
    return { items: body.items ?? [], meta: body.meta }
  }

  async listTopupCategories(cursor?: string, limit = 200): Promise<FazerCategoryListPage> {
    const qs = new URLSearchParams({ limit: String(limit), include_ui: "1" })
    if (cursor) qs.set("cursor", cursor)
    const body = await this.request<
      ApiEnvelope<{
        items: FazerCategoryListPage["items"]
        meta: FazerCategoryListPage["meta"]
      }>
    >("GET", `/topups?${qs}`)
    return { items: body.items ?? [], meta: body.meta }
  }

  async getGiftCardCategoryDetail(categoryId: string): Promise<FazerGiftCardCategoryDetail> {
    const body = await this.request<ApiEnvelope<FazerGiftCardCategoryDetail>>(
      "GET",
      `/giftcards/cards?category_id=${encodeURIComponent(categoryId)}&include_ui=1`
    )
    return {
      category_id: body.category_id,
      name: body.name,
      note: body.note,
      imageurl: body.imageurl,
      offers: body.offers ?? [],
    }
  }

  async getTopupCategoryDetail(categoryId: string): Promise<FazerTopupCategoryDetail> {
    const body = await this.request<ApiEnvelope<FazerTopupCategoryDetail>>(
      "GET",
      `/topups/offers?category_id=${encodeURIComponent(categoryId)}&include_ui=1`
    )
    return {
      category_id: body.category_id,
      name: body.name,
      note: body.note,
      imageurl: body.imageurl,
      offers: body.offers ?? [],
      fields: body.fields,
    }
  }

  async getBalance(): Promise<FazerBalance> {
    const body = await this.request<ApiEnvelope<{ balance: string; currency: string }>>(
      "GET",
      "/balance"
    )
    return {
      balance_usd: Number(body.balance),
      currency: body.currency,
    }
  }

  async listPaymentMethods(): Promise<FazerPaymentMethod[]> {
    const body = await this.request<
      ApiEnvelope<{ methods?: FazerPaymentMethod[] }> | FazerPaymentMethod[]
    >("GET", "/payments/methods")
    if (Array.isArray(body)) return body
    return body.methods ?? []
  }

  async createPayment(input: FazerCreatePaymentInput): Promise<FazerPayment> {
    const body = await this.request<ApiEnvelope<{ payment?: Record<string, unknown> }>>(
      "POST",
      "/payments",
      {
        method: input.method,
        amount_usd: String(input.amount_usd),
      },
      { "Idempotency-Key": input.idempotency_key }
    )
    return this.normalizePayment(body.payment ?? body)
  }

  async getPayment(id: string): Promise<FazerPayment> {
    const body = await this.request<ApiEnvelope<{ payment?: Record<string, unknown> }>>(
      "GET",
      `/payments/${encodeURIComponent(id)}`
    )
    return this.normalizePayment(body.payment ?? body)
  }

  async confirmPayment(id: string, input: { tx_id: string }): Promise<FazerPayment> {
    const body = await this.request<ApiEnvelope<{ payment?: Record<string, unknown> }>>(
      "POST",
      `/payments/${encodeURIComponent(id)}/confirm`,
      { tx_id: input.tx_id }
    )
    return this.normalizePayment(body.payment ?? body)
  }

  async createOrder(input: FazerCreateOrderInput): Promise<FazerOrder> {
    const parsed = parseFazerSku(input.sku_id)
    if (!parsed) {
      throw new Error(`Invalid Fazer sku_id format: ${input.sku_id}`)
    }

    const headers = { "Idempotency-Key": input.idempotency_key }

    if (parsed.kind === "giftcard") {
      const body = await this.request<ApiEnvelope<{ order: Record<string, unknown> }>>(
        "POST",
        "/giftcards/order",
        {
          category_id: parsed.category_id,
          card_id: parsed.offer_id,
          quantity: input.quantity,
        },
        headers
      )
      return this.normalizeOrder(body.order, input)
    }

    if (!input.external_id) {
      throw new Error("Top-up orders require external_id (player id).")
    }

    const body = await this.request<ApiEnvelope<{ order: Record<string, unknown> }>>(
      "POST",
      "/topups/order",
      {
        category_id: parsed.category_id,
        offer_id: parsed.offer_id,
        fields: { player_id: input.external_id },
      },
      headers
    )
    return this.normalizeOrder(body.order, input)
  }

  async getOrder(id: string): Promise<FazerOrder> {
    const body = await this.request<ApiEnvelope<{ order: Record<string, unknown> }>>(
      "GET",
      `/orders/${encodeURIComponent(id)}`
    )
    return this.normalizeOrder(body.order)
  }

  private async getGiftCardOffers(
    categoryId: string
  ): Promise<{ offers: FazerGiftCardOffer[] }> {
    const detail = await this.getGiftCardCategoryDetail(categoryId)
    return { offers: detail.offers }
  }

  private async getTopupOffers(
    categoryId: string
  ): Promise<{ offers: FazerTopupOffer[] }> {
    const detail = await this.getTopupCategoryDetail(categoryId)
    return { offers: detail.offers }
  }

  private giftCardToCatalogItem(
    categoryId: string,
    offer: FazerGiftCardOffer
  ): FazerCatalogItem {
    const stock = offer.stock ?? 0
    return {
      id: formatFazerSku("giftcard", categoryId, offer.card_id),
      name: offer.name,
      category: "gift-cards",
      price_usd: Number(offer.price_usd),
      currency: "USD",
      in_stock: stock > 0,
    }
  }

  private topupToCatalogItem(categoryId: string, offer: FazerTopupOffer): FazerCatalogItem {
    return {
      id: formatFazerSku("topup", categoryId, offer.offer_id),
      name: offer.name,
      category: "top-ups",
      price_usd: Number(offer.price_usd),
      currency: "USD",
      in_stock: true,
    }
  }

  private normalizeOrder(
    raw: Record<string, unknown>,
    input?: FazerCreateOrderInput
  ): FazerOrder {
    const status = String(raw.status ?? "pending").toLowerCase() as FazerOrderStatus
    const cards = this.extractCodes(raw)
    return {
      id: String(raw.id ?? raw.order_id ?? ""),
      status,
      sku_id: input?.sku_id ?? String(raw.sku_id ?? ""),
      quantity: input?.quantity ?? Number(raw.quantity ?? 1),
      codes: cards.length ? cards : undefined,
      error: raw.error ? String(raw.error) : undefined,
    }
  }

  private normalizePayment(raw: Record<string, unknown>): FazerPayment {
    return {
      id: String(raw.id ?? raw.payment_id ?? ""),
      method: String(raw.method ?? "binancepay"),
      amount_usd: String(raw.amount_usd ?? raw.amount ?? "0"),
      status: raw.status ? String(raw.status) : undefined,
      pay_to: raw.pay_to ? String(raw.pay_to) : undefined,
      pay_url: raw.pay_url ? String(raw.pay_url) : undefined,
    }
  }

  private extractCodes(raw: Record<string, unknown>): string[] {
    const cards = raw.cards
    if (Array.isArray(cards)) {
      return cards
        .map((c) => {
          if (typeof c === "string") return c
          if (c && typeof c === "object" && "code" in c) return String((c as { code: unknown }).code)
          return null
        })
        .filter((c): c is string => !!c)
    }
    if (typeof raw.code === "string") return [raw.code]
    return []
  }

  private async request<T>(
    method: string,
    path: string,
    body?: unknown,
    extraHeaders: Record<string, string> = {}
  ): Promise<T> {
    const url = `${this.baseUrl}${path}`
    let attempt = 0

    while (true) {
      try {
        const response = await this.fetchWithTimeout(url, method, body, extraHeaders)
        const parsed = (await this.parseJson(response)) as T | ApiErrorEnvelope

        if (response.ok) {
          if (parsed && typeof parsed === "object" && "ok" in parsed && parsed.ok === false) {
            throw new FazerApiError(response.status, parsed)
          }
          return parsed as T
        }

        if (this.isRetryable(response.status) && attempt < this.retries) {
          await this.sleep(this.backoffMs(attempt, response))
          attempt++
          continue
        }

        throw new FazerApiError(response.status, parsed)
      } catch (err) {
        if (err instanceof FazerApiError) {
          throw err
        }

        const isTimeout = (err as Error)?.name === "AbortError"
        if (attempt < this.retries) {
          await this.sleep(this.backoffMs(attempt))
          attempt++
          continue
        }
        throw isTimeout
          ? new FazerTimeoutError(this.timeoutMs)
          : new FazerNetworkError(err)
      }
    }
  }

  private async fetchWithTimeout(
    url: string,
    method: string,
    body: unknown,
    extraHeaders: Record<string, string>
  ): Promise<Response> {
    const controller = new AbortController()
    const timer = setTimeout(() => controller.abort(), this.timeoutMs)
    try {
      return await this.fetchImpl(url, {
        method,
        headers: {
          "X-Api-Key": this.apiKey,
          "Content-Type": "application/json",
          Accept: "application/json",
          ...extraHeaders,
        },
        body: body != null ? JSON.stringify(body) : undefined,
        signal: controller.signal,
      })
    } finally {
      clearTimeout(timer)
    }
  }

  private async parseJson(response: Response): Promise<unknown> {
    const text = await response.text()
    return text ? JSON.parse(text) : null
  }

  private isRetryable(status: number): boolean {
    return status === 429 || (status >= 500 && status < 600)
  }

  private backoffMs(attempt: number, response?: Response): number {
    const retryAfter = response?.headers?.get?.("retry-after")
    if (retryAfter) {
      const seconds = Number(retryAfter)
      if (!Number.isNaN(seconds)) {
        return seconds * 1000
      }
    }
    const base = Math.min(1000 * 2 ** attempt, 10_000)
    return base + Math.floor(Math.random() * 250)
  }
}
