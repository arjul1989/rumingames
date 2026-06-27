import type {
  CreateEpaycoChargeInput,
  EpaycoChargeResponse,
  EpaycoCustomer,
  EpaycoLoginResponse,
  EpaycoToken,
  EpaycoTransaction,
} from "./types"

const API_BASE = "https://api.secure.payco.co"
const SECURE_BASE = "https://secure.payco.co"
const DEFAULT_TIMEOUT_MS = 25_000

export interface EpaycoClientOptions {
  publicKey: string
  privateKey: string
  testMode?: boolean
  timeoutMs?: number
  fetchImpl?: typeof fetch
}

export class EpaycoError extends Error {
  constructor(
    public readonly status: number,
    public readonly body: unknown
  ) {
    super(`ePayco API error ${status}: ${JSON.stringify(body)}`)
    this.name = "EpaycoError"
  }
}

export class EpaycoClient {
  private readonly publicKey: string
  private readonly privateKey: string
  private readonly testMode: boolean
  private readonly timeoutMs: number
  private readonly fetchImpl: typeof fetch
  private bearerToken: string | null = null
  private tokenExpiresAt = 0

  constructor(options: EpaycoClientOptions) {
    if (!options.publicKey || !options.privateKey) {
      throw new Error("EpaycoClient requires publicKey and privateKey.")
    }
    this.publicKey = options.publicKey
    this.privateKey = options.privateKey
    this.testMode = options.testMode ?? true
    this.timeoutMs = options.timeoutMs ?? DEFAULT_TIMEOUT_MS
    this.fetchImpl = options.fetchImpl ?? globalThis.fetch
  }

  async createToken(input: {
    number: string
    exp_year: string
    exp_month: string
    cvc: string
  }): Promise<EpaycoToken> {
    const token = await this.getBearerToken()
    const res = await this.request<{ data?: EpaycoToken; id?: string }>(
      "POST",
      `${API_BASE}/v1/tokens`,
      token,
      {
        "card[number]": input.number,
        "card[exp_year]": input.exp_year,
        "card[exp_month]": input.exp_month.padStart(2, "0"),
        "card[cvc]": input.cvc,
        hasCvv: true,
      }
    )
    const data = res.data ?? res
    if (!data.id) {
      throw new Error("ePayco tokenization did not return a token id.")
    }
    return data as EpaycoToken
  }

  async createCustomer(input: {
    tokenCard: string
    email: string
    name: string
    lastName: string
  }): Promise<EpaycoCustomer> {
    const token = await this.getBearerToken()
    const res = await this.request<{ data?: EpaycoCustomer; success?: boolean }>(
      "POST",
      `${API_BASE}/payment/v1/customer/create`,
      token,
      {
        token_card: input.tokenCard,
        email: input.email,
        name: input.name,
        last_name: input.lastName,
        default: true,
      }
    )
    const customerId = res.data?.customerId
    if (!customerId) {
      throw new Error("ePayco customer creation failed.")
    }
    return { customerId, email: input.email }
  }

  async createCharge(input: CreateEpaycoChargeInput): Promise<EpaycoChargeResponse> {
    const token = await this.getBearerToken()
    const amount = Math.round(Number(input.amountPesos))
    const body = {
      token_card: input.tokenCard,
      customer_id: input.customerId,
      doc_type: input.docType,
      doc_number: input.docNumber,
      name: input.firstName,
      last_name: input.lastName,
      email: input.customerEmail,
      bill: input.reference,
      description: input.description ?? `Pedido ${input.reference}`,
      value: String(amount),
      tax: "0",
      tax_base: "0",
      currency: "COP",
      dues: "1",
      city: input.city ?? "Bogota",
      address: input.address ?? "N/A",
      phone: input.phone ?? "3000000000",
      cell_phone: input.phone ?? "3000000000",
      country: "CO",
      ip: input.ip,
      url_response: input.redirectUrl,
      url_confirmation: input.confirmationUrl,
      method_confirmation: "POST",
      test: input.testMode ?? this.testMode,
      extras: {
        extra1: "",
        extra2: "",
        extra3: "",
        extra4: "",
        extra5: "P44",
        extra6: "",
      },
    }

    return this.request<EpaycoChargeResponse>(
      "POST",
      `${API_BASE}/payment/v1/charge/create`,
      token,
      body
    )
  }

  async getTransaction(refPayco: string): Promise<EpaycoTransaction> {
    const url = `${SECURE_BASE}/restpagos/transaction/response.json?ref_payco=${encodeURIComponent(refPayco)}&public_key=${encodeURIComponent(this.publicKey)}`
    const res = await this.request<{ data?: EpaycoTransaction; success?: boolean }>(
      "GET",
      url,
      null
    )
    const tx = res.data
    if (!tx?.ref_payco) {
      throw new Error(`ePayco transaction not found: ${refPayco}`)
    }
    return tx
  }

  private async getBearerToken(): Promise<string> {
    if (this.bearerToken && Date.now() < this.tokenExpiresAt) {
      return this.bearerToken
    }

    const res = await this.request<EpaycoLoginResponse>(
      "POST",
      `${API_BASE}/v1/auth/login`,
      null,
      {
        public_key: this.publicKey,
        private_key: this.privateKey,
      }
    )

    const bearer = res.token ?? res.bearer_token
    if (!bearer) {
      throw new Error("ePayco login did not return a bearer token.")
    }

    this.bearerToken = bearer
    this.tokenExpiresAt = Date.now() + 50 * 60 * 1000
    return bearer
  }

  private async request<T>(
    method: string,
    url: string,
    bearer: string | null,
    body?: unknown
  ): Promise<T> {
    const controller = new AbortController()
    const timer = setTimeout(() => controller.abort(), this.timeoutMs)
    try {
      const headers: Record<string, string> = {
        Accept: "application/json",
        "Content-Type": "application/json",
        lang: "NODE",
        type: "sdk-jwt",
      }
      if (bearer) {
        headers.Authorization = `Bearer ${bearer}`
      }

      const res = await this.fetchImpl(url, {
        method,
        headers,
        body: body != null ? JSON.stringify(body) : undefined,
        signal: controller.signal,
      })

      const text = await res.text()
      const json = text ? JSON.parse(text) : null
      if (!res.ok) {
        throw new EpaycoError(res.status, json)
      }
      return json as T
    } finally {
      clearTimeout(timer)
    }
  }
}
