import type { FazerClient } from "./client"
import type { FazerCreateOrderInput, FazerOrder, FazerPayment } from "./types"

function mockCode(): string {
  const part = () => Math.random().toString(36).slice(2, 6).toUpperCase()
  return `MOCK-${part()}-${part()}-${part()}`
}

/** Instant successful Fazer orders for local fulfillment testing (MOCK_FAZER=true). */
export function createMockFazerClient(): Pick<
  import("./client").FazerClient,
  "createOrder" | "getOrder" | "createPayment" | "getPayment"
> {
  const orders = new Map<string, FazerOrder>()
  const payments = new Map<string, FazerPayment>()

  return {
    createOrder(input: FazerCreateOrderInput): Promise<FazerOrder> {
      const id = `mock_fazer_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`
      const order: FazerOrder = {
        id,
        status: "completed",
        sku_id: input.sku_id,
        quantity: input.quantity,
        codes: Array.from({ length: input.quantity }, () => mockCode()),
      }
      orders.set(id, order)
      return Promise.resolve(order)
    },

    getOrder(id: string): Promise<FazerOrder> {
      const existing = orders.get(id)
      if (existing) {
        return Promise.resolve(existing)
      }
      return Promise.resolve({
        id,
        status: "completed",
        sku_id: "",
        quantity: 1,
        codes: [mockCode()],
      })
    },

    createPayment(input: {
      method: string
      amount_usd: number
      idempotency_key: string
    }): Promise<FazerPayment> {
      const id = `mock_pay_${Date.now()}`
      const payment: FazerPayment = {
        id,
        method: input.method,
        amount_usd: String(input.amount_usd),
        status: "completed",
        pay_to: "TMockBinanceAddress123",
      }
      payments.set(id, payment)
      return Promise.resolve(payment)
    },

    getPayment(id: string): Promise<FazerPayment> {
      const existing = payments.get(id)
      if (existing) return Promise.resolve(existing)
      return Promise.resolve({
        id,
        method: "binancepay",
        amount_usd: "0",
        status: "completed",
      })
    },
  }
}
