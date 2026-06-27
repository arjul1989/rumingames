import {
  decodeWompiChallengeHtml,
  extractWompiChallengeIframeSrcDoc,
  getWompiThreeDsAuth,
  isWompiFinalStatus,
  isWompiThreeDsAuthenticating,
  isWompiThreeDsChallenge,
} from "../lib/three-ds"
import type { WompiTransaction } from "../lib/types"

describe("Wompi 3DS helpers", () => {
  it("detects final transaction statuses", () => {
    expect(isWompiFinalStatus("APPROVED")).toBe(true)
    expect(isWompiFinalStatus("DECLINED")).toBe(true)
    expect(isWompiFinalStatus("PENDING")).toBe(false)
  })

  it("extracts three_ds_auth from transaction", () => {
    const tx = {
      payment_method: {
        extra: {
          three_ds_auth: {
            current_step: "CHALLENGE",
            current_step_status: "PENDING",
            three_ds_method_data: "&lt;iframe&gt;&lt;/iframe&gt;",
          },
        },
      },
    } as WompiTransaction

    expect(getWompiThreeDsAuth(tx)?.current_step).toBe("CHALLENGE")
  })

  it("detects active 3DS challenge", () => {
    expect(
      isWompiThreeDsChallenge({
        current_step: "CHALLENGE",
        current_step_status: "PENDING",
        three_ds_method_data: "&lt;iframe&gt;&lt;/iframe&gt;",
      })
    ).toBe(true)

    expect(
      isWompiThreeDsChallenge({
        current_step: "CHALLENGE",
        current_step_status: "COMPLETED",
        three_ds_method_data: "&lt;iframe&gt;&lt;/iframe&gt;",
      })
    ).toBe(false)
  })

  it("detects authentication step", () => {
    expect(
      isWompiThreeDsAuthenticating({
        current_step: "AUTHENTICATION",
        current_step_status: "PENDING",
      })
    ).toBe(true)
  })

  it("decodes escaped challenge HTML", () => {
    const escaped = "&lt;iframe src=&quot;about:blank&quot;&gt;&lt;/iframe&gt;"
    expect(decodeWompiChallengeHtml(escaped)).toBe(
      '<iframe src="about:blank"></iframe>'
    )
    expect(extractWompiChallengeIframeSrcDoc(escaped)).toContain("<iframe")
  })
})
