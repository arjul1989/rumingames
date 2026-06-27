"use client"

import { addToCart } from "@lib/data/cart"
import { getProductPrice } from "@lib/util/get-product-price"
import { HttpTypes } from "@medusajs/types"
import { formatCop, requiresPlayerId } from "@modules/gorumin/lib/product-meta"
import LocalizedClientLink from "@modules/common/components/localized-client-link"
import { isEqual } from "lodash"
import { useParams } from "next/navigation"
import { useEffect, useMemo, useState } from "react"

const optionsAsKeymap = (
  variantOptions: HttpTypes.StoreProductVariant["options"]
) =>
  variantOptions?.reduce((acc: Record<string, string>, varopt) => {
    if (varopt.option_id) acc[varopt.option_id] = varopt.value
    return acc
  }, {})

import { isStorefrontPurchasableVariant } from "@lib/storefront-catalog"

type VariantWithPrice = HttpTypes.StoreProductVariant & {
  calculated_price?: { calculated_amount?: number }
  metadata?: Record<string, unknown> | null
}

type OptionChoice = {
  optionId: string
  title: string
  value: string
  sortPrice: number
}

function buildOptionChoices(product: HttpTypes.StoreProduct): OptionChoice[] {
  const purchasable = (product.variants ?? []).filter((v) =>
    isStorefrontPurchasableVariant(v as VariantWithPrice)
  ) as VariantWithPrice[]

  const choices = new Map<string, OptionChoice>()

  for (const variant of purchasable) {
    const price = variant.calculated_price?.calculated_amount ?? 0
    for (const opt of variant.options ?? []) {
      if (!opt.option_id) continue
      const title =
        product.options?.find((o) => o.id === opt.option_id)?.title ?? "Opción"
      const key = `${opt.option_id}::${opt.value}`
      const existing = choices.get(key)
      if (!existing || price < existing.sortPrice) {
        choices.set(key, {
          optionId: opt.option_id,
          title,
          value: opt.value,
          sortPrice: price,
        })
      }
    }
  }

  return [...choices.values()].sort((a, b) => a.sortPrice - b.sortPrice)
}

