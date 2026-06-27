export type EpaycoTransactionStatus =
  | "Aceptada"
  | "Rechazada"
  | "Pendiente"
  | "Fallida"

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

export type EpaycoChargeResponse = {
  success: boolean
  title_response?: string
  text_response?: string
  data?: EpaycoTransaction
  "3DS"?: EpaycoThreeDsPayload
  cc_network_response?: { code?: string | number; message?: string }
}

export type EpaycoTransaction = {
  ref_payco: string | number
  factura?: string
  descripcion?: string
  valor?: string | number
  iva?: string | number
  baseiva?: string | number
  moneda?: string
  estado: EpaycoTransactionStatus | string
  respuesta?: string
  autorizacion?: string
  recibo?: string | number
  fecha?: string
  cod_respuesta?: string
  email?: string
  "3DS"?: EpaycoThreeDsPayload
  cc_network_response?: { code?: string | number; message?: string }
}

export type EpaycoToken = {
  id: string
  status?: string
  created?: string
  card?: {
    name?: string
    last4?: string
    brand?: string
  }
}

export type EpaycoCustomer = {
  customerId: string
  email?: string
}

export type EpaycoLoginResponse = {
  token?: string
  bearer_token?: string
  success?: boolean
}

export type CreateEpaycoChargeInput = {
  reference: string
  amountPesos: number
  customerEmail: string
  tokenCard: string
  customerId: string
  docType: string
  docNumber: string
  firstName: string
  lastName: string
  phone?: string
  city?: string
  address?: string
  description?: string
  ip: string
  redirectUrl: string
  confirmationUrl: string
  testMode?: boolean
}
