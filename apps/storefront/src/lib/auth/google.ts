import "server-only"

import { medusaFetch } from "@lib/bff/medusa"
import { transferCart } from "@lib/data/customer"
import { linkGuestOrders } from "@lib/data/link-guest-orders"
import { getCacheTag } from "@lib/data/cookies"
import { revalidateTag } from "next/cache"

type GoogleJwtPayload = {
  actor_id?: string
  user_metadata?: {
    email?: string
    given_name?: string
    family_name?: string
    name?: string
  }
}

function decodeJwtPayload(token: string): GoogleJwtPayload {
  const [, payload] = token.split(".")
  if (!payload) {
    throw new Error("Token de autenticación inválido")
  }

  const normalized = payload.replace(/-/g, "+").replace(/_/g, "/")
  return JSON.parse(Buffer.from(normalized, "base64").toString("utf8"))
}

function isDuplicateCustomerError(error?: string): boolean {
  if (!error) return false
  return error.toLowerCase().includes("already has an account")
}

async function linkGoogleToExistingCustomer(
  token: string,
  email: string
): Promise<void> {
  const link = await medusaFetch<{ customer_id?: string }>(
    "/store/auth/google/link",
    {
      method: "POST",
      token,
      body: { email },
    }
  )

  if (!link.ok) {
    throw new Error(
      link.error ||
        "Ya existe una cuenta con ese correo. Inicia sesión con correo y contraseña."
    )
  }
}

function splitGoogleName(metadata: GoogleJwtPayload["user_metadata"]) {
  const fullName = metadata?.name?.trim()
  if (!fullName) {
    return {
      first_name: metadata?.given_name,
      last_name: metadata?.family_name,
    }
  }

  const [first, ...rest] = fullName.split(/\s+/)
  return {
    first_name: metadata?.given_name || first,
    last_name: metadata?.family_name || rest.join(" ") || undefined,
  }
}

// Validates the Google OAuth callback with Medusa, creates the customer on first
// login, refreshes the JWT, and stores the session cookie.
export async function completeGoogleAuth(
  query: Record<string, string>
): Promise<string> {
  const callback = await medusaFetch<{ token: string }>(
    "/auth/customer/google/callback",
    {
      method: "POST",
      query,
    }
  )

  if (!callback.ok || !callback.data?.token) {
    throw new Error(callback.error || "No se pudo autenticar con Google")
  }

  let token = callback.data.token
  const decoded = decodeJwtPayload(token)
  const needsCustomer = !decoded.actor_id?.trim()

  if (needsCustomer) {
    const email = decoded.user_metadata?.email
    if (!email) {
      throw new Error("Tu cuenta de Google no tiene correo verificado")
    }

    const { first_name, last_name } = splitGoogleName(decoded.user_metadata)
    const create = await medusaFetch("/store/customers", {
      method: "POST",
      token,
      body: {
        email,
        first_name,
        last_name,
        metadata: { email_verified: true },
      },
    })

    if (!create.ok) {
      if (isDuplicateCustomerError(create.error)) {
        await linkGoogleToExistingCustomer(token, email)
      } else {
        throw new Error(create.error || "No se pudo crear la cuenta")
      }
    }
  }

  const refresh = await medusaFetch<{ token: string }>("/auth/token/refresh", {
    method: "POST",
    token,
  })

  if (!refresh.ok || !refresh.data?.token) {
    throw new Error(refresh.error || "No se pudo finalizar la sesión")
  }

  token = refresh.data.token

  const email = decoded.user_metadata?.email
  if (email) {
    await linkGoogleToExistingCustomer(token, email)
  }

  const customerCacheTag = await getCacheTag("customers")
  revalidateTag(customerCacheTag)

  await transferCart()
  await linkGuestOrders()

  return token
}

export function getGoogleCallbackUrl(): string {
  const base =
    process.env.NEXT_PUBLIC_BASE_URL ||
    process.env.STOREFRONT_URL ||
    "http://localhost:8000"

  return `${base.replace(/\/$/, "")}/api/auth/google/callback`
}

export const OAUTH_COUNTRY_COOKIE = "_gorumin_oauth_country"
