import { MedusaContainer } from "@medusajs/framework"
import { WompiClient } from "../modules/payment-wompi/lib/client"
import { buildWompiThreeDsTransactionBody } from "../modules/payment-wompi/lib/build-three-ds-transaction"
import type {
  CreateWompiThreeDsTransactionInput,
  WompiMerchant,
  WompiTransaction,
} from "../modules/payment-wompi/lib/types"
import { isMockWompiEnabled } from "./dev-mocks"
import { createMockWompiClient } from "../modules/payment-wompi/lib/mock-client"

function wompiClient(): WompiClient {
  if (isMockWompiEnabled()) {
    return createMockWompiClient() as unknown as WompiClient
  }
  return new WompiClient({
    publicKey: process.env.WOMPI_PUBLIC_KEY!,
    privateKey: process.env.WOMPI_PRIVATE_KEY!,
    baseUrl: process.env.WOMPI_API_BASE_URL,
  })
}

export async function getWompiAcceptanceTokens(): Promise<WompiMerchant> {
  return wompiClient().getMerchant()
}

export async function createWompiThreeDsTransaction(
  input: CreateWompiThreeDsTransactionInput
): Promise<WompiTransaction> {
  const integritySecret = process.env.WOMPI_INTEGRITY_SECRET
  if (!integritySecret) {
    throw new Error("WOMPI_INTEGRITY_SECRET is not configured")
  }

  const isSandbox =
    process.env.WOMPI_API_BASE_URL?.includes("sandbox") ||
    process.env.WOMPI_PUBLIC_KEY?.startsWith("pub_test_")

  const body = buildWompiThreeDsTransactionBody(input, integritySecret, {
    isSandbox,
    threeDsAuthType: process.env.WOMPI_THREE_DS_AUTH_TYPE || "challenge_v2",
  })

  return wompiClient().createTransaction(body)
}

export async function getWompiTransaction(id: string): Promise<WompiTransaction> {
  return wompiClient().getTransaction(id)
}

export function isWompiThreeDsEnabled(): boolean {
  return process.env.WOMPI_THREE_DS_ENABLED !== "false"
}
