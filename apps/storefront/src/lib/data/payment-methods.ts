"use server"

import { sdk } from "@lib/config"
import { getAuthHeaders } from "./cookies"

export type SavedPaymentMethod = {
  id: string
  last_four: string
  brand: string
  exp_month: number | null
  exp_year: number | null
  holder_name: string | null
}

export type PaymentMethodsResponse = {
  cards: SavedPaymentMethod[]
  public_key: string | null
}

export async function listPaymentMethods(): Promise<PaymentMethodsResponse | null> {
  const headers = await getAuthHeaders()
  if (!headers) return null

  try {
    return await sdk.client.fetch<PaymentMethodsResponse>(
      "/store/customers/me/payment-methods",
      { method: "GET", headers }
    )
  } catch {
    return null
  }
}

export async function addPaymentMethod(token: string): Promise<{
  card?: SavedPaymentMethod
  error?: string
}> {
  const headers = await getAuthHeaders()
  if (!headers) {
    return { error: "Debes iniciar sesión." }
  }

  try {
    const res = await sdk.client.fetch<{ card: SavedPaymentMethod }>(
      "/store/customers/me/payment-methods",
      {
        method: "POST",
        headers: { ...headers, "Content-Type": "application/json" },
        body: { token },
      }
    )
    return { card: res.card }
  } catch (e) {
    return {
      error: e instanceof Error ? e.message : "No se pudo guardar la tarjeta.",
    }
  }
}

export async function removePaymentMethod(cardId: string): Promise<{ error?: string }> {
  const headers = await getAuthHeaders()
  if (!headers) {
    return { error: "Debes iniciar sesión." }
  }

  try {
    await sdk.client.fetch(`/store/customers/me/payment-methods/${cardId}`, {
      method: "DELETE",
      headers,
    })
    return {}
  } catch (e) {
    return {
      error: e instanceof Error ? e.message : "No se pudo eliminar la tarjeta.",
    }
  }
}

export async function getMpCustomerId(): Promise<string | null> {
  const headers = await getAuthHeaders()
  if (!headers) return null

  try {
    const { customer } = await sdk.client.fetch<{ customer: { metadata?: Record<string, unknown> } }>(
      "/store/customers/me",
      {
        method: "GET",
        query: { fields: "metadata" },
        headers,
      }
    )
    const id = customer.metadata?.mp_customer_id
    return typeof id === "string" ? id : null
  } catch {
    return null
  }
}
