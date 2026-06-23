import { Suspense } from "react"

import LocalizedClientLink from "@modules/common/components/localized-client-link"
import CartButton from "@modules/layout/components/cart-button"
import MobileMenu from "@modules/gorumin/components/mobile-menu"

// Gorumin global header (US-7.1 / RUM-37). Tienda first as primary CTA.
const NAV_LINKS = [
  { href: "/store", label: "TIENDA", highlight: true },
  { href: "/noticias", label: "NOTICIAS" },
  { href: "/streamers", label: "STREAMERS" },
] as const

export default async function Nav() {
  return (
    <div className="sticky top-0 inset-x-0 z-50">
      <header className="relative h-16 border-b border-white/10 bg-surface-dim/70 backdrop-blur-xl">
        <nav className="content-container flex h-full items-center justify-between">
          <LocalizedClientLink
            href="/"
            className="font-display text-2xl font-extrabold tracking-tighter text-primary drop-shadow-[0_0_15px_rgba(221,183,255,0.6)]"
            data-testid="nav-store-link"
          >
            GORUMIN
          </LocalizedClientLink>

          <div className="hidden items-center gap-gutter md:flex">
            {NAV_LINKS.map((link) => (
              <LocalizedClientLink
                key={link.href}
                href={link.href}
                className={
                  "highlight" in link && link.highlight
                    ? "brutalist-button relative overflow-hidden bg-primary px-5 py-2.5 font-mono text-label-caps tracking-widest text-on-primary shadow-[0_0_24px_rgba(221,183,255,0.45)] transition-all duration-300 hover:scale-105 hover:shadow-[0_0_32px_rgba(221,183,255,0.6)] active:scale-95"
                    : "font-mono text-label-caps tracking-widest text-on-surface-variant transition-colors duration-300 hover:text-primary"
                }
              >
                {"highlight" in link && link.highlight && (
                  <span className="shimmer-overlay absolute inset-0 animate-shimmer opacity-20" />
                )}
                <span className={"highlight" in link && link.highlight ? "relative z-10" : undefined}>
                  {link.label}
                </span>
              </LocalizedClientLink>
            ))}
          </div>

          <div className="flex items-center gap-x-base">
            <LocalizedClientLink
              href="/account"
              aria-label="Mi cuenta"
              className="material-symbols-outlined text-on-surface-variant transition-colors hover:text-primary"
              data-testid="nav-account-link"
            >
              account_circle
            </LocalizedClientLink>
            <Suspense
              fallback={
                <LocalizedClientLink
                  href="/cart"
                  className="material-symbols-outlined text-on-surface-variant hover:text-primary"
                  data-testid="nav-cart-link"
                >
                  shopping_cart
                </LocalizedClientLink>
              }
            >
              <CartButton />
            </Suspense>
            <MobileMenu />
          </div>
        </nav>
      </header>
    </div>
  )
}