// Variant selector + add-to-cart with the Gorumin look (US-7.5). Collects a
// player id for top-up products (delivery_type = topup_id) before adding.
export default function ProductActions({
  product,
}: {
  product: HttpTypes.StoreProduct
}) {
  const countryCode = useParams().countryCode as string

  const [options, setOptions] = useState<Record<string, string | undefined>>({})
  const [playerId, setPlayerId] = useState("")
  const [isAdding, setIsAdding] = useState(false)
  const [added, setAdded] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const needsPlayerId = requiresPlayerId(product)

  const optionChoices = useMemo(() => buildOptionChoices(product), [product])

  const choicesByOption = useMemo(() => {
    const grouped = new Map<string, { title: string; values: OptionChoice[] }>()
    for (const choice of optionChoices) {
      const group = grouped.get(choice.optionId) ?? {
        title: choice.title,
        values: [],
      }
      group.values.push(choice)
      grouped.set(choice.optionId, group)
    }
    return grouped
  }, [optionChoices])

  useEffect(() => {
    if (optionChoices.length === 1) {
      const only = optionChoices[0]
      setOptions({ [only.optionId]: only.value })
    }
  }, [optionChoices])

  const selectedVariant = useMemo(() => {
    if (!product.variants?.length) return undefined
    return product.variants.find((v) => {
      if (!isStorefrontPurchasableVariant(v as VariantWithPrice)) return false
      return isEqual(optionsAsKeymap(v.options), options)
    })
  }, [product.variants, options])

  const setOptionValue = (optionId: string, value: string) => {
    setOptions((prev) => ({ ...prev, [optionId]: value }))
    setAdded(false)
  }

  const { cheapestPrice, variantPrice } = getProductPrice({
    product,
    variantId: selectedVariant?.id,
  })
  const price = selectedVariant ? variantPrice : cheapestPrice

  const inStock = useMemo(() => {
    if (!selectedVariant) return false
    if (!selectedVariant.manage_inventory) return true
    if (selectedVariant.allow_backorder) return true
    return (selectedVariant.inventory_quantity || 0) > 0
  }, [selectedVariant])

  const playerIdMissing = needsPlayerId && !playerId.trim()
  const canAdd = !!selectedVariant && inStock && !playerIdMissing && !isAdding

  const handleAddToCart = async () => {
    if (!selectedVariant?.id) return
    setIsAdding(true)
    setError(null)
    try {
      await addToCart({
        variantId: selectedVariant.id,
        quantity: 1,
        countryCode,
        metadata: needsPlayerId ? { player_id: playerId.trim() } : undefined,
      })
      setAdded(true)
    } catch {
      setError("No se pudo agregar al carrito. Inténtalo de nuevo.")
    } finally {
      setIsAdding(false)
    }
  }

  return (
    <div className="flex flex-col gap-6">
      {[...choicesByOption.entries()].map(([optionId, group]) => (
        <div key={optionId} className="flex flex-col gap-3">
          <span className="font-mono text-label-caps tracking-widest text-on-surface-variant/70">
            {group.title?.toUpperCase()}
          </span>
          <div className="flex flex-wrap gap-2">
            {group.values.map((choice) => {
              const active = options[optionId] === choice.value
              return (
                <button
                  key={`${optionId}-${choice.value}`}
                  type="button"
                  onClick={() => setOptionValue(optionId, choice.value)}
                  className={
                    active
                      ? "rounded-lg border border-secondary bg-secondary/10 px-4 py-3 font-mono text-sm text-secondary"
                      : "rounded-lg border border-white/10 bg-surface-container/50 px-4 py-3 font-mono text-sm text-on-surface transition-colors hover:border-secondary/60"
                  }
                >
                  {choice.value}
                </button>
              )
            })}
          </div>
        </div>
      ))}

      {needsPlayerId && (
        <div className="flex flex-col gap-2">
          <label
            htmlFor="player-id"
            className="font-mono text-label-caps tracking-widest text-on-surface-variant/70"
          >
            ID DE JUGADOR
          </label>
          <input
            id="player-id"
            value={playerId}
            onChange={(e) => {
              setPlayerId(e.target.value)
              setAdded(false)
            }}
            placeholder="Ingresa tu ID dentro del juego"
            className="rounded-lg border border-white/10 bg-surface-container/50 px-4 py-3 text-on-surface placeholder:text-on-surface-variant/40 focus:border-secondary focus:outline-none focus:ring-0"
          />
          <p className="text-xs text-on-surface-variant/50">
            La recarga se acreditará en esta cuenta.
          </p>
        </div>
      )}

      <div className="flex items-end justify-between border-t border-white/10 pt-6">
        <div className="flex flex-col">
          <span className="font-mono text-label-caps tracking-widest text-on-surface-variant/60">
            {selectedVariant ? "PRECIO" : "DESDE"}
          </span>
          {price ? (
            <span className="font-display text-3xl font-extrabold text-on-surface">
              {formatCop(
                price.calculated_price_number,
                price.currency_code || "COP"
              )}
            </span>
          ) : (
            <span className="font-display text-3xl font-extrabold text-on-surface-variant/40">
              —
            </span>
          )}
        </div>
      </div>

      <button
        type="button"
        onClick={handleAddToCart}
        disabled={!canAdd}
        className="brutalist-button bg-primary px-8 py-4 font-mono text-label-caps tracking-widest text-on-primary transition-all hover:scale-[1.02] active:scale-95 disabled:cursor-not-allowed disabled:opacity-40 disabled:hover:scale-100"
      >
        {isAdding
          ? "AGREGANDO..."
          : !selectedVariant
          ? "SELECCIONA UNA OPCIÓN"
          : !inStock
          ? "SIN STOCK"
          : playerIdMissing
          ? "INGRESA TU ID DE JUGADOR"
          : "AGREGAR AL CARRITO"}
      </button>

      {error && <p className="text-sm text-error">{error}</p>}

      {added && (
        <div className="flex items-center justify-between rounded-lg border border-secondary/40 bg-secondary/10 px-4 py-3">
          <span className="text-sm text-secondary">Agregado al carrito.</span>
          <LocalizedClientLink
            href="/cart"
            className="font-mono text-label-caps tracking-widest text-secondary underline"
          >
            VER CARRITO
          </LocalizedClientLink>
        </div>
      )}
    </div>
  )
}
