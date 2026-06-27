import type { WompiTransaction } from "./types"

const store = new Map<string, WompiTransaction>()

export function createMockWompiClient() {
  return {
    getTransaction(id: string): Promise<WompiTransaction> {
      const tx = store.get(id)
      if (!tx) {
        throw new Error(`Mock Wompi transaction not found: ${id}`)
      }
      return Promise.resolve({ ...tx })
    },
    voidTransaction(id: string): Promise<WompiTransaction> {
      const tx = store.get(id)
      if (!tx) {
        throw new Error(`Mock Wompi transaction not found: ${id}`)
      }
      const updated = { ...tx, status: "VOIDED" as const }
      store.set(id, updated)
      return Promise.resolve(updated)
    },
    seedTransaction(tx: WompiTransaction) {
      store.set(tx.id, tx)
    },
  }
}

export type MockWompiClient = ReturnType<typeof createMockWompiClient>
