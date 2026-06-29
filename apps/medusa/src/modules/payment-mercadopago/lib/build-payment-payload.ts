import type { MpCreatePaymentInput, MpPayer } from "./types"

const ASYNC_METHODS = new Set(["pse", "efecty"])

export function isAsyncMpPaymentMethod(id?: string): boolean {
  return Boolean(id && ASYNC_METHODS.has(id.toLowerCase()))
}

function clip(value: unknown, max: number): string | undefined {
  if (typeof value !== "string") return undefined
  const trimmed = value.trim()
  return trimmed ? trimmed.slice(0, max) : undefined
}

function normalizeZip(zip?: unknown): string {
  const digits = String(zip ?? "").replace(/\D/g, "")
  return digits.length === 5 ? digits : "00000"
}

function parseColombiaPhone(
  phone?: unknown
): { area_code?: string; number?: string } | undefined {
  const digits = String(phone ?? "").replace(/\D/g, "")
  if (digits.length < 7) return undefined
  return {
    area_code: digits.slice(0, 3),
    number: digits.slice(3, 8),
  }
}

function readMetaIdentification(meta: Record<string, unknown> | undefined) {
  if (!meta) return undefined
  const type = (meta.payer_identification_type as string | undefined) || "CC"
  const raw = meta.payer_identification_number as string | undefined
  if (!raw?.trim()) return undefined
  const number =
    type === "PAS"
      ? raw.trim().replace(/\s/g, "").toUpperCase()
      : raw.replace(/\D/g, "")
  if (!number) return undefined
  return { type, number }
}

/** Brick may send camelCase or snake_case payer fields. */
export function normalizeBrickPayer(raw: unknown): MpPayer {
  if (!raw || typeof raw !== "object") return {}
  const p = raw as Record<string, unknown>
  const id = p.identification as Record<string, unknown> | undefined
  const address = p.address as Record<string, unknown> | undefined
  const phone = p.phone as Record<string, unknown> | undefined

  const payer: MpPayer = {
    email: clip(p.email, 256),
    entity_type: (p.entity_type ?? p.entityType ?? "individual") as MpPayer["entity_type"],
    first_name: clip(p.first_name ?? p.firstName, 32),
    last_name: clip(p.last_name ?? p.lastName, 32),
  }

  if (id?.type && id?.number) {
    payer.identification = {
      type: String(id.type),
      number: String(id.number),
    }
  }

  if (address) {
    payer.address = {
      zip_code: normalizeZip(address.zip_code ?? address.zipCode),
      street_name: clip(address.street_name ?? address.streetName, 18),
      street_number: clip(address.street_number ?? address.streetNumber, 5) || "1",
      neighborhood: clip(address.neighborhood, 18),
      city: clip(address.city, 18),
      federal_unit: clip(address.federal_unit ?? address.federalUnit, 18),
    }
  }

  if (phone) {
    payer.phone = {
      area_code: clip(phone.area_code ?? phone.areaCode, 3),
      number: clip(phone.number, 5),
    }
  }

  return payer
}

function enrichPayerFromCheckout(
  payer: MpPayer,
  data: Record<string, unknown>
): MpPayer {
  const shipping = (data.shipping_address ?? {}) as Record<string, unknown>
  const meta = (data.cart_metadata ?? {}) as Record<string, unknown>

  const enriched: MpPayer = {
    ...payer,
    entity_type: payer.entity_type ?? "individual",
    email: payer.email ?? clip(data.payer_email, 256),
    first_name:
      payer.first_name ?? clip(shipping.first_name, 32),
    last_name: payer.last_name ?? clip(shipping.last_name, 32),
  }

  if (!enriched.identification) {
    const fromMeta = readMetaIdentification(meta)
    if (fromMeta) enriched.identification = fromMeta
  }

  if (!enriched.address && shipping.address_1) {
    enriched.address = {
      zip_code: normalizeZip(shipping.postal_code),
      street_name: clip(shipping.address_1, 18)!,
      street_number: clip(shipping.address_2, 5) || "1",
      neighborhood: clip(shipping.city, 18),
      city: clip(shipping.city, 18),
      federal_unit: clip(shipping.province, 18),
    }
  }

  if (!enriched.phone && shipping.phone) {
    enriched.phone = parseColombiaPhone(shipping.phone)
  }

  return enriched
}

function resolveIpAddress(data: Record<string, unknown>): string {
  const fromField = data.ip_address
  if (typeof fromField === "string" && fromField.trim()) {
    return fromField.trim()
  }

  const additional = data.additional_info as { ip_address?: string } | undefined
  if (additional?.ip_address?.trim()) {
    return additional.ip_address.trim()
  }

  // MP rejects null; only used when IP is unavailable (local tests).
  return "127.0.0.1"
}

export function buildMpCreatePaymentPayload(
  data: Record<string, unknown>,
  options: {
    notificationUrl?: string
    callbackUrl?: string
    statementDescriptor?: string
  }
): MpCreatePaymentInput {
  const paymentMethodId = data.payment_method_id as string | undefined
  const token = data.token as string | undefined
  const amount = data.amount ?? data.transaction_amount

  if (amount == null) {
    throw new Error("Mercado Pago authorization requires an amount.")
  }

  const payer = enrichPayerFromCheckout(normalizeBrickPayer(data.payer), data)

  const payload: MpCreatePaymentInput = {
    transaction_amount: Number(amount),
    external_reference: String(data.session_id ?? ""),
    description: (data.description as string | undefined) ?? "Compra en rumin",
    statement_descriptor: options.statementDescriptor,
    notification_url: options.notificationUrl,
    payment_method_id: paymentMethodId,
    payer,
    transaction_details: data.transaction_details as MpCreatePaymentInput["transaction_details"],
    metadata: data.metadata as Record<string, unknown> | undefined,
    additional_info: {
      ip_address: resolveIpAddress(data),
    },
  }

  if (isAsyncMpPaymentMethod(paymentMethodId) && options.callbackUrl) {
    payload.callback_url = options.callbackUrl
  }

  if (token) {
    payload.token = token
    payload.installments = (data.installments as number) ?? 1
    payload.issuer_id = data.issuer_id as string | undefined
  } else if (!paymentMethodId) {
    throw new Error(
      "Mercado Pago authorization requires a card token or payment_method_id."
    )
  }

  return payload
}
