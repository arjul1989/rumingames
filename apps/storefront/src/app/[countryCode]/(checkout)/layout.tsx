import { Metadata } from "next"
import LocalizedClientLink from "@modules/common/components/localized-client-link"

// Private flow — keep it out of search results (Epic 8 / US-8.1).
export const metadata: Metadata = {
  robots: { index: false, follow: false },
}

// Gorumin checkout shell (US-7.6 / RUM-42). Dark themed, minimal chrome.
// The payment flow itself (Mercado Pago) is wired in Epic 3.
export default function CheckoutLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <div className="relative min-h-screen w-full bg-background">
      <div className="h-16 border-b border-white/10 bg-surface-dim/70 backdrop-blur-xl">
        <nav className="content-container flex h-full items-center justify-between">
          <LocalizedClientLink
            href="/cart"
            className="flex items-center gap-2 font-mono text-label-caps tracking-widest text-on-surface-variant transition-colors hover:text-primary"
            data-testid="back-to-cart-link"
          >
            <span className="material-symbols-outlined text-base">
              chevron_left
            </span>
            <span className="hidden sm:inline">VOLVER AL CARRITO</span>
            <span className="sm:hidden">VOLVER</span>
          </LocalizedClientLink>
          <LocalizedClientLink
            href="/"
            className="font-display text-xl font-extrabold tracking-tighter text-primary drop-shadow-[0_0_15px_rgba(221,183,255,0.6)]"
            data-testid="store-link"
          >
            RUMIN
          </LocalizedClientLink>
          <div className="flex items-center gap-2 font-mono text-label-caps tracking-widest text-on-surface-variant/50">
            <span className="material-symbols-outlined text-base text-secondary">
              lock
            </span>
            <span className="hidden sm:inline">PAGO SEGURO</span>
          </div>
        </nav>
      </div>
      <div className="relative" data-testid="checkout-container">
        {children}
      </div>
    </div>
  )
}
