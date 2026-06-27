import type { WompiApiEnvelope, WompiTransaction } from "./types"

const DEFAULT_BASE_URL = "https://sandbox.wompi.co/v1"
const DEFAULT_TIMEOUT_MS = 20_000

export interface WompiClientOptions {
  publicKey: string
  privateKey: string
  baseUrl?: string
  timeoutMs?: number
  fetchImpl?: typeof fetch
}

export class WompiError extends Error {
  constructor(
    public readonly status: number,
    public readonly body: unknown
  ) {
    super(`Wompi API error ${status}: ${JSON.stringify(body)}`)
    this.name = "WompiError"
  }
}

export class WompiClient {
  private readonly publicKey: string
  private readonly privateKey: string
  private readonly baseUrl: string
  private readonly timeoutMs: number
  private readonly fetchImpl: typeof fetch

  constructor(options: WompiClientOptions) {
    if (!options.publicKey || !options.privateKey) {
      throw new Error("WompiClient requires publicKey and privateKey.")
    }
    this.publicKey = options.publicKey
    this.privateKey = options.privateKey
    this.baseUrl = (options.baseUrl ?? DEFAULT_BASE_URL).replace(/\/$/, "")
    this.timeoutMs = options.timeoutMs ?? DEFAULT_TIMEOUT_MS
    this.fetchImpl = options.fetchImpl ?? globalThis.fetch
  }

  getTransaction(id: string): Promise<WompiTransaction> {
    return this.request<WompiApiEnvelope<WompiTransaction>>(
      "GET",
      `/transactions/${id}`,
      this.publicKey
    ).then((res) => res.data)
  }

  voidTransaction(id: string): Promise<WompiTransaction> {
    return this.request<WompiApiEnvelope<WompiTransaction>>(
      "POST",
      `/transactions/${id}/void`,
      this.privateKey
    ).then((res) => res.data)
  }

  private async request<T>(
    method: string,
    path: string,
    bearer: string,
    body?: unknown
  ): Promise<T> {
    const controller = new AbortController()
    const timer = setTimeout(() => controller.abort(), this.timeoutMs)
    try {
      const res = await this.fetchImpl(`${this.baseUrl}${path}`, {
        method,
        headers: {
          Authorization: `Bearer ${bearer}`,
          "Content-Type": "application/json",
          Accept: "application/json",
        },
        body: body != null ? JSON.stringify(body) : undefined,
        signal: controller.signal,
      })
      const text = await res.text()
      const json = text ? JSON.parse(text) : null
      if (!res.ok) {
        throw new WompiError(res.status, json)
      }
      return json as T
    } finally {
      clearTimeout(timer)
    }
  }
}
