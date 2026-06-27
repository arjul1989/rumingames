import Image from "next/image"
import { HttpTypes } from "@medusajs/types"
import { imageForLineItem } from "@lib/platform-assets"

type LineItemLike = HttpTypes.StoreCartLineItem | HttpTypes.StoreOrderLineItem

const SIZES = {
  sm: { className: "h-14 w-14", sizes: "56px", icon: "text-2xl" },
  md: { className: "h-20 w-20", sizes: "80px", icon: "text-3xl" },
  lg: { className: "h-24 w-24", sizes: "96px", icon: "text-4xl" },
} as const

export default function LineItemThumbnail({
  item,
  size = "md",
  className = "",
}: {
  item: LineItemLike
  size?: keyof typeof SIZES
  className?: string
}) {
  const src = imageForLineItem(item)
  const dim = SIZES[size]

  return (
    <div
      className={`relative flex-shrink-0 overflow-hidden rounded-lg bg-surface-container-low ${dim.className} ${className}`}
    >
      {src ? (
        <Image
          src={src}
          alt={item.product_title ?? item.title ?? ""}
          fill
          sizes={dim.sizes}
          className="object-cover"
        />
      ) : (
        <div className="flex h-full w-full items-center justify-center">
          <span
            className={`material-symbols-outlined text-on-surface-variant/40 ${dim.icon}`}
          >
            redeem
          </span>
        </div>
      )}
    </div>
  )
}
