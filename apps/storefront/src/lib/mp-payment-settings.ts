"use server"

import { sdk } from "@lib/config"
import {
  MP_PAYMENT_SETTINGS_DEFAULTS,
  type MpPaymentSettings,
} from "./mp-payment-settings.shared"

export async function getMpPaymentSettings(): Promise<MpPaymentSettings> {
  try {
    const data = await sdk.client.fetch<MpPaymentSettings>(
      "/store/mercadopago/settings",
      {
        method: "GET",
        cache: "no-store",
      }
    )
    return data
  } catch {
    return MP_PAYMENT_SETTINGS_DEFAULTS
  }
}
