import {
  countDeliveredUnits,
  persistDeliveredCodesForLineItem,
} from "../fulfill-digital-order"

describe("persistDeliveredCodesForLineItem", () => {
  it("stores one row per unit when Fazer returns multiple codes", async () => {
    const rows: Array<{ id: string; status: string; code?: string }> = []
    let nextId = 1

    const delivery = {
      async createDigitalDeliveries(input: Array<{ order_id: string; line_item_id: string; status: string }>) {
        const row = { id: `dd_${nextId++}`, status: input[0].status }
        rows.push(row)
        return [row]
      },
      async updateDigitalDeliveries(input: { id: string; status: string }) {
        const row = rows.find((r) => r.id === input.id)
        if (row) row.status = input.status
      },
      async storeCode(id: string, code: string) {
        const row = rows.find((r) => r.id === id)
        if (row) {
          row.code = code
          row.status = "delivered"
        }
      },
    }

    const result = await persistDeliveredCodesForLineItem(
      delivery as never,
      {
        orderId: "order_1",
        lineItemId: "item_1",
        itemTitle: "Nintendo eShop Gift Card",
        fazerOrderId: "fazer_1",
        codes: ["CODE-A", "CODE-B"],
        expectedQuantity: 2,
      }
    )

    expect(result.unitsDelivered).toBe(2)
    expect(result.newCodes).toEqual([
      { product: "Nintendo eShop Gift Card", code: "CODE-A" },
      { product: "Nintendo eShop Gift Card", code: "CODE-B" },
    ])
    expect(rows).toHaveLength(2)
    expect(rows.every((r) => r.status === "delivered")).toBe(true)
  })

  it("skips units already delivered and only stores missing codes", async () => {
    const rows = [{ id: "dd_1", status: "delivered", code: "CODE-A" }]
    let nextId = 2

    const delivery = {
      async createDigitalDeliveries() {
        const row = { id: `dd_${nextId++}`, status: "processing" }
        rows.push(row)
        return [row]
      },
      async updateDigitalDeliveries(input: { id: string; status: string }) {
        const row = rows.find((r) => r.id === input.id)
        if (row) row.status = input.status
      },
      async storeCode(id: string, code: string) {
        const row = rows.find((r) => r.id === id)
        if (row) {
          row.code = code
          row.status = "delivered"
        }
      },
    }

    const result = await persistDeliveredCodesForLineItem(
      delivery as never,
      {
        orderId: "order_1",
        lineItemId: "item_1",
        itemTitle: "Nintendo eShop Gift Card",
        fazerOrderId: "fazer_1",
        codes: ["CODE-A", "CODE-B"],
        expectedQuantity: 2,
        existingDeliveries: rows,
      }
    )

    expect(result.unitsDelivered).toBe(1)
    expect(result.newCodes).toEqual([
      { product: "Nintendo eShop Gift Card", code: "CODE-B" },
    ])
    expect(rows).toHaveLength(2)
  })
})

describe("countDeliveredUnits", () => {
  it("returns true when all units are delivered", () => {
    expect(
      countDeliveredUnits(
        [{ status: "delivered" }, { status: "delivered" }],
        2
      )
    ).toBe(true)
  })
})
