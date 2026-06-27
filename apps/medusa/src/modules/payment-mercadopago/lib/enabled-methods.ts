import { MedusaContainer } from "@medusajs/framework"
import {
  getMpPaymentConfig,
  type MpPaymentConfigView,
} from "../../../lib/mp-payment-config"

export type MpEnabledMethods = Pick<
  MpPaymentConfigView,
  "enable_cards" | "enable_pse" | "enable_efecty"
>

export async function resolveMpEnabledMethods(
  container: MedusaContainer
): Promise<MpEnabledMethods> {
  const config = await getMpPaymentConfig(container)
  return {
    enable_cards: config.enable_cards,
    enable_pse: config.enable_pse,
    enable_efecty: config.enable_efecty,
  }
}

export function mpRedirectUrl(payment: {
  transaction_details?: { external_resource_url?: string }
  point_of_interaction?: {
    transaction_data?: { ticket_url?: string; bank_transfer_url?: string }
  }
}): string | null {
  return (
    payment.transaction_details?.external_resource_url ??
    payment.point_of_interaction?.transaction_data?.bank_transfer_url ??
    payment.point_of_interaction?.transaction_data?.ticket_url ??
    null
  )
}
