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
import { EpaycoClient } from "./lib/client"
import { createMockEpaycoClient } from "./lib/mock-client"
import { isMockEpaycoEnabled } from "../../lib/dev-mocks"
import {
  epaycoAuthorizeStatusFromTransaction,
  epaycoStatusToAction,
  epaycoStatusToSessionStatus,
} from "./lib/status"
import type { EpaycoTransaction } from "./lib/types"

export interface EpaycoOptions {
  publicKey: string
  privateKey: string
  testMode?: boolean
  confirmationSecret?: string
  redirectUrl?: string
  confirmationUrl?: string
}

type InjectedDependencies = { logger: Logger }

type EpaycoClientLike = Pick<EpaycoClient, "getTransaction">

class EpaycoProviderService extends AbstractPaymentProvider<EpaycoOptions> {
  static identifier = "epayco"

  protected readonly logger_: Logger
  protected readonly options_: EpaycoOptions
  protected readonly client_: EpaycoClientLike

  constructor(container: InjectedDependencies, options: EpaycoOptions) {
    super(container, options)
    this.logger_ = container.logger
    this.options_ = options
    if (isMockEpaycoEnabled()) {
      this.client_ = createMockEpaycoClient()
      this.logger_.warn("MOCK_EPAYCO=true — ePayco API mocked.")
    } else {
      this.client_ = new EpaycoClient({
        publicKey: options.publicKey,
        privateKey: options.privateKey,
        testMode: options.testMode,
      })
    }
  }

  static validateOptions(options: Record<string, unknown>) {
    if (!options.publicKey || !options.privateKey) {
      throw new MedusaError(
        MedusaError.Types.INVALID_DATA,
        "ePayco provider requires `publicKey` and `privateKey` options."
      )
    }
  }

  private toNumber(amount: unknown): number {
    return new BigNumber(amount as number).numeric
  }

  async initiatePayment(input: InitiatePaymentInput): Promise<InitiatePaymentOutput> {
    const incoming = (input.data ?? {}) as Record<string, unknown>
    const id = (incoming.session_id as string) ?? `epayco_${crypto.randomUUID()}`
    return {
      id,
      status: PaymentSessionStatus.PENDING,
      data: {
        ...incoming,
        session_id: id,
        amount: this.toNumber(input.amount),
        currency_code: input.currency_code,
        epayco_public_key: this.options_.publicKey,
        epayco_test_mode: this.options_.testMode ?? true,
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
    const refPayco =
      (data.epayco_ref_payco as string | undefined) ??
      (data.ref_payco as string | undefined)

    if (!refPayco) {
      throw new MedusaError(
        MedusaError.Types.INVALID_DATA,
        "Missing ePayco ref_payco."
      )
    }

    try {
      const tx = await this.client_.getTransaction(refPayco)
      const sessionId = (data.session_id as string | undefined) ?? ""
      if (sessionId && tx.factura && tx.factura !== sessionId) {
        throw new MedusaError(
          MedusaError.Types.INVALID_DATA,
          "ePayco invoice reference does not match payment session."
        )
      }

      return {
        status: epaycoAuthorizeStatusFromTransaction(tx),
        data: this.mergeTransaction(data, tx),
      }
    } catch (e) {
      const message = (e as Error).message
      this.logger_.error(`ePayco authorize failed: ${message}`)
      return {
        status: PaymentSessionStatus.ERROR,
        data: { ...data, epayco_error: message },
      }
    }
  }

  async capturePayment(input: CapturePaymentInput): Promise<CapturePaymentOutput> {
    const data = input.data ?? {}
    if (!data.epayco_ref_payco) return { data }
    const tx = await this.client_.getTransaction(String(data.epayco_ref_payco))
    return { data: this.mergeTransaction(data, tx) }
  }

  async getPaymentStatus(input: GetPaymentStatusInput): Promise<GetPaymentStatusOutput> {
    const data = input.data ?? {}
    if (!data.epayco_ref_payco) {
      return { status: PaymentSessionStatus.PENDING, data }
    }
    const tx = await this.client_.getTransaction(String(data.epayco_ref_payco))
    return {
      status: epaycoStatusToSessionStatus(tx.estado),
      data: this.mergeTransaction(data, tx),
    }
  }

  async refundPayment(_input: RefundPaymentInput): Promise<RefundPaymentOutput> {
    throw new MedusaError(
      MedusaError.Types.NOT_ALLOWED,
      "ePayco refunds are not automated yet; process manually in the ePayco dashboard."
    )
  }

  async cancelPayment(input: CancelPaymentInput): Promise<CancelPaymentOutput> {
    return { data: input.data ?? {} }
  }

  async deletePayment(input: DeletePaymentInput): Promise<DeletePaymentOutput> {
    return { data: input.data ?? {} }
  }

  async retrievePayment(input: RetrievePaymentInput): Promise<RetrievePaymentOutput> {
    const data = input.data ?? {}
    if (!data.epayco_ref_payco) return { data }
    const tx = await this.client_.getTransaction(String(data.epayco_ref_payco))
    return { data: this.mergeTransaction(data, tx) }
  }

  async getWebhookActionAndData(
    payload: ProviderWebhookPayload["payload"]
  ): Promise<WebhookActionResult> {
    const body = (payload.data ?? {}) as Record<string, unknown>
    const refPayco = String(body.ref_payco ?? body.x_ref_payco ?? "")
    if (!refPayco) {
      return { action: "not_supported" }
    }

    try {
      const tx = await this.client_.getTransaction(refPayco)
      const action = epaycoStatusToAction(tx.estado)
      if (action === "not_supported") {
        return { action }
      }
      return {
        action,
        data: {
          session_id: tx.factura,
          amount: new BigNumber(Number(tx.valor ?? 0)),
        },
      }
    } catch (e) {
      this.logger_.error(`ePayco webhook handling failed: ${(e as Error).message}`)
      return { action: "not_supported" }
    }
  }

  private mergeTransaction(
    data: Record<string, unknown>,
    tx: EpaycoTransaction
  ): Record<string, unknown> {
    return {
      ...data,
      epayco_ref_payco: String(tx.ref_payco),
      epayco_invoice: tx.factura ?? null,
      epayco_status: tx.estado,
      epayco_response: tx.respuesta ?? null,
      epayco_authorization: tx.autorizacion ?? null,
    }
  }
}

export default EpaycoProviderService
