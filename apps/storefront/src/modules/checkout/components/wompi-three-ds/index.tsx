"use client"

function decodeChallengeHtml(escapedHtml: string): string {
  return escapedHtml
    .replace(/&lt;/g, "<")
    .replace(/&gt;/g, ">")
    .replace(/&quot;/g, '"')
    .replace(/&#39;/g, "'")
    .replace(/&amp;/g, "&")
}

export function WompiThreeDsBadge() {
  return (
    <div
      className="flex items-center gap-3 rounded-lg border border-white/15 bg-white/5 px-4 py-3"
      role="status"
      aria-live="polite"
    >
      <div className="flex h-10 w-16 items-center justify-center rounded bg-[#1A1F71] text-[10px] font-bold tracking-wider text-white">
        MC
      </div>
      <div className="text-left">
        <p className="text-sm font-semibold text-on-surface">
          Autenticación 3D Secure
        </p>
        <p className="text-xs text-on-surface-variant">
          Tu banco está verificando la transacción de forma segura.
        </p>
      </div>
    </div>
  )
}

export function WompiThreeDsChallengeFrame({
  escapedHtml,
}: {
  escapedHtml: string
}) {
  const srcDoc = decodeChallengeHtml(escapedHtml)

  return (
    <div className="mt-4 overflow-hidden rounded-xl border border-white/15 bg-white">
      <iframe
        title="Verificación 3D Secure"
        srcDoc={srcDoc}
        className="h-[420px] w-full border-0"
        sandbox="allow-forms allow-scripts allow-same-origin allow-popups"
      />
    </div>
  )
}
