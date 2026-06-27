import type { MedusaRequest, MedusaResponse } from "@medusajs/framework/http"
import { SUPPLIER_MODULE } from "../../../../modules/supplier"
import type SupplierModuleService from "../../../../modules/supplier/service"
import { PLATFORM_LABELS, groupKey } from "../../../../lib/fazer-meta"

// Grouped Fazer catalog mirror for the admin UI.
export async function GET(req: MedusaRequest, res: MedusaResponse) {
  const supplier = req.scope.resolve<SupplierModuleService>(SUPPLIER_MODULE)
  const { platform, region, kind } = req.query as Record<string, string>

  const catFilters: Record<string, unknown> = {}
  if (platform) catFilters.platform = platform
  if (region) catFilters.region = region
  if (kind) catFilters.kind = kind

  const categories = await supplier.listFazerCategories(catFilters, {
    order: { platform: "ASC", region: "ASC", name: "ASC" },
    take: 500,
  })

  const offers = await supplier.listFazerOffers(
    {
      ...(platform ? { platform } : {}),
      ...(region ? { region } : {}),
      ...(kind ? { kind } : {}),
    },
    { order: { wholesale_price_usd: "ASC" }, take: 5000 }
  )

  const offersByCategory = new Map<string, typeof offers>()
  for (const offer of offers) {
    const list = offersByCategory.get(offer.fazer_category_id) ?? []
    list.push(offer)
    offersByCategory.set(offer.fazer_category_id, list)
  }

  const groups = new Map<
    string,
    {
      platform: string
      platform_label: string
      region: string | null
      categories: Array<{
        category: (typeof categories)[0]
        offers: typeof offers
      }>
    }
  >()

  for (const category of categories) {
    const key = groupKey(category.platform, category.region)
    const entry = groups.get(key) ?? {
      platform: category.platform ?? "other",
      platform_label: PLATFORM_LABELS[category.platform ?? "other"] ?? category.platform,
      region: category.region,
      categories: [],
    }
    entry.categories.push({
      category,
      offers: offersByCategory.get(category.fazer_category_id) ?? [],
    })
    groups.set(key, entry)
  }

  res.json({
    groups: [...groups.values()].sort((a, b) =>
      `${a.platform_label}${a.region}`.localeCompare(`${b.platform_label}${b.region}`)
    ),
    totals: {
      categories: categories.length,
      offers: offers.length,
    },
  })
}
