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
import { mpStatusToAction, mpStatusToSessionStatus } from "./lib/status"
import type { MpCreatePaymentInput, MpPayment } from "./lib/types"

export interface MercadoPagoOptions {
  accessToken: string
  publicKey?: string
  webhookSecret?: string
  /** es-CO for Colombia. */
  locale?: string
  baseUrl?: string
  notificationUrl?: string
  /** Shown on the buyer's card statement. */
  statementDescriptor?: string
}

type InjectedDependencies = { logger: Logger }

// Mercado Pago payment provider for Medusa v2, tuned for Colombia (es-CO / COP)
// with card and PSE support via Checkout Bricks (US-3.1 / RUM-23).
class MercadoPagoProviderService extends AbstractPaymentProvider<MercadoPagoOptions> {
  static identifier = "mercadopago"

  protected readonly logger_: Logger
  protected readonly options_: MercadoPagoOptions
  protected readonly client_: MercadoPagoClient

  constructor(container: InjectedDependencies, options: MercadoPagoOptions) {
    super(container, options)
    this.logger_ = container.logger
    this.options_ = options
    this.client_ = new MercadoPagoClient({
      accessToken: options.accessToken,
      baseUrl: options.baseUrl,
    })
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
    // The Brick collects the card token on the client; we only create the
    // session here and hand the public key + amount to the frontend.
    //
    // The storefront re-initiates this session once the Brick produces a
    // token (`{ token, payment_method_id, issuer_id, installments, payer }`),
    // so we preserve any incoming `input.data` here. Otherwise the token
    // would be wiped before `authorizePayment` runs at cart completion.
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

    // Idempotent re-authorization: a payment already exists for this session.
    if (data.mp_payment_id) {
      const existing = await this.client_.getPayment(data.mp_payment_id as number)
      return { status: mpStatusToSessionStatus(existing.status), data: this.mergePayment(data, existing) }
    }

    const token = data.token as string | undefined
    if (!token) {
      throw new MedusaError(
        MedusaError.Types.INVALID_DATA,
        "Mercado Pago authorization requires a card `token` from the Brick."
      )
    }

    const amount = data.amount
    if (amount == null) {
      throw new MedusaError(
        MedusaError.Types.INVALID_DATA,
        "Mercado Pago authorization requires `amount` in the payment session."
      )
    }

    const sessionId = (data.session_id as string) ?? crypto.randomUUID()
    const payload: MpCreatePaymentInput = {
      transaction_amount: this.toNumber(amount),
      token,
      installments: (data.installments as number) ?? 1,
      payment_method_id: data.payment_method_id as string | undefined,
      issuer_id: data.issuer_id as string | undefined,
      payer: data.payer as MpCreatePaymentInput["payer"],
      external_reference: sessionId,
      description: data.description as string | undefined,
      statement_descriptor: this.options_.statementDescriptor,
      notification_url: this.options_.notificationUrl,
    }

    try {
      const payment = await this.client_.createPayment(payload, sessionId)
      return { status: mpStatusToSessionStatus(payment.status), data: this.mergePayment(data, payment) }
    } catch (e) {
      this.logger_.error(`Mercado Pago authorize failed: ${(e as Error).message}`)
      return {
        status: PaymentSessionStatus.ERROR,
        data: { ...data, mp_error: (e as Error).message },
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
    return {
      ...data,
      mp_payment_id: payment.id,
      mp_status: payment.status,
      mp_status_detail: payment.status_detail,
    }
  }
}

export default MercadoPagoProviderService
