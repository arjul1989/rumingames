import { Modules } from "@medusajs/framework/utils"
import type { MedusaContainer } from "@medusajs/framework"
import { MercadoPagoClient } from "../modules/payment-mercadopago/lib/client"
import type { MpSavedCard } from "../modules/payment-mercadopago/lib/types"

export type SavedCardView = {
  id: string
  last_four: string
  brand: string
  exp_month: number | null
  exp_year: number | null
  holder_name: string | null
}

function mpClient(): MercadoPagoClient {
  const token = process.env.MP_ACCESS_TOKEN
  if (!token) {
    throw new Error("MP_ACCESS_TOKEN no configurado.")
  }
  return new MercadoPagoClient({ accessToken: token })
}

function toView(card: MpSavedCard): SavedCardView {
  return {
    id: card.id,
    last_four: card.last_four_digits ?? "????",
    brand: card.payment_method?.name ?? card.payment_method?.id ?? "Tarjeta",
    exp_month: card.expiration_month ?? null,
    exp_year: card.expiration_year ?? null,
    holder_name: card.cardholder?.name ?? null,
  }
}

export async function getMpCustomerId(
  container: MedusaContainer,
  customerId: string
): Promise<string | null> {
  const customerService = container.resolve(Modules.CUSTOMER)
  const customer = await customerService.retrieveCustomer(customerId, {
    select: ["id", "metadata"],
  })
  const mpId = customer.metadata?.mp_customer_id
  return typeof mpId === "string" && mpId.length > 0 ? mpId : null
}

export async function ensureMpCustomer(
  container: MedusaContainer,
  customerId: string
): Promise<string> {
  const existing = await getMpCustomerId(container, customerId)
  if (existing) return existing

  const customerService = container.resolve(Modules.CUSTOMER)
  const customer = await customerService.retrieveCustomer(customerId, {
    select: ["id", "email", "first_name", "last_name", "metadata"],
  })

  if (!customer.email) {
    throw new Error("El cliente no tiene correo electrónico.")
  }

  const client = mpClient()
  let mpCustomerId: string | undefined

  const search = await client.searchCustomers(customer.email)
  mpCustomerId = search.results?.[0]?.id

  if (!mpCustomerId) {
    const created = await client.createCustomer({
      email: customer.email,
      first_name: customer.first_name ?? undefined,
      last_name: customer.last_name ?? undefined,
    })
    mpCustomerId = created.id
  }

  await customerService.updateCustomers(customer.id, {
    metadata: {
      ...(customer.metadata ?? {}),
      mp_customer_id: mpCustomerId,
    },
  })

  return mpCustomerId
}

export async function listSavedCards(
  container: MedusaContainer,
  customerId: string
): Promise<SavedCardView[]> {
  const mpCustomerId = await getMpCustomerId(container, customerId)
  if (!mpCustomerId) return []

  const cards = await mpClient().listCustomerCards(mpCustomerId)
  return (cards ?? []).map(toView)
}

export async function saveCard(
  container: MedusaContainer,
  customerId: string,
  token: string
): Promise<SavedCardView> {
  const mpCustomerId = await ensureMpCustomer(container, customerId)
  const card = await mpClient().saveCustomerCard(mpCustomerId, token)
  return toView(card)
}

export async function deleteSavedCard(
  container: MedusaContainer,
  customerId: string,
  cardId: string
): Promise<void> {
  const mpCustomerId = await getMpCustomerId(container, customerId)
  if (!mpCustomerId) {
    throw new Error("No hay cliente Mercado Pago vinculado.")
  }
  await mpClient().deleteCustomerCard(mpCustomerId, cardId)
}

export function mpPublicKey(): string | null {
  return process.env.MP_PUBLIC_KEY ?? null
}
