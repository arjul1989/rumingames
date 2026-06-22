import { notFound } from "next/navigation"

import { listProducts } from "@lib/data/products"
import LocalizedClientLink from "@modules/common/components/localized-client-link"
import ProductCard from "@modules/gorumin/components/product-card"
import { SortOptions } from "@modules/store/components/refinement-list/sort-products"
import { HttpTypes } from "@medusajs/types"

// Category listing with the Gorumin design system (US-7.5 / RUM-41).
export default async function CategoryTemplate({
  category,
  countryCode,
}: {
  category: HttpTypes.StoreProductCategory
  sortBy?: SortOptions
  page?: string
  countryCode: string
}) {
  if (!category || !countryCode) notFound()

  const { response } = await listProducts({
    countryCode,
    queryParams: {
      category_id: [category.id],
      limit: 48,
    } as HttpTypes.StoreProductListParams,
  }).catch(() => ({ response: { products: [], count: 0 } }))

  const products = response.products

  const parents: HttpTypes.StoreProductCategory[] = []
  const collectParents = (c: HttpTypes.StoreProductCategory) => {
    if (c.parent_category) {
      parents.push(c.parent_category)
      collectParents(c.parent_category)
    }
  }
  collectParents(category)

  return (
    <div className="content-container py-16">
      <header className="mb-12 space-y-3">
        <nav className="flex flex-wrap items-center gap-2 font-mono text-label-caps tracking-widest text-on-surface-variant/60">
          <LocalizedClientLink href="/store" className="hover:text-secondary">
            TIENDA
          </LocalizedClientLink>
          {parents.reverse().map((parent) => (
            <span key={parent.id} className="flex items-center gap-2">
              <span>/</span>
              <LocalizedClientLink
                href={`/categories/${parent.handle}`}
                className="hover:text-secondary"
              >
                {parent.name.toUpperCase()}
              </LocalizedClientLink>
            </span>
          ))}
        </nav>
        <h1 className="font-display text-4xl font-extrabold text-primary md:text-5xl">
          {category.name}
        </h1>
        {category.description && (
          <p className="max-w-2xl text-on-surface-variant/70">
            {category.description}
          </p>
        )}
      </header>

      {category.category_children && category.category_children.length > 0 && (
        <div className="mb-10 flex flex-wrap gap-3">
          {category.category_children.map((child) => (
            <LocalizedClientLink
              key={child.id}
              href={`/categories/${child.handle}`}
              className="rounded-full border border-white/10 bg-surface-container/50 px-4 py-2 font-mono text-label-caps tracking-widest text-on-surface-variant transition-colors hover:border-secondary hover:text-secondary"
            >
              {child.name.toUpperCase()}
            </LocalizedClientLink>
          ))}
        </div>
      )}

      {products.length ? (
        <div className="grid grid-cols-2 gap-gutter md:grid-cols-3 lg:grid-cols-4">
          {products.map((product) => (
            <ProductCard key={product.id} product={product} />
          ))}
        </div>
      ) : (
        <p className="text-on-surface-variant/70">
          No hay productos en esta categoría todavía.
        </p>
      )}
    </div>
  )
}
