"use client"

import { useState } from "react"
import { HttpTypes } from "@medusajs/types"
import { deleteLineItem, updateLineItem } from "@lib/data/cart"
import { formatCop } from "@modules/gorumin/lib/product-meta"
import LineItemThumbnail from "@modules/gorumin/components/line-item-thumbnail"
import LocalizedClientLink from "@modules/common/components/localized-client-link"

// Gorumin cart line item (US-7.5). Shows the player id for top-ups, kept on the
// line-item metadata when added to cart.
export default function CartItem({
  item,
  currencyCode,
}: {
  item: HttpTypes.StoreCartLineItem
  currencyCode: string
}) {
  const [updating, setUpdating] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const playerId = (item.metadata as Record<string, unknown> | undefined)
    ?.player_id as string | undefined

  const changeQuantity = async (quantity: number) => {
    if (quantity < 1) return
    setUpdating(true)
    setError(null)
    try {
      await updateLineItem({ lineId: item.id, quantity })
    } catch {
      setError("No se pudo actualizar la cantidad.")
    } finally {
      setUpdating(false)
    }
  }

  const remove = async () => {
    setUpdating(true)
    try {
      await deleteLineItem(item.id)
    } catch {
      setError("No se pudo eliminar el producto.")
      setUpdating(false)
    }
  }

  return (
    <div className="flex gap-4 border-b border-white/10 py-5">
      <LocalizedClientLink
        href={`/products/${item.product_handle}`}
        className="block"
      >
        <LineItemThumbnail item={item} size="md" />
      </LocalizedClientLink>

      <div className="flex min-w-0 flex-1 flex-col gap-1">
        <LocalizedClientLink
          href={`/products/${item.product_handle}`}
          className="font-headline truncate font-bold text-on-surface hover:text-primary"
        >
          {item.product_title}
        </LocalizedClientLink>
        {item.variant_title && (
          <span className="font-mono text-xs tracking-wide text-on-surface-variant/70">
            {item.variant_title}
          </span>
        )}
        {playerId && (
          <span className="font-mono text-[11px] tracking-wide text-secondary">
            ID JUGADOR: {playerId}
          </span>
        )}

        <div className="mt-2 flex items-center gap-3">
          <div className="flex items-center rounded-lg border border-white/10">
            <button
              type="button"
              aria-label="Disminuir"
              onClick={() => changeQuantity(item.quantity - 1)}
              disabled={updating || item.quantity <= 1}
              className="material-symbols-outlined px-2 py-1 text-on-surface-variant disabled:opacity-30"
            >
              remove
            </button>
            <span className="min-w-8 text-center font-mono text-sm text-on-surface">
              {item.quantity}
            </span>
            <button
              type="button"
              aria-label="Aumentar"
              onClick={() => changeQuantity(item.quantity + 1)}
              disabled={updating}
              className="material-symbols-outlined px-2 py-1 text-on-surface-variant disabled:opacity-30"
            >
              add
            </button>
          </div>
          <button
            type="button"
            onClick={remove}
            disabled={updating}
            className="font-mono text-[11px] tracking-widest text-on-surface-variant/60 transition-colors hover:text-error"
          >
            ELIMINAR
          </button>
        </div>
        {error && <span className="text-xs text-error">{error}</span>}
      </div>

      <div className="flex flex-col items-end justify-start">
        <span className="font-display font-bold text-on-surface">
          {formatCop(item.total ?? 0, currencyCode)}
        </span>
        {item.quantity > 1 && (
          <span className="font-mono text-[11px] text-on-surface-variant/50">
            {formatCop(item.unit_price ?? 0, currencyCode)} c/u
          </span>
        )}
      </div>
    </div>
  )
}
