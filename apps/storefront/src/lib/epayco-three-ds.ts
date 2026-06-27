import type { EpaycoChargeResult } from "@lib/epayco-types"

const POLL_MS = 2500
const MAX_POLLS = 120

export function epaycoThreeDsEnvironment(testMode: boolean): "test" | "prod" {
  return testMode ? "test" : "prod"
}

export async function runEpaycoThreeDsValidation(
  chargeResult: EpaycoChargeResult,
  testMode: boolean
): Promise<{ success: boolean; refPayco?: string; message?: string }> {
  if (!chargeResult.three_ds_required || !window.validate3ds) {
    return { success: false, message: "3DS no disponible." }
  }

  const transactionData = {
    ...chargeResult.charge,
    ref_payco: chargeResult.ref_payco,
    properties: { withParent: true },
  }

  return new Promise((resolve) => {
    const environment = epaycoThreeDsEnvironment(testMode)
    const timeout = window.setTimeout(() => {
      window.removeEventListener("message", onMessage)
      resolve({ success: false, message: "La autenticación 3D Secure tardó demasiado." })
    }, 420_000)

    const onMessage = (event: MessageEvent) => {
      const data = event.data as { success?: boolean; ref_payco?: string; message?: string }
      if (data?.ref_payco && data.success !== undefined) {
        window.clearTimeout(timeout)
        window.removeEventListener("message", onMessage)
        resolve({
          success: Boolean(data.success),
          refPayco: String(data.ref_payco),
          message: data.message,
        })
      }
    }

    window.addEventListener("message", onMessage)

    void window.validate3ds!(transactionData, environment).catch(() => {
      window.clearTimeout(timeout)
      window.removeEventListener("message", onMessage)
      resolve({ success: false, message: "Error en la validación 3D Secure." })
    })
  })
}

export async function pollEpaycoTransaction(
  refPayco: string,
  fetchTx: (ref: string) => Promise<{ transaction: { estado: string } }>
): Promise<{ approved: boolean; message?: string }> {
  for (let attempt = 0; attempt < MAX_POLLS; attempt++) {
    const { transaction } = await fetchTx(refPayco)
    if (transaction.estado === "Aceptada") {
      return { approved: true }
    }
    if (transaction.estado === "Rechazada" || transaction.estado === "Fallida") {
      return {
        approved: false,
        message: "El pago fue rechazado por el banco.",
      }
    }
    await new Promise((resolve) => setTimeout(resolve, POLL_MS))
  }
  return { approved: false, message: "La confirmación del pago tardó demasiado." }
}
