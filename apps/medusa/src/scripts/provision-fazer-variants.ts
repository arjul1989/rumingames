import { ExecArgs } from "@medusajs/framework/types"
import { provisionFazerVariants } from "../lib/provision-fazer-variants"

// Creates Medusa variants for enabled Fazer offers without a linked variant.
// Run: npx medusa exec ./src/scripts/provision-fazer-variants.ts
export default async function provisionFazerVariantsScript({ container }: ExecArgs) {
  await provisionFazerVariants(container)
}
