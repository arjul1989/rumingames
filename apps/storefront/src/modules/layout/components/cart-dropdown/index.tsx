"use client"

import {
  Popover,
  PopoverButton,
  PopoverPanel,
  Transition,
} from "@headlessui/react"
import { convertToLocale } from "@lib/util/money"
import { cartLabels } from "@lib/i18n/es-co"
import { HttpTypes } from "@medusajs/types"
import DeleteButton from "@modules/common/components/delete-button"
import LineItemOptions from "@modules/common/components/line-item-options"
import LineItemPrice from "@modules/common/components/line-item-price"
import LocalizedClientLink from "@modules/common/components/localized-client-link"
import LineItemThumbnail from "@modules/gorumin/components/line-item-thumbnail"
import { usePathname } from "next/navigation"
import { Fragment, useEffect, useRef, useState } from "react"

const CartDropdown = ({
  cart: cartState,
}: {
  cart?: HttpTypes.StoreCart | null
}) => {
  const [activeTimer, setActiveTimer] = useState<NodeJS.Timer | undefined>(
    undefined
  )
  const [cartDropdownOpen, setCartDropdownOpen] = useState(false)

  const open = () => setCartDropdownOpen(true)
  const close = () => setCartDropdownOpen(false)

  const totalItems =
    cartState?.items?.reduce((acc, item) => {
      return acc + item.quantity
    }, 0) || 0

  const subtotal = cartState?.subtotal ?? 0
  const itemRef = useRef<number>(totalItems || 0)

  const timedOpen = () => {
    open()

    const timer = setTimeout(close, 5000)

    setActiveTimer(timer)
  }

  const openAndCancel = () => {
    if (activeTimer) {
      clearTimeout(activeTimer)
    }

    open()
  }

  useEffect(() => {
    return () => {
      if (activeTimer) {
        clearTimeout(activeTimer)
      }
    }
  }, [activeTimer])

  const pathname = usePathname()

  useEffect(() => {
    if (itemRef.current !== totalItems && !pathname.includes("/cart")) {
      timedOpen()
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [totalItems, itemRef.current])

  return (
    <div
      className="z-50 h-full"
      onMouseEnter={openAndCancel}
      onMouseLeave={close}
    >
      <Popover className="relative h-full">
        <PopoverButton className="h-full">
          <LocalizedClientLink
            className="font-mono text-label-caps tracking-widest text-on-surface-variant transition-colors hover:text-secondary"
            href="/cart"
            data-testid="nav-cart-link"
          >{`${cartLabels.cart} (${totalItems})`}</LocalizedClientLink>
        </PopoverButton>
        <Transition
          show={cartDropdownOpen}
          as={Fragment}
          enter="transition ease-out duration-200"
          enterFrom="opacity-0 translate-y-1"
          enterTo="opacity-100 translate-y-0"
          leave="transition ease-in duration-150"
          leaveFrom="opacity-100 translate-y-0"
          leaveTo="opacity-0 translate-y-1"
        >
          <PopoverPanel
            static
            className="absolute right-0 top-[calc(100%+8px)] hidden w-[400px] overflow-hidden rounded-xl border border-white/10 bg-surface-container/95 text-on-surface shadow-2xl backdrop-blur-md small:block"
            data-testid="nav-cart-dropdown"
          >
            <div className="flex items-center justify-center border-b border-white/10 px-4 py-3">
              <h3 className="font-mono text-label-caps tracking-widest text-primary">
                {cartLabels.cart}
              </h3>
            </div>
            {cartState && cartState.items?.length ? (
              <>
                <div className="grid max-h-[360px] grid-cols-1 gap-y-6 overflow-y-scroll px-4 py-4 no-scrollbar">
                  {cartState.items
                    .sort((a, b) => {
                      return (a.created_at ?? "") > (b.created_at ?? "")
                        ? -1
                        : 1
                    })
                    .map((item) => (
                      <div
                        className="grid grid-cols-[80px_1fr] gap-x-3"
                        key={item.id}
                        data-testid="cart-item"
                      >
                        <LocalizedClientLink
                          href={`/products/${item.product_handle}`}
                        >
                          <LineItemThumbnail item={item} size="md" />
                        </LocalizedClientLink>
                        <div className="flex min-w-0 flex-col justify-between">
                          <div className="flex items-start justify-between gap-2">
                            <div className="min-w-0 flex-1">
                              <h3 className="truncate font-headline text-sm font-bold text-on-surface">
                                <LocalizedClientLink
                                  href={`/products/${item.product_handle}`}
                                  data-testid="product-link"
                                >
                                  {item.title}
                                </LocalizedClientLink>
                              </h3>
                              <LineItemOptions
                                variant={item.variant}
                                data-testid="cart-item-variant"
                                data-value={item.variant}
                              />
                              <span
                                className="font-mono text-[11px] text-on-surface-variant/60"
                                data-testid="cart-item-quantity"
                                data-value={item.quantity}
                              >
                                {cartLabels.quantityN(item.quantity)}
                              </span>
                            </div>
                            <LineItemPrice
                              item={item}
                              style="tight"
                              currencyCode={cartState.currency_code}
                            />
                          </div>
                          <DeleteButton
                            id={item.id}
                            className="mt-1 text-on-surface-variant/60 hover:text-error"
                            data-testid="cart-item-remove-button"
                          >
                            {cartLabels.remove}
                          </DeleteButton>
                        </div>
                      </div>
                    ))}
                </div>
                <div className="flex flex-col gap-y-4 border-t border-white/10 p-4">
                  <div className="flex items-center justify-between">
                    <span className="font-mono text-xs tracking-wide text-on-surface-variant/70">
                      {cartLabels.subtotalExclTax}
                    </span>
                    <span
                      className="font-display font-bold text-on-surface"
                      data-testid="cart-subtotal"
                      data-value={subtotal}
                    >
                      {convertToLocale({
                        amount: subtotal,
                        currency_code: cartState.currency_code,
                      })}
                    </span>
                  </div>
                  <LocalizedClientLink href="/cart">
                    <span
                      className="brutalist-button block w-full bg-primary py-3 text-center font-mono text-label-caps tracking-widest text-on-primary transition-transform hover:scale-[1.02]"
                      data-testid="go-to-cart-button"
                    >
                      {cartLabels.goToCart}
                    </span>
                  </LocalizedClientLink>
                </div>
              </>
            ) : (
              <div className="flex flex-col items-center justify-center gap-y-4 px-4 py-12">
                <span className="material-symbols-outlined text-4xl text-on-surface-variant/30">
                  shopping_cart
                </span>
                <span className="text-sm text-on-surface-variant/70">
                  {cartLabels.emptyBag}
                </span>
                <LocalizedClientLink href="/store">
                  <span
                    className="brutalist-button bg-secondary px-6 py-2 font-mono text-label-caps tracking-widest text-on-secondary"
                    onClick={close}
                  >
                    {cartLabels.exploreProducts}
                  </span>
                </LocalizedClientLink>
              </div>
            )}
          </PopoverPanel>
        </Transition>
      </Popover>
    </div>
  )
}

export default CartDropdown
