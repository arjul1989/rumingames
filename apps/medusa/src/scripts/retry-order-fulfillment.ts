import type { ExecArgs } from "@medusajs/framework/types"
import { fulfillDigitalOrder } from "../lib/fulfill-digital-order"

export default async function retryOrderFulfillment({ container }: ExecArgs) {
  const orderId = process.env.ORDER_ID
  if (!orderId) {
    throw new Error("Set ORDER_ID to the Medusa order id (e.g. order_01…).")
  }

  const result = await fulfillDigitalOrder(container, { orderId })
  console.log(JSON.stringify(result, null, 2))
}
