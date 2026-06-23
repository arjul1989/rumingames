import type { MedusaRequest, MedusaResponse } from "@medusajs/framework/http"
import { Modules } from "@medusajs/framework/utils"
import { FAZER_MODULE } from "../../../../modules/fazer"
import type FazerModuleService from "../../../../modules/fazer/service"
import { emitMonitorAlert } from "../../../../lib/monitoring"

const DEFAULT_THRESHOLD = 50
const LOW_BALANCE_DEDUPE_SECONDS = 60 * 60 * 6 // alert at most every 6h

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
    const low = balance.balance_usd < threshold

    if (low) {
      const cache = req.scope.resolve(Modules.CACHE)
      const dedupeKey = "monitor:fazer:balance:low"
      if (!(await cache.get(dedupeKey))) {
        await cache.set(dedupeKey, "1", LOW_BALANCE_DEDUPE_SECONDS)
        await emitMonitorAlert(req.scope, {
          event_type: "fazer.balance.low",
          severity: "WARNING",
          message: `Saldo Fazer bajo: $${balance.balance_usd.toFixed(2)} USD (umbral $${threshold})`,
          context: {
            balance_usd: balance.balance_usd,
            threshold,
            currency: balance.currency,
          },
        })
      }
    }

    res.json({
      configured: true,
      balance_usd: balance.balance_usd,
      currency: balance.currency,
      threshold,
      low,
    })
  } catch (e) {
    res.status(502).json({
      configured: true,
      message: `No se pudo obtener el balance: ${(e as Error).message}`,
    })
  }
}
