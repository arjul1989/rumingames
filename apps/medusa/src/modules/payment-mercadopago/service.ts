import crypto from "crypto"
import {
  AbstractPaymentProvider,
  BigNumber,
  MedusaError,
  PaymentSessionStatus,
} from "@medusajs/framework/utils"
import type { Logger } from "@medusajs/framework/types"
import type {
  AuthorizePaymentInput,
  AuthorizePaymentOutput,
  CancelPaymentInput,
  CancelPaymentOutput,
  CapturePaymentInput,
  CapturePaymentOutput,
  DeletePaymentInput,
  DeletePaymentOutput,
  GetPaymentStatusInput,
  GetPaymentStatusOutput,
  InitiatePaymentInput,
  InitiatePaymentOutput,
  ProviderWebhookPayload,
  RefundPaymentInput,
  RefundPaymentOutput,
  RetrievePaymentInput,
  RetrievePaymentOutput,
  UpdatePaymentInput,
  UpdatePaymentOutput,
  WebhookActionResult,
} from "@medusajs/framework/types"
import { MercadoPagoClient } from "./lib/client"
import { createMockMercadoPagoClient } from "./lib/mock-client"
import { buildMpCreatePaymentPayload } from "./lib/build-payment-payload"
import { isMockMpEnabled } from "../../lib/dev-mocks"
import { mpRedirectUrl } from "./lib/enabled-methods"
import { buildMpPaymentSnapshot } from "./lib/mp-payment-snapshot"
import {
  medusaAuthorizeStatusFromMpPayment,
  mpStatusToAction,
  mpStatusToSessionStatus,
} from "./lib/status"
import type { MpPayment } from "./lib/types"

export interface MercadoPagoOptions {
  accessToken: string
  publicKey?: string
  webhookSecret?: string
  /** es-CO for Colombia. */
  locale?: string
  baseUrl?: string
  notificationUrl?: string
  /** Buyer return URL after PSE / bank redirect. */
  callbackUrl?: string
  /** Shown on the buyer's card statement. */
  statementDescriptor?: string
}

type InjectedDependencies = { logger: Logger }

type MpClientLike = Pick<
  MercadoPagoClient,
  "createPayment" | "getPayment" | "cancelPayment" | "refundPayment"
>

// Mercado Pago payment provider for Medusa v2, tuned for Colombia (es-CO / COP)
// with card and PSE support via Checkout Bricks (US-3.1 / RUM-23).
class MercadoPagoProviderService extends AbstractPaymentProvider<MercadoPagoOptions> {
  static identifier = "mercadopago"

  protected readonly logger_: Logger
  protected readonly options_: MercadoPagoOptions
  protected readonly client_: MpClientLike

  constructor(container: InjectedDependencies, options: MercadoPagoOptions) {
    super(container, options)
    this.logger_ = container.logger
    this.options_ = options
    if (isMockMpEnabled()) {
      this.client_ = createMockMercadoPagoClient()
      this.logger_.warn(
        "MOCK_MP=true — Mercado Pago API mocked; use /dev/mock-mp to approve/reject."
      )
    } else {
      this.client_ = new MercadoPagoClient({
        accessToken: options.accessToken,
        baseUrl: options.baseUrl,
      })
    }
  }

  static validateOptions(options: Record<string, unknown>) {
    if (!options.accessToken) {
      throw new MedusaError(
        MedusaError.Types.INVALID_DATA,
        "Mercado Pago provider requires an `accessToken` option."
      )
    }
  }

  private toNumber(amount: unknown): number {
    return new BigNumber(amount as number).numeric
  }

  async initiatePayment(input: InitiatePaymentInput): Promise<InitiatePaymentOutput> {
    const incoming = (input.data ?? {}) as Record<string, unknown>
    const id = (incoming.session_id as string) ?? `mp_${crypto.randomUUID()}`
    return {
      id,
      status: PaymentSessionStatus.PENDING,
      data: {
        ...incoming,
        session_id: id,
        amount: this.toNumber(input.amount),
        currency_code: input.currency_code,
        mp_public_key: this.options_.publicKey ?? null,
        locale: this.options_.locale ?? "es-CO",
      },
    }
  }

  async updatePayment(input: UpdatePaymentInput): Promise<UpdatePaymentOutput> {
    return {
      status: PaymentSessionStatus.PENDING,
      data: {
        ...(input.data ?? {}),
        amount: this.toNumber(input.amount),
        currency_code: input.currency_code,
      },
    }
  }

