import crypto from "crypto"
import type {
  MpCreatePaymentInput,
  MpCustomer,
  MpPayment,
  MpRefund,
  MpSavedCard,
} from "./types"

const DEFAULT_BASE_URL = "https://api.mercadopago.com"
const DEFAULT_TIMEOUT_MS = 20_000

export interface MercadoPagoClientOptions {
  accessToken: string
  baseUrl?: string
  timeoutMs?: number
  fetchImpl?: typeof fetch
}

export class MercadoPagoError extends Error {
  constructor(
    public readonly status: number,
    public readonly body: unknown
  ) {
    super(`Mercado Pago API error ${status}: ${JSON.stringify(body)}`)
    this.name = "MercadoPagoError"
  }
}

// Minimal fetch-based client for the Mercado Pago payments API (US-3.1 / RUM-23).
export class MercadoPagoClient {
  private readonly accessToken: string
  private readonly baseUrl: string
  private readonly timeoutMs: number
  private readonly fetchImpl: typeof fetch

  constructor(options: MercadoPagoClientOptions) {
    if (!options.accessToken) {
      throw new Error("MercadoPagoClient requires an accessToken.")
    }
    this.accessToken = options.accessToken
    this.baseUrl = (options.baseUrl ?? DEFAULT_BASE_URL).replace(/\/$/, "")
    this.timeoutMs = options.timeoutMs ?? DEFAULT_TIMEOUT_MS
    this.fetchImpl = options.fetchImpl ?? globalThis.fetch
  }

  createPayment(input: MpCreatePaymentInput, idempotencyKey: string): Promise<MpPayment> {
    return this.request<MpPayment>("POST", "/v1/payments", input, {
      "X-Idempotency-Key": idempotencyKey,
    })
  }

  getPayment(id: string | number): Promise<MpPayment> {
    return this.request<MpPayment>("GET", `/v1/payments/${id}`)
  }

  cancelPayment(id: string | number): Promise<MpPayment> {
    return this.request<MpPayment>("PUT", `/v1/payments/${id}`, { status: "cancelled" })
  }

  refundPayment(id: string | number, amount?: number): Promise<MpRefund> {
    return this.request<MpRefund>(
      "POST",
      `/v1/payments/${id}/refunds`,
      amount != null ? { amount } : {},
      { "X-Idempotency-Key": crypto.randomUUID() }
    )
  }

  createCustomer(input: {
    email: string
    first_name?: string
    last_name?: string
  }): Promise<MpCustomer> {
    return this.request<MpCustomer>("POST", "/v1/customers", input)
  }

  searchCustomers(email: string): Promise<{ results?: MpCustomer[] }> {
    const qs = new URLSearchParams({ email })
    return this.request("GET", `/v1/customers/search?${qs.toString()}`)
  }

  listCustomerCards(customerId: string): Promise<MpSavedCard[]> {
    return this.request<MpSavedCard[]>("GET", `/v1/customers/${customerId}/cards`)
  }

  saveCustomerCard(customerId: string, token: string): Promise<MpSavedCard> {
    return this.request<MpSavedCard>("POST", `/v1/customers/${customerId}/cards`, {
      token,
    })
  }

  deleteCustomerCard(customerId: string, cardId: string): Promise<void> {
    return this.request<void>("DELETE", `/v1/customers/${customerId}/cards/${cardId}`)
  }

  private async request<T>(
    method: string,
    path: string,
    body?: unknown,
    extraHeaders: Record<string, string> = {}
  ): Promise<T> {
    const controller = new AbortController()
    const timer = setTimeout(() => controller.abort(), this.timeoutMs)
    try {
      const res = await this.fetchImpl(`${this.baseUrl}${path}`, {
        method,
        headers: {
          Authorization: `Bearer ${this.accessToken}`,
          "Content-Type": "application/json",
          Accept: "application/json",
          ...extraHeaders,
        },
        body: body != null ? JSON.stringify(body) : undefined,
        signal: controller.signal,
      })
      const text = await res.text()
      const json = text ? JSON.parse(text) : null
      if (!res.ok) {
        throw new MercadoPagoError(res.status, json)
      }
      return json as T
    } finally {
      clearTimeout(timer)
    }
  }
}
