import type { MercadoPagoClient } from "./client"
import type { MpCreatePaymentInput, MpPayment, MpRefund } from "./types"
import {
  createMockMpPayment,
  getMockMpPayment,
  setMockMpPaymentStatus,
} from "../../../lib/dev-mocks/mp-mock-store"

/** In-memory Mercado Pago client for local checkout testing (MOCK_MP=true). */
export function createMockMercadoPagoClient(): Pick<
  MercadoPagoClient,
  "createPayment" | "getPayment" | "cancelPayment" | "refundPayment"
> {
  return {
    createPayment(input: MpCreatePaymentInput, idempotencyKey: string) {
      const payment = createMockMpPayment({
        transaction_amount: input.transaction_amount,
        external_reference: input.external_reference ?? idempotencyKey,
        payment_method_id: input.payment_method_id,
      })
      return Promise.resolve(payment)
    },

    getPayment(id: string | number) {
      const payment = getMockMpPayment(id)
      if (!payment) {
        return Promise.reject(new Error(`Mock MP payment ${id} not found`))
      }
      return Promise.resolve(payment)
    },

    cancelPayment(id: string | number) {
      const payment = setMockMpPaymentStatus(id, "cancelled")
      if (!payment) {
        return Promise.reject(new Error(`Mock MP payment ${id} not found`))
      }
      return Promise.resolve(payment)
    },

    refundPayment(id: string | number, amount?: number) {
      setMockMpPaymentStatus(id, "refunded")
      return Promise.resolve({
        id: Date.now(),
        payment_id: Number(id),
        amount: amount ?? 0,
        status: "approved",
      } satisfies MpRefund)
    },
  }
}
