export type EpaycoThreeDsPayload = {
  data?: {
    accessToken?: string
    resultCode?: string
    action?: {
      challenge?: { acsURL?: string; encodedCReq?: string }
      threeDSMethodURL?: string
    }
  }
  methodData?: string
}

export type EpaycoTransactionView = {
  ref_payco: string | number
  factura?: string
  estado: string
  respuesta?: string
  valor?: string | number
  "3DS"?: EpaycoThreeDsPayload
  cc_network_response?: { code?: string | number; message?: string }
}

export type EpaycoChargeResult = {
  charge: {
    success?: boolean
    data?: EpaycoTransactionView
    "3DS"?: EpaycoThreeDsPayload
    cc_network_response?: { code?: string | number; message?: string }
  }
  transaction: EpaycoTransactionView | null
  ref_payco: string | null
  three_ds_required: boolean
  three_ds: EpaycoThreeDsPayload | null
}

declare global {
  interface Window {
    validate3ds?: (
      transactionData: Record<string, unknown>,
      environment?: "test" | "prod" | "green" | "local",
      timeoutMs?: number
    ) => Promise<boolean | void>
  }
}
