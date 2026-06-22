import { HttpTypes } from "@medusajs/types"
import ProductCard from "@modules/gorumin/components/product-card"
import PlatformCategories from "@modules/gorumin/components/platform-categories"

// Store landing (US-7.5 / RUM-41): platform categories + product grid, styled
// with the Gorumin design system.
export default function StoreTemplate({
  products,
  categories,
}: {
  products: HttpTypes.StoreProduct[]
  categories: HttpTypes.StoreProductCategory[]
}) {
  return (
    <div className="content-container py-16">
      <header className="mb-12 space-y-2">
        <p className="font-mono text-label-caps tracking-[0.3em] text-secondary">
          GIFT CARDS · RECARGAS · SUSCRIPCIONES
        </p>
        <h1 className="font-display text-4xl font-extrabold text-primary md:text-5xl">
          Tienda
        </h1>
      </header>

      {categories.length > 0 && (
        <section className="mb-16 space-y-6">
          <h2 className="font-mono text-label-caps tracking-widest text-on-surface-variant/60">
            EXPLORA POR PLATAFORMA
          </h2>
          <PlatformCategories categories={categories} />
        </section>
      )}

      <section className="space-y-6">
        <h2 className="font-mono text-label-caps tracking-widest text-on-surface-variant/60">
          TODOS LOS PRODUCTOS
        </h2>
        {products.length ? (
          <div className="grid grid-cols-2 gap-gutter md:grid-cols-3 lg:grid-cols-4">
            {products.map((product) => (
              <ProductCard key={product.id} product={product} />
            ))}
          </div>
        ) : (
          <p className="text-on-surface-variant/70">
            Aún no hay productos disponibles.
          </p>
        )}
      </section>
    </div>
  )
}
