"use client"

import { useEffect, useState } from "react"
import LocalizedClientLink from "@modules/common/components/localized-client-link"

// Basic cookie consent banner (US-10.2 / RUM-66). Stores acceptance in a
// first-party cookie so it isn't shown again. Non-blocking and dismissible.
const CONSENT_COOKIE = "gorumin_cookie_consent"

function hasConsent(): boolean {
  if (typeof document === "undefined") return true
  return document.cookie.split("; ").some((c) => c.startsWith(`${CONSENT_COOKIE}=`))
}

export default function CookieConsent() {
  const [visible, setVisible] = useState(false)

  useEffect(() => {
    if (!hasConsent()) setVisible(true)
  }, [])

  const accept = () => {
    const oneYear = 60 * 60 * 24 * 365
    document.cookie = `${CONSENT_COOKIE}=1; path=/; max-age=${oneYear}; samesite=lax`
    setVisible(false)
  }

  if (!visible) return null

  return (
    <div
      role="dialog"
      aria-label="Aviso de cookies"
      className="fixed inset-x-0 bottom-0 z-50 px-4 pb-4"
    >
      <div className="hyper-glass mx-auto flex max-w-3xl flex-col items-start gap-4 rounded-2xl border border-white/10 p-5 shadow-2xl sm:flex-row sm:items-center sm:justify-between">
        <p className="text-sm text-on-surface-variant/90">
          Usamos cookies para el funcionamiento del sitio y análisis. Al continuar aceptas su uso.{" "}
          <LocalizedClientLink href="/privacidad" className="text-secondary underline">
            Más información
          </LocalizedClientLink>
          .
        </p>
        <button
          type="button"
          onClick={accept}
          className="flex-shrink-0 rounded-lg bg-primary px-5 py-2 font-mono text-label-caps tracking-widest text-on-primary transition-opacity hover:opacity-90"
        >
          ACEPTAR
        </button>
      </div>
    </div>
  )
}
