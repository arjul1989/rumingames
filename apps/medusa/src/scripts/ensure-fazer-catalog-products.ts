import { ExecArgs } from "@medusajs/framework/types"
import { ensureFazerCatalogProducts } from "../lib/ensure-fazer-catalog-products"

// Creates Medusa products from CATALOG that are required by the Fazer category map.
// Run: npx medusa exec ./src/scripts/ensure-fazer-catalog-products.ts
export default async function ensureFazerCatalogProductsScript({ container }: ExecArgs) {
  const result = await ensureFazerCatalogProducts(container)
  const logger = container.resolve("logger")
  logger.info(
    `Fazer catalog products: ${result.created} created, ${result.existing} already existed.`
  )
}
