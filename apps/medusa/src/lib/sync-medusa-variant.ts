import { MedusaContainer } from "@medusajs/framework"
import { ContainerRegistrationKeys } from "@medusajs/framework/utils"
import { updateProductVariantsWorkflow, updateProductsWorkflow } from "@medusajs/medusa/core-flows"
import { runSql } from "./run-sql"

export interface SyncMedusaVariantInput {
  variantId: string
  productId?: string | null
  faceValueLabel: string
  imageUrl?: string | null
  cop: number
  fazerSkuId: string
}

/** Display title aligned with Fazer face value + sale price in COP. */
export function formatVariantTitle(faceValueLabel: string, cop: number): string {
  const copFmt = new Intl.NumberFormat("es-CO", { maximumFractionDigits: 0 }).format(
    Math.round(cop)
  )
  return `${faceValueLabel} · $${copFmt} COP`
}

async function getOptionValueId(
  container: MedusaContainer,
  variantId: string
): Promise<string | null> {
  const query = container.resolve(ContainerRegistrationKeys.QUERY)
  const { data } = await query.graph({
    entity: "product_variant",
    fields: ["options.id"],
    filters: { id: variantId },
  })
  const variant = data[0] as { options?: Array<{ id: string }> } | undefined
  return variant?.options?.[0]?.id ?? null
}

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

async function updateOptionValueSql(optionValueId: string, value: string): Promise<void> {
  await runSql(
    `UPDATE product_option_value SET value = $1, updated_at = now() WHERE id = $2`,
    [value, optionValueId]
  )
}

/** Push Fazer offer data into the linked Medusa variant (admin + storefront). */
export async function syncMedusaVariantFromFazer(
  container: MedusaContainer,
  input: SyncMedusaVariantInput
): Promise<void> {
  const title = formatVariantTitle(input.faceValueLabel, input.cop)
  const imageUrl = input.imageUrl ?? undefined
  const metadata = await readVariantMetadata(container, input.variantId)

  await updateProductVariantsWorkflow(container).run({
    input: {
      product_variants: [
        {
          id: input.variantId,
          title,
          ...(imageUrl ? { thumbnail: imageUrl } : {}),
          prices: [{ amount: Math.round(input.cop), currency_code: "cop" }],
          metadata: {
            ...metadata,
            fazer_sku_id: input.fazerSkuId,
            fazer_image_url: imageUrl ?? null,
            face_value_label: input.faceValueLabel,
          },
        },
      ],
    },
  })

  const optionValueId = await getOptionValueId(container, input.variantId)
  if (optionValueId) {
    try {
      await updateOptionValueSql(optionValueId, input.faceValueLabel)
    } catch {
      // Option label sync is best-effort; title already reflects Fazer data.
    }
  }

  if (input.productId && imageUrl) {
    await updateProductsWorkflow(container).run({
      input: {
        products: [
          {
            id: input.productId,
            thumbnail: imageUrl,
            metadata: {
              fazer_image_url: imageUrl,
            },
          },
        ],
      },
    })
  }
}
