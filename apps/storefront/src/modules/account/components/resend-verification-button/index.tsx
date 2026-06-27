"use client"

import { useState } from "react"
import { resendVerificationEmail } from "@lib/data/customer"
import { Button } from "@modules/common/components/ui"

export default function ResendVerificationButton({ email }: { email: string }) {
  const [status, setStatus] = useState<"idle" | "sending" | "sent" | "error">("idle")

  const handleResend = async () => {
    setStatus("sending")
    const res = await resendVerificationEmail(email)
    setStatus(res.error ? "error" : "sent")
  }

  return (
    <div className="mt-4 flex flex-col items-center gap-2">
      <Button
        type="button"
        variant="secondary"
        size="small"
        isLoading={status === "sending"}
        onClick={handleResend}
        data-testid="resend-verification-button"
      >
        Reenviar correo de confirmación
      </Button>
      {status === "sent" && (
        <p className="text-xs text-secondary">Revisa tu bandeja (y spam).</p>
      )}
      {status === "error" && (
        <p className="text-xs text-error">No se pudo reenviar. Intenta más tarde.</p>
      )}
    </div>
  )
}
