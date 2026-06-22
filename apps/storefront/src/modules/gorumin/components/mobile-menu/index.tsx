"use client"

import { useState } from "react"
import LocalizedClientLink from "@modules/common/components/localized-client-link"

const LINKS = [
  { href: "/noticias", label: "NOTICIAS" },
  { href: "/streamers", label: "STREAMERS" },
  { href: "/store", label: "TIENDA" },
  { href: "/account", label: "MI CUENTA" },
]

export default function MobileMenu() {
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
                className="font-mono py-3 text-label-caps tracking-widest text-on-surface-variant transition-colors hover:text-primary"
              >
                {link.label}
              </LocalizedClientLink>
            ))}
          </nav>
        </div>
      )}
    </div>
  )
}
