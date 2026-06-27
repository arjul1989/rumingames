import type { EpaycoChargeResponse, EpaycoThreeDsPayload } from "./types"

/** ePayco signals 3DS when cc_network_response.code is 187. */
export const EPAYCO_THREE_DS_NETWORK_CODE = "187"

export function isEpaycoThreeDsRequired(
  response: Pick<EpaycoChargeResponse, "3DS" | "cc_network_response">
): boolean {
  return (
    Boolean(response["3DS"]) &&
    String(response.cc_network_response?.code ?? "") === EPAYCO_THREE_DS_NETWORK_CODE
  )
}

export function getEpaycoThreeDsPayload(
  response: EpaycoChargeResponse
): EpaycoThreeDsPayload | null {
  return response["3DS"] ?? response.data?.["3DS"] ?? null
}

export function epaycoThreeDsEnvironment(testMode: boolean): "test" | "prod" {
  return testMode ? "test" : "prod"
}
