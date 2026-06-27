"use client"

import { useState } from "react"
import LocalizedClientLink from "@modules/common/components/localized-client-link"
import { accountLabels } from "@lib/i18n/es-co"

const LINKS = [
  { href: "/store", label: "TIENDA", highlight: true },
  { href: "/noticias", label: "NOTICIAS" },
  { href: "/streamers", label: "STREAMERS" },
] as const

type MobileMenuProps = {
  customer: { first_name?: string | null } | null
}

export default function MobileMenu({ customer }: MobileMenuProps) {
  const [open, setOpen] = useState(false)

  return (
    <div className="md:hidden">
      <button
        type="button"
        aria-label="Abrir menú"
        onClick={() => setOpen((v) => !v)}
        className="material-symbols-outlined text-on-surface-variant transition-colors hover:text-primary"
      >
        {open ? "close" : "menu"}
      </button>

      {open && (
        <div className="fixed inset-x-0 top-16 z-40 border-b border-white/10 bg-surface-dim/95 backdrop-blur-xl">
          <nav className="flex flex-col px-margin-mobile py-base">
            {LINKS.map((link) => (
              <LocalizedClientLink
                key={link.href}
                href={link.href}
                onClick={() => setOpen(false)}
                className={
                  "highlight" in link && link.highlight
                    ? "brutalist-button my-1 bg-primary px-4 py-3 text-center font-mono text-label-caps tracking-widest text-on-primary shadow-[0_0_20px_rgba(221,183,255,0.35)]"
                    : "font-mono py-3 text-label-caps tracking-widest text-on-surface-variant transition-colors hover:text-primary"
                }
              >
                {link.label}
              </LocalizedClientLink>
            ))}

            <div className="my-2 border-t border-white/10" />

            {customer ? (
              <LocalizedClientLink
                href="/account/orders"
                onClick={() => setOpen(false)}
                className="font-mono py-3 text-label-caps tracking-widest text-on-surface-variant transition-colors hover:text-primary"
              >
                {accountLabels.myPurchases}
              </LocalizedClientLink>
            ) : (
              <>
                <LocalizedClientLink
                  href="/account"
                  onClick={() => setOpen(false)}
                  className="font-mono py-3 text-label-caps tracking-widest text-on-surface-variant transition-colors hover:text-primary"
                >
                  {accountLabels.signIn}
                </LocalizedClientLink>
                <LocalizedClientLink
                  href="/account?view=register"
                  onClick={() => setOpen(false)}
                  className="brutalist-button my-1 bg-primary px-4 py-3 text-center font-mono text-label-caps tracking-widest text-on-primary"
                >
                  {accountLabels.register}
                </LocalizedClientLink>
              </>
            )}
          </nav>
        </div>
      )}
    </div>
  )
}
