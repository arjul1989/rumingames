import type { ExecArgs } from "@medusajs/framework/types"
import { ContainerRegistrationKeys, Modules } from "@medusajs/framework/utils"
import { isMockMpEnabled } from "../lib/dev-mocks"
import { medusaAuthorizeStatusFromMpPayment } from "../modules/payment-mercadopago/lib/status"
import { createMockMercadoPagoClient } from "../modules/payment-mercadopago/lib/mock-client"
import { buildMpCreatePaymentPayload } from "../modules/payment-mercadopago/lib/build-payment-payload"

/**
 * Verifies Mercado Pago card authorization for local checkout (MOCK_MP).
 * Run: npx medusa exec ./src/scripts/verify-mp-checkout.ts
 */
export default async function verifyMpCheckout({ container }: ExecArgs) {
  const logger = container.resolve(ContainerRegistrationKeys.LOGGER)

  if (!isMockMpEnabled()) {
    logger.warn("MOCK_MP is not enabled — enable it in apps/medusa/.env to test locally.")
  }

  const mapped = medusaAuthorizeStatusFromMpPayment({
    status: "pending",
    payment_method_id: "visa",
  })
  logger.info(`[status] pending visa -> ${mapped} (expected authorized when MOCK_MP=true)`)

  const client = createMockMercadoPagoClient()
  const sessionId = "payses_verify_test"
  const payload = buildMpCreatePaymentPayload(
    {
      session_id: sessionId,
      amount: 73000,
      token: "mock_card_token",
      payment_method_id: "visa",
      installments: 1,
      ip_address: "127.0.0.1",
      payer_email: "verify@gorumin.com",
      payer: {
        email: "verify@gorumin.com",
        identification: { type: "CC", number: "1095799788" },
      },
    },
    {}
  )

  const payment = await client.createPayment(payload, sessionId)
  const authorizeStatus = medusaAuthorizeStatusFromMpPayment(payment)
  logger.info(
    `[mock-create] mp_payment_id=${payment.id} status=${payment.status} -> medusa=${authorizeStatus}`
  )

  if (authorizeStatus !== "authorized") {
    throw new Error(
      `Expected authorized for MOCK_MP card flow, got ${authorizeStatus}`
    )
  }

  const paymentModule = container.resolve(Modules.PAYMENT)
  const providers = await paymentModule.listPaymentProviders({})
  const mp = providers.find((p) => p.id.includes("mercadopago"))
  logger.info(`[providers] mercadopago provider: ${mp?.id ?? "not found"}`)

  logger.info("verify-mp-checkout OK")
}
