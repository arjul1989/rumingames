import type { MedusaRequest, MedusaResponse } from "@medusajs/framework/http"
import { SUPPLIER_MODULE } from "../../../../modules/supplier"
import type SupplierModuleService from "../../../../modules/supplier/service"
import {
  createWalletTopup,
  serializeWalletTopup,
} from "../../../../lib/funding/wallet-topup"

export async function GET(req: MedusaRequest, res: MedusaResponse) {
  const supplier = req.scope.resolve<SupplierModuleService>(SUPPLIER_MODULE)
  const [topups] = await supplier.listAndCountFazerWalletTopups(
    {},
    { take: 20, order: { created_at: "DESC" } }
  )
  res.json({ topups: topups.map((t) => serializeWalletTopup(t as Record<string, unknown>)) })
}

export async function POST(req: MedusaRequest, res: MedusaResponse) {
  const body = (req.body ?? {}) as { amount_usd?: number; method?: string }
  const amount = Number(body.amount_usd)
  if (!Number.isFinite(amount) || amount <= 0) {
    res.status(400).json({ message: "amount_usd inválido." })
    return
  }

  const createdBy = (req as { auth_context?: { actor_id?: string } }).auth_context?.actor_id ?? null

  try {
    const result = await createWalletTopup(req.scope, {
      amount_usd: amount,
      method: body.method,
      created_by: createdBy ?? undefined,
    })
    res.status(201).json({
      topup: serializeWalletTopup(result.topup as Record<string, unknown>),
      instructions: result.instructions,
    })
  } catch (err) {
    res.status(500).json({ message: (err as Error).message })
  }
}
