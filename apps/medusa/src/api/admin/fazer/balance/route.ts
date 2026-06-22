import type { MedusaRequest, MedusaResponse } from "@medusajs/framework/http"
import { FAZER_MODULE } from "../../../../modules/fazer"
import type FazerModuleService from "../../../../modules/fazer/service"

const DEFAULT_THRESHOLD = 50

// Returns the Fazer Cards wallet balance for the admin (US-2.3 / RUM-18),
// flagging when it drops below a configurable alert threshold.
export async function GET(req: MedusaRequest, res: MedusaResponse) {
  if (!process.env.FAZER_API_KEY) {
    return res.status(503).json({
      configured: false,
      message: "FAZER_API_KEY no está configurado.",
    })
  }

  const threshold = Number(process.env.FAZER_BALANCE_ALERT_THRESHOLD) || DEFAULT_THRESHOLD

  try {
    const fazer = req.scope.resolve<FazerModuleService>(FAZER_MODULE)
    const balance = await fazer.getBalance()
    res.json({
      configured: true,
      balance_usd: balance.balance_usd,
      currency: balance.currency,
      threshold,
      low: balance.balance_usd < threshold,
    })
  } catch (e) {
    res.status(502).json({
      configured: true,
      message: `No se pudo obtener el balance: ${(e as Error).message}`,
    })
  }
}
