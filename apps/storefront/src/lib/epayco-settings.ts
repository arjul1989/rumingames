"use server"

import { sdk } from "@lib/config"
import type { EpaycoChargeResult, EpaycoTransactionView } from "./epayco-types"

export type EpaycoSettings = {
  configured: boolean
  public_key: string | null
  test_mode?: boolean
  three_ds_enabled?: boolean
  confirmation_url?: string
  redirect_url?: string
}

export async function getEpaycoSettings(): Promise<EpaycoSettings> {
  try {
    return await sdk.client.fetch<EpaycoSettings>("/store/epayco/settings", {
      method: "GET",
      cache: "no-store",
    })
  } catch {
    return { configured: false, public_key: null }
  }
}

export async function createEpaycoCardCharge(input: {
  reference: string
  amountPesos: number
  customerEmail: string
  cardNumber: string
  expMonth: string
  expYear: string
  cvc: string
  docType: string
  docNumber: string
  firstName: string
  lastName: string
  phone?: string
  city?: string
  address?: string
  countryCode?: string
  redirectUrl?: string
}): Promise<EpaycoChargeResult> {
  return sdk.client.fetch<EpaycoChargeResult>("/store/epayco/charge", {
    method: "POST",
    body: input,
    cache: "no-store",
  })
}

export async function fetchEpaycoTransaction(ref: string): Promise<{
  transaction: EpaycoTransactionView
  three_ds_required: boolean
}> {
  return sdk.client.fetch(`/store/epayco/transactions/${ref}`, {
    method: "GET",
    cache: "no-store",
  })
}
