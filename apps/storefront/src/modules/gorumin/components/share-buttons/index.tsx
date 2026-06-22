"use client"

import { useState } from "react"

// Social share + copy link for article detail (US-7.3, Open Graph).
export default function ShareButtons({ title }: { title: string }) {
  const [copied, setCopied] = useState(false)

  const url = typeof window !== "undefined" ? window.location.href : ""

  const share = (network: "x" | "facebook" | "whatsapp") => {
    const encodedUrl = encodeURIComponent(url)
    const encodedTitle = encodeURIComponent(title)
    const targets = {
      x: `https://twitter.com/intent/tweet?url=${encodedUrl}&text=${encodedTitle}`,
      facebook: `https://www.facebook.com/sharer/sharer.php?u=${encodedUrl}`,
      whatsapp: `https://wa.me/?text=${encodedTitle}%20${encodedUrl}`,
    }
    window.open(targets[network], "_blank", "noopener,noreferrer")
  }

  const copy = async () => {
    try {
      await navigator.clipboard.writeText(url)
      setCopied(true)
      setTimeout(() => setCopied(false), 2000)
    } catch {
      /* noop */
    }
  }

  return (
    <div className="flex items-center gap-3">
      <span className="font-mono text-label-caps tracking-widest text-on-surface-variant/50">
        COMPARTIR
      </span>
      <button
        type="button"
        onClick={() => share("x")}
        aria-label="Compartir en X"
        className="material-symbols-outlined text-on-surface-variant transition-colors hover:text-secondary"
      >
        share
      </button>
      <button
        type="button"
        onClick={() => share("whatsapp")}
        aria-label="Compartir en WhatsApp"
        className="material-symbols-outlined text-on-surface-variant transition-colors hover:text-secondary"
      >
        chat
      </button>
      <button
        type="button"
        onClick={copy}
        aria-label="Copiar enlace"
        className="material-symbols-outlined text-on-surface-variant transition-colors hover:text-secondary"
      >
        {copied ? "check" : "link"}
      </button>
    </div>
  )
}
