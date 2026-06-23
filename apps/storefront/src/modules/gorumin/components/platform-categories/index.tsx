import Image from "next/image"
import { HttpTypes } from "@medusajs/types"
import LocalizedClientLink from "@modules/common/components/localized-client-link"
import { imageForCategory } from "@lib/platform-assets"

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
      {categories.map((category) => {
        const image = imageForCategory(category)
        return (
        <LocalizedClientLink
          key={category.id}
          href={`/categories/${category.handle}`}
          className="hyper-glass group flex flex-col items-center gap-3 rounded-xl p-5 text-center transition-all duration-500 hover:-translate-y-1 hover:border-secondary"
        >
          <div className="relative h-16 w-16 overflow-hidden rounded-xl bg-surface-container-low ring-1 ring-white/10 transition-transform group-hover:scale-110">
            {image ? (
              <Image
                src={image}
                alt={category.name}
                fill
                sizes="64px"
                className="object-cover"
              />
            ) : (
              <span className="material-symbols-outlined flex h-full w-full items-center justify-center text-3xl text-secondary">
                sports_esports
              </span>
            )}
          </div>
          <span className="font-mono text-label-caps tracking-widest text-on-surface group-hover:text-secondary">
            {category.name.toUpperCase()}
          </span>
        </LocalizedClientLink>
        )
      })}
    </div>
  )
}
