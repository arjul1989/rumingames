import { MedusaContainer } from "@medusajs/framework"
import { EpaycoClient } from "../modules/payment-epayco/lib/client"
import type { CreateEpaycoChargeInput } from "../modules/payment-epayco/lib/types"
import { isMockEpaycoEnabled } from "./dev-mocks"
import { createMockEpaycoClient } from "../modules/payment-epayco/lib/mock-client"

function epaycoClient(): EpaycoClient {
  if (isMockEpaycoEnabled()) {
    return createMockEpaycoClient() as unknown as EpaycoClient
  }
  return new EpaycoClient({
    publicKey: process.env.EPAYCO_PUBLIC_KEY!,
    privateKey: process.env.EPAYCO_PRIVATE_KEY!,
    testMode: isEpaycoTestMode(),
  })
}

export function isEpaycoConfigured(): boolean {
  return Boolean(process.env.EPAYCO_PUBLIC_KEY && process.env.EPAYCO_PRIVATE_KEY)
}

export function isEpaycoTestMode(): boolean {
  return process.env.EPAYCO_TEST_MODE !== "false"
}

export function isEpaycoThreeDsEnabled(): boolean {
  return process.env.EPAYCO_THREE_DS_ENABLED !== "false"
}

export async function tokenizeEpaycoCard(input: {
  number: string
  exp_year: string
  exp_month: string
  cvc: string
}) {
  return epaycoClient().createToken(input)
}

export async function createEpaycoCustomer(input: {
  tokenCard: string
  email: string
  name: string
  lastName: string
}) {
  return epaycoClient().createCustomer(input)
}

export async function createEpaycoCharge(input: CreateEpaycoChargeInput) {
  return epaycoClient().createCharge({
    ...input,
    testMode: input.testMode ?? isEpaycoTestMode(),
  })
}

export async function getEpaycoTransaction(refPayco: string) {
  return epaycoClient().getTransaction(refPayco)
}

export function epaycoConfirmationUrl(): string {
  return (
    process.env.EPAYCO_NOTIFICATION_URL ??
    (process.env.MEDUSA_BACKEND_URL
      ? `${process.env.MEDUSA_BACKEND_URL.replace(/\/$/, "")}/hooks/epayco`
      : "http://localhost:9000/hooks/epayco")
  )
}

export function epaycoRedirectUrl(countryCode = "co"): string {
  return (
    process.env.EPAYCO_REDIRECT_URL ??
    (process.env.STOREFRONT_URL
      ? `${process.env.STOREFRONT_URL.replace(/\/$/, "")}/${countryCode}/checkout/pending`
      : `http://localhost:8000/${countryCode}/checkout/pending`)
  )
}

/** No-op placeholder for container injection symmetry with other gateways. */
export function resolveEpaycoFromContainer(_container: MedusaContainer) {
  return epaycoClient()
}
