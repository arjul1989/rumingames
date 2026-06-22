import { FazerApiError, FazerNetworkError, FazerTimeoutError } from "./errors"
import type {
  FazerBalance,
  FazerCatalogPage,
  FazerCatalogParams,
  FazerCreateOrderInput,
  FazerOrder,
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

const defaultSleep = (ms: number) => new Promise((r) => setTimeout(r, ms))

/**
 * Minimal typed client for the Fazer Cards reseller API.
 * Retries on 429 (honoring Retry-After), 5xx, and network/timeout errors
 * with exponential backoff + jitter. Does not retry other 4xx responses.
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

  getCatalog(params: FazerCatalogParams = {}): Promise<FazerCatalogPage> {
    const qs = new URLSearchParams()
    if (params.category) qs.set("category", params.category)
    if (params.limit != null) qs.set("limit", String(params.limit))
    if (params.offset != null) qs.set("offset", String(params.offset))
    const suffix = qs.toString() ? `?${qs.toString()}` : ""
    return this.request<FazerCatalogPage>("GET", `/catalog${suffix}`)
  }

  getBalance(): Promise<FazerBalance> {
    return this.request<FazerBalance>("GET", "/balance")
  }

  createOrder(input: FazerCreateOrderInput): Promise<FazerOrder> {
    return this.request<FazerOrder>("POST", "/order", input, {
      "Idempotency-Key": input.idempotency_key,
    })
  }

  getOrder(id: string): Promise<FazerOrder> {
    return this.request<FazerOrder>("GET", `/order/${encodeURIComponent(id)}`)
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

        if (response.ok) {
          return (await this.parseJson(response)) as T
        }

        // Retry 429 and 5xx; surface other 4xx immediately.
        if (this.isRetryable(response.status) && attempt < this.retries) {
          await this.sleep(this.backoffMs(attempt, response))
          attempt++
          continue
        }

        const errorBody = await this.parseJson(response).catch(() => null)
        throw new FazerApiError(response.status, errorBody)
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
    // Honor Retry-After (seconds) on 429 when present.
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
