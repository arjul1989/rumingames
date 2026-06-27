import type { MedusaRequest, MedusaResponse } from "@medusajs/framework/http"
import { SUPPLIER_MODULE } from "../../../../../modules/supplier"
import type SupplierModuleService from "../../../../../modules/supplier/service"
import {
  confirmWalletTopup,
  sendWalletTopupBinance,
  serializeWalletTopup,
} from "../../../../../lib/funding/wallet-topup"

export async function GET(req: MedusaRequest, res: MedusaResponse) {
  const supplier = req.scope.resolve<SupplierModuleService>(SUPPLIER_MODULE)
  const id = req.params.id
  const topup = await supplier.retrieveFazerWalletTopup(id)
  res.json({ topup: serializeWalletTopup(topup as Record<string, unknown>) })
}

export async function POST(req: MedusaRequest, res: MedusaResponse) {
  const id = req.params.id
  const action = String((req.query as { action?: string }).action ?? "")

  try {
    if (action === "send-binance") {
      const topup = await sendWalletTopupBinance(req.scope, id)
      res.json({ topup: serializeWalletTopup(topup as Record<string, unknown>) })
      return
    }

    if (action === "confirm") {
      const body = (req.body ?? {}) as { binance_tx_id?: string }
      const topup = await confirmWalletTopup(req.scope, id, body.binance_tx_id ?? "")
      res.json({ topup: serializeWalletTopup(topup as Record<string, unknown>) })
      return
    }

    res.status(400).json({ message: "Query action requerida: send-binance | confirm" })
  } catch (err) {
    res.status(500).json({ message: (err as Error).message })
  }
}
