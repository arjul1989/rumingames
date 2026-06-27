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
import { WompiClient } from "./lib/client"
import { createMockWompiClient } from "./lib/mock-client"
import { isMockWompiEnabled } from "../../lib/dev-mocks"
import {
  wompiAuthorizeStatusFromTransaction,
  wompiStatusToAction,
  wompiStatusToSessionStatus,
} from "./lib/status"
import type { WompiTransaction } from "./lib/types"

export interface WompiOptions {
  publicKey: string
  privateKey: string
  integritySecret?: string
  eventsSecret?: string
  baseUrl?: string
  redirectUrl?: string
}

type InjectedDependencies = { logger: Logger }

type WompiClientLike = Pick<WompiClient, "getTransaction" | "voidTransaction">

class WompiProviderService extends AbstractPaymentProvider<WompiOptions> {
  static identifier = "wompi"

  protected readonly logger_: Logger
  protected readonly options_: WompiOptions
  protected readonly client_: WompiClientLike

  constructor(container: InjectedDependencies, options: WompiOptions) {
    super(container, options)
    this.logger_ = container.logger
    this.options_ = options
    if (isMockWompiEnabled()) {
      this.client_ = createMockWompiClient()
      this.logger_.warn("MOCK_WOMPI=true — Wompi API mocked.")
    } else {
      this.client_ = new WompiClient({
        publicKey: options.publicKey,
        privateKey: options.privateKey,
        baseUrl: options.baseUrl,
      })
    }
  }

  static validateOptions(options: Record<string, unknown>) {
    if (!options.publicKey || !options.privateKey) {
      throw new MedusaError(
        MedusaError.Types.INVALID_DATA,
        "Wompi provider requires `publicKey` and `privateKey` options."
      )
    }
  }

  private toNumber(amount: unknown): number {
    return new BigNumber(amount as number).numeric
  }

  async initiatePayment(input: InitiatePaymentInput): Promise<InitiatePaymentOutput> {
    const incoming = (input.data ?? {}) as Record<string, unknown>
    const id = (incoming.session_id as string) ?? `wompi_${crypto.randomUUID()}`
    return {
      id,
      status: PaymentSessionStatus.PENDING,
      data: {
        ...incoming,
        session_id: id,
        amount: this.toNumber(input.amount),
        currency_code: input.currency_code,
        wompi_public_key: this.options_.publicKey,
        wompi_redirect_url: this.options_.redirectUrl ?? null,
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
    const transactionId =
      (data.wompi_transaction_id as string | undefined) ??
      (data.transaction_id as string | undefined)

    if (!transactionId) {
      throw new MedusaError(
        MedusaError.Types.INVALID_DATA,
        "Missing Wompi transaction id."
      )
    }

    try {
      const tx = await this.client_.getTransaction(transactionId)
      const sessionId = (data.session_id as string | undefined) ?? ""
      if (sessionId && tx.reference !== sessionId) {
        throw new MedusaError(
          MedusaError.Types.INVALID_DATA,
          "Wompi transaction reference does not match payment session."
        )
      }

      return {
        status: wompiAuthorizeStatusFromTransaction(tx),
        data: this.mergeTransaction(data, tx),
      }
    } catch (e) {
      const message = (e as Error).message
      this.logger_.error(`Wompi authorize failed: ${message}`)
      return {
        status: PaymentSessionStatus.ERROR,
        data: { ...data, wompi_error: message },
      }
    }
  }

  async capturePayment(input: CapturePaymentInput): Promise<CapturePaymentOutput> {
    const data = input.data ?? {}
    if (!data.wompi_transaction_id) {
      return { data }
    }
    const tx = await this.client_.getTransaction(data.wompi_transaction_id as string)
    return { data: this.mergeTransaction(data, tx) }
  }

  async getPaymentStatus(input: GetPaymentStatusInput): Promise<GetPaymentStatusOutput> {
    const data = input.data ?? {}
    if (!data.wompi_transaction_id) {
      return { status: PaymentSessionStatus.PENDING, data }
    }
    const tx = await this.client_.getTransaction(data.wompi_transaction_id as string)
    return {
      status: wompiStatusToSessionStatus(tx.status),
      data: this.mergeTransaction(data, tx),
    }
  }

  async refundPayment(_input: RefundPaymentInput): Promise<RefundPaymentOutput> {
    throw new MedusaError(
      MedusaError.Types.NOT_ALLOWED,
      "Wompi refunds are not automated yet; process manually in the Wompi dashboard."
    )
  }

  async cancelPayment(input: CancelPaymentInput): Promise<CancelPaymentOutput> {
    const data = input.data ?? {}
    if (!data.wompi_transaction_id) {
      return { data }
    }
    try {
      const tx = await this.client_.voidTransaction(data.wompi_transaction_id as string)
      return { data: this.mergeTransaction(data, tx) }
    } catch (e) {
      this.logger_.warn(`Wompi void failed: ${(e as Error).message}`)
      return { data }
    }
  }

  async deletePayment(input: DeletePaymentInput): Promise<DeletePaymentOutput> {
    return { data: input.data ?? {} }
  }

  async retrievePayment(input: RetrievePaymentInput): Promise<RetrievePaymentOutput> {
    const data = input.data ?? {}
    if (!data.wompi_transaction_id) {
      return { data }
    }
    const tx = await this.client_.getTransaction(data.wompi_transaction_id as string)
    return { data: this.mergeTransaction(data, tx) }
  }

  async getWebhookActionAndData(
    payload: ProviderWebhookPayload["payload"]
  ): Promise<WebhookActionResult> {
    const body = (payload.data ?? {}) as Record<string, unknown>
    const event = body.event as string | undefined
    const tx = (body.data as Record<string, unknown> | undefined)?.transaction as
      | Record<string, unknown>
      | undefined

    if (event !== "transaction.updated" || !tx?.id) {
      return { action: "not_supported" }
    }

    try {
      const transaction = await this.client_.getTransaction(String(tx.id))
      const action = wompiStatusToAction(transaction.status)
      if (action === "not_supported") {
        return { action }
      }
      return {
        action,
        data: {
          session_id: transaction.reference,
          amount: new BigNumber(transaction.amount_in_cents / 100),
        },
      }
    } catch (e) {
      this.logger_.error(`Wompi webhook handling failed: ${(e as Error).message}`)
      return { action: "not_supported" }
    }
  }

  private mergeTransaction(
    data: Record<string, unknown>,
    tx: WompiTransaction
  ): Record<string, unknown> {
    const threeDs = tx.payment_method?.extra?.three_ds_auth
    return {
      ...data,
      wompi_transaction_id: tx.id,
      wompi_reference: tx.reference,
      wompi_status: tx.status,
      wompi_payment_method_type: tx.payment_method_type ?? null,
      wompi_status_message: tx.status_message ?? null,
      wompi_redirect_url: tx.redirect_url ?? null,
      wompi_three_ds_auth: threeDs ?? null,
      wompi_three_ds_step: threeDs?.current_step ?? null,
      wompi_three_ds_step_status: threeDs?.current_step_status ?? null,
    }
  }
}

export default WompiProviderService
