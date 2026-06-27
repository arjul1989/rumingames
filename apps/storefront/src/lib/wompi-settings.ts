"use server"

import { sdk } from "@lib/config"
import type {
  WompiAcceptanceToken,
  WompiBrowserInfo,
  WompiThreeDsAuth,
  WompiTransactionView,
} from "./wompi-types"

export type WompiSettings = {
  configured: boolean
  public_key: string | null
  api_base_url?: string
  three_ds_enabled?: boolean
}

export type WompiAcceptanceResponse = {
  acceptance: WompiAcceptanceToken
  personal_data_auth: WompiAcceptanceToken
  three_ds_enabled: boolean
}

export async function getWompiSettings(): Promise<WompiSettings> {
  try {
    return await sdk.client.fetch<WompiSettings>("/store/wompi/settings", {
      method: "GET",
      cache: "no-store",
    })
  } catch {
    return { configured: false, public_key: null }
  }
}

export async function fetchWompiAcceptance(): Promise<WompiAcceptanceResponse> {
  return sdk.client.fetch<WompiAcceptanceResponse>("/store/wompi/acceptance", {
    method: "GET",
    cache: "no-store",
  })
}

export type WompiCheckoutParams = {
  public_key: string
  currency: string
  amount_in_cents: number
  reference: string
  signature_integrity: string
  redirect_url: string
  customer_email?: string
  customer_data?: Record<string, string>
}

export async function fetchWompiCheckoutParams(input: {
  reference: string
  amount: number
  customer_email?: string
  customer_data?: Record<string, string>
  redirect_url?: string
}): Promise<WompiCheckoutParams> {
  return sdk.client.fetch<WompiCheckoutParams>("/store/wompi/checkout-params", {
    method: "POST",
    body: input,
    cache: "no-store",
  })
}

export async function createWompiThreeDsTransaction(input: {
  reference: string
  amountPesos: number
  customerEmail: string
  cardToken: string
  acceptanceToken: string
  acceptPersonalAuth: string
  browserInfo: WompiBrowserInfo
  redirectUrl?: string
  customerData?: {
    full_name?: string
    phone_number?: string
    legal_id?: string
    legal_id_type?: string
  }
}): Promise<{ transaction: WompiTransactionView }> {
  return sdk.client.fetch<{ transaction: WompiTransactionView }>(
    "/store/wompi/transactions/three-ds",
    {
      method: "POST",
      body: input,
      cache: "no-store",
    }
  )
}

export async function fetchWompiTransaction(
  id: string
): Promise<{ transaction: WompiTransactionView; three_ds_auth: WompiThreeDsAuth | null }> {
  return sdk.client.fetch(`/store/wompi/transactions/${id}`, {
    method: "GET",
    cache: "no-store",
  })
}
