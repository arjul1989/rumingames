import { HttpTypes } from "@medusajs/types"
import LocalizedClientLink from "@modules/common/components/localized-client-link"

// Platform category shortcuts for the store landing (US-7.5). Each card links
// to the filtered category listing.
export default function PlatformCategories({
  categories,
}: {
  categories: HttpTypes.StoreProductCategory[]
}) {
  if (!categories.length) return null

  return (
    <div className="grid grid-cols-2 gap-gutter sm:grid-cols-3 lg:grid-cols-6">
      {categories.map((category) => (
        <LocalizedClientLink
          key={category.id}
          href={`/categories/${category.handle}`}
          className="hyper-glass group flex flex-col items-center gap-3 rounded-xl p-5 text-center transition-all duration-500 hover:-translate-y-1 hover:border-secondary"
        >
          <span className="material-symbols-outlined text-3xl text-secondary transition-transform group-hover:scale-110">
            sports_esports
          </span>
          <span className="font-mono text-label-caps tracking-widest text-on-surface group-hover:text-secondary">
            {category.name.toUpperCase()}
          </span>
        </LocalizedClientLink>
      ))}
    </div>
  )
}
