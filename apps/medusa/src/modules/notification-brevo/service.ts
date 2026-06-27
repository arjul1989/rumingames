import {
  AbstractNotificationProviderService,
  MedusaError,
} from "@medusajs/framework/utils"
import type { Logger } from "@medusajs/framework/types"
import type {
  ProviderSendNotificationDTO,
  ProviderSendNotificationResultsDTO,
} from "@medusajs/framework/types"
import { BrevoClient } from "./lib/client"

export type BrevoNotificationOptions = {
  apiKey: string
  from: string
  senderName?: string
  replyTo?: string
  /** Optional Brevo dashboard template IDs keyed by Medusa template name. */
  templateIds?: Record<string, number | string>
}

type InjectedDependencies = { logger: Logger }

class BrevoNotificationProviderService extends AbstractNotificationProviderService {
  static identifier = "brevo"

  protected readonly logger_: Logger
  protected readonly options_: BrevoNotificationOptions
  protected readonly client_: BrevoClient

  constructor(container: InjectedDependencies, options: BrevoNotificationOptions) {
    super()
    this.logger_ = container.logger
    this.options_ = options
    this.client_ = new BrevoClient(options.apiKey)
  }

  static validateOptions(options: Record<string, unknown>) {
    if (!options.apiKey) {
      throw new MedusaError(
        MedusaError.Types.INVALID_DATA,
        "Brevo notification provider requires `apiKey`."
      )
    }
    if (!options.from) {
      throw new MedusaError(
        MedusaError.Types.INVALID_DATA,
        "Brevo notification provider requires `from` (sender email)."
      )
    }
  }

  private templateIdFor(name?: string): number | undefined {
    if (!name) return undefined
    const raw = this.options_.templateIds?.[name]
    if (raw == null || raw === "") return undefined
    const id = Number(raw)
    return Number.isFinite(id) ? id : undefined
  }

  async send(
    notification: ProviderSendNotificationDTO
  ): Promise<ProviderSendNotificationResultsDTO> {
    if (!notification?.to) {
      throw new MedusaError(
        MedusaError.Types.INVALID_DATA,
        "No notification recipient provided."
      )
    }

    const senderName = this.options_.senderName ?? "rumin"
    const from = notification.from?.trim() || this.options_.from
    const subject =
      notification.content?.subject ??
      (typeof notification.data?.subject === "string"
        ? notification.data.subject
        : "rumin")

    const brevoTemplateId = this.templateIdFor(notification.template)
    const payload: Parameters<BrevoClient["sendTransactionalEmail"]>[0] = {
      sender: { name: senderName, email: from },
      to: [{ email: notification.to }],
      subject,
    }

    if (this.options_.replyTo) {
      payload.replyTo = { email: this.options_.replyTo, name: senderName }
    }

    if (brevoTemplateId) {
      payload.templateId = brevoTemplateId
      payload.params = (notification.data ?? {}) as Record<string, unknown>
    } else {
      payload.htmlContent = notification.content?.html
      payload.textContent = notification.content?.text
      if (!payload.htmlContent && !payload.textContent) {
        payload.textContent = subject
      }
    }

    try {
      const result = await this.client_.sendTransactionalEmail(payload)
      this.logger_.info(
        `Brevo email sent to ${notification.to} [${notification.template ?? "no-template"}]`
      )
      return { id: result.messageId }
    } catch (e) {
      this.logger_.error(`Brevo send failed: ${(e as Error).message}`)
      throw new MedusaError(
        MedusaError.Types.UNEXPECTED_STATE,
        `Failed to send email via Brevo: ${(e as Error).message}`
      )
    }
  }
}

export default BrevoNotificationProviderService
