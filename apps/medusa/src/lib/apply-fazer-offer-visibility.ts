import { MedusaContainer } from "@medusajs/framework"
import { ContainerRegistrationKeys } from "@medusajs/framework/utils"
import { updateProductVariantsWorkflow } from "@medusajs/medusa/core-flows"
import { ensureFazerVariantInventory } from "./ensure-fazer-variant-inventory"

async function readVariantMetadata(
  container: MedusaContainer,
  variantId: string
): Promise<Record<string, unknown>> {
  const query = container.resolve(ContainerRegistrationKeys.QUERY)
  const { data } = await query.graph({
    entity: "product_variant",
    fields: ["metadata"],
    filters: { id: variantId },
  })
  return ((data[0] as { metadata?: Record<string, unknown> } | undefined)?.metadata ??
    {}) as Record<string, unknown>
}

/** Reflect Fazer enabled/status on the linked Medusa variant (stock + metadata). */
export async function applyFazerOfferVisibility(
  container: MedusaContainer,
  input: {
    variantId: string
    enabled: boolean
    status: "active" | "inactive" | "out_of_stock"
  }
): Promise<void> {
  const visible =
    input.enabled && (input.status === "active" || input.status === "out_of_stock")

  await ensureFazerVariantInventory(container, input.variantId, visible)

  const metadata = await readVariantMetadata(container, input.variantId)
  await updateProductVariantsWorkflow(container).run({
    input: {
      product_variants: [
        {
          id: input.variantId,
          metadata: {
            ...metadata,
            fazer_enabled: visible,
            fazer_status: input.status,
          },
        },
      ],
    },
  })
}
