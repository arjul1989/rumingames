"use client"

export function EpaycoThreeDsBadge() {
  return (
    <div
      className="flex items-center gap-3 rounded-lg border border-white/15 bg-white/5 px-4 py-3"
      role="status"
      aria-live="polite"
    >
      <div className="flex h-10 w-16 items-center justify-center rounded bg-[#1A1F71] text-[10px] font-bold tracking-wider text-white">
        3DS
      </div>
      <div className="text-left">
        <p className="text-sm font-semibold text-on-surface">
          Autenticación 3D Secure
        </p>
        <p className="text-xs text-on-surface-variant">
          ePayco está verificando la transacción con tu banco.
        </p>
      </div>
    </div>
  )
}

export function EpaycoThreeDsContainer() {
  return (
    <div
      id="epayco-threeds-root"
      className="mt-4 min-h-[420px] overflow-hidden rounded-xl border border-white/15 bg-white/5"
      aria-label="Verificación 3D Secure ePayco"
    />
  )
}
