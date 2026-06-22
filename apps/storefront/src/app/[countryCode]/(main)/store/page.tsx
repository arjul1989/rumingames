import { Metadata } from "next"

import { listProducts } from "@lib/data/products"
import { listCategories } from "@lib/data/categories"
import StoreTemplate from "@modules/gorumin/templates/store"

export const metadata: Metadata = {
  title: "Tienda — Gorumin",
  description:
    "Gift cards, recargas y suscripciones de videojuegos con entrega digital inmediata. Steam, PlayStation, Nintendo, Xbox, Riot y Free Fire.",
}

type Params = {
  params: Promise<{ countryCode: string }>
}

export default async function StorePage(props: Params) {
  const { countryCode } = await props.params

  const [productsResult, categories] = await Promise.all([
    listProducts({
      countryCode,
      queryParams: { limit: 24 },
    }).catch(() => ({ response: { products: [], count: 0 } })),
    listCategories().catch(() => []),
  ])

  // Top-level categories only (platforms).
  const platformCategories = (categories || []).filter(
    (c) => !c.parent_category
  )

  return (
    <StoreTemplate
      products={productsResult.response.products}
      categories={platformCategories}
    />
  )
}
