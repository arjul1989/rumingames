import { ExecArgs } from "@medusajs/framework/types"
import { ContainerRegistrationKeys, Modules } from "@medusajs/framework/utils"
import { fulfillDigitalOrder, FazerLike } from "../lib/fulfill-digital-order"
import { SUPPLIER_MODULE } from "../modules/supplier"
import { DIGITAL_DELIVERY_MODULE } from "../modules/digital-delivery"
import type SupplierModuleService from "../modules/supplier/service"
import type DigitalDeliveryModuleService from "../modules/digital-delivery/service"
import type { FazerOrder } from "../modules/fazer/lib/types"

const noopSleep = async () => {}

// End-to-end verification of digital fulfillment (US-2.4 / RUM-19) using an
// injected Fazer mock. Run: npx medusa exec ./src/scripts/verify-fulfillment.ts
export default async function verifyFulfillment({ container }: ExecArgs) {
  const logger = container.resolve("logger")
  const query = container.resolve(ContainerRegistrationKeys.QUERY)
  const supplier = container.resolve<SupplierModuleService>(SUPPLIER_MODULE)
  const delivery = container.resolve<DigitalDeliveryModuleService>(DIGITAL_DELIVERY_MODULE)
  const orderModule = container.resolve(Modules.ORDER)

  const { data: variants } = await query.graph({
    entity: "product_variant",
    fields: ["id", "sku"],
    filters: { sku: "STEAM-CO-20000" },
  })
  const variant = variants[0]
  if (!variant) {
    logger.error("Seed variant STEAM-CO-20000 not found; run db:migrate first.")
    return
  }

  const [mapping] = await supplier.createSupplierProductMappings([
    {
      medusa_product_id: "prod_fulfill_test",
      medusa_variant_id: variant.id,
      fazer_sku_id: "steam-fulfill-sku",
      status: "active",
    },
  ])

  const createOrder = async (email: string) => {
    const order = await orderModule.createOrders({
      currency_code: "cop",
      email,
      items: [
        { title: "Steam Gift Card", quantity: 1, unit_price: 23000, variant_id: variant.id },
      ],
    })
    return order
  }

  // ---- Happy path ----
  const okOrder = await createOrder("buyer-ok@test.com")
  const mockOk: FazerLike = {
    createOrder: async (input): Promise<FazerOrder> => ({
      id: "fz_ok_1",
      status: "completed",
      sku_id: input.sku_id,
      quantity: input.quantity,
      codes: ["ABC-123-DEF"],
    }),
    getOrder: async (id) => ({ id, status: "completed", sku_id: "x", quantity: 1, codes: ["ABC-123-DEF"] }),
  }

  const r1 = await fulfillDigitalOrder(container, { orderId: okOrder.id, fazer: mockOk, sleepImpl: noopSleep })
  const deliveries1 = await delivery.listDigitalDeliveries({ order_id: okOrder.id })
  const revealed = deliveries1[0] ? await delivery.revealCode(deliveries1[0].id) : null
  logger.info(`[happy] result=${JSON.stringify(r1)} status=${deliveries1[0]?.status} code=${revealed}`)

  // ---- Idempotency: re-run should skip ----
  const r2 = await fulfillDigitalOrder(container, { orderId: okOrder.id, fazer: mockOk, sleepImpl: noopSleep })
  logger.info(`[idempotent] result=${JSON.stringify(r2)} (expected skipped=1, delivered=0)`)

  // ---- Failure path: 3 attempts then failed ----
  const failOrder = await createOrder("buyer-fail@test.com")
  let attempts = 0
  const mockFail: FazerLike = {
    createOrder: async (): Promise<FazerOrder> => {
      attempts++
      throw new Error("supplier 500")
    },
    getOrder: async (id) => ({ id, status: "failed", sku_id: "x", quantity: 1 }),
  }
  const r3 = await fulfillDigitalOrder(container, { orderId: failOrder.id, fazer: mockFail, sleepImpl: noopSleep })
  const deliveries3 = await delivery.listDigitalDeliveries({ order_id: failOrder.id })
  logger.info(`[fail] result=${JSON.stringify(r3)} attempts=${attempts} status=${deliveries3[0]?.status} err=${deliveries3[0]?.error_message}`)

  // ---- Cleanup ----
  const allDeliveries = [...deliveries1, ...deliveries3]
  if (allDeliveries.length) {
    await delivery.deleteDigitalDeliveries(allDeliveries.map((d) => d.id))
  }
  await supplier.deleteSupplierProductMappings([mapping.id])
  await orderModule.deleteOrders([okOrder.id, failOrder.id])
  logger.info("Fulfillment verification cleanup done.")
}
