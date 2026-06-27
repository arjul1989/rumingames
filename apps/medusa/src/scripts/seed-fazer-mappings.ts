import { ExecArgs } from "@medusajs/framework/types"
import { ContainerRegistrationKeys } from "@medusajs/framework/utils"
import { formatFazerSku } from "../modules/fazer/lib/sku"
import { SUPPLIER_MODULE } from "../modules/supplier"
import type SupplierModuleService from "../modules/supplier/service"

// Links seeded Medusa variants to live Fazer Cards wholesale SKUs.
// Run: FAZER_API_KEY=... npx medusa exec ./src/scripts/seed-fazer-mappings.ts
const VARIANT_MAPPINGS: Array<{ sku: string; fazer: [kind: "giftcard" | "topup", category: string, offer: string] }> = [
  { sku: "STEAM-CO-20000", fazer: ["giftcard", "steam_wallet_co", "20500_cop"] },
  { sku: "STEAM-CO-50000", fazer: ["giftcard", "steam_wallet_co", "41000_cop"] },
  { sku: "STEAM-CO-100000", fazer: ["giftcard", "steam_wallet_co", "82000_cop"] },
  { sku: "PSN-CO-40000", fazer: ["giftcard", "playstation_us", "10_usd"] },
  { sku: "PSN-CO-80000", fazer: ["giftcard", "playstation_us", "25_usd"] },
  { sku: "NIN-CO-50000", fazer: ["giftcard", "nintendo_us", "10_usd"] },
  { sku: "NIN-CO-100000", fazer: ["giftcard", "nintendo_us", "20_usd"] },
  { sku: "RIOT-CO-25000", fazer: ["giftcard", "valorant_latam", "475_vp"] },
  { sku: "RIOT-CO-60000", fazer: ["giftcard", "valorant_latam", "1520_vp"] },
  { sku: "FF-CO-100", fazer: ["topup", "free_fire_latam", "110_diamonds"] },
  { sku: "FF-CO-310", fazer: ["topup", "free_fire_latam", "341_diamonds"] },
  { sku: "FF-CO-520", fazer: ["topup", "free_fire_latam", "572_diamonds"] },
  { sku: "XGP-CO-1M", fazer: ["giftcard", "xbox_game_pass_us", "ultimate_1month"] },
  { sku: "XGP-CO-3M", fazer: ["giftcard", "xbox_game_pass_us", "ultimate_3month"] },
]

export default async function seedFazerMappings({ container }: ExecArgs) {
  const logger = container.resolve(ContainerRegistrationKeys.LOGGER)
  const query = container.resolve(ContainerRegistrationKeys.QUERY)
  const supplier = container.resolve<SupplierModuleService>(SUPPLIER_MODULE)

  const { data: variants } = await query.graph({
    entity: "product_variant",
    fields: ["id", "sku", "product_id"],
    filters: { sku: VARIANT_MAPPINGS.map((m) => m.sku) },
  })
  const variantBySku = new Map(variants.map((v) => [v.sku, v]))

  let created = 0
  let updated = 0
  let missing = 0

  for (const mapping of VARIANT_MAPPINGS) {
    const variant = variantBySku.get(mapping.sku)
    if (!variant) {
      missing++
      logger.warn(`Variant ${mapping.sku} not found; run db:migrate first.`)
      continue
    }

    const fazerSkuId = formatFazerSku(mapping.fazer[0], mapping.fazer[1], mapping.fazer[2])
    const existing = await supplier.listSupplierProductMappings({
      medusa_variant_id: variant.id,
    })

    if (existing[0]) {
      await supplier.updateSupplierProductMappings({
        id: existing[0].id,
        fazer_sku_id: fazerSkuId,
        status: "active",
      })
      updated++
      continue
    }

    await supplier.createSupplierProductMappings([
      {
        medusa_product_id: variant.product_id,
        medusa_variant_id: variant.id,
        fazer_sku_id: fazerSkuId,
        status: "active",
      },
    ])
    created++
  }

  logger.info(
    `Fazer mappings: ${created} created, ${updated} updated, ${missing} missing variants.`
  )
}
