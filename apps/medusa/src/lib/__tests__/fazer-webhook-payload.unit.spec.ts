import { parseFazerWebhookBody } from "../fazer-webhook-payload"

describe("parseFazerWebhookBody", () => {
  it("parses official order.completed events", () => {
    const parsed = parseFazerWebhookBody({
      type: "order.completed",
      order: { id: "ord_123", code: "ABCD-1234" },
    })
    expect(parsed).toEqual({
      fazerOrderId: "ord_123",
      status: "delivered",
      codes: ["ABCD-1234"],
      error: null,
      notificationId: "ord_123:order.completed",
    })
  })

  it("parses legacy flat payloads", () => {
    const parsed = parseFazerWebhookBody({
      fazer_order_id: "ord_456",
      status: "completed",
      codes: ["X", "Y"],
    })
    expect(parsed?.fazerOrderId).toBe("ord_456")
    expect(parsed?.status).toBe("delivered")
    expect(parsed?.codes).toEqual(["X", "Y"])
  })
})
