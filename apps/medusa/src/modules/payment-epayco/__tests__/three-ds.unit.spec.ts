import {
  EPAYCO_THREE_DS_NETWORK_CODE,
  epaycoThreeDsEnvironment,
  getEpaycoThreeDsPayload,
  isEpaycoThreeDsRequired,
} from "../lib/three-ds"

describe("ePayco 3DS helpers", () => {
  it("detects 3DS required when network code is 187", () => {
    expect(
      isEpaycoThreeDsRequired({
        "3DS": { data: { resultCode: "IdentifyShopper" } },
        cc_network_response: { code: EPAYCO_THREE_DS_NETWORK_CODE },
      })
    ).toBe(true)

    expect(
      isEpaycoThreeDsRequired({
        "3DS": { data: { resultCode: "IdentifyShopper" } },
        cc_network_response: { code: "00" },
      })
    ).toBe(false)
  })

  it("extracts 3DS payload from charge response", () => {
    const payload = { data: { resultCode: "ChallengeShopper" } }
    expect(
      getEpaycoThreeDsPayload({
        success: true,
        "3DS": payload,
      })
    ).toEqual(payload)
  })

  it("maps test mode to test environment", () => {
    expect(epaycoThreeDsEnvironment(true)).toBe("test")
    expect(epaycoThreeDsEnvironment(false)).toBe("prod")
  })
})