  async authorizePayment(input: AuthorizePaymentInput): Promise<AuthorizePaymentOutput> {
    const data = input.data ?? {}

    if (data.mp_payment_id) {
      const existing = await this.client_.getPayment(data.mp_payment_id as number)
      return {
        status: medusaAuthorizeStatusFromMpPayment(existing),
        data: this.mergePayment(data, existing),
      }
    }

    const sessionId = (data.session_id as string) ?? crypto.randomUUID()

    let payload
    try {
      const ctx = (input.context ?? {}) as Record<string, unknown>
      payload = buildMpCreatePaymentPayload(
        {
          ...data,
          session_id: sessionId,
          ip_address: data.ip_address ?? ctx.ip_address ?? ctx.customer_ip,
        },
        {
          notificationUrl: this.options_.notificationUrl,
          callbackUrl: this.options_.callbackUrl,
          statementDescriptor: this.options_.statementDescriptor,
        }
      )
    } catch (e) {
      throw new MedusaError(
        MedusaError.Types.INVALID_DATA,
        (e as Error).message
      )
    }

    try {
      const payment = await this.client_.createPayment(payload, sessionId)
      return {
        status: medusaAuthorizeStatusFromMpPayment(payment),
        data: this.mergePayment(data, payment),
      }
    } catch (e) {
      const message = (e as Error).message
      this.logger_.error(`Mercado Pago authorize failed: ${message}`)
      return {
        status: PaymentSessionStatus.ERROR,
        data: { ...data, mp_error: message },
      }
    }
  }

  async capturePayment(input: CapturePaymentInput): Promise<CapturePaymentOutput> {
    const data = input.data ?? {}
    if (!data.mp_payment_id) {
      return { data }
    }
    // Cards are auto-captured by Mercado Pago; just refresh the stored state.
    const payment = await this.client_.getPayment(data.mp_payment_id as number)
    return { data: this.mergePayment(data, payment) }
  }

  async getPaymentStatus(input: GetPaymentStatusInput): Promise<GetPaymentStatusOutput> {
    const data = input.data ?? {}
    if (!data.mp_payment_id) {
      return { status: PaymentSessionStatus.PENDING, data }
    }
    const payment = await this.client_.getPayment(data.mp_payment_id as number)
    return { status: mpStatusToSessionStatus(payment.status), data: this.mergePayment(data, payment) }
  }

  async refundPayment(input: RefundPaymentInput): Promise<RefundPaymentOutput> {
    const data = input.data ?? {}
    if (!data.mp_payment_id) {
      throw new MedusaError(
        MedusaError.Types.INVALID_DATA,
        "Cannot refund: missing Mercado Pago payment id."
      )
    }
    const refund = await this.client_.refundPayment(
      data.mp_payment_id as number,
      this.toNumber(input.amount)
    )
    return { data: { ...data, mp_refund_id: refund.id } }
  }

  async cancelPayment(input: CancelPaymentInput): Promise<CancelPaymentOutput> {
    const data = input.data ?? {}
    if (!data.mp_payment_id) {
      return { data }
    }
    try {
      const payment = await this.client_.cancelPayment(data.mp_payment_id as number)
      return { data: this.mergePayment(data, payment) }
    } catch (e) {
      this.logger_.warn(`Mercado Pago cancel failed: ${(e as Error).message}`)
      return { data }
    }
  }

  async deletePayment(input: DeletePaymentInput): Promise<DeletePaymentOutput> {
    return { data: input.data ?? {} }
  }

  async retrievePayment(input: RetrievePaymentInput): Promise<RetrievePaymentOutput> {
    const data = input.data ?? {}
    if (!data.mp_payment_id) {
      return { data }
    }
    const payment = await this.client_.getPayment(data.mp_payment_id as number)
    return { data: this.mergePayment(data, payment) }
  }

  async getWebhookActionAndData(
    payload: ProviderWebhookPayload["payload"]
  ): Promise<WebhookActionResult> {
    const body = (payload.data ?? {}) as Record<string, any>
    const paymentId = body?.data?.id ?? body?.id

    if (!paymentId) {
      return { action: "not_supported" }
    }

    try {
      const payment = await this.client_.getPayment(paymentId)
      const action = mpStatusToAction(payment.status)
      if (action === "not_supported") {
        return { action }
      }
      return {
        action,
        data: {
          session_id: payment.external_reference as string,
          amount: new BigNumber(payment.transaction_amount),
        },
      }
    } catch (e) {
      this.logger_.error(`Mercado Pago webhook handling failed: ${(e as Error).message}`)
      return { action: "not_supported" }
    }
  }

  private mergePayment(data: Record<string, unknown>, payment: MpPayment): Record<string, unknown> {
    const redirect = mpRedirectUrl(payment)
    const snapshot = buildMpPaymentSnapshot(payment as unknown as Record<string, unknown>)
    return {
      ...data,
      ...snapshot,
      mp_payment_id: payment.id,
      ...(redirect ? { mp_redirect_url: redirect } : {}),
    }
  }
}

export default MercadoPagoProviderService
