import type { ExecArgs } from "@medusajs/framework/types"
import { ContainerRegistrationKeys } from "@medusajs/framework/utils"
import { MercadoPagoClient } from "../modules/payment-mercadopago/lib/client"
import { buildMpPaymentSnapshot } from "../modules/payment-mercadopago/lib/mp-payment-snapshot"
import { runSql } from "../lib/run-sql"

export default async function syncOrderMpPayment({ container }: ExecArgs) {
  const orderId = process.env.ORDER_ID
  if (!orderId) {
    throw new Error("Set ORDER_ID (e.g. order_01…).")
  }

  const logger = container.resolve("logger")
  const query = container.resolve(ContainerRegistrationKeys.QUERY)
  const accessToken = process.env.MP_ACCESS_TOKEN
  if (!accessToken) {
    throw new Error("MP_ACCESS_TOKEN is required.")
  }

  const { data: orders } = await query.graph({
    entity: "order",
    fields: [
      "id",
      "display_id",
      "status",
      "payment_collections.payments.id",
      "payment_collections.payments.data",
    ],
    filters: { id: orderId },
  })

  const order = orders[0] as
    | {
        id: string
        display_id?: number
        status?: string
        payment_collections?: Array<{
          payments?: Array<{ id: string; data?: Record<string, unknown> }>
        }>
      }
    | undefined

  if (!order) {
    throw new Error(`Order ${orderId} not found.`)
  }

  const payment = order.payment_collections
    ?.flatMap((pc) => pc.payments ?? [])
    .find((p) => p.data?.mp_payment_id)

  if (!payment?.data?.mp_payment_id) {
    throw new Error("No Mercado Pago payment linked to this order.")
  }

  const mpId = Number(payment.data.mp_payment_id)
  const client = new MercadoPagoClient({ accessToken })
  const mpPayment = await client.getPayment(mpId)
  const snapshot = buildMpPaymentSnapshot(
    mpPayment as unknown as Record<string, unknown>
  )

  const merged = {
    ...payment.data,
    mp_payment_id: mpPayment.id,
    mp_status: mpPayment.status,
    mp_status_detail: mpPayment.status_detail,
    mp_payment_method_id: mpPayment.payment_method_id,
    ...snapshot,
  }

  await runSql(
    `UPDATE payment SET data = $1::jsonb, updated_at = NOW() WHERE id = $2`,
    [JSON.stringify(merged), payment.id]
  )

  if (order.status === "canceled") {
    await runSql(
      `UPDATE "order" SET status = 'completed', updated_at = NOW() WHERE id = $1`,
      [orderId]
    )
    logger.info(`Order ${orderId} status set to completed.`)
  }

  logger.info(
    `Synced MP payment ${mpId} for order #${order.display_id ?? orderId}: status=${mpPayment.status}`
  )
  console.log(JSON.stringify(snapshot, null, 2))
}
