import { HttpTypes } from "@medusajs/types"

/** Colombia default when no postal code is collected (PSE requires exactly 5 digits). */
export const MP_CO_ZIP_DEFAULT = "00000"

/** Payer payload for Mercado Pago Payment Brick (cards + PSE + Efecty). */
export type MpBrickPayer = {
  entityType: "individual"
  email: string
  firstName?: string
  lastName?: string
  customerId?: string
  identification?: {
    type: string
    number: string
  }
  address?: {
    streetName?: string
    streetNumber?: string
    neighborhood?: string
    city?: string
    federalUnit?: string
    zipCode?: string
  }
  phone?: {
    areaCode?: string
    number?: string
  }
}

function clip(value: string | undefined | null, max: number): string | undefined {
  const trimmed = value?.trim()
  if (!trimmed) return undefined
  return trimmed.slice(0, max)
}

/** PSE requires exactly 5 numeric positions for zip_code. */
export function normalizeMpZipCode(zip?: string | null): string {
  const digits = (zip ?? "").replace(/\D/g, "")
  if (digits.length === 5) return digits
  return MP_CO_ZIP_DEFAULT
}

function normalizeIdentificationNumber(type: string, raw: string): string {
  const trimmed = raw.trim()
  if (!trimmed) return ""
  if (type === "PAS") {
    return trimmed.replace(/\s/g, "").toUpperCase()
  }
  return trimmed.replace(/\D/g, "")
}

/** Split a Colombian mobile/landline into MP phone fields (3 + up to 5 digits). */
function parseColombiaPhone(
  phone?: string | null
): { areaCode?: string; number?: string } | undefined {
  const digits = (phone ?? "").replace(/\D/g, "")
  if (digits.length < 7) return undefined
  return {
    areaCode: digits.slice(0, 3),
    number: digits.slice(3, 8),
  }
}

function readIdentification(cart: HttpTypes.StoreCart) {
  const meta = (cart.metadata ?? {}) as Record<string, unknown>
  const type =
    (meta.payer_identification_type as string | undefined) ||
    (meta.document_type as string | undefined) ||
    "CC"
  const raw =
    (meta.payer_identification_number as string | undefined) ||
    (meta.document_number as string | undefined) ||
    ""
  const number = normalizeIdentificationNumber(type, String(raw))
  if (!number) return undefined
  return { type, number }
}

/** Build payer initialization for the MP Payment Brick from checkout cart data. */
export function buildMpBrickPayer(
  cart: HttpTypes.StoreCart,
  mpCustomerId?: string | null
): MpBrickPayer | undefined {
  const email = cart.email?.trim()
  if (!email) return undefined

  const addr = cart.shipping_address
  const identification = readIdentification(cart)
  const phone = parseColombiaPhone(addr?.phone)

  const payer: MpBrickPayer = {
    entityType: "individual",
    email,
    ...(addr?.first_name ? { firstName: clip(addr.first_name, 32) } : {}),
    ...(addr?.last_name ? { lastName: clip(addr.last_name, 32) } : {}),
    ...(mpCustomerId ? { customerId: mpCustomerId } : {}),
    ...(identification ? { identification } : {}),
    ...(phone ? { phone } : {}),
  }

  const streetName = clip(addr?.address_1, 18)
  if (streetName) {
    payer.address = {
      streetName,
      streetNumber: clip(addr?.address_2, 5) || "1",
      neighborhood: clip(addr?.city, 18),
      city: clip(addr?.city, 18),
      federalUnit: clip(addr?.province, 18),
      zipCode: normalizeMpZipCode(addr?.postal_code),
    }
  }

  return payer
}
